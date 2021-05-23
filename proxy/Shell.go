package main

import (
	"context"
	"fmt"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"go.opentelemetry.io/otel"
	"golang.org/x/crypto/ssh"
	"io"
	"log"
	"time"
)

func (conn *SshConnection) RunCommand(ctx context.Context, cmd string) (*CommandResult, error) {
	log.Printf("Running '%s' on %s\n", cmd, conn.id)

	_, span := otel.Tracer("shell").Start(ctx, fmt.Sprintf("Command: %s", cmd))
	defer span.End()

	span.AddEvent("Creating session")
	session, err := conn.client.NewSession()
	if err != nil {
		span.RecordError(err)
		log.Printf("Failed to create session on because %s\n", err)
		return nil, err
	}
	defer session.Close()

	span.AddEvent("Creating stdout pipe")
	outPipe, err := session.StdoutPipe()
	if err != nil {
		span.RecordError(err)
		log.Printf("Failed to open stdout on %s because %s\n", conn.id, err)
		return nil, err
	}

	span.AddEvent("Creating stderr pipe")
	errPipe, err := session.StderrPipe()
	if err != nil {
		span.RecordError(err)
		log.Printf("Failed to open stderr on %s because %s\n", conn.id, err)
		return nil, err
	}

	span.AddEvent("Starting session")
	err = session.Start(cmd)
	if err != nil {
		span.RecordError(err)
		log.Printf("Failed to start session on %s\n", conn.id)
		return nil, err
	}

	cWait := make(chan error)
	go func() {
		err = session.Wait()
		cWait <- err
	}()

	result := CommandResult{
		Cmd: cmd,
	}

	select {
	case err = <-cWait:
		{
			if err != nil {
				switch v := err.(type) {
				case *ssh.ExitError:
					span.AddEvent("Exit")
					result.Code = v.Waitmsg.ExitStatus()
					break
				default:
					span.RecordError(err)
					log.Printf("Failed run Command %s on %s because %s\n", cmd, conn.id, err)
					return nil, err
				}
			}
			break
		}
	case <-time.After(30 * time.Second):
		span.AddEvent("Timed out")
		result.Error = "timeout"
		return &result, nil
	}

	span.AddEvent("Reading stdout")
	stdout, outReadErr := io.ReadAll(outPipe)
	if outReadErr != nil {
		span.RecordError(outReadErr)
		log.Printf("Failed to read output for Command %s on %s because %s.\n", cmd, conn.id, outReadErr)
		return nil, outReadErr
	}

	span.AddEvent("Reading stderr")
	stderr, errReadErr := io.ReadAll(errPipe)
	if errReadErr != nil {
		span.RecordError(errReadErr)
		log.Printf("Failed to read output for Command %s on %s because %s.\n", cmd, conn.id, errReadErr)
		return nil, errReadErr
	}

	result.Stdout = stdout
	result.Stderr = stderr

	return &result, nil
}

func commandRoute(app *iris.Application) {
	app.Get("/command", func(ctx iris.Context) {
		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		out, err := handle.conn.RunCommand(ctx.Request().Context(), ctx.URLParam("command"))

		if err != nil {
			ctx.StopWithError(iris.StatusUnprocessableEntity, err)
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command failed").
				Type("command_err").
				DetailErr(err))
			return
		}

		ctx.JSON(out)
	}).SetName("Command")
}
