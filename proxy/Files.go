package main

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"io"
	"os"
	"path"
	"time"
)

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
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(fileStatError))
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
				DetailErr(fileStatError))
			return
		}
		defer tempFileHandle.Close()

		if _, err := tempFileHandle.Write(body.Contents); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error writing temp file").
				Type("temp_file_write").
				DetailErr(fileStatError))
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
							DetailErr(mkdirError))
						return
					}
				} else {
					ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
						Title("Parent folder does not exist but CreateFolder is not set").
						Type("folder_open").
						DetailErr(dirStatError))
					return
				}
			} else if dirStatError != nil {
				ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
					Title("Error opening parent folder of file").
					Type("folder_open").
					DetailErr(dirStatError))
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
				DetailErr(fileStatError))
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
				DetailErr(err))
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
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		fileHandle, err := handle.conn.sftpClient.Open(ctx.URLParam("path"))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error opening file").
				Type("file_open").
				DetailErr(err))
			return
		}
		defer fileHandle.Close()

		resp := FileResponse{}

		stat, err := fileHandle.Stat()
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Error reading file metadata").
				Type("file_stat").
				DetailErr(err))
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
					DetailErr(err))
				return
			}
			resp.Contents = &contents
		}

		ctx.JSON(resp)
	})
}
