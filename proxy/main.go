package main

import (
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/context"
	"github.com/kataras/iris/v12/middleware/jwt"
	"github.com/kataras/iris/v12/middleware/logger"
	"github.com/kataras/iris/v12/middleware/recover"
	"github.com/spf13/viper"
	"log"
)

type ProxyError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Err     error
}

func (err ProxyError) Error() string {
	return err.Message
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
		return new(SshConnectionCredentials)
	})

	app.Use(verifyMiddleware)

	containerStatsRoute(app)

	app.Use(iris.Compression)

	SystemdGetServiceRoute(app)
	SystemdReloadRoute(app)
	SystemdStartServiceRoute(app)
	SystemdStopServiceRoute(app)
	SystemdRestartServiceRoute(app)
	SystemdEnableServiceRoute(app)
	SystemdDisableServiceRoute(app)

	writeFileRoute(app)
	readFileRoute(app)
	upsertFileRoute(app)
	deleteFileRoute(app)

	commandRoute(app)
	containersRoute(app)
	containerInspectRoute(app)

	err := app.Listen(":8080", iris.WithSocketSharding)
	if err != nil {
		log.Fatalf("Error while binding port 8080 %v", err)
		return
	}
}
