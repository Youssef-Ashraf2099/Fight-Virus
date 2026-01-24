package enemies

import (
	"fightvirus/utils"
	"testing"
)

// TestEnemyCreation tests basic enemy creation
func TestEnemyCreation(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)

	if e.ClassName != "TestEnemy" {
		t.Errorf("Class name mismatch: expected 'TestEnemy', got '%s'", e.ClassName)
	}

	if e.Health != 100 {
		t.Errorf("Health mismatch: expected 100, got %f", e.Health)
	}

	if e.BehaviorState != StateIdle {
		t.Errorf("Initial behavior should be Idle, got %d", e.BehaviorState)
	}
}

// TestEnemyBehaviorTransition tests state transitions
func TestEnemyBehaviorTransition(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)
	playerPos := utils.NewVector3(20, 0, 0) // Within aggro range

	// Should transition to pursuing when player is close
	e.updateBehaviorState(15) // 15 units away, within 30 unit aggro range

	if e.BehaviorState != StatePursuing {
		t.Errorf("Should transition to Pursuing, got state %d", e.BehaviorState)
	}
}

// TestEnemyPursuitMovement tests pursuing movement
func TestEnemyPursuitMovement(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)
	e.BehaviorState = StatePursuing
	
	playerPos := utils.NewVector3(10, 0, 0) // 10 units away in X

	e.Update(1.0, playerPos)

	// Enemy should move toward player
	if e.Position.X <= 0 {
		t.Errorf("Enemy should move closer to player: startX=0, endX=%f", e.Position.X)
	}
}

// TestEnemyStun tests stun mechanic
func TestEnemyStun(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)
	e.BehaviorState = StatePursuing

	e.ApplyStun(1.0)

	if e.BehaviorState != StateStunned {
		t.Errorf("Should be stunned, got state %d", e.BehaviorState)
	}

	// Velocity should be zero while stunned
	playerPos := utils.NewVector3(10, 0, 0)
	e.Update(0.5, playerPos)

	if e.Velocity.Length() != 0 {
		t.Errorf("Velocity should be 0 while stunned, got %f", e.Velocity.Length())
	}
}

// TestEnemyDamage tests damage handling
func TestEnemyDamage(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)

	e.TakeDamage(25)

	if e.Health != 75 {
		t.Errorf("Health should be 75, got %f", e.Health)
	}

	e.TakeDamage(100)

	if e.Health != 0 {
		t.Errorf("Health should not go below 0, got %f", e.Health)
	}

	if e.IsAlive() {
		t.Error("Enemy should be dead")
	}
}

// TestEnemyKnockback tests knockback
func TestEnemyKnockback(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)
	
	knockbackDir := utils.NewVector3(1, 0, 0)
	e.ApplyKnockback(50, knockbackDir)

	if e.KnockbackVelocity.Length() <= 0 {
		t.Errorf("Knockback velocity should be set, got %f", e.KnockbackVelocity.Length())
	}

	startX := e.Position.X
	e.Update(1.0, utils.NewVector3(0, 0, 0))

	if e.Position.X <= startX {
		t.Errorf("Enemy should move due to knockback: startX=%f, endX=%f", startX, e.Position.X)
	}
}

// TestEnemyDeaggro tests deaggro mechanic
func TestEnemyDeaggro(t *testing.T) {
	e := NewBaseEnemy("TestEnemy", "Test Enemy", 0, 0, 0, 100, 20, 10)
	e.BehaviorState = StatePursuing
	e.IsAggroed = true

	// Player far away (beyond deaggro range of 50)
	e.updateBehaviorState(100)

	if e.BehaviorState != StateIdle {
		t.Errorf("Should deaggro to Idle, got state %d", e.BehaviorState)
	}

	if e.IsAggroed {
		t.Error("Should no longer be aggroed")
	}
}
