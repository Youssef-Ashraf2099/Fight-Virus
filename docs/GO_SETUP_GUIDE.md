# Go Setup & Compilation Guide for Fight Virus

## Install Go

### Windows
1. Download: https://go.dev/dl/ (Get latest stable, e.g., go1.21.x)
2. Run installer
3. Verify: Open PowerShell and run:
   ```powershell
   go version
   ```
   Should output: `go version go1.21.x windows/amd64`

### macOS
```bash
brew install go
go version
```

### Linux
```bash
wget https://go.dev/dl/go1.21.x.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.x.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin
go version
```

---

## Build Steps

### 1. **Run Tests** (Validate code)
```bash
cd src-go
go test ./... -v
```

Expected output:
```
ok      fightvirus/entities/player   0.001s
ok      fightvirus/entities/enemies  0.001s
ok      fightvirus/entities/bosses   0.001s
PASS
```

### 2. **Compile Game Core Binary**

#### Build for current platform:
```bash
cd src-go
go build -o ../bin/game-core ./cmd
```

#### Build for all platforms:
```bash
# Windows
GOOS=windows GOARCH=amd64 go build -o ../bin/game-core-win.exe ./cmd

# macOS
GOOS=darwin GOARCH=amd64 go build -o ../bin/game-core-mac ./cmd

# Linux
GOOS=linux GOARCH=amd64 go build -o ../bin/game-core-linux ./cmd
```

### 3. **Create Shared Library** (For calling from JS)

#### Windows DLL:
```bash
go build -buildmode=c-shared -o ../bin/game-core.dll ./cmd
```

#### macOS dylib:
```bash
go build -buildmode=c-shared -o ../bin/game-core.dylib ./cmd
```

#### Linux .so:
```bash
go build -buildmode=c-shared -o ../bin/game-core.so ./cmd
```

---

## Create cmd/main.go

First, create the binary entrypoint:

```go
// src-go/cmd/main.go
package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"fightvirus/systems"
)

func main() {
	// Initialize game core
	gameCore := systems.NewGameCore()
	gameCore.Initialize()

	// Spawn a few enemies for testing
	gameCore.SpawnEnemy("ransomware", 10, 0, 10)
	gameCore.SpawnEnemy("trojan", 20, 0, 0)
	gameCore.SpawnEnemy("worm", -10, 0, 15)

	// Spawn a boss
	gameCore.SpawnBoss("circuit-overlord", 30, 5, 30)

	// Game loop
	fmt.Println("🎮 Fight Virus - Go Core Engine")
	fmt.Println("================================")
	fmt.Printf("Player initialized at: (%.1f, %.1f, %.1f)\n",
		gameCore.Player.Position.X,
		gameCore.Player.Position.Y,
		gameCore.Player.Position.Z)
	fmt.Printf("Enemies spawned: %d\n", len(gameCore.Enemies))
	fmt.Printf("Bosses spawned: %d\n", len(gameCore.Bosses))

	// Simulate 100 frames
	ticker := time.NewTicker(time.Millisecond * 16) // ~60 FPS
	frameCount := 0
	maxFrames := 100

	for range ticker.C {
		// Update
		gameCore.Update(0.016)

		// Every 10 frames, print status
		if frameCount%10 == 0 {
			state, _ := gameCore.GetState()
			fmt.Printf("[Frame %d] Player Health: %.0f, Enemies: %d, Bosses: %d\n",
				frameCount,
				gameCore.Player.Health,
				len(gameCore.Enemies),
				len(gameCore.Bosses))

			// Print first 100 bytes of state JSON
			if len(state) > 0 {
				fmt.Printf("State: %s...\n\n", string(state[:min(100, len(state))]))
			}
		}

		frameCount++
		if frameCount >= maxFrames {
			break
		}
	}

	ticker.Stop()
	fmt.Println("✅ Simulation complete!")

	// Print final state
	state, _ := gameCore.GetState()
	fmt.Printf("\nFinal Game State:\n%s\n", string(state))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
```

---

## Create WebSocket Bridge (JavaScript Integration)

### src-go/systems/websocket_bridge.go

```go
package systems

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins (development only!)
	},
}

type WebSocketBridge struct {
	gameCore *GameCore
	clients  map[*websocket.Conn]bool
	broadcast chan []byte
}

// NewWebSocketBridge creates a WebSocket bridge
func NewWebSocketBridge(gameCore *GameCore) *WebSocketBridge {
	return &WebSocketBridge{
		gameCore:  gameCore,
		clients:   make(map[*websocket.Conn]bool),
		broadcast: make(chan []byte, 256),
	}
}

// Start starts the WebSocket server on given port
func (wsb *WebSocketBridge) Start(port int) {
	http.HandleFunc("/ws", wsb.handleWS)
	http.HandleFunc("/health", wsb.handleHealth)

	addr := fmt.Sprintf("localhost:%d", port)
	log.Printf("🌐 WebSocket server starting on ws://%s/ws", addr)

	go wsb.broadcastLoop()
	http.ListenAndServe(addr, nil)
}

func (wsb *WebSocketBridge) handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	wsb.clients[conn] = true
	defer delete(wsb.clients, conn)

	log.Println("✅ Client connected")

	// Read loop
	for {
		var input PlayerInput
		err := conn.ReadJSON(&input)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("⚠️ WebSocket error: %v", err)
			}
			break
		}

		// Handle input
		wsb.gameCore.HandlePlayerInput(&input)

		// Update game
		wsb.gameCore.Update(0.016) // 60 FPS

		// Broadcast state to all clients
		state, _ := wsb.gameCore.GetState()
		wsb.broadcast <- state
	}
}

func (wsb *WebSocketBridge) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	frameTime := wsb.gameCore.GetFrameTime()
	json.NewEncoder(w).Encode(frameTime)
}

func (wsb *WebSocketBridge) broadcastLoop() {
	for {
		select {
		case msg := <-wsb.broadcast:
			for client := range wsb.clients {
				err := client.WriteMessage(websocket.TextMessage, msg)
				if err != nil {
					client.Close()
					delete(wsb.clients, client)
				}
			}
		}
	}
}
```

Add to `go.mod`:
```
require github.com/gorilla/websocket v1.5.0
```

Then run:
```bash
go get github.com/gorilla/websocket
```

---

## Connect from JavaScript

### src/systems/GoGameBridge.js

```javascript
export class GoGameBridge {
  constructor(wsURL = 'ws://localhost:9000/ws') {
    this.ws = null;
    this.wsURL = wsURL;
    this.connected = false;
    this.gameState = null;
    this.listeners = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsURL);

      this.ws.onopen = () => {
        console.log('✅ Connected to Go game core');
        this.connected = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.gameState = JSON.parse(event.data);
        this.notifyListeners('stateUpdate', this.gameState);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.warn('⚠️ Disconnected from Go core');
        this.connected = false;
      };

      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  sendInput(input) {
    if (this.connected) {
      this.ws.send(JSON.stringify(input));
    }
  }

  getState() {
    return this.gameState;
  }

  onStateUpdate(callback) {
    this.listeners.push({ event: 'stateUpdate', callback });
  }

  notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

### Usage in GameMain.js

```javascript
import { GoGameBridge } from './systems/GoGameBridge.js';

const bridge = new GoGameBridge('ws://localhost:9000/ws');

// Start game
async function init() {
  await bridge.connect();

  bridge.onStateUpdate((state) => {
    // Update Three.js scene with state
    updatePlayerPosition(state.player);
    updateEnemies(state.enemies);
    updateBosses(state.bosses);
  });

  // In input handler
  document.addEventListener('keydown', (e) => {
    const input = {
      moveDirection: [0, 0, 0],
      fireWeapon: false,
      switchWeapon: -1,
      useSprint: false,
      useEMP: false,
    };

    if (e.key === 'w') input.moveDirection[2] = -1;
    if (e.key === 'a') input.moveDirection[0] = -1;
    if (e.key === 's') input.moveDirection[2] = 1;
    if (e.key === 'd') input.moveDirection[0] = 1;
    if (e.key === ' ') input.fireWeapon = true;
    if (e.key === 'Shift') input.useSprint = true;
    if (e.key === 'e') input.useEMP = true;

    bridge.sendInput(input);
  });
}
```

---

## Performance Expectations

### Before (JavaScript):
- ~15 enemies max before lag
- 30-40 FPS with 10 enemies
- Collision checks: O(n²)

### After (Go, Phase 1):
- ~50 enemies stable
- 60 FPS with 20 enemies
- Collision checks: O(n²) but faster math

### After (Go + Goroutines, Phase 2):
- 100+ enemies
- 60 FPS consistently
- Collision checks: O(n²/4) with 4 workers

---

## Troubleshooting

### "go: command not found"
- Go not in PATH
- Restart terminal after installation
- Check `go version` works

### "undefined: websocket"
- Run `go get github.com/gorilla/websocket`

### "Module not found: fightvirus"
- Make sure `go.mod` is at `src-go/go.mod`
- Check module name matches imports

### Compilation errors in tests
- Ensure all `.go` files are in correct packages
- Check imports paths match directory structure

---

## Next: Phase 1 Validation

Once compiled and running:

1. **Performance Test**: Monitor FPS with 30 enemies
2. **Compatibility Test**: Compare JSON output with JS version byte-for-byte
3. **Stability Test**: Run for 10 minutes, check memory
4. **Deletion**: Remove `src/entities/` JS code
5. **Benchmark**: Compare old vs new performance

See [PHASE1_GO_MIGRATION.md](./PHASE1_GO_MIGRATION.md) for validation checklist.
