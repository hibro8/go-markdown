package single

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
)

const port = 18321

type message struct {
	Files []string `json:"files"`
}

// TryAcquire tries to become the single instance. Returns a listener and true
// if this is the first instance. Returns the file paths to open if this is a
// secondary instance (the files come from the primary's response).
func TryAcquire(args []string) (ln net.Listener, isFirst bool, forwardFiles []string) {
	addr := fmt.Sprintf("127.0.0.1:%d", port)
	ln, err := net.Listen("tcp", addr)
	if err == nil {
		return ln, true, nil
	}

	// Port is busy — another instance is running. Forward our args.
	forwardFiles = filterFiles(args)
	if len(forwardFiles) == 0 {
		return nil, false, nil
	}

	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return nil, false, nil
	}
	defer conn.Close()

	msg := message{Files: forwardFiles}
	data, _ := json.Marshal(msg)
	data = append(data, '\n')
	conn.Write(data)

	// Read response (list of files the primary actually opened)
	resp, _ := bufio.NewReader(conn).ReadString('\n')
	var opened message
	json.Unmarshal([]byte(resp), &opened)

	return nil, false, opened.Files
}

func filterFiles(args []string) []string {
	var files []string
	for _, a := range args {
		ext := ""
		for i := len(a) - 1; i >= 0; i-- {
			if a[i] == '.' {
				ext = a[i:]
				break
			}
			if a[i] == '/' || a[i] == '\\' {
				break
			}
		}
		switch ext {
		case ".md", ".markdown", ".mdown", ".mkd":
			if _, err := os.Stat(a); err == nil {
				files = append(files, a)
			}
		}
	}
	return files
}
