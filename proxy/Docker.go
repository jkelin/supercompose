package main

import (
	"bufio"
	"encoding/json"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/filters"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/jwt"
)

func containerInspectRoute(app *iris.Application) {
	app.Get("/containers/:id/json", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		containers, _, err := handle.conn.dockerClient.ContainerInspectWithRaw(handle.conn.ctx, ctx.Params().Get("id"), true)
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Command error").
				Type("command_err").
				DetailErr(err))
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
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
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
				DetailErr(err))
			return
		}

		ctx.JSON(containers)
	})
}

func containerStatsRoute(app *iris.Application) {
	app.Get("/containers/:id/stats", func(ctx iris.Context) {
		handle, err := GetConnection(jwt.Get(ctx).(*SshConnectionArgs))
		if err != nil {
			ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
				Title("Connection to target host failed").
				Type("connection_err").
				DetailErr(err))
			return
		}
		defer handle.Close()

		statStream, err := handle.conn.dockerClient.ContainerStats(handle.conn.ctx, ctx.Params().Get("id"), true)
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
	})
}
