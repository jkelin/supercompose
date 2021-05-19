package main

import (
	systemdDbus "github.com/coreos/go-systemd/dbus"
	"github.com/godbus/dbus"
	"strconv"
)

type SystemdHandle struct {
	sshConn     *SshConnection
	systemdConn *systemdDbus.Conn
}

func (conn *SshConnection) GetSystemdConnection() (*SystemdHandle, error) {
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

	return &SystemdHandle{
		sshConn:     conn,
		systemdConn: connection,
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

func (handle *SystemdHandle) GetService(name string) (*SystemdService, error) {
	unit, err := handle.systemdConn.GetUnitProperties(name)
	if err != nil {
		return nil, err
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
