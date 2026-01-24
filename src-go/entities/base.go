package entities

import (
	"fightvirus/utils"
	"time"
)

// EntityState represents the state of an entity (Used to serialize to JS)
type EntityState struct {
	ID             string                 `json:"id"`
	Type           string                 `json:"type"` // "player", "enemy", "boss"
	Position       [3]float64             `json:"position"`
	Velocity       [3]float64             `json:"velocity"`
	Health         float64                `json:"health"`
	MaxHealth      float64                `json:"maxHealth"`
	Rotation       [3]float64             `json:"rotation,omitempty"`
	CollisionRadius float64               `json:"collisionRadius"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// BaseEntity represents common properties for all game entities
type BaseEntity struct {
	ID              string
	Position        *utils.Vector3
	Velocity        *utils.Vector3
	Rotation        *utils.Vector3
	Health          float64
	MaxHealth       float64
	CollisionRadius float64
	Active          bool
	CreatedAt       time.Time
}

// NewBaseEntity creates a base entity
func NewBaseEntity(id string, x, y, z, maxHealth, collisionRadius float64) *BaseEntity {
	return &BaseEntity{
		ID:              id,
		Position:        utils.NewVector3(x, y, z),
		Velocity:        utils.NewVector3(0, 0, 0),
		Rotation:        utils.NewVector3(0, 0, 0),
		Health:          maxHealth,
		MaxHealth:       maxHealth,
		CollisionRadius: collisionRadius,
		Active:          true,
		CreatedAt:       time.Now(),
	}
}

// Update updates the entity's position based on velocity and delta time
func (e *BaseEntity) Update(deltaTime float64) {
	if !e.Active {
		return
	}

	// Position += Velocity * deltaTime
	vel := e.Velocity.Clone()
	e.Position.Add(vel.MultiplyScalar(deltaTime))
}

// TakeDamage reduces health
func (e *BaseEntity) TakeDamage(damage float64) {
	e.Health -= damage
	if e.Health < 0 {
		e.Health = 0
	}
	if e.Health <= 0 {
		e.Active = false
	}
}

// Heal increases health
func (e *BaseEntity) Heal(amount float64) {
	e.Health += amount
	if e.Health > e.MaxHealth {
		e.Health = e.MaxHealth
	}
}

// IsAlive checks if entity is still alive
func (e *BaseEntity) IsAlive() bool {
	return e.Active && e.Health > 0
}

// ToState converts entity to serializable state for JS renderer
func (e *BaseEntity) ToState() *EntityState {
	return &EntityState{
		ID:              e.ID,
		Position:        [3]float64{e.Position.X, e.Position.Y, e.Position.Z},
		Velocity:        [3]float64{e.Velocity.X, e.Velocity.Y, e.Velocity.Z},
		Health:          e.Health,
		MaxHealth:       e.MaxHealth,
		Rotation:        [3]float64{e.Rotation.X, e.Rotation.Y, e.Rotation.Z},
		CollisionRadius: e.CollisionRadius,
	}
}
