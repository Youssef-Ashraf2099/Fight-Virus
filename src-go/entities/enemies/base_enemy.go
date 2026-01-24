package enemies

import (
	"fightvirus/entities"
	"fightvirus/utils"
	"time"
)

// BehaviorState represents the enemy's current behavior
type BehaviorState int

const (
	StateIdle BehaviorState = iota
	StatePursuing
	StateAttacking
	StateStunned
	StateDead
)

// BaseEnemy represents all common enemy properties
type BaseEnemy struct {
	*entities.BaseEntity

	// Enemy type
	ClassName  string
	DisplayName string

	// Stats
	BaseSpeed        float64
	BaseDamage       float64
	ContactDamage    float64
	AttackCooldown   float64
	AggroRange       float64
	DeAggroRange     float64
	PassiveWanderRadius float64

	// State
	BehaviorState       BehaviorState
	CurrentTarget       *utils.Vector3
	IsAggroed           bool
	LastAttackTime      time.Time
	StunDuration        float64
	StunStartTime       time.Time

	// Visuals
	Color           uint32
	SecondaryColor  uint32
	CollisionRadius float64

	// Combat
	CurrentAttackCooldown float64
	KnockbackVelocity     *utils.Vector3

	// Spawning position (for tracking)
	SpawnPosition *utils.Vector3
	WaveNumber    int
}

// NewBaseEnemy creates a new base enemy
func NewBaseEnemy(className, displayName string, x, y, z, health, speed, damage float64) *BaseEnemy {
	baseEntity := entities.NewBaseEntity("", x, y, z, health, 1.5)

	enemy := &BaseEnemy{
		BaseEntity:          baseEntity,
		ClassName:           className,
		DisplayName:         displayName,
		BaseSpeed:           speed,
		BaseDamage:          damage,
		ContactDamage:       damage * 0.5,
		AttackCooldown:      1.0,
		AggroRange:          30,
		DeAggroRange:        50,
		PassiveWanderRadius: 10,
		BehaviorState:       StateIdle,
		CurrentTarget:       utils.NewVector3(0, 0, 0),
		IsAggroed:           false,
		LastAttackTime:      time.Now(),
		StunDuration:        0,
		Color:               0xff0000,
		SecondaryColor:      0xaa0000,
		CollisionRadius:     1.5,
		KnockbackVelocity:   utils.NewVector3(0, 0, 0),
		SpawnPosition:       utils.NewVector3(x, y, z),
		WaveNumber:          0,
	}

	return enemy
}

// Update updates the enemy state
func (e *BaseEnemy) Update(deltaTime float64, playerPos *utils.Vector3) {
	if !e.IsAlive() {
		e.BehaviorState = StateDead
		return
	}

	// Handle stun state
	if e.BehaviorState == StateStunned {
		e.updateStun(deltaTime)
		return
	}

	// Update cooldowns
	e.CurrentAttackCooldown -= deltaTime
	if e.CurrentAttackCooldown < 0 {
		e.CurrentAttackCooldown = 0
	}

	// Check distance to player
	distToPlayer := e.Position.DistanceTo(playerPos)

	// Update behavior state
	e.updateBehaviorState(distToPlayer)

	// Execute behavior
	switch e.BehaviorState {
	case StateIdle:
		e.updateIdle(deltaTime)
	case StatePursuing:
		e.updatePursuing(deltaTime, playerPos, distToPlayer)
	case StateAttacking:
		e.updateAttacking(deltaTime, playerPos, distToPlayer)
	}

	// Apply knockback and decay it
	if e.KnockbackVelocity.Length() > 0.1 {
		e.Velocity.Copy(e.KnockbackVelocity)
		e.KnockbackVelocity.MultiplyScalar(0.9) // Friction
	}

	// Update position
	e.BaseEntity.Update(deltaTime)
}

// updateBehaviorState determines what the enemy should do
func (e *BaseEnemy) updateBehaviorState(distToPlayer float64) {
	switch e.BehaviorState {
	case StateIdle:
		if distToPlayer < e.AggroRange {
			e.BehaviorState = StatePursuing
			e.IsAggroed = true
		}

	case StatePursuing:
		if distToPlayer > e.DeAggroRange {
			e.BehaviorState = StateIdle
			e.IsAggroed = false
		} else if distToPlayer < 5 {
			e.BehaviorState = StateAttacking
		}

	case StateAttacking:
		if distToPlayer > 7 {
			e.BehaviorState = StatePursuing
		}
	}
}

// updateIdle handles idle wandering
func (e *BaseEnemy) updateIdle(deltaTime float64) {
	// Simple idle: slow movement around spawn point
	distToSpawn := e.Position.DistanceTo(e.SpawnPosition)
	if distToSpawn > e.PassiveWanderRadius {
		// Move back toward spawn
		direction := e.SpawnPosition.Clone().Sub(e.Position).Normalize()
		e.Velocity = direction.MultiplyScalar(e.BaseSpeed * 0.3)
	} else {
		// Slow wander
		e.Velocity.MultiplyScalar(0.1) // Slow down
	}
}

// updatePursuing handles pursuing the player
func (e *BaseEnemy) updatePursuing(deltaTime float64, playerPos *utils.Vector3, distToPlayer float64) {
	direction := playerPos.Clone().Sub(e.Position).Normalize()
	e.Velocity = direction.MultiplyScalar(e.BaseSpeed)
}

// updateAttacking handles attacking the player
func (e *BaseEnemy) updateAttacking(deltaTime float64, playerPos *utils.Vector3, distToPlayer float64) {
	// Move closer if too far
	if distToPlayer > 3 {
		direction := playerPos.Clone().Sub(e.Position).Normalize()
		e.Velocity = direction.MultiplyScalar(e.BaseSpeed * 0.5)
	} else {
		e.Velocity = utils.NewVector3(0, 0, 0)
	}

	// Check if ready to attack
	if e.CurrentAttackCooldown <= 0 {
		e.PerformAttack()
	}
}

// updateStun handles stun state
func (e *BaseEnemy) updateStun(deltaTime float64) {
	elapsed := time.Since(e.StunStartTime).Seconds()
	if elapsed > e.StunDuration {
		e.BehaviorState = StatePursuing
		e.IsAggroed = true
	}
	e.Velocity = utils.NewVector3(0, 0, 0) // Stop moving while stunned
}

// PerformAttack executes an attack (override in subclasses for different behaviors)
func (e *BaseEnemy) PerformAttack() {
	e.CurrentAttackCooldown = e.AttackCooldown
	e.LastAttackTime = time.Now()
	// To be overridden by specific enemy types
}

// ApplyStun stuns the enemy for a duration
func (e *BaseEnemy) ApplyStun(duration float64) {
	if e.BehaviorState != StateStunned {
		e.BehaviorState = StateStunned
		e.StunDuration = duration
		e.StunStartTime = time.Now()
	}
}

// ApplyKnockback applies knockback velocity
func (e *BaseEnemy) ApplyKnockback(force float64, direction *utils.Vector3) {
	knockback := direction.Clone().Normalize().MultiplyScalar(force)
	e.KnockbackVelocity = knockback
}

// TakeDamage overrides to apply damage multiplier
func (e *BaseEnemy) TakeDamage(damage float64) {
	// Base implementation: direct damage
	e.BaseEntity.TakeDamage(damage)
}
