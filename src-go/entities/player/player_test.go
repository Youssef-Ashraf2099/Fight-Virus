package player

import (
	"testing"

	"fightvirus/utils"
)

// TestPlayerCreation tests that a player can be created with default values
func TestPlayerCreation(t *testing.T) {
	p := NewPlayer("test-player")

	if p.ID != "test-player" {
		t.Errorf("Player ID mismatch: expected 'test-player', got '%s'", p.ID)
	}

	if p.Health != p.MaxHealth {
		t.Errorf("Player health mismatch: expected %f, got %f", p.MaxHealth, p.Health)
	}

	if len(p.Weapons) != 7 {
		t.Errorf("Expected 7 weapons, got %d", len(p.Weapons))
	}

	if p.Energy != 100 {
		t.Errorf("Expected 100 energy, got %f", p.Energy)
	}
}

// TestPlayerMovement tests player movement
func TestPlayerMovement(t *testing.T) {
	p := NewPlayer("test-player")
	startX := p.Position.X

	// Create input velocity
	inputVelocity := utils.NewVector3(1, 0, 0)

	// Update with input
	p.Update(1.0, inputVelocity) // 1 second of movement

	// Check position changed
	if p.Position.X <= startX {
		t.Errorf("Player should move forward: startX=%f, endX=%f", startX, p.Position.X)
	}
}

// TestPlayerFiring tests weapon firing
func TestPlayerFiring(t *testing.T) {
	p := NewPlayer("test-player")

	// First shot should succeed
	weapon, fired := p.Fire()
	if !fired {
		t.Error("First shot should succeed")
	}

	if weapon == nil {
		t.Error("Weapon should not be nil")
	}

	// Immediate second shot should fail (cooldown)
	_, fired2 := p.Fire()
	if fired2 {
		t.Error("Second immediate shot should fail (cooldown)")
	}
}

// TestPlayerWeaponSwitch tests weapon switching
func TestPlayerWeaponSwitch(t *testing.T) {
	p := NewPlayer("test-player")

	p.SwitchWeapon(3)

	if p.CurrentWeaponIdx != 3 {
		t.Errorf("Weapon index should be 3, got %d", p.CurrentWeaponIdx)
	}

	// Try invalid index
	p.SwitchWeapon(100)
	if p.CurrentWeaponIdx != 3 {
		t.Errorf("Invalid weapon index should be rejected, index changed to %d", p.CurrentWeaponIdx)
	}
}

// TestPlayerEnergyRegen tests energy regeneration
func TestPlayerEnergyRegen(t *testing.T) {
	p := NewPlayer("test-player")
	p.Energy = 50

	p.Update(1.0, nil)

	if p.Energy <= 50 {
		t.Errorf("Energy should regenerate: expected > 50, got %f", p.Energy)
	}

	if p.Energy > p.MaxEnergy {
		t.Errorf("Energy should not exceed max: expected <= %f, got %f", p.MaxEnergy, p.Energy)
	}
}

// TestPlayerDamage tests taking damage
func TestPlayerDamage(t *testing.T) {
	p := NewPlayer("test-player")
	originalHealth := p.Health

	p.TakeDamage(100)

	if p.Health >= originalHealth {
		t.Errorf("Health should decrease: original=%f, after=%f", originalHealth, p.Health)
	}

	if p.Health < 0 {
		t.Errorf("Health should not go below 0: got %f", p.Health)
	}
}

// TestPlayerEMP tests EMP ability
func TestPlayerEMP(t *testing.T) {
	p := NewPlayer("test-player")

	// First EMP should succeed
	if !p.UseEMP() {
		t.Error("First EMP should succeed")
	}

	// Immediate second should fail
	if p.UseEMP() {
		t.Error("Second immediate EMP should fail (cooldown)")
	}
}

