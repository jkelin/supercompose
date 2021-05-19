package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"github.com/spf13/viper"
	"io"
	"log"
	"os"
	"path"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/context"
	"github.com/kataras/iris/v12/middleware/jwt"
	"github.com/kataras/iris/v12/middleware/logger"
	"github.com/kataras/iris/v12/middleware/recover"
)

func containerInspectRoute(app *iris.Application) {
	app.Get("/containers/:id/json", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", err))
			return
		}
		defer handle.Close()

		containers, _, err := handle.conn.dockerClient.ContainerInspectWithRaw(handle.conn.ctx, ctx.Params().Get("id"), true)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				Key("error", err))
			return
		}

		ctx.JSON(containers)
	})
}

func containersRoute(app *iris.Application) {
	app.Get("/containers/json", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", err))
			return
		}
		defer handle.Close()

		containerFilters := filters.NewArgs()
		containerFilters.Add("label", "com.docker.compose.service")
		containers, err := handle.conn.dockerClient.ContainerList(handle.conn.ctx, types.ContainerListOptions{
			Filters: containerFilters,
			Size:    true,
		})
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				Key("error", err))
			return
		}

		ctx.JSON(containers)
	})
}

func commandRoute(app *iris.Application) {
	app.Get("/command", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", err))
			return
		}
		defer handle.Close()

		out, err := handle.conn.RunCommand(ctx.URLParam("command"))

		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				Key("error", err))
			return
		}

		ctx.JSON(out)
	})
}

func writeFileRoute(app *iris.Application) {
	type FileWriteRequest struct {
		Contents     []byte `json:"contents" validate:"required"`
		Path         string `json:"path" validate:"required"`
		CreateFolder bool   `json:"create_folder"`
		ModTime      string `json:"mod_time"`
	}

	app.Post("/files/write", func(ctx iris.Context) {
		var body FileWriteRequest
		if err := ctx.ReadBody(&body); err != nil {
			ctx.StopWithError(iris.StatusBadRequest, err)
			return
		}

		connectionHandle, fileStatError := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if fileStatError != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", fileStatError))
			return
		}
		defer connectionHandle.Close()

		// We first write into a temp file and then move it onto the target location
		// Swapping the file like this ensures that we are not leaving the target file half overwritten

		tempFilePath := fmt.Sprintf("/tmp/%s", uuid.New().String())
		tempFileHandle, fileStatError := connectionHandle.conn.sftpClient.OpenFile(tempFilePath, os.O_CREATE|os.O_WRONLY)
		if fileStatError != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error opening temp file").
				Type("temp_file_open").
				Key("error", fileStatError))
			return
		}
		defer tempFileHandle.Close()

		if _, err := tempFileHandle.Write(body.Contents); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error writing temp file").
				Type("temp_file_write").
				Key("error", fileStatError))
			return
		}

		dir := path.Dir(body.Path)
		fileInfo, fileStatError := connectionHandle.conn.sftpClient.Stat(body.Path)
		if fileStatError == os.ErrNotExist {
			dirStat, dirStatError := connectionHandle.conn.sftpClient.Stat(dir)
			if dirStatError == os.ErrNotExist {
				if body.CreateFolder {
					mkdirError := connectionHandle.conn.sftpClient.MkdirAll(dir)
					if mkdirError != nil {
						ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
							Title("Could not create parent folder").
							Type("folder_create").
							Key("error", mkdirError))
						return
					}
				} else {
					ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
						Title("Parent folder does not exist but CreateFolder is not set").
						Type("folder_open").
						Key("error", dirStatError))
					return
				}
			} else if dirStatError != nil {
				ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
					Title("Error opening parent folder of file").
					Type("folder_open").
					Key("error", dirStatError))
				return
			} else if !dirStat.IsDir() {
				ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
					Title("Parent is not a directory, something is very wrong").
					Type("folder_is_not_a_directory"))
				return
			}
		} else if fileStatError != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error opening file").
				Type("file_open").
				Key("error", fileStatError))
			return
		} else if fileInfo.IsDir() {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("File is a directory").
				Type("file_is_directory"))
			return
		}

		moveCommand := fmt.Sprintf("mv --force '%s' '%s'", tempFilePath, body.Path)
		if _, err := connectionHandle.conn.RunCommand(moveCommand); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not move temp file to target path").
				Type("temp_file_move").
				Key("error", err))
			return
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func readFileRoute(app *iris.Application) {
	type FileResponse struct {
		Contents *[]byte `json:"contents"`
		Size     int64   `json:"size"`
		IsDir    bool    `json:"is_dir"`
		ModTime  string  `json:"mod_time"`
	}

	app.Get("/files/read", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", err))
			return
		}
		defer handle.Close()

		fileHandle, err := handle.conn.sftpClient.Open(ctx.URLParam("path"))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error opening file").
				Type("file_open").
				Key("error", err))
			return
		}
		defer fileHandle.Close()

		resp := FileResponse{}

		stat, err := fileHandle.Stat()
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error reading file metadata").
				Type("file_stat").
				Key("error", err))
			return
		}
		resp.Size = stat.Size()
		resp.ModTime = stat.ModTime().UTC().Format(time.RFC3339)
		resp.IsDir = stat.IsDir()

		if resp.IsDir {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("File is a directory").
				Type("file_is_directory"))
			return
		}

		if resp.Size > 10_000_000 {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("File too big").
				Type("file_is_too_big"))
			return
		}

		if resp.Size > 0 {
			contents, err := io.ReadAll(fileHandle)
			if err != nil {
				ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
					Title("Error reading file").
					Type("file_read").
					Key("error", err))
				return
			}
			resp.Contents = &contents
		}

		ctx.JSON(resp)
	})
}

func sse(ctx iris.Context, lines chan string) {
	flusher, ok := ctx.ResponseWriter().Flusher()
	if !ok {
		ctx.StopWithText(iris.StatusHTTPVersionNotSupported, "Streaming unsupported!")
		return
	}

	cw, err := context.AcquireCompressResponseWriter(ctx.ResponseWriter(), ctx.Request(), -1)
	if err != nil {
		ctx.StopWithText(iris.StatusHTTPVersionNotSupported, "Compression unsupported!")
		return
	}

	ctx.ContentType("text/event-stream")
	ctx.Header("Cache-Control", "no-cache")

	cancellation := make(chan bool)
	ctx.OnClose(func(ctx *context.Context) {
		cancellation <- true
	})

	for {
		select {
		case <-cancellation:
			log.Println("Closing request")
			return
		case line := <-lines:
			cw.Write([]byte(fmt.Sprintf("data: %s\n\n", line)))
			cw.Flush()
			flusher.Flush()
		}
	}
}

func containerStatsRoute(app *iris.Application) {
	app.Get("/containers/:id/stats", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", err))
			return
		}
		defer handle.Close()

		statStream, err := handle.conn.dockerClient.ContainerStats(handle.conn.ctx, ctx.Params().Get("id"), true)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				Key("error", err))
			return
		}
		defer statStream.Body.Close()

		reader := bufio.NewReader(statStream.Body)

		lines := make(chan string)
		go (func() {
			for {
				line, _, err := reader.ReadLine()
				if err != nil {
					ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
						Title("Command error").
						Detail("Error reading stats").
						Type("command_err").
						Key("error", err))
					return
				}

				var stats types.Stats
				err = json.Unmarshal(line, &stats)
				if err != nil {
					ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
						Title("Command error").
						Detail("Error parsing stats").
						Type("command_err").
						Key("error", err))
					return
				}

				lineOut, err := json.Marshal(stats)

				lines <- string(lineOut)
			}
		})()

		sse(ctx, lines)
	})
}

func systemdGetService(app *iris.Application) {
	app.Get("/systemd/service", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection error").
				Type("connection_err").
				Key("error", err))
			return
		}
		defer handle.Close()

		systemd, err := handle.conn.GetSystemdConnection()
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Systemd connection error").
				Type("systemd_connection_err").
				Key("error", err))
			return
		}
		defer systemd.Close()

		services, err := systemd.GetService(ctx.URLParam("name"))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Systemd services detail error").
				Type("systemd_command_err").
				Key("error", err))
			return
		}

		ctx.JSON(services)
	})
}

func FromParameter(param string) jwt.TokenExtractor {
	return func(ctx *context.Context) string {
		return ctx.URLParam(param)
	}
}

func main() {
	go RunConnectionManager()

	viper.SetDefault("JWT_KEY", "your-256-bit-secret")
	viper.SetDefault("JWE_KEY", nil)
	viper.AutomaticEnv()

	app := iris.New()
	app.Validator = validator.New()

	app.Logger().SetLevel("debug")
	app.Use(recover.New())
	app.Use(logger.New())

	crs := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // allows everything, use that to change the hosts.
		AllowCredentials: true,
	})
	app.UseRouter(crs)

	verifier := jwt.NewVerifier(jwt.HS256, []byte(viper.GetString("JWT_KEY")))
	verifier.WithDefaultBlocklist()
	verifier.Extractors = append(verifier.Extractors, FromParameter("authorize"))
	if viper.IsSet("JWE_KEY") {
		verifier.WithDecryption([]byte(viper.GetString("JWE_KEY")), nil)
	}
	verifyMiddleware := verifier.Verify(func() interface{} {
		return new(SshConnectionArgs)
	})

	app.Use(verifyMiddleware)

	containerStatsRoute(app)

	app.Use(iris.Compression)

	systemdGetService(app)
	writeFileRoute(app)
	readFileRoute(app)
	commandRoute(app)
	containersRoute(app)
	containerInspectRoute(app)

	app.Listen(":8080", iris.WithSocketSharding)
}
