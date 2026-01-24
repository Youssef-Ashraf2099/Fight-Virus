package systems

import (
	"encoding/json"
	"fightvirus/entities"
	"fightvirus/entities/bosses"
	"fightvirus/entities/enemies"
	"fightvirus/entities/player"
)

// GameState represents the entire game state to be sent to JS
type GameState struct {
	Player         *entities.EntityState   `json:"player"`
	Enemies        []*entities.EntityState `json:"enemies"`
	Bosses         []*entities.EntityState `json:"bosses"`
	Projectiles    []*entities.EntityState `json:"projectiles,omitempty"`
	Particles      []*entities.EntityState `json:"particles,omitempty"`
	Timestamp      int64                   `json:"timestamp"`
}

// StateManager manages serialization of game state for the JS renderer
type StateManager struct {
	player *player.Player
	enemies []*enemies.BaseEnemy
	bosses  []*bosses.BaseBoss
}

// NewStateManager creates a state manager
func NewStateManager() *StateManager {
	return &StateManager{
		enemies: make([]*enemies.BaseEnemy, 0),
		bosses:  make([]*bosses.BaseBoss, 0),
	}
}

// SetPlayer sets the player reference
func (sm *StateManager) SetPlayer(p *player.Player) {
	sm.player = p
}

// AddEnemy adds an enemy to track
func (sm *StateManager) AddEnemy(e *enemies.BaseEnemy) {
	sm.enemies = append(sm.enemies, e)
}

// AddBoss adds a boss to track
func (sm *StateManager) AddBoss(b *bosses.BaseBoss) {
	sm.bosses = append(sm.bosses, b)
}

// RemoveDeadEntities removes dead entities from tracking
func (sm *StateManager) RemoveDeadEntities() {
	// Remove dead enemies
	alive := make([]*enemies.BaseEnemy, 0)
	for _, e := range sm.enemies {
		if e.IsAlive() {
			alive = append(alive, e)
		}
	}
	sm.enemies = alive

	// Remove dead bosses
	aliveB := make([]*bosses.BaseBoss, 0)
	for _, b := range sm.bosses {
		if b.IsAlive() {
			aliveB = append(aliveB, b)
		}
	}
	sm.bosses = aliveB
}

// SerializeToJSON converts current state to JSON for transmission to JS
func (sm *StateManager) SerializeToJSON() ([]byte, error) {
	state := &GameState{
		Enemies:     make([]*entities.EntityState, 0),
		Bosses:      make([]*entities.EntityState, 0),
		Timestamp:   getTimestamp(),
	}

	// Player state
	if sm.player != nil {
		state.Player = sm.player.ToState()
		state.Player.Type = "player"
	}

	// Enemy states
	for _, e := range sm.enemies {
		if e.IsAlive() {
			es := e.ToState()
			es.Type = "enemy"
			es.Metadata = map[string]interface{}{
				"className":   e.ClassName,
				"displayName": e.DisplayName,
				"behavior":    int(e.BehaviorState),
				"aggro":       e.IsAggroed,
			}
			state.Enemies = append(state.Enemies, es)
		}
	}

	// Boss states
	for _, b := range sm.bosses {
		if b.IsAlive() {
			bs := b.ToState()
			bs.Type = "boss"
			bs.Metadata = map[string]interface{}{
				"bossName":   b.BossName,
				"bossTitle":  b.BossTitle,
				"phase":      b.CurrentPhaseIdx,
				"spawned":    b.IsSpawned,
				"minions":    len(b.SpawnedMinions),
			}
			state.Bosses = append(state.Bosses, bs)
		}
	}

	return json.MarshalIndent(state, "", "  ")
}

// helper function to get current timestamp in milliseconds
func getTimestamp() int64 {
	return 0 // Placeholder
}
