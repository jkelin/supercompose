package main

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"io"
	"log"
	"os"
	"path"
	"time"
)

type FileInfo struct {
	Contents []byte `json:"contents"`
	ModTime  string `json:"mod_time"`
	Size     int64  `json:"size"`
}

func (conn *SshConnection) readFile(path string, maxSize int64) (*FileInfo, error) {
	log.Printf("Reading file at %s", path)

	fileHandle, err := conn.sftpClient.Open(path)
	if err != nil {
		return nil, fmt.Errorf("error opening file: %w", err)
	}
	defer fileHandle.Close()

	resp := FileInfo{}

	stat, err := fileHandle.Stat()
	if err != nil {
		return nil, fmt.Errorf("error reading file metadata: %w", err)
	}
	resp.Size = stat.Size()
	resp.ModTime = stat.ModTime().UTC().Format(time.RFC3339)

	if stat.IsDir() {
		return nil, fmt.Errorf("path is a directory")
	}

	if resp.Size > maxSize {
		return nil, fmt.Errorf("file too big (%d bytes > %d bytes allowed)", resp.Size, maxSize)
	}

	if resp.Size > 0 {
		contents, err := io.ReadAll(fileHandle)
		if err != nil {
			return nil, fmt.Errorf("failed to read file contents: %w", err)
		}

		resp.Contents = contents
	}

	return &resp, nil
}

func (conn *SshConnection) writeFile(path string, contents []byte) error {
	log.Printf("Writing file at %s", path)

	// We first write into a temp file and then move it onto the target location
	// Swapping the file like this ensures that we are not leaving the target file half overwritten

	tempFilePath := fmt.Sprintf("/tmp/%s", uuid.New().String())
	tempFileHandle, err := conn.sftpClient.OpenFile(tempFilePath, os.O_CREATE|os.O_WRONLY)
	if err != nil {
		return fmt.Errorf("failed to open temp file: %w", err)
	}
	defer tempFileHandle.Close()

	if _, err := tempFileHandle.Write(contents); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	moveCommand := fmt.Sprintf("mv --force '%s' '%s'", tempFilePath, path)
	if _, err := conn.RunCommand(moveCommand); err != nil {
		return fmt.Errorf("failed to move temp file to target path: %w", err)
	}

	return nil
}

func (conn *SshConnection) ensureDirectoryExists(path string) error {
	log.Printf("Ensuring directory exists at %s", path)
	dirStat, dirStatError := conn.sftpClient.Stat(path)
	if dirStatError == os.ErrNotExist {
		mkdirError := conn.sftpClient.MkdirAll(path)
		if mkdirError != nil {
			return fmt.Errorf("failed to create directory %s: %w", path, mkdirError)
		}

		return nil
	}

	if dirStatError != nil {
		return fmt.Errorf("failed read directory path %s: %w", path, dirStatError)
	}

	if dirStat.IsDir() {
		return nil
	} else {
		return fmt.Errorf("failed to create directory at path %s because it is a file", path)
	}
}

func (conn *SshConnection) upsertFile(filePath string, createDir bool, targetContents []byte) (bool, error) {
	log.Printf("Upserting file at %s", filePath)
	fileHandle, err := conn.sftpClient.Open(filePath)
	write := false
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return false, fmt.Errorf("error opening file: %w", err)
		} else {
			write = true
		}
	} else {
		defer fileHandle.Close()
	}

	if fileHandle != nil {
		stat, err := fileHandle.Stat()
		if err != nil {
			return false, fmt.Errorf("error reading file metadata: %w", err)
		}

		if stat.IsDir() {
			return false, fmt.Errorf("cannot upsert a directory")
		}

		if stat.Size() != int64(len(targetContents)) {
			write = true
		} else {
			contents, err := io.ReadAll(fileHandle)
			if err != nil {
				return false, fmt.Errorf("failed to read file contents: %w", err)
			}

			write = !bytes.Equal(contents, targetContents)
		}
	}

	if write {
		if createDir {
			dir := path.Dir(filePath)
			if err := conn.ensureDirectoryExists(dir); err != nil {
				return false, err
			}
		}

		if err := conn.writeFile(filePath, targetContents); err != nil {
			return false, err
		}
	}

	return write, nil
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

		connectionHandle, fileStatError := GetConnection(jwt.Get(ctx).(*SshConnectionCredentials))
		if fileStatError != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(fileStatError))
			return
		}
		defer connectionHandle.Close()

		dir := path.Dir(body.Path)
		if err := connectionHandle.conn.ensureDirectoryExists(dir); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not create parent folder").
				Type("folder_create").
				DetailErr(err))
		}

		if err := connectionHandle.conn.writeFile(body.Path, body.Contents); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not write file").
				Type("file_write").
				DetailErr(err))
		}

		ctx.StatusCode(iris.StatusOK)
	})
}

func readFileRoute(app *iris.Application) {
	app.Get("/files/read", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		fileData, err := handle.conn.readFile(ctx.URLParam("path"), 10_000_000)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not read file").
				Type("file_open").
				DetailErr(err))
			return
		}

		ctx.JSON(fileData)
	})
}

func upsertFileRoute(app *iris.Application) {
	type FileUpsertRequest struct {
		Contents     []byte `json:"contents" validate:"required"`
		Path         string `json:"path" validate:"required"`
		CreateFolder bool   `json:"create_folder"`
	}

	type FileUpsertResponse struct {
		Updated bool `json:"updated"`
	}

	app.Post("/files/upsert", func(ctx iris.Context) {
		var body FileUpsertRequest
		if err := ctx.ReadBody(&body); err != nil {
			ctx.StopWithError(iris.StatusBadRequest, err)
			return
		}

		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		updated, err := handle.conn.upsertFile(body.Path, body.CreateFolder, body.Contents)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not upsert file").
				Type("file_upsert").
				DetailErr(err))
			return
		}

		ctx.JSON(FileUpsertResponse{
			Updated: updated,
		})
	})
}

func deleteFileRoute(app *iris.Application) {
	app.Post("/files/delete", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		log.Printf("Deleting file at %s", ctx.URLParam("path"))
		if err := handle.conn.sftpClient.Remove(ctx.URLParam("path")); err != nil && !errors.Is(err, os.ErrNotExist) {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not delete file").
				Type("file_delete").
				DetailErr(err))
			return
		}
	})
}
