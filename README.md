# SuperCompose

SuperCompose manages docker-compose on your servers. It will automate Continuous Delivery with WebHooks and ensure redeploys on image changes in Docker registries. Currently in ALPHA.

## Audience

- Homelab owners
  - SuperCompose helps you manage your self-hosted applications with ease of web-ui yet with all the power of Docker.
- One man projects
  - SuperCompose lets you worry about development instead of deployment. It helps you save costs on expensive cloud configurations.
- Small and medium enterprises
  - SuperCompose will manage your small cluster of servers with ease and flexibility of docker-compose, but won't require you to invest into learning difficult solutions like Kubernetes

## Features

- Configure servers through SSH
- Configure docker-compose files
- Deploy compose files to servers (one compose file can be deployed to multiple servers and vice versa)
- Track running containers
- See deployment status on a glance (running, failed, warning)
- Action log so you can diagnose and resolve issues quickly (for example missing dependencies or insufficient user privileges)

## Why not Kubernetes or Nomad?

Complex systems fail in complex ways. Kubernetes is made by Google to solve their scaling problems. Most organizations (which likely means you as well) do not have Google scale problems and so don't require Google scale solutions. Kubernetes is huge and complex and when you grok it you will discover fractal of other tools that you also need (sometimes to solver problems that Kubernetes itself has created). Service meshes, sidecar containers and autoscaling groups are nice engineering concepts, but answer truthfully - do you actually need them? And if you do, do you have enough operations engineers to support these behemoths?

SuperCompose does something that does not make sense at a first glance - it takes a step back. A step back from complexity. However this allows it to take two steps forward in user experience. It won't scale to thousands of servers, but that's OK. But it will do what it can to help you configure and run your applications quickly, with minimal hassle and minimal maintenance.

## Project structure

- [Backend](/backend) is ASP.NET Core app with different modules that handle everything from the API for configuration interface to communication with your servers
- [Frontend](/frontend) is Next.js React/Typescript GUI that consumes GraphQL API exposed by the Backend

## Planned features

- Streaming logs
- CPU/RAM/IO metrics integration
- Service scaling and docker service level redeploys
- Compose environment variable management (on compose/deployment level)
- Webhooks/API for inbound/outbound CI/CD integration
- Docker registry integration
- Team management and shared resources
- Generic deployment steps which should allow calling external APIs or running scripts before and after deployment
