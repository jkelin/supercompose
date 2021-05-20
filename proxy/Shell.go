package main

import (
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"golang.org/x/crypto/ssh"
	"io"
	"log"
	"time"
)

func (conn *SshConnection) RunCommand(cmd string) (*CommandResult, error) {
	log.Printf("Running '%s' on %s\n", cmd, conn.id)

	session, err := conn.client.NewSession()
	if err != nil {
		log.Printf("Failed to create session on because %s\n", err)
		return nil, err
	}
	defer session.Close()

	outPipe, err := session.StdoutPipe()
	if err != nil {
		log.Printf("Failed to open stdout on %s because %s\n", conn.id, err)
		return nil, err
	}

	errPipe, err := session.StderrPipe()
	if err != nil {
		log.Printf("Failed to open stderr on %s because %s\n", conn.id, err)
		return nil, err
	}

	err = session.Start(cmd)
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
					result.Code = v.Waitmsg.ExitStatus()
					break
				default:
					log.Printf("Failed run Command %s on %s because %s\n", cmd, conn.id, err)
					return nil, err
				}
			}
			break
		}
	case <-time.After(30 * time.Second):
		result.Error = CommandErrorTimeout
		return &result, nil
	}

	stdout, outReadErr := io.ReadAll(outPipe)
	if outReadErr != nil {
		log.Printf("Failed to read output for Command %s on %s because %s.\n", cmd, conn.id, outReadErr)
		return nil, outReadErr
	}

	stderr, errReadErr := io.ReadAll(errPipe)
	if errReadErr != nil {
		log.Printf("Failed to read output for Command %s on %s because %s.\n", cmd, conn.id, errReadErr)
		return nil, errReadErr
	}

	result.Stdout = string(stdout)
	result.Stderr = string(stderr)

	return &result, nil
}

func commandRoute(app *iris.Application) {
	app.Get("/command", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		out, err := handle.conn.RunCommand(ctx.URLParam("command"))

		if err != nil {
			ctx.StopWithError(iris.StatusUnprocessableEntity, err)
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command failed").
				Type("command_err").
				DetailErr(err))
			return
		}

		ctx.JSON(out)
	})
}
