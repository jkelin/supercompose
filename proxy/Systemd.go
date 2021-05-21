package main

import (
	"fmt"
	systemdDbus "github.com/coreos/go-systemd/dbus"
	"github.com/godbus/dbus"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"log"
	"strconv"
)

type SystemdHandle struct {
	sshConn     *SshConnection
	systemdConn *systemdDbus.Conn
}

func (conn *SshConnection) GetSystemdConnection() (*SystemdHandle, error) {
	if conn.systemdHandle == nil {
		log.Printf("Connecting to systemd")

		connection, err := systemdDbus.NewConnection(func() (*dbus.Conn, error) {
			socketConn, err := conn.client.Dial("unix", "/run/systemd/private")
			if err != nil {
				return nil, err
			}

			dbusConn, err := dbus.NewConn(socketConn)
			if err != nil {
				return nil, err
			}

			methods := []dbus.Auth{dbus.AuthExternal(strconv.Itoa(conn.uid))}

			err = dbusConn.Auth(methods)
			if err != nil {
				if err := conn.Close(); err != nil {
					return nil, err
				}

				return nil, err
			}

			return dbusConn, nil
		})
		if err != nil {
			return nil, err
		}

		conn.systemdHandle = connection
	}

	return &SystemdHandle{
		sshConn:     conn,
		systemdConn: conn.systemdHandle,
	}, nil
}

func (handle *SystemdHandle) Close() {
	handle.systemdConn.Close()
}

type SystemdService struct {
	Id          string `json:"title"`
	Description string `json:"description"`
	Path        string `json:"path"`
	IsEnabled   bool   `json:"is_enabled"`
	IsActive    bool   `json:"is_active"`
	IsRunning   bool   `json:"is_running"`
	IsFailed    bool   `json:"is_failed"`
	IsLoading   bool   `json:"is_loading"`
	LoadState   string `json:"load_state"`   // loaded, error, masked
	ActiveState string `json:"active_state"` // active, reloading, inactive, failed, activating, deactivating. active
	SubState    string `json:"sub_state"`
}

func (handle *SystemdHandle) SystemdGetService(name string) (*SystemdService, error) {
	log.Printf("Getting systemd service %s", name)

	unit, err := handle.systemdConn.GetUnitProperties(name)
	if err != nil {
		return nil, fmt.Errorf("failed getting systemd unit properties because: %w", err)
	}

	return &SystemdService{
		Id:          unit["Id"].(string),
		Description: unit["Description"].(string),
		IsEnabled:   unit["UnitFileState"].(string) == "enabled",
		Path:        unit["FragmentPath"].(string),
		IsActive:    unit["ActiveState"].(string) == "active",
		IsRunning:   unit["SubState"].(string) == "running",
		IsFailed:    unit["ActiveState"].(string) == "failed",
		IsLoading:   unit["ActiveState"].(string) == "reloading" || unit["ActiveState"].(string) == "deactivating" || unit["ActiveState"].(string) == "activating",
		SubState:    unit["SubState"].(string),
		ActiveState: unit["ActiveState"].(string),
		LoadState:   unit["LoadState"].(string),
	}, nil
}

func acquireSystemd(ctx iris.Context) (*ConnectionHandle, *SystemdHandle, iris.Problem) {
	handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
	if err != nil {
		return nil, nil, iris.NewProblem().
			Title("Connection to target host failed").
			Status(iris.StatusBadRequest).
			Type("connection_err").
			DetailErr(err)
	}

	systemd, err := handle.conn.GetSystemdConnection()
	if err != nil {
		return nil, nil, iris.NewProblem().
			Title("Systemd connection error").
			Status(iris.StatusBadRequest).
			Type("systemd_connection_err").
			DetailErr(err)
	}

	return handle, systemd, nil
}

func SystemdGetServiceRoute(app *iris.Application) {
	app.Get("/systemd/service", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		services, err := systemd.SystemdGetService(ctx.URLParam("id"))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Systemd services detail error").
				Type("systemd_get_service").
				DetailErr(err))
			return
		}

		ctx.JSON(services)
	})
}

func SystemdStartServiceRoute(app *iris.Application) {
	app.Post("/systemd/service/start", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		log.Printf("Starting service %s", ctx.URLParam("id"))
		_, err := systemd.systemdConn.StartUnit(ctx.URLParam("id"), "replace", nil)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Starting systemd service failed").
				Type("systemd_start_service").
				DetailErr(err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func SystemdStopServiceRoute(app *iris.Application) {
	app.Post("/systemd/service/stop", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		log.Printf("Stopping service %s", ctx.URLParam("id"))
		_, err := systemd.systemdConn.StopUnit(ctx.URLParam("id"), "replace", nil)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Starting systemd service failed").
				Type("systemd_start_service").
				DetailErr(err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func SystemdRestartServiceRoute(app *iris.Application) {
	app.Post("/systemd/service/restart", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		log.Printf("Restarting service %s", ctx.URLParam("id"))
		_, err := systemd.systemdConn.ReloadOrRestartUnit(ctx.URLParam("id"), "replace", nil)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Restarting systemd service failed").
				Type("systemd_restart_service").
				DetailErr(err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func SystemdEnableServiceRoute(app *iris.Application) {
	app.Post("/systemd/service/enable", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		log.Printf("Enabling service %s", ctx.URLParam("id"))
		units := make([]string, 1)
		units[0] = ctx.URLParam("id")
		_, _, err := systemd.systemdConn.EnableUnitFiles(units, false, true)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Enabling systemd service failed").
				Type("systemd_enable_service").
				DetailErr(err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func SystemdDisableServiceRoute(app *iris.Application) {
	app.Post("/systemd/service/disable", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		log.Printf("Disabling service %s", ctx.URLParam("id"))
		units := make([]string, 1)
		units[0] = ctx.URLParam("id")
		_, err := systemd.systemdConn.DisableUnitFiles(units, false)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Disabling systemd service failed").
				Type("systemd_disable_service").
				DetailErr(err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func SystemdReloadRoute(app *iris.Application) {
	app.Post("/systemd/reload", func(ctx iris.Context) {
		handle, systemd, problem := acquireSystemd(ctx)
		if problem != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, problem)
			return
		}
		defer handle.Close()

		log.Printf("Reloading systemd")
		if err := systemd.systemdConn.Reload(); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Reloading systemd services failed").
				Type("systemd_reload").
				DetailErr(err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

//func UpdateSystemdServiceRoute(app *iris.Application) {
//  type UpdateSystemdServiceRequest struct {
//    Contents     []byte `json:"contents" validate:"required"`
//    Path         string `json:"path" validate:"required"`
//    IsActive  bool   `json:"is_active" validate:"required"`
//    IsEnabled  bool   `json:"is_enabled" validate:"required"`
//  }
//
//	app.Post("/systemd/service", func(ctx iris.Context) {
//    var body UpdateSystemdServiceRequest
//    if err := ctx.ReadBody(&body); err != nil {
//      ctx.StopWithError(iris.StatusBadRequest, err)
//      return
//    }
//
//		handle, systemd, problem := acquireSystemd(ctx)
//		if problem != nil {
//			ctx.StopWithProblem(iris.StatusBadRequest, problem)
//			return
//		}
//		defer handle.Close()
//		defer systemd.Close()
//
//    serviceStatus, err := systemd.SystemdGetService(body.Path)
//    if err != nil {
//      ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
//        Title("Systemd services detail error").
//        Type("systemd_get_service").
//        DetailErr(err))
//      return
//    }
//
//    modified, err := handle.conn.upsertFile(body.Path, 1_000_000, false, body.Contents)
//    if err != nil {
//      ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
//        Title("Failed to update systemd file").
//        Type("file_update").
//        DetailErr(err))
//    }
//
//    if serviceStatus == nil || serviceStatus.IsEnabled != body.IsEnabled {
//      units := make([]string, 1)
//      units[0] = ctx.URLParam(body.Path)
//
//      if body.IsEnabled {
//        if _, _, err := systemd.systemdConn.EnableUnitFiles(units, false, true); err != nil {
//          ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
//            Title("Enabling systemd service failed").
//            Type("systemd_enable_service").
//            DetailErr(err))
//          return
//        }
//      } else {
//        if _, err := systemd.systemdConn.DisableUnitFiles(units, false); err != nil {
//          ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
//            Title("Disabling systemd service failed").
//            Type("systemd_disable_service").
//            DetailErr(err))
//          return
//        }
//      }
//    }
//
//    if modified || serviceStatus == nil || serviceStatus.IsEnabled != body.IsEnabled {
//      if err := systemd.systemdConn.Reload(); err != nil {
//        ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
//          Title("Reloading systemd services failed").
//          Type("systemd_reload").
//          DetailErr(err))
//        return
//      }
//    }
//
//    if serviceStatus == nil || serviceStatus.IsActive != body.IsActive {
//      if body.IsActive {
//
//      }
//    }
//
//		ctx.StatusCode(iris.StatusOK)
//	})
//}
