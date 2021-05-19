package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/client"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type SshConnectionArgs struct {
	Host     string `json:"host" validate:"required"`
	Username string `json:"username" validate:"required"`
	Pkey     string `json:"pkey" validate:"required"`
}

type SshConnection struct {
	io.Closer
	id           string
	args         SshConnectionArgs
	client       *ssh.Client
	sftpClient   *sftp.Client
	shellSession *ssh.Session
	ctx          context.Context
	dockerClient *client.Client
	uid          int
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
	if err := conn.sftpClient.Close(); err != nil {
		return err
	}

	if err := conn.client.Close(); err != nil {
		return err
	}

	return nil
}

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

func ConnectToHost(args *SshConnectionArgs) (*SshConnection, error) {
	id := fmt.Sprintf("%s@%s", args.Username, args.Host)

	// Create the Signer for this private key.
	signer, err := ssh.ParsePrivateKey([]byte(args.Pkey))
	if err != nil {
		log.Printf("Unable to parse private key: %v", err)
		return nil, err
	}

	sshConfig := &ssh.ClientConfig{
		User: args.Username,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
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
