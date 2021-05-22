package main

import (
	"bufio"
	"context"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	dockerClient "github.com/docker/docker/client"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"golang.org/x/crypto/ssh"
	"log"
	"net"
	"net/http"
)

var dockerTracer = otel.Tracer("Docker")

func createDockerClient(sshClient *ssh.Client) (*dockerClient.Client, error) {
	transport := &http.Transport{
		DialContext: func(ctx context.Context, net string, addr string) (net.Conn, error) {
			_, dockerSpan := dockerTracer.Start(ctx, "Docker pipe open")
			defer dockerSpan.End()

			connection, err := sshClient.Dial("unix", "/var/run/docker.sock")
			if err != nil {
				dockerSpan.RecordError(err)
				return nil, err
			}

			return connection, nil
		},
	}
	client := http.Client{Transport: otelhttp.NewTransport(transport)}

	return dockerClient.NewClientWithOpts(dockerClient.WithHTTPClient(&client), dockerClient.WithAPIVersionNegotiation())
}

func containerInspectRoute(app *iris.Application) {
	app.Get("/containers/:id/json", func(ctx iris.Context) {
		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		log.Printf("Inspecting container %s", ctx.Params().Get("id"))
		containers, _, err := handle.conn.dockerClient.ContainerInspectWithRaw(ctx.Request().Context(), ctx.Params().Get("id"), true)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				DetailErr(err))
			return
		}

		ctx.JSON(containers)
	}).SetName("Docker container inspect")
}

func containersRoute(app *iris.Application) {
	app.Get("/containers/json", func(ctx iris.Context) {
		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		log.Printf("Reading containers")
		containerFilters := filters.NewArgs()
		containerFilters.Add("label", "com.docker.compose.service")
		containers, err := handle.conn.dockerClient.ContainerList(ctx.Request().Context(), types.ContainerListOptions{
			Filters: containerFilters,
			Size:    true,
		})
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				DetailErr(err))
			return
		}

		ctx.JSON(containers)
	}).SetName("Docker containers")
}

func containerStatsRoute(app *iris.Application) {
	app.Get("/containers/:id/stats", func(ctx iris.Context) {
		handle, err := GetConnection(ctx.Request().Context(), jwt.Get(ctx).(*SshConnectionCredentials))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		log.Printf("Reading container stats for %s", ctx.Params().Get("id"))
		statStream, err := handle.conn.dockerClient.ContainerStats(ctx.Request().Context(), ctx.Params().Get("id"), true)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				DetailErr(err))
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
						DetailErr(err))
					return
				}

				var stats types.Stats
				err = json.Unmarshal(line, &stats)
				if err != nil {
					ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
						Title("Command error").
						Detail("Error parsing stats").
						Type("command_err").
						DetailErr(err))
					return
				}

				lineOut, err := json.Marshal(stats)

				lines <- string(lineOut)
			}
		})()

		sse(ctx, lines)
	}).SetName("Docker container stats")
}
