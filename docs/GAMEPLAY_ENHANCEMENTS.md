# Gameplay Enhancements - Balanced Combat System

## Overview

This document outlines the comprehensive enhancements made to create a balanced and engaging gameplay experience with varied enemy attack patterns, balanced player stats, and boss fights.

---

## 🎮 Player Balance

### Health System

- **Max Health**: 120 HP (increased from 100)
  - Provides better survivability without making the game too easy
  - Allows players to recover from mistakes
  - Balanced against enemy damage output

### EMP Special Ability

- **Energy Cost**: 40 (reduced from 50)
- **Cooldown**: 8 seconds (increased from 5)
- **Damage**: 60 base damage
- **Radius**: 18 units
- **Features**:
  - Damage scales with distance (50-100% effectiveness)
  - Visual feedback showing hit count
  - Strategic ability requiring timing

---

## 👾 Enemy Attack Types

### 1. **Melee Attackers** (Close Combat)

**Examples**: Worm Virus, Adware Virus

**Characteristics**:

- Fast movement speed (12-14 units/sec)
- Low-medium health (50-70 HP base)
- Attack Range: 2.5-3 units
- Attack Cooldown: 0.8-1.5 seconds
- Strategy: Swarm and overwhelm with numbers

**Worm Virus**:

- Health: 70 HP × difficulty
- Speed: 14
- Damage: 12 × difficulty
- Contact Damage: 10 × difficulty
- Behavior: Snake-like movement, rapid melee attacks

**Adware Virus**:

- Health: 50 HP × difficulty
- Speed: 12
- Damage: 8 × difficulty
- Contact Damage: 6 × difficulty
- Behavior: Erratic swarming, fast but weak

---

### 2. **Ranged Attackers** (Projectile-Based)

**Example**: Spyware Virus

**Characteristics**:

- Medium speed (8 units/sec)
- Medium health (90 HP base)
- Attack Range: 22 units
- Projectile Speed: 18 units/sec
- Attack Cooldown: 2 seconds
- Strategy: Maintain distance and shoot

**Spyware Virus**:

- Health: 90 HP × difficulty
- Damage: 18 × difficulty (ranged)
- Special: Can teleport when player gets too close (< 8 units)
- Behavior: Kiting, teleportation, ranged attacks

---

### 3. **Charger Attackers** (High-Speed Rush)

**Example**: Trojan Virus

**Characteristics**:

- Slow base speed (4 units/sec)
- Charge speed (18 units/sec)
- High health (180 HP base)
- High damage (25 base)
- Attack Range: 15 units (for charge initiation)
- Charge Cooldown: 4 seconds
- Strategy: Devastating charges from distance

**Trojan Virus**:

- Health: 180 HP × difficulty
- Damage: 25 × difficulty
- Contact Damage: 18 × difficulty
- Charge Duration: 2 seconds
- Behavior: Charges at player, creates trail effects, circles when close

---

### 4. **AOE Attackers** (Area of Effect)

**Example**: Ransomware Virus

**Characteristics**:

- Slow speed (3 units/sec)
- Very high health (220 HP base)
- Shield system (120 HP)
- AOE Damage: 28 × 0.7 = ~20
- AOE Radius: 12 units
- Attack Cooldown: 3 seconds
- Strategy: Tank and explode

**Ransomware Virus**:

- Health: 220 HP × difficulty + 120 HP shield
- Damage: 28 × difficulty
- Shield absorbs all damage until broken
- Behavior: Slow approach, explosive AOE when in range
- Visual: Warning particles before AOE attack

---

### 5. **Hybrid Boss** (Multiple Attack Types)

**Example**: Rootkit Virus (Ultimate Boss)

**Characteristics**:

- Very slow speed (2 units/sec, 3 in phase 2)
- Massive health (600 HP base)
- Multiple attack patterns
- Two combat phases
- Ranged + AOE capabilities

**Rootkit Virus**:

- Health: 600 HP × difficulty
- Damage: 35 × difficulty
- Contact Damage: 28 × difficulty
- Score Value: 500 × 3 (boss multiplier)

**Phase 1** (100-50% HP):

- Spiral projectile patterns (5 projectiles)
- Slow movement
- Attack Cooldown: 3 seconds

**Phase 2** (50-0% HP):

- 1.5× speed boost
- Spiral + Radial attacks (13 projectiles total)
- Attack Cooldown: 2 seconds
- Enhanced visual effects

---

## 🏆 Boss Fight System

### Boss Wave Schedule

- **Wave 3, 6, 9, etc.**: Elite enemy bosses (enhanced versions)
- **Wave 5, 10, 15, etc.**: Mini-boss waves (Ransomware)
- **Wave 10, 20, 30, etc.**: Ultimate boss waves (Rootkit)

### Boss Features

1. **Enhanced Stats**: 2-2.5× difficulty multiplier
2. **Bonus Points**: 3× score multiplier
3. **Visual Markers**: Enhanced lighting and effects
4. **Special Messages**: Boss arrival and defeat announcements
5. **Longer Rest**: 5 seconds between boss waves vs 3 seconds normal

### Boss Rewards

- **Bonus Score**: Base score × 3
- **Health Restoration**: 30 HP (vs 20 HP normal waves)
- **Energy Restoration**: 30 energy points
- **Achievement Message**: Special defeat message

---

## ⚖️ Difficulty Scaling

### Per-Wave Scaling

```javascript
difficulty = 1 + (waveNumber - 1) × 0.15

Wave 1:  1.00× difficulty
Wave 5:  1.60× difficulty
Wave 10: 2.35× difficulty
Wave 20: 3.85× difficulty
```

### Enemy Count Scaling

```javascript
enemyCount = 5 + waveNumber × 2

Wave 1:  7 enemies
Wave 5:  15 enemies
Wave 10: 25 enemies
```

### Boss Difficulty

- Elite Boss: difficulty × 2
- Ultimate Boss: difficulty × 2.5

---

## 🎯 Attack Type Summary Table

| Enemy Type | Attack Type | Speed | Health | Damage | Range | Cooldown |
| ---------- | ----------- | ----- | ------ | ------ | ----- | -------- |
| Worm       | Melee       | 14    | 70     | 12     | 3     | 0.8s     |
| Adware     | Melee       | 12    | 50     | 8      | 2.5   | 1.0s     |
| Spyware    | Ranged      | 8     | 90     | 18     | 22    | 2.0s     |
| Trojan     | Charger     | 4/18  | 180    | 25     | 15    | 4.0s     |
| Ransomware | AOE         | 3     | 220+   | 28     | 12    | 3.0s     |
| Rootkit    | Hybrid      | 2     | 600    | 35     | 25    | 2-3s     |

---

## 🎨 Visual Indicators

### Attack Warnings

1. **Charge Attack**: Trail particles during charge
2. **Ranged Attack**: Glowing projectiles with trails
3. **AOE Attack**: Particle explosion with expanding radius
4. **Boss Phase**: Color intensity changes, particle effects

### Player Feedback

- **Damage Taken**: Red screen flash
- **EMP Use**: Blue shockwave, hit count display
- **Boss Kill**: Large explosion, special message

---

## 💡 Strategic Gameplay

### Countering Different Enemies

**vs Melee (Worm, Adware)**:

- Keep distance with movement
- Use automatic weapons for crowd control
- EMP when surrounded

**vs Ranged (Spyware)**:

- Close distance quickly
- Dodge projectiles with lateral movement
- Use high-damage single-shot weapons

**vs Charger (Trojan)**:

- Watch for charge wind-up
- Sidestep charge attacks
- Attack while they recover

**vs AOE (Ransomware)**:

- Break shield first (120 HP)
- Move away when at close range
- Use long-range weapons

**vs Boss (Rootkit)**:

- Learn attack patterns
- Save EMP for critical moments
- Focus on dodging in Phase 2
- Use cover and kiting

---

## 🔧 Technical Implementation

### Base Enemy Attack System

All enemies inherit from `BaseEnemy` with these attack methods:

- `performMeleeAttack(playerPosition)`
- `performRangedAttack(playerPosition)`
- `performChargeAttack(playerPosition)`
- `performAOEAttack(playerPosition)`
- `shootProjectile(targetPosition)`
- `updateProjectiles(deltaTime)`

### Collision Detection

- Contact damage on collision
- Projectile damage with explosion effects
- AOE damage with radius checks
- Distance-based damage scaling for EMP

---

## 📊 Balance Philosophy

### Core Principles

1. **Risk vs Reward**: Harder enemies give more points
2. **Skill Ceiling**: Player movement and timing matter
3. **Strategic Depth**: Different weapons for different enemies
4. **Progressive Challenge**: Smooth difficulty curve
5. **Boss Spectacle**: Memorable milestone encounters

### Playtesting Notes

- Average player should reach Wave 10-15
- Skilled players can reach Wave 20+
- Boss fights should take 30-60 seconds
- EMP should feel powerful but not overpowered
- Health should allow 3-5 mistakes per wave

---

## 🚀 Future Enhancement Ideas

1. **More Enemy Types**: Add 2-3 new virus types
2. **Boss Variants**: Different boss per 10-wave milestone
3. **Attack Combos**: Enemies combine attacks
4. **Environmental Hazards**: Map-specific dangers
5. **Power-ups**: Temporary buffs between waves
6. **Difficulty Modes**: Easy/Normal/Hard presets

---

## 📝 Testing Checklist

- [ ] All enemy types spawn correctly
- [ ] Attack cooldowns work as intended
- [ ] Boss fights trigger at correct waves
- [ ] Player health balance feels right
- [ ] EMP ability is satisfying to use
- [ ] Damage numbers are visible and accurate
- [ ] Boss defeat messages display properly
- [ ] Wave transitions are smooth
- [ ] Difficulty scaling is appropriate
- [ ] Performance is stable with multiple enemies

---

**Last Updated**: November 6, 2025
**Version**: 1.0
**Status**: Implemented and Ready for Testing
