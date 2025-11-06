# Gameplay Testing Guide

## Quick Test Checklist

### ✅ Player Survivability

- [ ] Player starts with **150 HP** (check HUD)
- [ ] Taking damage shows red flash (intensity varies with damage)
- [ ] **No instant death** when touching enemies
- [ ] After taking damage, there's a **0.5s invulnerability** (weapon pulses)
- [ ] Multiple enemies touching at once don't stack damage instantly

### ✅ Enemy Attack Variety

#### Melee Enemies (Should rush at you)

- [ ] **Adware** (yellow): Fast, weak (4 damage), swarms
- [ ] **Worm** (green): Very fast, snaking movement (6 damage)

#### Ranged Enemies (Should shoot from distance)

- [ ] **Spyware** (purple): Shoots projectiles, teleports away if you get close

#### Charger Enemies (Should charge from distance)

- [ ] **Trojan** (red): Charges at high speed from 10-25 units away

#### AOE Enemies (Should create area explosions)

- [ ] **Ransomware** (orange): Creates explosions when close, has shield

#### Boss Enemies (Multiple abilities)

- [ ] **Rootkit** (black/red): Shoots spirals and radial projectiles

### ✅ Boss Fight System

#### Wave 3 (First Boss)

- [ ] After clearing wave 3 enemies, a boss spawns
- [ ] Message: "⚡ ELITE ENEMY! ⚡"
- [ ] Boss has enhanced stats

#### Wave 5 (Mini-Boss)

- [ ] Message: "🔥 MINI BOSS WAVE! 🔥"
- [ ] Ransomware spawns with shield

#### Wave 10 (Ultimate Boss)

- [ ] Message: "⚠️ ULTIMATE BOSS INCOMING! ⚠️"
- [ ] Rootkit boss spawns
- [ ] Very high health (600+)

### ✅ Boss Rewards

- [ ] Boss kill shows: "💀 BOSS DEFEATED! +[SCORE] 💀"
- [ ] Score is **3x normal** for bosses
- [ ] After boss wave: **+30 HP and +30 Energy**
- [ ] **5-second rest** after boss waves

### ✅ EMP Special Ability

- [ ] EMP costs **40 energy** (not 50)
- [ ] EMP cooldown is **8 seconds**
- [ ] EMP radius is **~18 units** (large blue shockwave)
- [ ] EMP shows: "EMP BLAST! X ENEMIES HIT!"
- [ ] Damage scales with distance (60 at center, 30 at edge)

### ✅ Visual Feedback

- [ ] Invulnerable: Weapon light pulses rapidly
- [ ] Low health: Weapon light dims
- [ ] Boss enemies: Brighter lights, larger glow
- [ ] Boss death: Huge explosion (50 particles vs 30)

---

## Combat Scenarios to Test

### Scenario 1: Single Enemy

**Expected**: Should take **4-20 damage per hit** depending on enemy type
**Result**: With 150 HP, you can survive **7-37 hits** before dying

### Scenario 2: Enemy Swarm (5+ Adware)

**Expected**: Invulnerability prevents death from simultaneous hits
**Result**: Should be challenging but survivable with movement

### Scenario 3: Mixed Enemy Types

**Expected**: Need to prioritize ranged enemies while avoiding melee
**Result**: Strategic depth, not just running around

### Scenario 4: Boss Fight

**Expected**: Intense but fair, can survive several hits
**Result**: Should take 2-3 minutes for first boss

### Scenario 5: EMP Usage

**Expected**: Can clear a group of 5-8 weak enemies
**Result**: Tactical decision when to use it

---

## Known Good Values

### Player Stats

```javascript
Max Health: 150
Max Energy: 100
EMP Damage: 60 (base)
EMP Radius: 18
EMP Cost: 40
EMP Cooldown: 8s
Invulnerability: 0.5s
```

### Enemy Contact Damage (Difficulty 1.0)

```javascript
Adware: 4;
Worm: 6;
Spyware: 7;
Trojan: 12;
Ransomware: 15;
Rootkit: 20;
```

### Time to Kill Player (Standing Still)

```javascript
Adware: 37.5 seconds (37 hits)
Worm: 25 seconds (25 hits)
Spyware: 21 seconds (21 hits)
Trojan: 12.5 seconds (12 hits)
Ransomware: 10 seconds (10 hits)
Rootkit: 7.5 seconds (7 hits)
```

---

## Difficulty Progression

| Wave | Difficulty | Boss?        | Enemy Types          |
| ---- | ---------- | ------------ | -------------------- |
| 1    | 1.0        | No           | Trojan, Worm, Adware |
| 2    | 1.15       | No           | Trojan, Worm, Adware |
| 3    | 1.3        | ⚡ Elite     | + Spyware            |
| 4    | 1.45       | No           | All except Rootkit   |
| 5    | 1.6        | 🔥 Mini-Boss | + Ransomware         |
| 6    | 1.75       | ⚡ Elite     | All types            |
| 7    | 1.9        | No           | + Rootkit            |
| 8    | 2.05       | No           | All types            |
| 9    | 2.2        | ⚡ Elite     | All types            |
| 10   | 2.35       | ⚠️ Ultimate  | Rootkit Boss         |

---

## Troubleshooting

### "Player dies too fast"

- Check if invulnerability is working (weapon should pulse)
- Verify player has 150 HP at start
- Check enemy contact damage values

### "Enemies too weak"

- This is intentional for early waves
- Difficulty scales with waves (+15% per wave)
- Boss waves provide the challenge

### "Boss doesn't spawn"

- Boss spawns AFTER clearing all regular enemies
- Only on waves divisible by 3
- Check console for boss spawn messages

### "EMP too powerful/weak"

- Base damage: 60
- Scales with distance
- 8-second cooldown prevents spam
- 40 energy cost (regenerates at 10/sec = 4 seconds to refill)

---

## Performance Notes

- Projectiles auto-cleanup after 3-5 seconds
- Max enemies on screen: ~15-25 (scales with wave)
- Boss fights: 1 boss only
- Particle effects are optimized

---

_Happy Testing! Report any issues or suggestions._
