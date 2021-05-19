package main

import (
	"fmt"
	"log"
	"sync"
	"time"
)

type connectionManager struct {
	connections map[string]*connectionWrapper
	mu          sync.Mutex
}

type ConnectionHandle struct {
	conn  *SshConnection
	Close func()
}

type connectionWrapper struct {
	conn    *SshConnection
	handles int
	lastUse time.Time
	marked  bool
}

var manager connectionManager

const closeConnectionAfter = 10 * time.Minute

func RunConnectionManager() {
	manager = connectionManager{
		connections: make(map[string]*connectionWrapper),
	}

	for {
		time.Sleep(1 * time.Second)

		// mark and sweep garbage collection
		manager.mu.Lock()
		for key, element := range manager.connections {
			if element.handles == 0 {
				if element.marked && time.Now().After(element.lastUse.Add(closeConnectionAfter)) {
					log.Printf("Closing connection %s because it was not used recently", element.conn.id)
					delete(manager.connections, key)

					element.conn.Close()
				} else {
					element.marked = true
				}
			} else if element.marked {
				element.marked = false
			}
		}
		manager.mu.Unlock()
	}
}

func GetConnection(args *SshConnectionArgs) (*ConnectionHandle, error) {
	argsHash := fmt.Sprintf("%s@%s %s", args.Username, args.Host, args.Pkey)

	manager.mu.Lock()

	conn := manager.connections[argsHash]

	if conn == nil {
		manager.mu.Unlock()
		host, err := ConnectToHost(args)
		if err != nil {
			return nil, err
		}

		manager.mu.Lock()
		conn = manager.connections[argsHash]
		if conn == nil {
			conn = &connectionWrapper{
				conn:    host,
				handles: 0,
			}

			manager.connections[argsHash] = conn
		}
	}

	conn.lastUse = time.Now()
	conn.handles += 1
	manager.mu.Unlock()

	handle := ConnectionHandle{
		conn: conn.conn,
		Close: func() {
			conn.handles -= 1
			conn.lastUse = time.Now()
			log.Printf("Closed connection handle to %s", conn.conn.id)
		},
	}

	log.Printf("Acquired connection handle to %s", handle.conn.id)

	return &handle, nil
}