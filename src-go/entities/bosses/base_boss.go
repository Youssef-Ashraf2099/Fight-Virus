package bosses

import (
	"fightvirus/entities/enemies"
	"fightvirus/utils"
	"time"
)

// BossPhase represents a phase in a boss fight
type BossPhase struct {
	HealthThreshold float64
	SpeedMultiplier float64
	AttackSpeedup   float64
	SpecialAbility  string
}

// BaseBoss represents all boss-specific behavior
type BaseBoss struct {
	*enemies.BaseEnemy

	// Boss properties
	BossName        string
	BossTitle       string
	IsBoss          bool
	ArenaRadius     float64
	EnrageThreshold float64

	// Multi-phase system
	Phases           []*BossPhase
	CurrentPhaseIdx  int
	PhaseTransition  bool

	// Spawning
	HasSpawnAnimation  bool
	SpawnAnimDuration  float64
	SpawnAnimStartTime time.Time
	IsSpawned          bool

	// Minions
	SpawnedMinions    []*enemies.BaseEnemy
	MinionSpawnCooldown float64
	MinionSpawnTimer  float64

	// Reward
	RewardScore   float64
	RewardHealth  float64
}

// NewBaseBoss creates a new boss entity
func NewBaseBoss(bossName, bossTitle, className string, x, y, z, health, speed, damage float64) *BaseBoss {
	baseEnemy := enemies.NewBaseEnemy(className, bossName, x, y, z, health, speed, damage)
	baseEnemy.AggroRange = 100
	baseEnemy.DeAggroRange = 150

	boss := &BaseBoss{
		BaseEnemy:           baseEnemy,
		BossName:            bossName,
		BossTitle:           bossTitle,
		IsBoss:              true,
		ArenaRadius:         50,
		EnrageThreshold:     0.3, // Enrage at 30% health
		Phases:              make([]*BossPhase, 0),
		CurrentPhaseIdx:     0,
		PhaseTransition:     false,
		HasSpawnAnimation:   true,
		SpawnAnimDuration:   3.0,
		SpawnAnimStartTime:  time.Now(),
		IsSpawned:           false,
		SpawnedMinions:      make([]*enemies.BaseEnemy, 0),
		MinionSpawnCooldown: 2.0,
		MinionSpawnTimer:    0,
		RewardScore:         10000,
		RewardHealth:        500,
	}

	// Initialize default single phase
	boss.Phases = append(boss.Phases, &BossPhase{
		HealthThreshold: 0.0,
		SpeedMultiplier: 1.0,
		AttackSpeedup:   1.0,
		SpecialAbility:  "basic",
	})

	return boss
}

// Update updates boss state
func (b *BaseBoss) Update(deltaTime float64, playerPos *utils.Vector3) {
	if !b.IsAlive() {
		return
	}

	// Handle spawn animation
	if !b.IsSpawned && b.HasSpawnAnimation {
		b.updateSpawnAnimation(deltaTime)
		return
	}

	// Update phase if needed
	b.checkPhaseTransition()

	// Apply phase modifiers
	b.applyPhaseModifiers()

	// Update base enemy behavior
	b.BaseEnemy.Update(deltaTime, playerPos)

	// Update minion spawning
	b.updateMinionSpawning(deltaTime)

	// Check enrage condition
	b.checkEnrage()
}

// updateSpawnAnimation handles boss entrance animation
func (b *BaseBoss) updateSpawnAnimation(deltaTime float64) {
	elapsed := time.Since(b.SpawnAnimStartTime).Seconds()

	if elapsed > b.SpawnAnimDuration {
		b.IsSpawned = true
		b.BehaviorState = enemies.StateIdle
		return
	}

	// Float up from ground during animation
	progress := elapsed / b.SpawnAnimDuration
	b.Position.Y = b.SpawnPosition.Y + (10 * progress)
	b.Velocity = utils.NewVector3(0, 0, 0)
}

// checkPhaseTransition checks if boss should transition to next phase
func (b *BaseBoss) checkPhaseTransition() {
	if b.CurrentPhaseIdx >= len(b.Phases)-1 {
		return // Already in final phase
	}

	healthPercent := b.Health / b.MaxHealth
	nextPhase := b.Phases[b.CurrentPhaseIdx+1]

	if healthPercent <= nextPhase.HealthThreshold {
		b.CurrentPhaseIdx++
		b.PhaseTransition = true
		// Boss could be invulnerable during transition if needed
	}
}

// applyPhaseModifiers applies current phase's stat modifiers
func (b *BaseBoss) applyPhaseModifiers() {
	if b.CurrentPhaseIdx < len(b.Phases) {
		phase := b.Phases[b.CurrentPhaseIdx]
		// Speed and attack speed are applied at attack time
		_ = phase
	}
}

// checkEnrage checks if boss should enter enraged state
func (b *BaseBoss) checkEnrage() {
	healthPercent := b.Health / b.MaxHealth

	if healthPercent < b.EnrageThreshold {
		// Apply enrage: increase speed and attack cooldown
		b.BaseSpeed *= 1.5
		b.AttackCooldown *= 0.6 // Attack faster
	}
}

// updateMinionSpawning spawns minions periodically
func (b *BaseBoss) updateMinionSpawning(deltaTime float64) {
	b.MinionSpawnTimer -= deltaTime

	if b.MinionSpawnTimer <= 0 && len(b.SpawnedMinions) < 3 {
		b.MinionSpawnTimer = b.MinionSpawnCooldown
		// To be overridden by specific bosses
	}
}

// AddPhase adds a new phase to the boss fight
func (b *BaseBoss) AddPhase(healthThreshold, speedMult, attackSpeedup float64, ability string) {
	b.Phases = append(b.Phases, &BossPhase{
		HealthThreshold: healthThreshold,
		SpeedMultiplier: speedMult,
		AttackSpeedup:   attackSpeedup,
		SpecialAbility:  ability,
	})
}

// SpawnMinion spawns a minion for the boss
func (b *BaseBoss) SpawnMinion(minion *enemies.BaseEnemy) {
	if minion != nil {
		minion.WaveNumber = b.WaveNumber
		b.SpawnedMinions = append(b.SpawnedMinions, minion)
	}
}

// RemoveDeadMinions removes dead minions from the list
func (b *BaseBoss) RemoveDeadMinions() {
	alive := make([]*enemies.BaseEnemy, 0)
	for _, minion := range b.SpawnedMinions {
		if minion.IsAlive() {
			alive = append(alive, minion)
		}
	}
	b.SpawnedMinions = alive
}

// GetReward returns the reward for defeating the boss
func (b *BaseBoss) GetReward() (score float64, health float64) {
	return b.RewardScore, b.RewardHealth
}

// PerformAttack performs a basic boss attack (override in subclasses)
func (b *BaseBoss) PerformAttack() {
	b.CurrentAttackCooldown = b.AttackCooldown
	b.LastAttackTime = time.Now()
	// Bosses can spawn projectiles or perform special attacks
}
