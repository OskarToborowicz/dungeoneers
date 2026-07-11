# Diabolo — Game Mechanics Reference

A browser-based Diablo-style dungeon crawler built with React + TypeScript.

---

## Table of Contents

1. [Characters & Classes](#characters--classes)
2. [Stats](#stats)
3. [Derived Stats](#derived-stats)
4. [Leveling & XP](#leveling--xp)
5. [XP Cap & Dungeon Progression](#xp-cap--dungeon-progression)
6. [Combat](#combat)
7. [Skills & Abilities](#skills--abilities)
8. [Class Passives](#class-passives)
9. [Items & Equipment](#items--equipment)
10. [Item Affixes](#item-affixes)
11. [Item Rarity](#item-rarity)
12. [Consumables](#consumables)
13. [Dungeons](#dungeons)
14. [Save System](#save-system)
15. [Patch Notes](PATCH_NOTES.md)

---

## Characters & Classes

Seven classes are available, each with a unique resource type, active ability, and passive skill.

| Class | Resource | Weapon | Playstyle |
|---|---|---|---|
| Barbarian | Fury | Axe | Melee berserker, rage-fueled combatant — 2 active abilities, 3 passives |
| Necromancer | Mana | Scythe | Poison DoT with magic lifesteal and golem tank — 2 active abilities, 3 passives |
| Sorceress | Mana | War Staff | Magic burst damage — 2 active abilities, 3 passives |
| Amazon | Mana | Bow | Multi-hit ranged with crowd-control — 2 active abilities, 3 passives |
| Paladin | Mana | Mace | Tank/sustain with healing aura — 2 active abilities, 3 passives |
| Druid | Mana | Totem | Dex-scaling melee with lifesteal and damage reduction |
| Assassin | Mana | Claw | Dex-scaling trap setter — 2 active abilities, 3 passives |

All classes start with **10 in every base stat** (Strength, Dexterity, Vitality, Energy) and **10 free stat points** to allocate.

**Weapons are class-locked.** Each class can only equip their designated weapon type. Unique weapons display a golden glow on the character sprite.

**Starting equipment.** Every new character begins with a Normal-quality version of their class weapon (item level 1, no affixes). This weapon occupies the main-hand slot immediately on character creation.

**Shield restrictions.** Only the Paladin can equip shields. The Barbarian can equip a second Axe in the off-hand slot (see Dual-Wield below). The Assassin can equip a second Claw in the off-hand slot. All other classes leave the shield slot empty.

---

## Stats

Every character has four base stats. Their final value is `classBase + allocatedPoints + gearAffixes`.

### Strength
Increases physical damage output at double the rate of Dexterity.
```
flatStrengthDamage = strength × 2 / 5
```
Every 2.5 Strength adds +1 to both minimum and maximum weapon damage.

### Dexterity
Increases physical damage and critical strike chance, and powers the Druid's and Assassin's abilities.
```
flatDexDamage = dexterity / 5
critChance    = min(0.60, 0.05 + dexterity × 0.001)
```
Every 5 Dexterity adds +1 to both minimum and maximum weapon damage. Base crit chance is 5% and scales to a soft cap of 60%. The Barbarian's passive adds 10% on top (recapped at 90%).

- Druid passive (Thick Hide): `reduction = min(0.25, dexterity × 0.002)` — caps at 25% damage reduction at 125 Dexterity.
- Druid ability (Werewolf Bite): deals `dexterity × 1.5` flat bonus damage on top of weapon damage.
- Assassin ability (Fire Trap): deals `dexterity × 2.5` damage when the trap detonates.

### Vitality
Increases maximum life and defense.
```
maxLife = 30 + (vitality × 3) + (level × 5) + gear life bonuses
defense += vitality / 4
```

### Energy
Increases maximum mana and adds flat bonus damage to all magic-typed abilities (spells).
```
maxMana          += floor(energy / 5)
magicDamageBonus  = floor(energy / 2)
```
Every 5 Energy grants +1 max mana. Every 2 Energy grants +1 flat damage added to each magic ability hit. Non-magic abilities (Barbarian, Amazon, Druid, Assassin) receive no damage benefit from Energy, but mana classes still gain mana from it.

---

## Derived Stats

These are recomputed each frame from current stats + equipped gear.

### Max Life
```
maxLife = 30 + (vitality × 3) + (level × 5) + gear life bonuses
```

### Max Mana / Fury
- **Mana classes**: base 100 + `floor(energy / 5)` + gear mana bonuses.
- **Barbarian (Fury)**: fixed at 100. Starts every combat at 20. Gains +10 Fury per basic attack. Never regenerates passively.

### Damage Range
```
weaponDamage      = equipped weapon [min, max], or [1, 3] if unarmed
flatPhysicalBonus = (strength × 2 + dexterity) / 5
damage[min]       = round(weaponDamage[min] + flatPhysicalBonus + gear damage bonuses)
damage[max]       = round(weaponDamage[max] + flatPhysicalBonus + gear damage bonuses)
```

### Defense
```
defense = round(gear defense bonuses + vitality / 4)
```

### Crit Chance
```
critChance = min(0.60, 0.05 + dexterity × 0.001)
```

### Magic Damage Bonus
```
magicDamageBonus = floor(energy / 2) + gear magicDamage bonuses
```
Added as flat damage to the final result of every magic ability hit (after the power multiplier).

### Magic Damage Multiplier
The Sorceress passive **Ancient Wisdom** (unlocks at level 20) applies a multiplicative bonus to all magic ability damage:
```
magicDamageMult = sorceress && level ≥ 20 ? 1.20 : 1.0
result = round((base + magicDamageBonus) × magicDamageMult)
```

### Gold Find Bonus
Accumulated from "of Greed" affixes on rings and belt. Applied multiplicatively to every gold drop:
```
finalGold = round(baseGold × (1 + totalGoldFind% / 100))
```

### Mind over Matter (Sorceress, level 35)
Adds bonus maximum life equal to **15% of maximum mana** after all other life calculations:
```
maxLife += round(maxMana × 0.15)
```

---

## Leveling & XP

XP to reach the next level follows a power curve:
```
xpToNextLevel(level) = round(40 × level^1.55)
```

| Level | XP Required |
|---|---|
| 1→2 | 40 |
| 2→3 | 91 |
| 3→4 | 152 |
| 5→6 | 313 |
| 10→11 | 877 |

**On level-up**: +5 stat points to spend freely, and Max Life gains +5 from the level term.

New characters start with **10 stat points** to allocate, a Normal-quality starting weapon, and **1 Health Potion**.

---

## XP Cap & Dungeon Progression

To prevent infinite farming before advancing to harder content, XP is capped based on dungeon progression.

### How the cap works

The maximum player level before XP stops is:
```
xpCapLevel = max(highestClearedDungeonBossLevel, currentDungeonBossLevel) + 5
```

The current dungeon's boss level is included so that entering a new dungeon immediately raises the cap — preventing the situation where a player clears one act's endgame and then earns 0 XP in the next act's first dungeon.

If no dungeons have been cleared yet, the cap uses the first dungeon's boss level (Blood Moor, boss level 3):
```
xpCapLevel = 3 + 5 = 8
```

When `character.level >= xpCapLevel`, battles award **0 XP**. Gold drops and item drops are unaffected.

### Reclear XP reduction

Replaying **Rogue Monastery or any Act 2 dungeon** after it has already been cleared awards only **25% of the normal XP**. Act 1 regular dungeons (Blood Moor through Ruins of Tristram) are not affected and give full XP on every run.

### Cap progression table — Act 1

| Highest dungeon cleared | Boss level | XP cap (max level) |
|---|---|---|
| None | — | 8 |
| Blood Moor | 3 | 8 |
| Cold Plains | 5 | 10 |
| Stony Field | 8 | 13 |
| Dark Wood | 12 | 17 |
| Ruins of Tristram | 18 | 23 |
| Rogue Monastery (Andariel) | 30 | 35 |

### Cap progression table — Act 2

| Highest dungeon cleared | Boss level | XP cap (max level) |
|---|---|---|
| Imp Field | 33 | 38 |
| Lava River | 38 | 43 |
| Ashen Caves | 43 | 48 |
| Higher Hell | 50 | 55 |
| Lower Hell (The Reaper) | 57 | 62 |
| Hellcore (Core of Hell) | 70 | 75 |

Clearing each dungeon raises the cap, forcing the player to progress rather than over-level an earlier zone.

---

## Combat

Combat is turn-based. The player chooses one action per round; the monster then attacks back.

**Animations are sequential.** The player's attack animation plays first (~550 ms), then the monster's animation fires. HP bars update at the start of each combatant's animation phase. Action buttons are locked during the sequence. The damage preview on each button (range, crit ceiling, type) reflects pre-combat expected values.

### Player Actions

| Action | Hotkey | Effect |
|---|---|---|
| Attack | `1` | Basic weapon hit, 98% hit rate, crit possible |
| Ability | `2` | Class active skill (costs mana/fury, has cooldown) |
| Ability 2 | `3` | Second active skill — available on Barbarian, Sorceress, Amazon, Paladin, and Assassin |
| Health Potion | — | Restores 35% of max life; 3-turn cooldown |
| Mana Potion | — | Restores 35% of max mana/fury; 3-turn cooldown |
| Flee | — | Spends an Escape Token to end the dungeon run safely |

Press `Space` to continue after a victory or defeat screen.

### Hit Chance

**Player attacks**: 2% always-miss chance. No defense roll — player attacks are not blocked by monster defense.

**Monster attacks** use a rating-vs-defense formula:
```
hitChance = attackRating / (defense × 1.5)
hitChance = clamp(hitChance, 0.15, 0.98)
```
Monsters always have at least a 15% chance to hit regardless of the player's defense.

### Critical Strikes

| | Crit Chance | Crit Multiplier |
|---|---|---|
| Player (base) | 5% + dex×0.001 (cap 60%) | ×1.50 |
| Monster | 10% | ×1.75 |

Basic attacks always roll for crits. The following abilities also crit on their direct-damage roll: **Fireball** (Sorceress), **Holy Bolt** damage (Paladin), **Poison Cloud initial hit** (Necromancer), and **Golem Defense detonation** (Necromancer). DoT ticks, burn stacks, and the Paladin's heal component never crit independently — if Holy Bolt's damage crits, the `round(dmg × 0.35)` heal is derived from the already-critted value and scales up naturally.

### Mana Regeneration

Every round, mana classes regenerate **5% of max mana** regardless of the action taken (including rounds when an ability is used). The Sorceress has a higher passive regen rate: **10% of max mana every turn** regardless of action, courtesy of the **Arcane Flow** passive.

Fury never regenerates. It starts at 20 per fight and builds by +10 per basic attack (+15 at level 35 with the Madness passive).

### Ability Cooldown

After using an ability, its cooldown counter is set. It decrements by 1 at the end of every round. While the counter is above 0, the ability button is disabled.

### Potion Cooldown

Potions share an individual cooldown per type. After drinking a Health or Mana Potion, that specific potion type cannot be used for **3 turns**. Both types count down independently. The remaining cooldown is shown on the button.

### Poison (Necromancer)

When Poison Cloud hits, the target is poisoned for 3 rounds. Each round the poison ticks at the **start of the monster's turn** (after the player acts, before the monster attacks). Poison damage is fixed at cast time:
```
poisonDamage = round(randomInRange(damage) × ability.power × 0.4) + magicDamageBonus
             × virulenceMult  (×1.25 at level 20+)
```
The Necromancer's Soul Siphon passive heals **15% of every magic damage instance** — both the initial hit and each tick. The heal can overheal up to 25% of max life once Blood Barrier (lv.35) is active.

### Fire Trap (Assassin)

Using Fire Trap places a trap on the battlefield that detonates **after the monster's attack** on the next round. While active, the trap is shown as a glowing device with a countdown in the battle arena. Detonation deals:
```
trapDamage = round(dexterity × 2.5)
```
Crits are possible. After detonation a 4-round cooldown applies before another trap can be placed. If the monster dies to the trap's explosion it counts as a player victory.

### Status Effects

Active status effects are shown as colored pills below each combatant's HP bar and as a pulsing aura on the player sprite.

**On the monster:**

| Effect | Trigger | Display |
|---|---|---|
| ☠ Poison N | Necromancer Poison Dagger | Green pill, remaining tick count |
| 💫 Stunned N | Necromancer Golem Defense | Yellow pill, remaining stunned turns; monster cannot act |
| ❄ Frozen N | Amazon Freezing Shot | Blue pill, remaining frozen turns |
| ⚡ Electrocute N | Amazon — Stormstring bow on hit | Yellow pill, remaining turns; enemy takes 20% increased damage from all sources |
| 🔥 Burn N | Demon's Tail belt — every hit/ability | Orange pill per active stack; hovering shows source and damage per turn |

**Burn stacks independently** — each hit with Demon's Tail equipped pushes a new `{ rounds, damage, source }` entry. Multiple stacks can be active simultaneously, each with its own timer and damage value (30% of the triggering hit). A separate 🔥 Burn badge appears for each active stack.

**Stunned** prevents the monster from acting for the duration. Applied by Golem Defense on cast. The monster still appears on its turn in the combat log with a "stunned" message but deals no damage and casts no spells.

**Frozen** prevents the monster from acting entirely for the duration. The monster still appears on its turn in the combat log with a "frozen solid" message, but deals no damage and casts no spells.

**Electrocute** increases all damage the monster receives by 20% for 2 turns. Applied on every successful basic attack with Stormstring equipped; does not stack — refreshes the duration instead.

**On the player:**

| Effect | Trigger | Display |
|---|---|---|
| Blood Fury N | Barbarian Blood Fury | Red pill, remaining turns |
| ✦ Regen Nova N | Paladin Regenerating Nova | Green pill, pulsing green glow |
| ❄ Frost Shield N | Sorceress Frost Shield | Cyan pill, pulsing icy blue glow |
| ☠ Poison N | Andariel — Poison Nova | Green pill, green glow |
| 🔥 Burn N | Bishibosh — Fire Wall | Orange pill, orange glow |

Poison and Burn applied to the player tick at the start of the monster's turn (after the player acts, before the monster attacks). Damage per tick:
```
round(spellDmg × 0.4)  ×  3 rounds
```

### Ability Animations

Each class ability triggers a short SVG overlay animation (≈800 ms) over the battle arena when used:

| Class | Ability | Animation |
|---|---|---|
| Barbarian | Blood Fury | Red spinning vortex |
| Barbarian | Obliterate | Red spinning vortex |
| Necromancer | Poison Cloud | Green toxic cloud flies toward the enemy and billows on impact |
| Necromancer | Golem Defense | Stone boulder rolls in with dust trails, impacts the enemy with stun stars, then the golem stands guard next to the Necromancer |
| Sorceress | Fireball | Expanding fireball with rays |
| Amazon | Multishot | Two green arrows flying toward the enemy |
| Amazon | Freezing Shot | Icy blue arrow flying toward the enemy + frost explosion on impact |
| Paladin | Holy Bolt | Golden holy cross with radiant pulse |
| Paladin | Regenerating Nova | Green healing rings expand from the player with rising sparkles |
| Druid | Werewolf Bite | Three green claw slashes |
| Assassin | Fire Trap | Blue trap placed on field; cyan explosion on detonation |
| Assassin | Blinding Powder | Golden powder pouch flies toward the enemy and bursts into an expanding dust cloud |
| Sorceress | Frost Shield | Expanding frost rings with ice crystal shards and sparkles radiating from the player |

### Monster Spells

Each dungeon boss has a unique spell that replaces its normal attack when it fires. Spells have a **3-round cooldown** after casting and a **35–45% cast chance** per eligible round. A spell animation overlay plays when the boss casts.

**Act 1 bosses:**

| Boss | Spell | Kind | Power | Effect |
|---|---|---|---|---|
| Corpsefire | Corpse Explosion | Burst | ×1.8 | Instant damage |
| Bishibosh | Fire Wall | Burn | ×1.6 | Initial hit + 3 burn ticks |
| Rakanishu | Chain Lightning | Burst | ×2.0 | Instant damage |
| Treehead Woodfist | Ground Slam | Burst | ×2.2 | Instant damage |
| The Countess | Blood Drain | Drain | ×1.5 | Deals damage, heals monster |
| Andariel | Poison Nova | Dot | ×0.7 | Initial hit + 3 poison ticks |

**Act 2 bosses:**

| Boss | Spell | Kind | Power | Effect |
|---|---|---|---|---|
| Queen of Imps | Imp Swarm | Burst | ×2.0 | Instant damage |
| Emberfire | Lava Burst | Burn | ×2.2 | Initial hit + 3 burn ticks |
| It | Suffocating Cloud | Dot | ×2.0 | Initial hit + 3 poison ticks |
| Reltih | Hellfire | Burn | ×2.5 | Initial hit + 3 burn ticks |
| The Reaper | Death Chill | Dot | ×2.3 | Initial hit + 3 poison ticks |
| Core of Hell | Hellstorm | Burn | ×3.0 | Initial hit + 3 burn ticks (45% cast chance) |

**Spell damage** = `round(randomInRange(monster.damage) × power)`.

For Dot/Burn spells, the initial hit is 40% of spell damage; each tick is also 40% of spell damage over 3 rounds.

The Paladin's Divine Retribution passive (15% of damage taken converted to life) applies to spell damage.

### Escape Tokens

Each character starts with **1 Escape Token**. Using the **Flee** action in combat consumes the token and immediately ends the dungeon run, returning the player to the Hub without dying. The save is preserved. Once the token is spent it is gone permanently — it does not replenish.

---

## Skills & Abilities

### Barbarian — Blood Fury
- **Kind**: buff (no damage roll — activates a combat stance)
- **Fury Cost**: 40
- **Cooldown**: 6 turns — starts immediately on cast
- **Duration**: 3 turns
- **Effect**: While active, grants +20% Life Steal on all hits, +25% Double Swing chance (stacks with the base 25%), and +20% bonus damage on all attacks
- **Special**: Does **not** end the turn — the player also attacks on the activation turn

### Barbarian — Obliterate
- **Kind**: physical (no magic bonus)
- **Fury Cost**: 30
- **Cooldown**: 3 turns
- **Damage**: `round((randomInRange(damage) + strength × 0.5) × madnessMult)`
- **Killing Blow**: if the strike kills the enemy, restores **10% of max life**
- **Madness interaction**: if Fury was above 30 before paying the cost, the Madness 15% damage bonus applies

### Necromancer — Poison Cloud
- **Kind**: dot (magic — gains `magicDamageBonus` per tick)
- **Mana Cost**: 20
- **Cooldown**: 2 turns
- **Initial hit**: `round(randomInRange(damage) × 0.4) + magicDamageBonus` — **can crit**
- **Poison ticks**: 3 rounds of `round(randomInRange(damage) × 1.4 × 0.4) + magicDamageBonus` each — cannot crit
- With Virulence (lv.20): all tick damage multiplied by 1.25

### Necromancer — Golem Defense *(Ability 2)*
- **Kind**: golem (physical, `canMiss: false`)
- **Mana Cost**: 40
- **Cooldown**: 6 turns
- **On cast**: The Stone Golem rolls in and **stuns the enemy for 1 turn** (💫 Stunned pill, monster cannot act)
- **Guard duration**: 3 turns — the golem stands next to the Necromancer on the battlefield
- **Redirect**: Each turn the golem is active, **30% of all incoming damage** (physical and spell) is redirected back at the enemy; the player receives only the remaining 70%
- **Display**: Golem appears on the left/player side of the arena as an SVG with a round countdown badge; cannot be re-summoned while active

### Sorceress — Fireball
- **Kind**: burst (magic — gains `magicDamageBonus` and `magicDamageMult`)
- **Mana Cost**: 30
- **Cooldown**: 0 (can cast every turn)
- **Damage**: `round((randomInRange(damage) × 1.0 + magicDamageBonus × 2) × magicDamageMult)` — **can crit**
- Scales equally with weapon damage and doubly with Magic Damage bonus, making Energy investment highly rewarding

### Sorceress — Frost Shield *(Ability 2)*
- **Kind**: buff (no damage)
- **Mana Cost**: 75
- **Cooldown**: 8 turns — starts immediately on cast
- **Duration**: 3 turns
- **Effect**: Reduces all incoming damage (physical and spell) by **60%** for the duration
- **Special**: While active, the Frost Shield button shows "Active: X turns" and cannot be recast; a cyan status pill and icy blue glow appear on the player sprite
- **Damage formula while shielded**: `dmg = max(1, round(dmg × 0.40))`

### Amazon — Multishot
- **Kind**: multi (physical — no magic bonus, 2 hits)
- **Mana Cost**: 18
- **Cooldown**: 2 turns
- **Damage per hit**: `round(randomInRange(damage) × 0.55)` — each hit rolls crit independently

### Amazon — Freezing Shot *(Ability 2)*
- **Kind**: freeze (physical — no magic bonus)
- **Mana Cost**: 40
- **Cooldown**: 5 turns
- **Damage**: `randomInRange(weaponDamage) + round(dexterity × 0.5)` — weapon roll plus half Dexterity as flat bonus
- **Crit**: standard crit roll applies; crits scale the full combined damage
- **Freeze**: on hit, sets `frozenRounds = 2` — the monster skips its action entirely for the next 2 turns
- **Miss**: subject to the standard 2% always-miss chance; on miss no freeze is applied
- **Status display**: ❄ Frozen N pill appears below the monster's HP bar while frozen

### Paladin — Holy Bolt
- **Kind**: heal (magic — gains `magicDamageBonus` and `magicDamageMult`)
- **Mana Cost**: 20
- **Cooldown**: 3 turns
- **Damage**: `round((round(randomInRange(damage) × 1.2) + magicDamageBonus × 1.5) × magicDamageMult)` — **can crit**
- **Heal**: `round(damage × 0.35)` life restored — always derived from the final damage value, so a crit naturally increases the heal; the heal itself does not roll crit independently
- Scales with both weapon damage (1.2×) and Magic Damage bonus (1.5×, affected by Ancient Wisdom if cross-classing is ever added)

### Paladin — Regenerating Nova *(Ability 2)*
- **Kind**: regen (no damage roll)
- **Mana Cost**: 50
- **Cooldown**: 6 turns — starts immediately on cast
- **Duration**: 3 turns
- **Heal per turn**: `round(maxLife × 0.10)` — 10% of maximum life
- **Special**: Does **not** end the turn — the player also attacks on the activation turn
- **Status display**: ✦ Regen Nova N pill on the player, with a pulsing green glow on the sprite for each remaining turn

### Druid — Werewolf Bite
- **Kind**: bite (physical — no magic bonus)
- **Mana Cost**: 18
- **Cooldown**: 3 turns
- **Damage**: `randomInRange(weaponDamage) + round(dexterity × 1.5)` — bypasses the power multiplier entirely
- **Lifesteal**: heals the player for **15% of damage dealt**

### Assassin — Fire Trap
- **Kind**: trap (physical — no magic bonus)
- **Mana Cost**: 20
- **Cooldown**: 4 turns (starts after detonation)
- **Damage**: `round(dexterity × 2.5)` — scales entirely with Dexterity
- **Timing**: trap is placed this turn; detonates after the monster attacks next turn

### Assassin — Blinding Powder
- **Kind**: debuff (no damage)
- **Mana Cost**: 60
- **Cooldown**: 8 turns
- **Blind**: monster **cannot act** for **2 turns**
- **Disorient**: when blind expires, monster deals **25% reduced damage** for **4 turns**
- Total debuff window: 6 turns (2 blind → 4 disorient)

### General Ability Damage Formula

For `burst`, `dot`, `multi`, and `heal` kinds:
```
base   = round(randomInRange(damage) × power)
result = magic ? round((base + magicDamageBonus × magicPower) × magicDamageMult) : base
```
`randomInRange` picks a uniformly random integer between damage min and max. `magicPower` defaults to 1 for all abilities; Fireball sets it to 2. `magicDamageMult` is 1.0 for all classes except the Sorceress at level ≥ 20 (1.20 via Ancient Wisdom).

---

## Class Passives

Passives are always active — no activation required.

### Barbarian — Double Swing *(always active)*
- After every basic attack, **25% chance to strike a second time** (50% with Blood Fury active).
- The follow-up rolls hit, miss, and crit **independently** — it is a full separate attack.

### Barbarian — Iron Skin *(unlocks at level 20)*
- Reduces all incoming damage (physical and spell) based on how much life is missing:
```
reduction = floor(missingLifePct / 5) × 2%
```
- Example: at 40% life missing → 8 × 2% = 16% damage reduction.
- At 0% life missing the passive provides 0 reduction; it scales up as the Barbarian takes damage.

### Barbarian — Madness *(unlocks at level 35)*
- While **Fury exceeds 30**, all damage is increased by **15%** (applies to basic attacks, Blood Fury hits, and Obliterate).
- Basic attacks generate **+5 Fury** (15 total per attack instead of 10).
- The Fury check for the damage bonus is evaluated at the moment the attack or ability fires (before cost is deducted for Obliterate, which captures the pre-spend value).

### Necromancer — Soul Siphon *(always active)*
- All magic damage heals the Necromancer for **15% of the damage dealt** — applies to Poison Cloud's initial hit and every poison tick.

### Necromancer — Virulence *(unlocks at level 20)*
- All damage-over-time effects deal **25% increased damage** (multiplicative multiplier applied at cast time).

### Necromancer — Blood Barrier *(unlocks at level 35)*
- Soul Siphon heals and **life steal** (Life Leech affixes, unique item lifesteal) can overheal up to **25% of maximum life**, creating a temporary buffer.
- Health potions are excluded — they never contribute to the overheal buffer.
- Overheal is shown as a **blue glow** on the HP bar (scales with how full the buffer is) and a **+X** badge next to the HP display.

### Sorceress — Arcane Flow *(always active)*
- Passively regenerates **10% of max mana every turn**, regardless of the action taken. Replaces the standard 5% mana regen.

### Sorceress — Ancient Wisdom *(unlocks at level 20)*
- Increases all **Magic Damage by 20%** via a multiplicative multiplier applied after the flat `magicDamageBonus` is added. Affects Fireball and any future magic abilities.

### Sorceress — Mind over Matter *(unlocks at level 35)*
- Channels arcane reserves into vitality: **maximum life is increased by 15% of maximum mana**.
```
maxLife += round(maxMana × 0.15)
```

### Amazon — Dodge *(always active)*
- **15% chance** to completely avoid any incoming attack or spell. Applies to both normal monster attacks and boss spell casts.

### Amazon — Find Weakness *(unlocks at level 20)*
- Increases Critical Strike Chance by **+15%** (stacks with the Dexterity-based base crit, recapped at 90%).

### Amazon — Heartseeker *(unlocks at level 35)*
- After any Critical Strike, fires a **bonus follow-up arrow** dealing **50% of the crit's damage** (70% with the Doomcrier unique bow equipped). The follow-up arrow cannot itself critically strike.
- Triggers on basic attacks and on each individual Multishot arrow that crits.

### Paladin — Divine Retribution *(always active)*
- On every hit taken (physical or spell), heals **15% of the incoming damage**.

### Paladin — Defensive Aura *(unlocks at level 20)*
- Increases effective Defense by **10%** when calculating monster physical hit chance.
- Health Potions restore an additional **10% of maximum life** on top of the standard 35%.

### Paladin — Thorns Aura *(unlocks at level 35)*
- After every physical hit or spell that damages the player, deals **20% of that damage** back to the attacker.
- Applies after Divine Retribution; the reflected damage is tracked in `damageDealt` for the run summary.
- Can kill a monster via reflected damage.

### Druid — Thick Hide
- On every monster hit, reduces incoming damage by a percentage based on Dexterity:
```
reduction = min(0.25, dexterity × 0.002)
```
At 50 Dex: 10% reduction. At 100 Dex: 20%. The 25% cap is reached at 125 Dex.

### Assassin — Fade *(always active)*
- **25% chance** to reduce incoming physical or spell damage by **45%**.

### Assassin — Venom *(unlocks at level 20)*
- Basic attacks **poison the enemy for 2 turns**, dealing **30% of the hit's damage** per tick. Replaces any existing poison on the target.

### Assassin — Assassin's Advantage *(unlocks at level 35)*
- Basic attacks deal **+10% increased damage**.
- When the enemy is **poisoned** (Venom active), basic attacks gain an additional **+5% Critical Hit chance**.

---

## Items & Equipment

### Equipment Slots

| Slot | Description |
|---|---|
| weapon | Main-hand weapon |
| shield | Off-hand (or second weapon for Barbarian/Assassin) |
| helm | Head armor |
| armor | Body armor |
| gloves | Hand armor |
| boots | Foot armor |
| belt | Waist armor |
| amulet | Jewelry |
| ring1 / ring2 | Two jewelry slots |

### Two-Handed Weapons

War Staff (Necromancer/Sorceress), Bow (Amazon), and Totem (Druid) are two-handed. Equipping one unequips the shield slot.

### Barbarian Dual-Wield

The Barbarian can equip an Axe in both the weapon and shield slots. The off-hand weapon does not replace the main-hand damage range — it contributes **50% of its average damage as flat bonus damage**:
```
offHandBonus = round(((baseDamage.min + baseDamage.max) / 2) × 0.5)
```

### Assassin Dual-Wield

The Assassin can equip a Claw in the off-hand slot under the same rules as the Barbarian's second Axe.

### Weapon Base Damage (before item level scaling)

| Weapon | Class | Min | Max | Two-Handed |
|---|---|---|---|---|
| Axe | Barbarian | 2 | 6 | No |
| Scythe | Necromancer | 3 | 8 | Yes |
| War Staff | Sorceress | 2 | 8 | Yes |
| Bow | Amazon | 3 | 7 | Yes |
| Mace | Paladin | 3 | 4 | No |
| Totem | Druid | 2 | 6 | Yes |
| Claw | Assassin | 2 | 5 | No |

Item level scaling adds `+0.25 to min` and `+0.35 to max` per level, applied after the rarity multiplier.

---

## Item Affixes

Affixes are random bonuses rolled when an item generates. Items can have 0–4 affixes depending on rarity. **Normal (white) items never have affixes** — they show only their base stat.

**Jewelry (amulets, rings)** always drops at minimum **Magic** rarity, so it always has at least 1 affix. White jewelry does not exist in drops or shops.

| Affix Label | Stat Affected | Base Range | Slot Restriction | Notes |
|---|---|---|---|---|
| of Strength | Strength | +2–8 | — | Scales with item level |
| of Dexterity | Dexterity | +2–8 | — | Scales with item level |
| of Vitality | Vitality | +2–8 | — | Scales with item level |
| of Energy | Energy | +2–8 | — | Scales with item level |
| of Power | Flat Damage | +2–10 | Weapons, shields, rings, amulets, gloves | Scales with item level |
| of Protection | Flat Defense | +2–10 | — | Scales with item level |
| of Life | Max Life | +5–20 | — | Scales with item level |
| of Mana | Max Mana | +5–20 | — | Scales with item level |
| of Arcane Power | Magic Damage Bonus | +2–6 | Weapons, shields, rings, amulets, gloves | Scales with item level |
| of Greed | Gold Find % | +15–25% | Rings, belt | Fixed range |
| of Vampirism | Life Leech % | +3–9% | Rings, gloves | Fixed range |
| of Clarity | Mana Regen / Turn | +3–7 | Rings, belt | Fixed range |
| of Warding | Magic Damage Reduced % | +3–6% | Helms, armors, boots | Item level 25+ only; scales to 12% max at item level 50 |
| of Fortitude | Physical Damage Reduced % | +3–6% | Helms, armors, boots | Item level 25+ only; scales to 12% max at item level 50 |

**Gold Find** is a percentage bonus applied to every monster gold drop:
```
finalGold = round(baseGold × (1 + totalGoldFind% / 100))
```
Multiple "of Greed" affixes across equipped rings and belts stack additively before the multiplier is applied.

**Life Leech** heals the player for a percentage of physical damage dealt on basic attacks (including Barbarian Double Swing).

**Mana Regen** adds flat mana per turn on top of the class percentage regeneration.

**Warding / Fortitude** use custom item-level scaling starting from item level 25:
```
scale = 1 + (itemLevel − 25) × 0.04     [only for itemLevel ≥ 25]
finalValue = round(baseRoll × scale)
```

Most affix values scale with item level using the standard formula:
```
finalAffixValue = round(baseRoll × (1 + itemLevel × 0.08))
```

---

## Item Rarity

| Rarity | Drop Weight | Affixes | Base Stat Multiplier |
|---|---|---|---|
| Normal | 55% | 0 | ×1.00 |
| Magic | 30% | 1 | ×1.15 |
| Rare | 12% | 3 | ×1.30 |
| Unique | 3% | 4 | ×1.50 |

**Shop rarity is level-gated.** The merchant only stocks items up to a maximum rarity based on character level:

| Character Level | Max Shop Rarity |
|---|---|
| 1–4 | Magic |
| 5–9 | Rare |
| 10+ | Unique |

**Unique items** display a golden glow on the character sprite's weapon.

### Sell / Buy Values

```
sellValue = max(1, round(itemLevel × 2 × rarityMult))
buyValue  = sellValue × 6
```

Gold rarity multipliers: Normal ×1, Magic ×2, Rare ×4, Unique ×8.

Items can be sold individually from the Shop tab or all at once using **Sell All** (shows total value with a confirmation prompt before executing).

### Shop Restock

The merchant's inventory can be refreshed for a gold fee that scales with character level:
```
restockFee = round(10 + (level − 1) × 8)
```

| Level | Restock Cost |
|---|---|
| 1 | 10 gold |
| 5 | 42 gold |
| 10 | 82 gold |
| 20 | 162 gold |

---

## Consumables

Bought from the Shop tab.

| Item | Act 1 Cost | Act 2 Cost | Act 1 Effect | Act 2 Effect | Cooldown |
|---|---|---|---|---|---|
| Health Potion | 12 gold | 250 gold | Restores 35% of max life | Restores 50% of max life | 3 turns |
| Mana Potion | 12 gold | 250 gold | Restores 35% of max mana | Restores 50% of max mana | 3 turns |

Prices and restore rates upgrade automatically when Act 2 is unlocked (after clearing Rogue Monastery). The shop description updates to reflect the current tier.

Potions are used as an action during combat. The restored amount scales with the character's current max life/mana (including all gear bonuses), making them more powerful as the character grows stronger. Each potion type has its own independent cooldown timer shown on the button.

**Stack cap**: each potion type is limited to **5 per character**. The shop buy button shows "Full (5/5)" and is disabled at the cap.

---

## Dungeons

The game is split into two acts. Each act has five regular dungeons followed by an endgame dungeon, unlocked after all five regulars are cleared. Clearing the Act 1 endgame (Rogue Monastery) opens Act 2 via a red portal.

Dungeons are linear: wave fights followed by a boss. Life carries over between fights within the same run. Mana resets to full between fights; Fury always resets to 20.

Completing a dungeon marks it as cleared (shown with a badge) but it can be replayed for loot and XP.

### Act 1

| Dungeon | Monster Levels | Boss | Boss Life |
|---|---|---|---|
| Blood Moor | 1–3 | Corpsefire | 60 |
| Cold Plains | 3–5 | Bishibosh | 110 |
| Stony Field | 6–8 | Rakanishu | 180 |
| Dark Wood | 10–12 | Treehead Woodfist | 320 |
| Ruins of Tristram | 15–18 | The Countess | 520 |
| Rogue Monastery *(endgame)* | 22–30 | Andariel | 3,500 |

### Act 2

Unlocked after clearing Rogue Monastery. Select via the Act 1 / Act 2 toggle in the Dungeons tab.

| Dungeon | Monster Levels | Boss | Boss Life |
|---|---|---|---|
| Imp Field | 30–33 | Queen of Imps | 1,700 |
| Lava River | 34–38 | Emberfire | 2,430 |
| Ashen Caves | 39–43 | It | 3,360 |
| Higher Hell | 44–50 | Reltih | 4,680 |
| Lower Hell | 51–57 | The Reaper | 6,570 |
| Hellcore *(endgame)* | 60–70 | Core of Hell | 18,570 |

Each boss casts a unique spell — see the [Monster Spells](#monster-spells) section.

### Item Drops

- Regular wave kill: **35% chance** to drop one item.
- Boss kill: **100% chance** to drop one item.
- Dropped item level equals the monster's level.
- Items are always appropriate for the active character's class (class-locked weapon filtering applies).

### Unique Items

Unique items have fixed stats and are not generated through the normal rarity roll. Each has a dedicated `generate*` function in `src/game/data/items.ts`. Drop logic lives in `src/game/data/drops.ts` (`UNIQUE_DROP_TABLE`) — each entry rolls independently on every boss kill.

| Name | Slot | Drop Source | Chance | Stats / Effect |
|---|---|---|---|---|
| Spellblade's Mask | Helm | Tristram, Andariel, any Act 2 boss | 0.25% | +15 Damage, +15 Magic Damage; **each basic attack fires a bonus magic hit equal to 10% of physical damage dealt + 10% of magic damage bonus** |
| Peasant Hood | Helm | Blood Moor, Cold Plains boss | 5% | +10 Damage, +10 Vitality, +25% Gold Find |
| Ragpicker's Sash | Belt | Any boss | 0.25% | +5 Vitality, +20% Gold Find |
| Cracked Lens | Helm | Any boss (lv 5+) | 0.25% | +15 Magic Damage, +10 Energy, −10 Defense |
| Thornback | Armor | Any boss (lv 12+) | 0.25% | +30 Defense; reflects 10% of all physical damage taken back to the attacker |
| Sharp Fangs | Gloves | Any boss (lv 15+) | 0.2% | +30 Strength, +30 Dexterity, +30 Damage, +30 Magic Damage |
| Venomweave Wrap | Belt | Stony Field, Dark Wood, Tristram boss (lv 15+) | 0.25% | +20 Dexterity; +25% Poison Damage |
| Mirror Ring | Ring | Andariel (Rogue Monastery) | 1% | Mirrors all affixes of the other ring slot |
| Eye of the Storm | Ring | Any boss (lv 18+) | 0.25% | +25 Energy, −15 Strength; +15% Mana Regeneration |
| Boneweave Gloves | Gloves | Any boss (lv 20+) | 0.25% | +20 Vitality, +15 Defense; 5% chance to reduce an incoming hit to 1 damage |
| Mask of Midnight | Helm | Any boss (lv 25+) | 0.25% | +25–35 Vitality, +25–35 Damage, +5% Crit Chance |
| Mask of Twilight | Helm | Any boss (lv 25+) | 0.25% | +25–35 Energy, +25–35 Magic Damage, +5% Crit Chance |
| Stone Husk | Armor | Any boss (lv 25+) | 0.5% | +20–30 Vitality, +40–60 Life, 5–10% Phys Dmg Reduced, 5–10% Magic Dmg Reduced |
| Heavy Stompers | Boots | Any boss | 0.5% | +200 Life, +100 Defense, −20 Strength, −20 Dexterity, −20 Energy |
| The Pentagram | Amulet | Any Act 2 boss | 0.5% | +100 Damage, −100 Life |
| Demon's Tail | Belt | Any Act 2 boss | 0.25% | Every direct hit pushes an independent burn stack: 30% of that hit's damage per turn for 2 turns. Multiple hits → multiple stacks active simultaneously |
| Reaper's Hood | Helm | The Reaper (Lower Hell) | 0.5% | +4–7% Life Leech, +35–50 Vitality, +35–50 Damage; 20% chance to disorient on attack for 2 turns |
| Crown of the Fallen | Helm | Any boss (lv 45+) | 0.25% | Low-life damage bonus +25% (below 35% HP) |
| Harvester | Weapon (Necromancer) | The Reaper (Lower Hell), Necromancer only | 6% | Base 18–28 dmg (two-handed), +50–75 Damage, +50–75 Magic Damage, +25–40 Vitality, +25–40 Energy |
| Blooddrinker | Weapon (Barbarian) | Any boss (lv 10+), Barbarian only | 0.15% | Base 6–14 dmg; 8–12% Life Leech, +15–20 Strength, −8 Defense |
| Ironjaw | Weapon (Barbarian) | Any boss (lv 28+), Barbarian only | 0.15% | Base 16–26 dmg; +35–50 Damage, +25–35 Vitality, +5% Crit Chance |
| Worldbreaker | Weapon (Barbarian) | Any boss (lv 50+), Barbarian only | 0.15% | Base 28–44 dmg; +55–75 Damage, +40–55 Strength, +30–45 Vitality, −25 Dexterity |
| Penitent's Grace | Weapon (Paladin) | Any boss (lv 10+), Paladin only | 0.15% | Base 5–10 dmg; +10–15 Energy, +8–12 Mana Regen/Turn, +10–15 Magic Damage, +10–15 Vitality |
| Justicar | Weapon (Paladin) | Any boss (lv 28+), Paladin only | 0.15% | Base 14–22 dmg; +30–45 Damage, +20–30 Energy, +15–25 Magic Damage, −15 Strength |
| Sanctifier | Weapon (Paladin) | Any boss (lv 50+), Paladin only | 0.15% | Base 24–38 dmg; +50–70 Magic Damage, +35–45 Damage, +40–55 Vitality, +6% Crit Chance |
| Whisper | Weapon (Amazon) | Any boss (lv 8+), Amazon only | 0.15% | Base 5–12 dmg (two-handed); +10–15 Dexterity, +10–15 Vitality, +10–15 Damage |
| Stormstring | Weapon (Amazon) | Any boss (lv 28+), Amazon only | 0.15% | Base 16–28 dmg (two-handed); +30–45 Dexterity, +25–35 Damage, −15 Strength; **Electrocute on hit** — enemy takes 20% more damage for 2 turns |
| Doomcrier | Weapon (Amazon) | Any boss (lv 50+), Amazon only | 0.15% | Base 28–46 dmg (two-handed); +55–75 Damage, +40–55 Dexterity, +8% Crit Chance; **Heartseeker fires at 70%** instead of 50% |
| Apprentice's Focus | Weapon (Sorceress) | Act 1 bosses, Sorceress only | 0.2% | Base 4–11 dmg (two-handed); +12–18 Energy, +12–18 Magic Damage, +8–12 Mana |
| The Arcanist | Weapon (Sorceress) | Andariel + Act 2 early bosses, Sorceress only | 0.1% | Base 9–18 dmg (two-handed); +30–45 Magic Damage, +20–30 Energy, −15 Vitality; **Fireball deals +40% damage while Frost Shield is active** |
| Eternity's Edge | Weapon (Sorceress) | Act 2 late bosses, Sorceress only | 0.1% | Base 15–26 dmg (two-handed); +55–75 Magic Damage, +40–55 Energy, +6% Crit Chance; **30% chance for Fireball to echo at 50% power** |
| Viper's Kiss | Weapon (Assassin) | Act 1 bosses, Assassin only | 0.2% | Base 4–8 dmg; +12–18 Dexterity, +10–15 Damage, +8–12 Vitality |
| Shadowfang | Weapon (Assassin) | Andariel + Act 2 early bosses, Assassin only | 0.2% | Base 9–15 dmg; +30–45 Dexterity, +20–30 Damage, −15 Vitality; **20% chance after each hit to call a phantom strike at 50% damage** |
| Deathwhisper | Weapon (Assassin) | Act 2 late bosses, Assassin only | 0.2% | Base 15–23 dmg; +55–75 Dexterity, +35–50 Damage, +6% Crit Chance; **all damage +30% while the enemy is blinded or disoriented** |

### Permadeath

If the player dies during a dungeon run, the character is **permanently deleted**. A death summary screen shows final stats before returning to character selection. Use the Flee action to escape a fight before dying (consumes the one-time Escape Token).

---

## Save System

Up to **6 heroes** can be saved simultaneously. Saves persist in `localStorage` under `"diabolo-saves"`.

Each save slot stores:
- Full character state (name, class, level, XP, gold, allocated stats, Escape Token count)
- All equipped items and inventory contents
- Cleared dungeon list
- Consumable stack counts
- Current shop stock

The game **auto-saves after every action**. Returning to the main menu via "Return to Menu" preserves the current save. Death permanently deletes the slot.

Legacy saves from older single-slot versions (stored as `"diabolo-save"`) are automatically migrated to a new slot on first load.
