# https://hub.docker.com/_/microsoft-dotnet
FROM mcr.microsoft.com/dotnet/sdk:5.0-focal AS build
WORKDIR /source

# copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore -r linux-x64

# copy everything else and build app
COPY . ./
WORKDIR /source
RUN dotnet publish SuperCompose.csproj -c release -o /app -r linux-x64 --self-contained false --no-restore

WORKDIR /app
RUN wget https://download-cf.jetbrains.com/resharper/dotUltimate.2021.1.2/JetBrains.dotTrace.CommandLineTools.linux-x64.2021.1.2.tar.gz
RUN mkdir trace
RUN tar -xf JetBrains.dotTrace.CommandLineTools.linux-x64.2021.1.2.tar.gz -C trace

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:5.0-focal-amd64
WORKDIR /app
COPY --from=build /app ./

# See: https://github.com/dotnet/announcements/issues/20
# Uncomment to enable globalization APIs (or delete)
#ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
#RUN apk add --no-cache icu-libs
#ENV LC_ALL=en_US.UTF-8
#ENV LANG=en_US.UTF-8

ENTRYPOINT ["./SuperCompose"]