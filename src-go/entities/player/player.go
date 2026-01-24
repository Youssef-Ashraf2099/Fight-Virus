package player

import (
	"fightvirus/entities"
	"fightvirus/utils"
	"time"
)

// Weapon represents a weapon equipped by the player
type Weapon struct {
	Name             string  `json:"name"`
	DPS              float64 `json:"dps"`
	ProjectileColor  uint32  `json:"projectileColor"`
	MuzzleFlashColor uint32  `json:"muzzleFlashColor"`
	FireRate         float64 `json:"fireRate"`
	ProjectileSpeed  float64 `json:"projectileSpeed"`
	ProjectileDamage float64 `json:"projectileDamage"`
	ProjectileSize   float64 `json:"projectileSize"`
}

// Player represents the player entity
type Player struct {
	*entities.BaseEntity

	// Player-specific attributes
	Energy            float64
	MaxEnergy         float64
	EnergyRegenRate   float64
	MovementSpeed     float64
	SprintSpeed       float64
	IsSprinting       bool
	CameraFOV         float64

	// Weapons
	Weapons         []*Weapon
	CurrentWeaponIdx int
	LastFireTime    time.Time

	// Combat stats
	DamageMultiplier float64
	HealthMultiplier float64

	// Abilities
	LastEMPTime time.Time
	EMPCooldown time.Duration
}

// NewPlayer creates a new player entity
func NewPlayer(id string) *Player {
	baseEntity := entities.NewBaseEntity(id, 0, 10, 0, 1.5e15, 2.0)

	player := &Player{
		BaseEntity:       baseEntity,
		Energy:           100,
		MaxEnergy:        100,
		EnergyRegenRate:  50,
		MovementSpeed:    50,
		SprintSpeed:      80,
		CameraFOV:        75,
		Weapons:          make([]*Weapon, 0),
		CurrentWeaponIdx: 0,
		LastFireTime:     time.Now().Add(-10 * time.Second),
		DamageMultiplier: 1.0,
		HealthMultiplier: 1.0,
		EMPCooldown:      3 * time.Second,
		LastEMPTime:      time.Now().Add(-10 * time.Second),
	}

	// Initialize default weapons
	player.initializeWeapons()
	return player
}

// initializeWeapons sets up all available weapons
func (p *Player) initializeWeapons() {
	weapons := []*Weapon{
		{
			Name:             "Pulse Cannon",
			DPS:              20,
			ProjectileColor:  0x00ff00,
			MuzzleFlashColor: 0x00aa00,
			FireRate:         5,
			ProjectileSpeed:  60,
			ProjectileDamage: 20,
			ProjectileSize:   0.5,
		},
		{
			Name:             "Revolver",
			DPS:              40,
			ProjectileColor:  0xffff00,
			MuzzleFlashColor: 0xffaa00,
			FireRate:         2,
			ProjectileSpeed:  100,
			ProjectileDamage: 40,
			ProjectileSize:   0.4,
		},
		{
			Name:             "Laser Rifle",
			DPS:              60,
			ProjectileColor:  0xff0000,
			MuzzleFlashColor: 0xff4444,
			FireRate:         8,
			ProjectileSpeed:  150,
			ProjectileDamage: 15,
			ProjectileSize:   0.3,
		},
		{
			Name:             "Plasma Launcher",
			DPS:              100,
			ProjectileColor:  0x00ffff,
			MuzzleFlashColor: 0x00aaff,
			FireRate:         1,
			ProjectileSpeed:  40,
			ProjectileDamage: 100,
			ProjectileSize:   1.0,
		},
		{
			Name:             "Shockwave Emitter",
			DPS:              80,
			ProjectileColor:  0xff00ff,
			MuzzleFlashColor: 0xff00aa,
			FireRate:         0.5,
			ProjectileSpeed:  30,
			ProjectileDamage: 80,
			ProjectileSize:   0.8,
		},
		{
			Name:             "Energy Sword",
			DPS:              120,
			ProjectileColor:  0x00ff00,
			MuzzleFlashColor: 0x00aa00,
			FireRate:         3,
			ProjectileSpeed:  0,
			ProjectileDamage: 50,
			ProjectileSize:   1.5,
		},
		{
			Name:             "Neon Knife",
			DPS:              90,
			ProjectileColor:  0xff00ff,
			MuzzleFlashColor: 0xaa00ff,
			FireRate:         4,
			ProjectileSpeed:  0,
			ProjectileDamage: 35,
			ProjectileSize:   0.3,
		},
	}
	p.Weapons = weapons
}

// Update updates the player state
func (p *Player) Update(deltaTime float64, inputVelocity *utils.Vector3) {
	if !p.IsAlive() {
		return
	}

	// Handle movement
	if inputVelocity != nil {
		speed := p.MovementSpeed
		if p.IsSprinting {
			speed = p.SprintSpeed
			p.Energy -= 30 * deltaTime
			if p.Energy < 0 {
				p.Energy = 0
				p.IsSprinting = false
			}
		}
		p.Velocity = inputVelocity.Clone().MultiplyScalar(speed)
	}

	// Regenerate energy
	p.Energy += p.EnergyRegenRate * deltaTime
	if p.Energy > p.MaxEnergy {
		p.Energy = p.MaxEnergy
	}

	// Update base entity (position) after velocity changes
	p.BaseEntity.Update(deltaTime)
}

// Fire attempts to fire the current weapon
func (p *Player) Fire() (*Weapon, bool) {
	if !p.IsAlive() || len(p.Weapons) == 0 {
		return nil, false
	}

	weapon := p.Weapons[p.CurrentWeaponIdx]
	timeSinceLastShot := time.Since(p.LastFireTime).Seconds()
	fireInterval := 1.0 / weapon.FireRate

	if timeSinceLastShot >= fireInterval {
		p.LastFireTime = time.Now()
		return weapon, true
	}

	return nil, false
}

// SwitchWeapon switches to a different weapon
func (p *Player) SwitchWeapon(weaponIdx int) {
	if weaponIdx >= 0 && weaponIdx < len(p.Weapons) {
		p.CurrentWeaponIdx = weaponIdx
	}
}

// GetCurrentWeapon returns the currently equipped weapon
func (p *Player) GetCurrentWeapon() *Weapon {
	if p.CurrentWeaponIdx >= 0 && p.CurrentWeaponIdx < len(p.Weapons) {
		return p.Weapons[p.CurrentWeaponIdx]
	}
	return nil
}

// UseEMP uses the EMP ability if available
func (p *Player) UseEMP() bool {
	if time.Since(p.LastEMPTime) >= p.EMPCooldown {
		p.LastEMPTime = time.Now()
		return true
	}
	return false
}

// ApplyDamageUpgrade multiplies damage multiplier
func (p *Player) ApplyDamageUpgrade(multiplier float64) {
	p.DamageMultiplier *= multiplier
}

// ApplyHealthUpgrade increases max health
func (p *Player) ApplyHealthUpgrade(multiplier float64) {
	p.MaxHealth *= multiplier
	p.Health = p.MaxHealth // Full heal on upgrade
}
