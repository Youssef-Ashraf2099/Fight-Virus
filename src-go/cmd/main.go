package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"fightvirus/systems"
)

func main() {
	// Parse command line args
	var testMode bool
	var maxFrames int
	var serverPort string

	// Parse flags
	flag.BoolVar(&testMode, "test", false, "Run in test validation mode (exits after N frames)")
	flag.IntVar(&maxFrames, "frames", 100, "Max frames for test mode")
	flag.StringVar(&serverPort, "port", "9000", "Server port (default 9000)")
	flag.Parse()

	// If positional arg provided, treat as frame count for backward compat
	if len(flag.Args()) > 0 {
		if n, err := strconv.Atoi(flag.Args()[0]); err == nil {
			maxFrames = n
			testMode = true
		}
	}

	// Initialize game core
	gameCore := systems.NewGameCore()
	gameCore.Initialize()

	// Spawn initial test entities
	gameCore.SpawnEnemy("ransomware", 10, 0, 10)
	gameCore.SpawnEnemy("trojan", 20, 0, 0)
	gameCore.SpawnEnemy("worm", -10, 0, 15)
	gameCore.SpawnEnemy("spyware", 0, 0, 20)
	gameCore.SpawnBoss("circuit-overlord", 30, 5, 30)

	if testMode {
		// Run test validation mode (legacy behavior, exits after frames)
		runTestValidation(gameCore, maxFrames)
	} else {
		// Run as HTTP server (continuous)
		runServer(gameCore, serverPort)
	}
}

func runServer(gameCore *systems.GameCore, port string) {
	// Create bridge
	bridge := systems.NewWebSocketBridge(gameCore)

	fmt.Printf("\n🎮 Fight Virus - Go Core Engine (Server Mode)\n")
	fmt.Printf("==========================================\n")
	fmt.Printf("Starting HTTP/REST server on :%s\n", port)
	fmt.Printf("Endpoints:\n")
	fmt.Printf("  POST http://localhost:%s/input  - Send PlayerInput, get GameState\n", port)
	fmt.Printf("  GET  http://localhost:%s/state  - Get current GameState\n", port)
	fmt.Printf("  GET  http://localhost:%s/health - Check server health\n", port)
	fmt.Printf("==========================================\n")

	// Parse port as int
	portInt := 9000
	if p, err := strconv.Atoi(port); err == nil {
		portInt = p
	}

	// Start server in background
	go func() {
		bridge.Start(portInt)
	}()

	// Run continuous game loop
	fmt.Printf("\n▶️ Running game loop at 60 FPS\n")
	ticker := time.NewTicker(time.Millisecond * 16)
	defer ticker.Stop()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	frameCount := 0
	for {
		select {
		case <-sigChan:
			fmt.Printf("\n\n🛑 Shutdown signal received\n")
			fmt.Printf("📊 Stats: %d frames processed\n", frameCount)
			return
		case <-ticker.C:
			// Spawn enemies less frequently (every 300 frames = 5 seconds at 60 FPS)
			if frameCount%300 == 0 && frameCount > 0 {
				enemyTypes := []string{"ransomware", "trojan", "worm", "spyware"}
				typeIdx := frameCount / 300 % len(enemyTypes)
				x := float64((-10 + (frameCount%20)) * 1)
				z := float64((10 + (frameCount%15)) * 1)
				gameCore.SpawnEnemy(enemyTypes[typeIdx], x, 0, z)
			}

			// Dummy input (can be overridden by HTTP /input endpoint)
			input := &systems.PlayerInput{
				MoveDirection: [3]float64{0, 0, 0},
				FireWeapon:    false,
				SwitchWeapon:  -1,
				UseSprint:     false,
				UseEMP:        false,
			}

			gameCore.HandlePlayerInput(input)
			gameCore.Update(0.016)

			frameCount++
			if frameCount%300 == 0 {
				fmt.Printf("✅ %d frames running | Enemies: %d | Player HP: %.0f\n",
					frameCount, len(gameCore.Enemies), gameCore.Player.Health)
			}
		}
	}
}

func runTestValidation(gameCore *systems.GameCore, maxFrames int) {
	// Game loop header
	fmt.Println("\n🎮 Fight Virus - Go Core Engine (Test Validation)")
	fmt.Println(repeatString("=", 60))
	fmt.Printf("Player initialized at: (%.1f, %.1f, %.1f)\n",
		gameCore.Player.Position.X,
		gameCore.Player.Position.Y,
		gameCore.Player.Position.Z)
	fmt.Printf("Max Health: %.0f\n", gameCore.Player.MaxHealth)
	fmt.Printf("Weapons: %d\n", len(gameCore.Player.Weapons))
	fmt.Printf("Enemies spawned: %d\n", len(gameCore.Enemies))
	fmt.Printf("Bosses spawned: %d\n", len(gameCore.Bosses))
	fmt.Println(repeatString("=", 60))

	// Simulate frames
	ticker := time.NewTicker(time.Millisecond * 16) // ~60 FPS
	frameCount := 0

	for range ticker.C {
		// Create dummy input for movement
		input := &systems.PlayerInput{
			MoveDirection: [3]float64{1, 0, 0}, // Move forward
			FireWeapon:    frameCount%10 == 0,  // Fire every 10 frames
			SwitchWeapon:  -1,
			UseSprint:     false,
			UseEMP:        frameCount == 50, // EMP at frame 50
		}

		// Handle input and update
		gameCore.HandlePlayerInput(input)
		gameCore.Update(0.016)

		// Print status every 10 frames
		if frameCount%10 == 0 {
			fmt.Printf("[Frame %3d] Player: ✓ | Enemies: %d | Health: %.0f | Energy: %.1f/%.1f\n",
				frameCount,
				len(gameCore.Enemies),
				gameCore.Player.Health,
				gameCore.Player.Energy,
				gameCore.Player.MaxEnergy)
		}

		frameCount++
		if frameCount >= maxFrames {
			break
		}
	}

	ticker.Stop()

	// Print final statistics
	fmt.Println("\n" + repeatString("=", 60))
	fmt.Println("📊 TEST RESULTS")
	fmt.Println(repeatString("=", 60))
	fmt.Printf("Total Frames: %d\n", frameCount)
	fmt.Printf("Final Player Health: %.0f\n", gameCore.Player.Health)
	fmt.Printf("Alive Enemies: %d\n", len(gameCore.Enemies))
	fmt.Printf("Alive Bosses: %d\n", len(gameCore.Bosses))

	frameTime := gameCore.GetFrameTime()
	fmt.Printf("Elapsed Time: %.2f seconds\n", frameTime["elapsed"])
	fmt.Printf("Average FPS: %.2f\n", frameTime["fps"])
	fmt.Printf("Delta Time: %.4f seconds\n", frameTime["deltaTime"])

	fmt.Println("\n✅ Test validation complete!")
}

// repeatString repeats a string n times
func repeatString(s string, n int) string {
	result := ""
	for i := 0; i < n; i++ {
		result += s
	}
	return result
}

// Star separator
func init() {
	log.SetFlags(log.Ltime)
}
