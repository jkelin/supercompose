package main

import (
	"context"
	"fmt"
	systemdDbus "github.com/coreos/go-systemd/dbus"
	"github.com/docker/docker/client"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
	"io"
	"log"
	"net"
	"strconv"
	"strings"
	"time"
)

type SshConnectionArgs struct {
	Host     string `json:"host" validate:"required"`
	Username string `json:"username" validate:"required"`
	Pkey     string `json:"pkey"`
	Password string `json:"password"`
}

type SshConnection struct {
	io.Closer
	id            string
	args          SshConnectionArgs
	client        *ssh.Client
	sftpClient    *sftp.Client
	shellSession  *ssh.Session
	ctx           context.Context
	dockerClient  *client.Client
	uid           int
	systemdHandle *systemdDbus.Conn
}

const (
	CommandErrorTimeout = "command_timeout"
)

type CommandResult struct {
	Cmd    string `json:"command"`
	Stdout string `json:"stdout"`
	Stderr string `json:"stderr"`
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

func ConnectToHost(args *SshConnectionArgs) (*SshConnection, error) {
	id := fmt.Sprintf("%s@%s", args.Username, args.Host)

	var authMethod []ssh.AuthMethod

	if len(args.Pkey) > 0 {
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

	log.Printf("Connecting to: %s\n", id)
	sshClient, err := ssh.Dial("tcp", args.Host, sshConfig)
	if err != nil {
		log.Printf("Connection to %s failed with %s\n", id, err)
		return nil, err
	}

	session, err := sshClient.NewSession()
	if err != nil {
		log.Printf("Failed to create session on because %s\n", err)
		return nil, err
	}

	err = session.Shell()
	if err != nil {
		log.Printf("Failed to shell on session session on because %s\n", err)
		return nil, err
	}

	conn := SshConnection{
		id:           id,
		client:       sshClient,
		shellSession: session,
	}

	log.Printf("Connection to %s successful\n", id)

	conn.sftpClient, err = sftp.NewClient(sshClient)
	if err != nil {
		log.Printf("Failed to create sftp connection to %s because %s\n", id, err)
		return nil, err
	}

	conn.ctx = context.Background()
	conn.dockerClient, err = client.NewClientWithOpts(client.WithDialContext(
		func(ctx context.Context, net string, addr string) (net.Conn, error) {
			connection, err := sshClient.Dial("unix", "/var/run/docker.sock")
			if err != nil {
				return nil, err
			}

			return connection, nil
		},
	), client.WithAPIVersionNegotiation())
	if err != nil {
		log.Printf("Failed to initialize docker client because %s\n", err)
		return nil, err
	}

	uidResult, err := conn.RunCommand("id -u")
	if err != nil {
		return nil, err
	}
	conn.uid, err = strconv.Atoi(strings.TrimSpace(uidResult.Stdout))
	if err != nil {
		return nil, err
	}

	return &conn, nil
}
