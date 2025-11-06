# ⚡ CORRUPTION CORE - BOSS POWERS REFERENCE

## 🎯 Boss Overview

**Name:** Corruption Core  
**Title:** The System Destroyer  
**Type:** Hybrid (Melee + Ranged + Special Abilities)  
**Spawn:** Always at map center with 3-second epic entrance

---

## 💪 Base Stats

```
Health:          2000 (×difficulty)
Damage:          60 base
Contact Damage:  35 on touch
Speed:           4 (increases each phase)
Size:            8 units (MASSIVE - 2x normal enemies)
Collision:       8 units radius
Score Reward:    5000 points
```

---

## 🌀 Special Powers

### 1. **Spiral Vortex**

_Core attack pattern_

- Fires 8 rotating projectiles (12 when enraged)
- Projectiles spin outward in spiral pattern
- Red octahedron projectiles
- Damage: 60
- Always active in all phases

### 2. **Radial Burst**

_Area denial_

- Fires 12 projectiles in all directions (16 when enraged)
- Perfect 360° coverage
- Red tetrahedron projectiles
- Damage: 78 (1.3× multiplier)
- Speed: +8 faster than spiral
- Unlocks: Phase 2 (66% HP)

### 3. **Homing Missiles**

_Tracking attack_

- 6 heat-seeking projectiles
- Actively track player position
- Pink/magenta sphere projectiles
- Damage: 90 (1.5× multiplier)
- Speed: 26 (fastest projectiles)
- Unlocks: Phase 3 (33% HP)

### 4. **Chaos Barrage**

_Overwhelming firepower_

- 20 projectiles in random directions
- Unpredictable spread pattern
- Orange box projectiles
- Damage: 48 (0.8× but high volume)
- Variable speed (random +0 to +10)
- Unlocks: Phase 4 / Enraged

### 5. **Shockwave Pulse**

_Close-range defense_

- Activates when player within 15 units
- Creates expanding shockwave
- 20 unit radius
- Cooldown: 10 seconds (6 when enraged)
- Knocks back player
- Red energy wave

### 6. **Corruption Pulse**

_Ultimate ability_

- Massive expanding wave attack
- 30 projectiles in sequence
- Each fires 50ms apart (cascading effect)
- Dark red octahedron projectiles
- Damage: 78 (1.3× multiplier)
- 80 particle explosion
- Cooldown: 15 seconds (10 when enraged)

---

## 🎭 Phase System

### Phase 1: Awakening (100-66% HP)

**Attack Pattern:**

- Spiral Vortex only
- Attack Cooldown: 2.5 seconds
- Optimal Distance: 10 units from player

**Behavior:**

- Methodical pursuit
- Testing the player
- Learning movement patterns

---

### Phase 2: Corruption Spread (66-33% HP)

**Attack Pattern:**

- Spiral Vortex + Radial Burst
- Attack Cooldown: 2.0 seconds
- Optimal Distance: 8 units from player
- Speed: +20%

**Triggers:**

- Massive particle explosion (80 particles)
- Light pulse (intensity 10)

**Behavior:**

- More aggressive movement
- Tighter attack patterns
- Reduced safe zones

---

### Phase 3: System Meltdown (33% HP - Enrage)

**Attack Pattern:**

- Spiral Vortex + Radial Burst + Homing Missiles
- Attack Cooldown: 1.5 seconds
- Optimal Distance: 6 units from player
- Speed: +40% total
- Shockwave Cooldown: 6 seconds

**Triggers:**

- Enrage state activated
- White particle explosion (100 particles)
- Shockwave (18 unit radius)
- Light pulse (intensity 15)
- Instant attack cooldown reset

**Behavior:**

- Relentless pursuit
- Minimal gaps between attacks
- Constantly approaching player

---

### Phase 4: Total Annihilation (Enraged)

**Attack Pattern:**

- ALL ATTACKS: Spiral + Radial + Homing + Chaos
- Attack Cooldown: 1.0 second (fastest)
- Optimal Distance: 6 units (aggressive)
- Speed: +70% total
- All cooldowns reduced

**Visual Changes:**

- Core emissive intensity: 2.5 (pulsing rapidly)
- Main light intensity: 13 (bright red glow)
- Spikes fully extended
- Corruption aura at maximum

**Behavior:**

- Maximum aggression
- Overwhelming projectile density
- Constant pressure on player
- No safe zones

---

## 🎨 Visual Design

### Core Components

- **Central Core:** 8-unit black icosahedron with red glow
- **Energy Core:** 5-unit pulsating red core inside
- **Orbital Rings:** 8 massive rings (10-24 unit radius)
- **Tendrils:** 16 writhing tentacles with 20 segments each
- **Spikes:** 40 rotating spikes that grow with damage
- **Dark Matter:** 80 swirling particle effects

### Lighting Effects

- **Main Light:** Red, 8 intensity, 60 range (pulses with health)
- **Pulse Light:** White, triggered on damage/phase change
- **Corruption Aura:** Red sphere, 18 units, pulsating opacity

### Spawn Animation

1. **Portal Phase (0-1s):**

   - Torus portal expands
   - 5 energy rings appear
   - Warning beacon lights up
   - Boss invisible

2. **Emergence Phase (1-2s):**

   - Boss fades in
   - Scales from 0% to 100%
   - Portal shrinks
   - Rings rise upward

3. **Roar Phase (2-3s):**
   - Camera shake effect
   - Lighting intensity peaks
   - Final particle burst
   - Portal cleanup

---

## 🎮 Combat Strategy (Player Tips)

### Phase 1 (Easy)

- Learn attack patterns
- Stay at medium range (10-15 units)
- Circle strafe around spiral attacks
- Use EMP to clear projectiles

### Phase 2 (Medium)

- Watch for radial burst warning
- Increase movement speed
- Use cover when available
- Save healing for Phase 3

### Phase 3 (Hard)

- Dodge homing missiles actively
- Never stop moving
- EMP is critical for survival
- Keep boss at max range

### Phase 4 (EXTREME)

- Constant evasive movement required
- Use invulnerability frames wisely
- Chaos barrage = find gaps in pattern
- Focus on DPS to end fight quickly

---

## 🔧 Technical Details

### Projectile Types

```javascript
Spiral:  OctahedronGeometry(0.7) - Red (#ff0000)
Radial:  TetrahedronGeometry(0.8) - Red (#ff0000)
Homing:  SphereGeometry(0.7)      - Magenta (#ff00ff)
Chaos:   BoxGeometry(1,1,1)       - Orange (#ffaa00)
Pulse:   OctahedronGeometry(0.7)  - Dark Red (#880000)
```

### Homing Missile Tracking

- Updates every frame
- 5% steering rate (lerp factor 0.05)
- Speed: 24 units/second
- Lifetime: 6 seconds
- Collision radius: 0.7 units

### Phase Transition Conditions

```javascript
Phase 1 → 2: health/maxHealth < 0.66
Phase 2 → 3: health/maxHealth < 0.33 (triggers enrage)
Phase 3 → 4: isEnraged === true (same as Phase 3)
```

### Performance Metrics

- 8 orbital rings updating per frame
- 16 tendrils × 20 segments = 320 segment updates/frame
- 40 spikes updating per frame
- 80 particles updating per frame
- Up to 58 projectiles simultaneously (all attacks)
- Total: ~500 mesh updates per frame

---

## 📊 Damage Output Analysis

### Attack DPS (Enraged, 1.0s cooldown)

```
Spiral:     8 projectiles  × 60 damage  = 480 DPS
Radial:     16 projectiles × 78 damage  = 1248 DPS
Homing:     6 projectiles  × 90 damage  = 540 DPS
Chaos:      20 projectiles × 48 damage  = 960 DPS
Contact:    35 damage (continuous if touching)
----------------------------------------------------
TOTAL POTENTIAL: 3228 projectile DPS + 35 contact
```

_Note: This is theoretical maximum if all projectiles hit. Actual player damage will be much lower due to dodging._

### Shockwave Timing

- Triggers every 6 seconds when enraged
- 15 unit proximity requirement
- Provides temporary burst of safety (pushback)

---

## 🏆 Boss Defeat Rewards

- **Score:** 5000 points
- **Healing:** Extra health restored
- **Bonus:** 3× score multiplier
- **Progression:** Unlocks next map/wave

---

## 🎬 Cinematic Elements

### Spawn Announcement

```
⚠️ CORRUPTION CORE AWAKENING! ⚠️
```

### Phase Transitions

- Phase 2: Explosion + Light Pulse
- Phase 3: ENRAGED with shockwave
- Console logs phase names

### Death Animation

- Massive particle explosion
- Shockwave effect
- Boss model destroyed
- Victory message

---

**Created by:** Enhanced Boss System  
**Version:** 1.0  
**Boss Difficulty:** ⭐⭐⭐⭐⭐ (5/5)  
**Recommended Player Level:** Wave 3+
