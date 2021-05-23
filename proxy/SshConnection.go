package main

import (
	"context"
	"fmt"
	systemdDbus "github.com/coreos/go-systemd/dbus"
	"github.com/docker/docker/client"
	"github.com/pkg/sftp"
	"go.opentelemetry.io/otel"
	"golang.org/x/crypto/ssh"
	"io"
	"log"
	"strconv"
	"strings"
	"time"
)

type SshConnectionCredentials struct {
	Host     string `json:"host" validate:"required"`
	Username string `json:"username" validate:"required"`
	Pkey     string `json:"pkey"`
	Password string `json:"password"`
}

type SshConnection struct {
	io.Closer
	id            string
	args          SshConnectionCredentials
	client        *ssh.Client
	sftpClient    *sftp.Client
	shellSession  *ssh.Session
	ctx           context.Context
	dockerClient  *client.Client
	uid           int
	systemdHandle *systemdDbus.Conn
}

type CommandResult struct {
	Cmd    string `json:"command"`
	Stdout []byte `json:"stdout"`
	Stderr []byte `json:"stderr"`
	Code   int    `json:"code"`
	Error  string `json:"error"`
}

func (conn *SshConnection) Close() error {
	if conn.systemdHandle != nil {
		conn.systemdHandle.Close()
	}

	if err := conn.sftpClient.Close(); err != nil {
		return err
	}

	if err := conn.client.Close(); err != nil {
		return err
	}

	return nil
}

var sshTracer = otel.Tracer("SSH")
var backgroundTracker = otel.Tracer("Proxy background")

func ConnectToHost(ctx context.Context, args *SshConnectionCredentials) (*SshConnection, error) {
	id := fmt.Sprintf("%s@%s", args.Username, args.Host)

	childCtx, span := sshTracer.Start(ctx, fmt.Sprintf("Connect to %s", id))
	defer span.End()

	var authMethod []ssh.AuthMethod

	if len(args.Pkey) > 0 {
		span.AddEvent("Parsing private key")
		// Create the Signer for this private key.
		signer, err := ssh.ParsePrivateKey([]byte(args.Pkey))
		if err != nil {
			log.Printf("Unable to parse private key: %v", err)
			return nil, err
		}

		authMethod = append(authMethod, ssh.PublicKeys(signer))
	}

	if len(args.Password) > 0 {
		authMethod = append(authMethod, ssh.Password(args.Password))
	}

	sshConfig := &ssh.ClientConfig{
		Timeout:         30 * time.Second,
		User:            args.Username,
		Auth:            authMethod,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	span.AddEvent("Dialing")
	log.Printf("Connecting to: %s\n", id)
	sshClient, err := ssh.Dial("tcp", args.Host, sshConfig)
	if err != nil {
		log.Printf("Connection to %s failed with %s\n", id, err)
		span.RecordError(err)
		return nil, err
	}

	span.AddEvent("Creating session")
	session, err := sshClient.NewSession()
	if err != nil {
		log.Printf("Failed to create session on because %s\n", err)
		span.RecordError(err)
		return nil, err
	}

	span.AddEvent("Opening shell")
	err = session.Shell()
	if err != nil {
		log.Printf("Failed to shell on session session on because %s\n", err)
		span.RecordError(err)
		return nil, err
	}

	conn := SshConnection{
		id:           id,
		client:       sshClient,
		shellSession: session,
	}

	log.Printf("Connection to %s successful\n", id)

	span.AddEvent("Creating sftp client")
	conn.sftpClient, err = sftp.NewClient(sshClient)
	if err != nil {
		log.Printf("Failed to create sftp connection to %s because %s\n", id, err)
		span.RecordError(err)
		return nil, err
	}

	conn.ctx, _ = backgroundTracker.Start(context.Background(), "Docker")

	span.AddEvent("Creating docker client")
	conn.dockerClient, err = createDockerClient(sshClient)
	if err != nil {
		log.Printf("Failed to initialize docker client because %s\n", err)
		span.RecordError(err)
		return nil, err
	}

	span.AddEvent("Acquiring id")
	uidResult, err := conn.RunCommand(childCtx, "id -u")
	if err != nil {
		span.RecordError(err)
		return nil, err
	}
	conn.uid, err = strconv.Atoi(strings.TrimSpace(string(uidResult.Stdout)))
	if err != nil {
		span.RecordError(err)
		return nil, err
	}

	return &conn, nil
}
