package systems

import (
	"fightvirus/entities/bosses"
	"fightvirus/entities/enemies"
	"fightvirus/entities/player"
	"fightvirus/utils"
	"sync"
	"time"
)

// GameCore represents the core game logic running in Go
type GameCore struct {
	Player         *player.Player
	Enemies        []*enemies.BaseEnemy
	Bosses         []*bosses.BaseBoss
	StateManager   *StateManager
	DeltaTime      float64
	FrameCount     int
	StartTime      time.Time
	Paused         bool
	mu             sync.RWMutex
}

// NewGameCore initializes the game core
func NewGameCore() *GameCore {
	return &GameCore{
		Player:       player.NewPlayer("player-1"),
		Enemies:      make([]*enemies.BaseEnemy, 0),
		Bosses:       make([]*bosses.BaseBoss, 0),
		StateManager: NewStateManager(),
		DeltaTime:    0.016, // ~60 FPS default
		StartTime:    time.Now(),
	}
}

// Initialize initializes core references in state manager
func (gc *GameCore) Initialize() {
	gc.StateManager.SetPlayer(gc.Player)
}

// Update updates all game state for one frame
func (gc *GameCore) Update(deltaSeconds float64) {
	gc.mu.Lock()
	defer gc.mu.Unlock()

	if gc.Paused {
		return
	}

	gc.DeltaTime = deltaSeconds
	gc.FrameCount++

	// Update player
	if gc.Player != nil && gc.Player.IsAlive() {
		gc.Player.Update(deltaSeconds, nil) // Input handled separately
	}

	playerPos := gc.Player.Position

	// Update enemies
	for _, e := range gc.Enemies {
		if e.IsAlive() {
			e.Update(deltaSeconds, playerPos)
		}
	}

	// Update bosses
	for _, b := range gc.Bosses {
		if b.IsAlive() {
			b.Update(deltaSeconds, playerPos)
		}
	}

	// Perform collision detection
	gc.checkCollisions()

	// Clean up dead entities
	gc.StateManager.RemoveDeadEntities()
}

// checkCollisions performs collision detection between all entities
func (gc *GameCore) checkCollisions() {
	// Enemy-to-player collision
	for _, e := range gc.Enemies {
		if e.IsAlive() && gc.Player.IsAlive() {
			if gc.checkCircleCollision(e.Position, e.CollisionRadius, gc.Player.Position, gc.Player.CollisionRadius) {
				gc.Player.TakeDamage(e.ContactDamage)
				e.ApplyKnockback(10, gc.Player.Position.Clone().Sub(e.Position))
			}
		}
	}

	// Boss-to-player collision
	for _, b := range gc.Bosses {
		if b.IsAlive() && gc.Player.IsAlive() {
			if gc.checkCircleCollision(b.Position, b.CollisionRadius, gc.Player.Position, gc.Player.CollisionRadius) {
				gc.Player.TakeDamage(b.ContactDamage)
				b.ApplyKnockback(15, gc.Player.Position.Clone().Sub(b.Position))
			}
		}
	}

	// Enemy-to-enemy collision (soft collision)
	for i, e1 := range gc.Enemies {
		for j, e2 := range gc.Enemies {
			if i < j && e1.IsAlive() && e2.IsAlive() {
				if gc.checkCircleCollision(e1.Position, e1.CollisionRadius, e2.Position, e2.CollisionRadius) {
					// Apply soft separation
					dir := e2.Position.Clone().Sub(e1.Position).Normalize()
					e1.ApplyKnockback(5, dir.Clone().MultiplyScalar(-1))
					e2.ApplyKnockback(5, dir)
				}
			}
		}
	}
}

// checkCircleCollision checks if two circles collide
func (gc *GameCore) checkCircleCollision(pos1 *utils.Vector3, rad1 float64, pos2 *utils.Vector3, rad2 float64) bool {
	distSq := pos1.DistanceToSq(pos2)
	sumRad := rad1 + rad2
	return distSq < (sumRad * sumRad)
}

// SpawnEnemy spawns an enemy in the game
func (gc *GameCore) SpawnEnemy(enemyType string, x, y, z float64) *enemies.BaseEnemy {
	gc.mu.Lock()
	defer gc.mu.Unlock()

	var e *enemies.BaseEnemy

	// Create enemy based on type
	switch enemyType {
	case "ransomware":
		e = enemies.NewBaseEnemy("RansomwareVirus", "Ransomware", x, y, z, 150, 25, 15)
	case "trojan":
		e = enemies.NewBaseEnemy("TrojanVirus", "Trojan", x, y, z, 100, 40, 20)
	case "worm":
		e = enemies.NewBaseEnemy("WormVirus", "Worm", x, y, z, 120, 30, 18)
	case "spyware":
		e = enemies.NewBaseEnemy("SpywareVirus", "Spyware", x, y, z, 90, 35, 12)
	case "adware":
		e = enemies.NewBaseEnemy("AdwareVirus", "Adware", x, y, z, 80, 20, 10)
	case "rootkit":
		e = enemies.NewBaseEnemy("RootkitVirus", "Rootkit", x, y, z, 200, 15, 25)
	case "shield":
		e = enemies.NewBaseEnemy("ShieldVirus", "Shield Virus", x, y, z, 250, 10, 8)
	case "drone":
		e = enemies.NewBaseEnemy("DroneVirus", "Drone", x, y, z, 70, 50, 12)
	case "blaster":
		e = enemies.NewBaseEnemy("BlasterVirus", "Blaster", x, y, z, 110, 20, 22)
	default:
		e = enemies.NewBaseEnemy("Generic", "Generic Enemy", x, y, z, 100, 25, 15)
	}

	gc.Enemies = append(gc.Enemies, e)
	gc.StateManager.AddEnemy(e)
	return e
}

// SpawnBoss spawns a boss in the game
func (gc *GameCore) SpawnBoss(bossType string, x, y, z float64) *bosses.BaseBoss {
	gc.mu.Lock()
	defer gc.mu.Unlock()

	var b *bosses.BaseBoss

	switch bossType {
	case "circuit-overlord":
		b = bosses.NewBaseBoss("Circuit Overlord", "Wave 3 Boss", "CircuitOverlord", x, y, z, 2000, 30, 50)
	case "corruption-core":
		b = bosses.NewBaseBoss("Corruption Core", "Mid-Game Boss", "CorruptionCore", x, y, z, 2500, 25, 60)
	case "data-wyrm":
		b = bosses.NewBaseBoss("Data Wyrm", "Dragon Boss", "DataWyrm", x, y, z, 3000, 35, 70)
	case "firewall-archon":
		b = bosses.NewBaseBoss("Firewall Archon", "Shield Boss", "FirewallArchon", x, y, z, 2200, 20, 55)
	case "ladybug-sentinel":
		b = bosses.NewBaseBoss("Ladybug Sentinel", "Memory Boss", "LadyBugSentinel", x, y, z, 1800, 28, 45)
	case "neural-overmind":
		b = bosses.NewBaseBoss("Neural Overmind", "AI Boss", "NeuralOvermind", x, y, z, 2800, 32, 65)
	case "noise":
		b = bosses.NewBaseBoss("Noise", "Disk Corruption", "Noise", x, y, z, 1600, 38, 40)
	case "packet-hydra":
		b = bosses.NewBaseBoss("Packet Hydra", "Network Boss", "PacketHydra", x, y, z, 3200, 33, 75)
	case "pixel-reaper":
		b = bosses.NewBaseBoss("Pixel Reaper", "GPU Boss", "PixelReaper", x, y, z, 2400, 40, 55)
	case "trojan-warhorse":
		b = bosses.NewBaseBoss("Trojan Warhorse", "Final Boss", "TrojanHorseColossus", x, y, z, 4000, 35, 80)
	default:
		b = bosses.NewBaseBoss("Generic Boss", "Boss", "GenericBoss", x, y, z, 2000, 30, 50)
	}

	gc.Bosses = append(gc.Bosses, b)
	gc.StateManager.AddBoss(b)
	return b
}

// PlayerInput handles player input updates
type PlayerInput struct {
	MoveDirection [3]float64 `json:"moveDirection"` // Actual velocity (not normalized)
	FireWeapon    bool       `json:"fireWeapon"`
	SwitchWeapon  int        `json:"switchWeapon"` // -1 for no change
	UseSprint     bool       `json:"useSprint"`
	UseEMP        bool       `json:"useEMP"`
}

// HandlePlayerInput processes player input
func (gc *GameCore) HandlePlayerInput(input *PlayerInput) {
	gc.mu.Lock()
	defer gc.mu.Unlock()

	if !gc.Player.IsAlive() {
		return
	}

	// Handle movement - apply velocity directly (already multiplied by speed on JS side)
	if input != nil {
		moveVel := utils.NewVector3(input.MoveDirection[0], 0, input.MoveDirection[2])
		gc.Player.Velocity = moveVel
	}

	// Handle weapon firing
	if input != nil && input.FireWeapon {
		weapon, fired := gc.Player.Fire()
		if fired && weapon != nil {
			// Projectile spawning handled on JS side
		}
	}

	// Handle weapon switching
	if input != nil && input.SwitchWeapon >= 0 {
		gc.Player.SwitchWeapon(input.SwitchWeapon)
	}

	// Handle sprint
	if input != nil {
		gc.Player.IsSprinting = input.UseSprint
	}

	// Handle EMP
	if input != nil && input.UseEMP {
		if gc.Player.UseEMP() {
			// EMP triggered, stun all enemies
			for _, e := range gc.Enemies {
				if e.IsAlive() {
					e.ApplyStun(3.0)
				}
			}
			for _, b := range gc.Bosses {
				if b.IsAlive() {
					b.ApplyStun(2.0)
				}
			}
		}
	}
}

// GetState returns the current game state as JSON
func (gc *GameCore) GetState() ([]byte, error) {
	gc.mu.RLock()
	defer gc.mu.RUnlock()

	return gc.StateManager.SerializeToJSON()
}

// GetFrameTime returns frame time info
func (gc *GameCore) GetFrameTime() map[string]interface{} {
	gc.mu.RLock()
	defer gc.mu.RUnlock()

	elapsed := time.Since(gc.StartTime).Seconds()
	return map[string]interface{}{
		"frameCount": gc.FrameCount,
		"deltaTime": gc.DeltaTime,
		"elapsed":   elapsed,
		"fps":       float64(gc.FrameCount) / elapsed,
	}
}

// Pause pauses the game
func (gc *GameCore) Pause() {
	gc.mu.Lock()
	defer gc.mu.Unlock()
	gc.Paused = true
}

// Resume resumes the game
func (gc *GameCore) Resume() {
	gc.mu.Lock()
	defer gc.mu.Unlock()
	gc.Paused = false
}
