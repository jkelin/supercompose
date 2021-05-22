package main

import (
	"context"
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/iris-contrib/middleware/cors"
	"github.com/kataras/iris/v12"
	irisContext "github.com/kataras/iris/v12/context"
	"github.com/kataras/iris/v12/middleware/jwt"
	"github.com/kataras/iris/v12/middleware/logger"
	"github.com/kataras/iris/v12/middleware/recover"
	"github.com/spf13/viper"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/trace/jaeger"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	traceSdk "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/semconv"
	"go.opentelemetry.io/otel/trace"
	"log"
	"net/http"
	"time"
)

func sse(ctx iris.Context, lines chan string) {
	flusher, ok := ctx.ResponseWriter().Flusher()
	if !ok {
		ctx.StopWithText(iris.StatusHTTPVersionNotSupported, "Streaming unsupported!")
		return
	}

	cw, err := irisContext.AcquireCompressResponseWriter(ctx.ResponseWriter(), ctx.Request(), -1)
	if err != nil {
		ctx.StopWithText(iris.StatusHTTPVersionNotSupported, "Compression unsupported!")
		return
	}

	ctx.ContentType("text/event-stream")
	ctx.Header("Cache-Control", "no-cache")

	cancellation := make(chan bool)
	ctx.OnClose(func(ctx *irisContext.Context) {
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
	return func(ctx *irisContext.Context) string {
		return ctx.URLParam(param)
	}
}

// tracerProvider returns an OpenTelemetry TracerProvider configured to use
// the Jaeger exporter that will send spans to the provided url. The returned
// TracerProvider will also use a Resource configured with all the information
// about the application.
func tracerProvider(url string) (*traceSdk.TracerProvider, error) {
	// Create the Jaeger exporter
	exp, err := jaeger.NewRawExporter(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(url)))
	if err != nil {
		return nil, err
	}
	tp := traceSdk.NewTracerProvider(
		// Always be sure to batch in production.
		traceSdk.WithBatcher(exp),
		// Record information about this application in an Resource.
		traceSdk.WithResource(resource.NewWithAttributes(
			semconv.ServiceNameKey.String("proxy"),
		)),
	)

	otel.SetTracerProvider(tp)
	propagator := propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{})
	otel.SetTextMapPropagator(propagator)

	return tp, nil
}

func injectOpenTelemetry(app *iris.Application) {
	app.Use(func(ctx iris.Context) {
		span := trace.SpanFromContext(ctx.Request().Context())
		span.SetName(ctx.RouteName())

		credentials := jwt.Get(ctx).(*SshConnectionCredentials)
		span.SetAttributes(
			attribute.String("command.host", credentials.Host),
			attribute.String("command.username", credentials.Username),
		)

		if id := ctx.Params().Get("id"); id != "" {
			span.SetAttributes(attribute.String("command.id", id))
		}

		if id := ctx.URLParam("id"); id != "" {
			span.SetAttributes(attribute.String("command.id", id))
		}

		if path := ctx.URLParam("path"); path != "" {
			span.SetAttributes(attribute.String("command.path", path))
		}

		if command := ctx.URLParam("command"); command != "" {
			span.SetAttributes(attribute.String("command.command", command))
		}

		ctx.OnClose(func(ctx iris.Context) {
			if ctx.GetStatusCode() < 400 {
				span.SetStatus(codes.Ok, fmt.Sprintf("%d", ctx.GetStatusCode()))
			} else {
				span.SetStatus(codes.Error, fmt.Sprintf("%d", ctx.GetStatusCode()))
			}

			if err := ctx.GetErr(); err != nil {
				span.SetAttributes(attribute.String("error.details", fmt.Sprintf("%v", err)))
				span.RecordError(err)
			}

			span.End()
		})

		ctx.Next()
	})
}

func main() {
	go RunConnectionManager()

	viper.SetDefault("JWT_KEY", "your-256-bit-secret")
	viper.SetDefault("JWE_KEY", nil)
	viper.SetDefault("JAEGER_URL", nil)
	viper.AutomaticEnv()

	app := iris.New()
	app.Validator = validator.New()

	app.Logger().SetLevel("debug")
	app.Use(recover.New())
	app.Use(logger.New())

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

	if viper.IsSet("JAEGER_URL") {
		tp, err := tracerProvider(viper.GetString("JAEGER_URL"))
		if err != nil {
			log.Fatalf("Could not init opentelemetry: %v", err)
			return
		}

		otel.SetTracerProvider(tp)
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		// Cleanly shutdown and flush telemetry when the application exits.
		defer func(ctx context.Context) {
			// Do not make the application hang when it is shutdown.
			ctx, cancel = context.WithTimeout(ctx, time.Second*5)
			defer cancel()
			if err := tp.Shutdown(ctx); err != nil {
				log.Fatal(err)
			}
		}(ctx)

		injectOpenTelemetry(app)
	}

	crs := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // allows everything, use that to change the hosts.
		AllowCredentials: true,
	})
	app.UseRouter(crs)

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

	//err := app.Listen(":8080", iris.WithSocketSharding)
	//if err != nil {
	//	log.Fatalf("Error while binding port 8080 %v", err)
	//	return
	//}

	if err := app.Build(); err != nil {
		panic(err)
	}

	openTelemetryHandler := otelhttp.NewHandler(app, "Iris")

	err := http.ListenAndServe(":8080", openTelemetryHandler)
	if err != nil {
		log.Fatalf("Error while binding port 8080 %v", err)
		return
	}
}
