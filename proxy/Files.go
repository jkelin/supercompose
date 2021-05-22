package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
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

var fileTracer = otel.Tracer("File")

func (conn *SshConnection) readFile(ctx context.Context, path string, maxSize int64) (*FileInfo, error) {
	log.Printf("Reading file at %s", path)
	_, span := sshTracer.Start(ctx, fmt.Sprintf("Read file %s", path))
	span.SetAttributes(attribute.Int64("file.max_size", maxSize))
	defer span.End()

	span.AddEvent("Opening file")
	fileHandle, err := conn.sftpClient.Open(path)
	if err != nil {
		span.RecordError(err)
		return nil, fmt.Errorf("error opening file: %w", err)
	}
	defer fileHandle.Close()

	resp := FileInfo{}

	span.AddEvent("Statting file")
	stat, err := fileHandle.Stat()
	if err != nil {
		span.RecordError(err)
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
		span.AddEvent("Reading file contents")
		contents, err := io.ReadAll(fileHandle)
		if err != nil {
			span.RecordError(err)
			return nil, fmt.Errorf("failed to read file contents: %w", err)
		}

		resp.Contents = contents
	}

	return &resp, nil
}

func (conn *SshConnection) writeFile(ctx context.Context, path string, contents []byte) error {
	tempFilePath := fmt.Sprintf("/tmp/%s", uuid.New().String())

	childCtx, span := sshTracer.Start(ctx, fmt.Sprintf("Write file %s", path))
	span.SetAttributes(attribute.Int("file.content_len", len(contents)))
	span.SetAttributes(attribute.String("file.temp_file", tempFilePath))
	defer span.End()

	log.Printf("Writing file at %s", path)

	// We first write into a temp file and then move it onto the target location
	// Swapping the file like this ensures that we are not leaving the target file half overwritten

	span.AddEvent("Creating temp file")
	tempFileHandle, err := conn.sftpClient.OpenFile(tempFilePath, os.O_CREATE|os.O_WRONLY)
	if err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to open temp file: %w", err)
	}
	defer tempFileHandle.Close()

	span.AddEvent("Writing temp file")
	if _, err := tempFileHandle.Write(contents); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	span.AddEvent("Running move command")
	moveCommand := fmt.Sprintf("mv --force '%s' '%s'", tempFilePath, path)
	if _, err := conn.RunCommand(childCtx, moveCommand); err != nil {
		span.RecordError(err)
		return fmt.Errorf("failed to move temp file to target path: %w", err)
	}

	return nil
}

func (conn *SshConnection) ensureDirectoryExists(ctx context.Context, path string) error {
	_, span := sshTracer.Start(ctx, fmt.Sprintf("Ensure directory exists at %s", path))
	defer span.End()

	log.Printf("Ensuring directory exists at %s", path)
	span.AddEvent("Statting path")
	dirStat, dirStatError := conn.sftpClient.Stat(path)
	if dirStatError == os.ErrNotExist {
		span.AddEvent("Mkdir all path")
		mkdirError := conn.sftpClient.MkdirAll(path)
		if mkdirError != nil {
			span.RecordError(mkdirError)
			return fmt.Errorf("failed to create directory %s: %w", path, mkdirError)
		}

		return nil
	}

	if dirStatError != nil {
		span.RecordError(dirStatError)
		return fmt.Errorf("failed read directory path %s: %w", path, dirStatError)
	}

	if dirStat.IsDir() {
		return nil
	} else {
		span.RecordError(fmt.Errorf("failed to create directory at path %s because it is a file", path))
		return fmt.Errorf("failed to create directory at path %s because it is a file", path)
	}
}

func (conn *SshConnection) upsertFile(ctx context.Context, filePath string, createDir bool, targetContents []byte) (bool, error) {
	childCtx, span := sshTracer.Start(ctx, fmt.Sprintf("Upsert file %s", filePath))
	span.SetAttributes(attribute.Bool("file.create_dir", createDir))
	span.SetAttributes(attribute.Int("file.content_len", len(targetContents)))
	defer span.End()

	log.Printf("Upserting file at %s", filePath)

	span.AddEvent("Opening file")
	fileHandle, err := conn.sftpClient.Open(filePath)
	write := false
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			span.RecordError(err)
			return false, fmt.Errorf("error opening file: %w", err)
		} else {
			write = true
		}
	} else {
		defer fileHandle.Close()
	}

	if fileHandle != nil {
		span.AddEvent("Reading file stats")
		stat, err := fileHandle.Stat()
		if err != nil {
			span.RecordError(err)
			return false, fmt.Errorf("error reading file metadata: %w", err)
		}

		if stat.IsDir() {
			span.RecordError(fmt.Errorf("cannot upsert a directory"))
			return false, fmt.Errorf("cannot upsert a directory")
		}

		if stat.Size() != int64(len(targetContents)) {
			write = true
		} else {
			span.AddEvent("Reading contents")
			contents, err := io.ReadAll(fileHandle)
			if err != nil {
				span.RecordError(err)
				return false, fmt.Errorf("failed to read file contents: %w", err)
			}

			write = !bytes.Equal(contents, targetContents)
		}
	}

	if write {
		if createDir {
			span.AddEvent("Getting directory")
			dir := path.Dir(filePath)
			if err := conn.ensureDirectoryExists(childCtx, dir); err != nil {
				span.RecordError(err)
				return false, err
			}
		}

		span.AddEvent("Writing file")
		if err := conn.writeFile(childCtx, filePath, targetContents); err != nil {
			span.RecordError(err)
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

		span := trace.SpanFromContext(ctx.Request().Context())
		span.SetAttributes(attribute.String("command.path", body.Path))

		connectionHandle, fileStatError := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if fileStatError != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(fileStatError))
			return
		}
		defer connectionHandle.Close()

		dir := path.Dir(body.Path)
		if err := connectionHandle.conn.ensureDirectoryExists(ctx.Request().Context(), dir); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not create parent folder").
				Type("folder_create").
				DetailErr(err))
		}

		if err := connectionHandle.conn.writeFile(ctx.Request().Context(), body.Path, body.Contents); err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not write file").
				Type("file_write").
				DetailErr(err))
		}

		ctx.StatusCode(iris.StatusOK)
	}).SetName("File write")
}

func readFileRoute(app *iris.Application) {
	app.Get("/files/read", func(ctx iris.Context) {
		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		fileData, err := handle.conn.readFile(ctx.Request().Context(), ctx.URLParam("path"), 10_000_000)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Could not read file").
				Type("file_open").
				DetailErr(err))
			return
		}

		ctx.JSON(fileData)
	}).SetName("File read")
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

		span := trace.SpanFromContext(ctx.Request().Context())
		span.SetAttributes(attribute.String("command.path", body.Path))

		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		updated, err := handle.conn.upsertFile(ctx.Request().Context(), body.Path, body.CreateFolder, body.Contents)
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
	}).SetName("File upsert")
}

func deleteFileRoute(app *iris.Application) {
	app.Post("/files/delete", func(ctx iris.Context) {
		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
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
	}).SetName("File delete")
}
