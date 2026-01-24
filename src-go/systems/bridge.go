package systems

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// WebSocketBridge (placeholder for Gorilla WebSocket implementation)
// This is a simplified version - production version uses gorilla/websocket

type WebSocketBridge struct {
	gameCore    *GameCore
	serverAddr  string
	isRunning   bool
	httpServer  *http.Server
}

// NewWebSocketBridge creates a WebSocket bridge
func NewWebSocketBridge(gameCore *GameCore) *WebSocketBridge {
	return &WebSocketBridge{
		gameCore:   gameCore,
		serverAddr: "localhost:9000",
		isRunning:  false,
	}
}

// Start starts the WebSocket server on given port
func (wsb *WebSocketBridge) Start(port int) {
	wsb.serverAddr = fmt.Sprintf("localhost:%d", port)

	// Setup HTTP routes with CORS middleware
	http.HandleFunc("/health", wsb.corsMiddleware(wsb.handleHealth))
	http.HandleFunc("/state", wsb.corsMiddleware(wsb.handleState))
	http.HandleFunc("/input", wsb.corsMiddleware(wsb.handleInput))

	log.Printf("🌐 Game Core API starting on http://%s", wsb.serverAddr)
	log.Println("   /health - Get FPS and frame info")
	log.Println("   /state  - Get current game state (GET)")
	log.Println("   /input  - Send player input (POST)")
	log.Println("\n📝 Note: Full WebSocket support requires 'go get github.com/gorilla/websocket'")

	wsb.isRunning = true

	// Start HTTP server (non-blocking)
	go func() {
		if err := http.ListenAndServe(wsb.serverAddr, nil); err != nil {
			log.Printf("Server error: %v", err)
		}
	}()

	// Give server time to start
	time.Sleep(100 * time.Millisecond)
}

// corsMiddleware adds CORS headers to responses
func (wsb *WebSocketBridge) corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	})
}


func (wsb *WebSocketBridge) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	frameTime := wsb.gameCore.GetFrameTime()
	json.NewEncoder(w).Encode(frameTime)
}

func (wsb *WebSocketBridge) handleState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	state, _ := wsb.gameCore.GetState()
	w.Write(state)
}

func (wsb *WebSocketBridge) handleInput(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST required", http.StatusMethodNotAllowed)
		return
	}

	var input PlayerInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	wsb.gameCore.HandlePlayerInput(&input)
	wsb.gameCore.Update(0.016)

	w.Header().Set("Content-Type", "application/json")
	state, _ := wsb.gameCore.GetState()
	w.Write(state)
}

// Stop stops the server
func (wsb *WebSocketBridge) Stop() {
	wsb.isRunning = false
	if wsb.httpServer != nil {
		wsb.httpServer.Close()
	}
}
