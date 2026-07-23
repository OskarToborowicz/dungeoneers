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
12. [The Forge](#the-forge)
13. [Consumables](#consumables)
14. [Dungeons](#dungeons)
15. [The Eternal Spire](#the-eternal-spire)
16. [Journal](#journal)
17. [Save System](#save-system)

---

## Characters & Classes

Eight classes are available, each with a unique resource type, active ability, and passive skill.

| Class | Resource | Weapon | Playstyle |
|---|---|---|---|
| Barbarian | Fury | Axe | Melee berserker, rage-fueled combatant — 2 active abilities, 3 passives |
| Necromancer | Mana | Scythe | Poison DoT with magic lifesteal and golem tank — 2 active abilities, 3 passives |
| Sorceress | Mana | War Staff | Magic burst damage — 2 active abilities, 3 passives |
| Huntress | Mana | Bow | Multi-hit ranged with crowd-control — 2 active abilities, 3 passives |
| Paladin | Mana | Sword | Tank/sustain with healing aura — 2 active abilities, 3 passives |
| Druid | Mana | Whip | Forest bruiser — vine whip with bleed, Grove immunity, thorn/poison stacks — 2 active abilities, 3 passives |
| Assassin | Preparation | Claw | Shadow warrior who builds Preparation through combat and unleashes devastating strikes — 2 active abilities, 3 passives |
| Monk | Chi | Katar | Fast multi-hit melee with self-sustain and counter-attack — 2 active abilities, 3 passives |

All classes start with **10 in every base stat** (Strength, Dexterity, Vitality, Energy) and **10 free stat points** to allocate.

**Weapons are class-locked.** Each class can only equip their designated weapon type. Unique weapons display a golden glow on the character sprite.

**Starting equipment.** Every new character begins with a Normal-quality version of their class weapon (item level 1, no affixes). The Paladin also starts with a Normal-quality Shield. These items occupy their slots immediately on character creation.

**Shield restrictions.** Only the Paladin can equip shields. The Barbarian, Assassin, and Monk can instead place a second one-handed weapon (Axe / Claw / Katar respectively) in the off-hand slot (see Dual-Wielding below). All other classes leave the shield slot empty.

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
Every 5 Dexterity adds +1 to both minimum and maximum weapon damage. Base crit chance is 5% and scales to a soft cap of 60%.

- Druid ability (Vine Whip): deals `dexterity × 1.0` flat bonus damage on top of `weaponDamage × 1.2`.

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
Every 5 Energy grants +1 max mana. Every 2 Energy grants +1 flat damage added to each magic ability hit. Non-magic abilities receive no damage benefit from Energy, but mana classes still gain mana from it.

---

## Derived Stats

These are recomputed each frame from current stats + equipped gear.

### Max Life
```
maxLife = 30 + (vitality × 3) + (level × 5) + gear life bonuses
```

### Max Mana / Fury / Preparation
- **Mana classes**: base 100 + `floor(energy / 5)` + gear mana bonuses.
- **Barbarian (Fury)**: fixed at 100. Starts every combat at 20. Gains +10 Fury per basic attack. Never regenerates passively.
- **Assassin (Preparation)**: 3 globes maximum. Starts every combat and dungeon run at 0. Gains 1 Preparation per basic attack, capped at 3. Carries over between fights within the same dungeon run.

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

### Gold Find Bonus
Accumulated from "of Greed" affixes on rings and belt. Every source is **summed** into one total, then applied once to the base gold drop — bonuses stack additively, never compounding with each other:
```
finalGold = round(baseGold × (1 + totalGoldFind% / 100))
```

---

## Leveling & XP

XP to reach the next level follows a power curve:
```
xpToNextLevel(level) = round(120 × level^1.58)
```

| Level | XP Required |
|---|---|
| 1→2 | 120 |
| 2→3 | 359 |
| 3→4 | 681 |
| 5→6 | 1,526 |
| 10→11 | 4,562 |
| 20→21 | 24,249 |
| 35→36 | 100,978 |
| 50→51 | 260,993 |
| 70→71 | 636,264 |
| 90→91 | 1,290,155 |

**On level-up**: +5 stat points to spend freely, and Max Life gains +5 from the level term.

New characters start with **10 stat points** to allocate, a Normal-quality starting weapon, and **1 Health Potion**.

### XP Multipliers

All XP rewards are multiplied before being capped:

| Condition | Multiplier |
|---|---|
| Any kill (baseline) | ×1.12 |
| First clear of a dungeon (all kills during the run) | ×2.24 (×1.12 × ×2) |

The **first-clear bonus** applies to every kill in the dungeon — waves and boss — because the dungeon is not marked cleared until after the boss dies. Replaying a cleared dungeon awards only the baseline ×1.12 multiplier (no additional penalty).

---

## XP Cap & Dungeon Progression

To prevent infinite farming before advancing to harder content, XP is capped based on dungeon progression.

### How the cap works

The maximum player level before XP stops is:
```
xpCapLevel = max(highestClearedDungeonBossLevel, currentDungeonBossLevel) + 5
```

The current dungeon's boss level is included so that entering a new dungeon immediately raises the cap — preventing the situation where a player clears one act's endgame and then earns 0 XP in the next act's first dungeon.

When `character.level >= xpCapLevel`, battles award **0 XP**. Gold drops and item drops are unaffected.

### Cap progression

Each boss's level determines the cap for that zone. Clearing each dungeon raises the cap, forcing the player to progress rather than over-level an earlier zone. The endgame boss of each act sets the cap ceiling before transitioning to the next act.

---

## Combat

Combat is turn-based. The player chooses one action per round; the monster then attacks back.

**Animations are sequential.** The player's attack animation plays first (~550 ms), then the monster's animation fires. HP bars update at the start of each combatant's animation phase. Action buttons are locked during the sequence. The damage preview on each button (range, crit ceiling, type) reflects pre-combat expected values.

**Clear Again.** After defeating a dungeon's boss, the victory screen offers a **Clear Again** button next to Continue. It banks the boss rewards as normal, then immediately restarts the same dungeon from the first wave (full life/mana) instead of returning to the Hub — a quick farming loop.

### Player Actions

| Action | Hotkey | Effect |
|---|---|---|
| Attack | `1` | Basic weapon hit, 98% hit rate, crit possible |
| Ability | `2` | Class active skill (costs mana/fury/preparation, has cooldown) |
| Ability 2 | `3` | Second active skill — available on Barbarian, Necromancer, Sorceress, Huntress, Paladin, Assassin, and Monk |
| Health Potion | — | Restores a flat 40% of max life; 3-turn cooldown |
| Flee | — | Spends an Escape Token to end the dungeon run safely |

> Mana Potions no longer exist — Health Potions are the only consumable.

Press `Space` to continue after a victory or defeat screen.

### Hit Chance

**Player attacks**: 2% always-miss chance. No defense roll — player attacks are not blocked by monster defense.

**Monster attacks** use a rating-vs-defense formula:
```
hitChance = attackRating / (defense × 1.5)
hitChance = clamp(hitChance, 0.15, 0.98)
```
Monsters always have at least a 15% chance to hit regardless of the player's defense. All monster HP and attack rating values are buffed by **50%** compared to their base design values.

### Critical Strikes

| | Crit Chance | Crit Multiplier |
|---|---|---|
| Player (base) | 5% + dex×0.001 (cap 60%) | ×1.50 |
| Monster | 10% | ×1.75 |

Basic attacks always roll for crits. The following abilities also crit on their direct-damage roll: **Frost Bolt** (Sorceress), the **Frostfire comet** (Sorceress), **Holy Bolt** damage (Paladin), **Poison Cloud initial hit** (Necromancer), **Golem Defense detonation** (Necromancer), **Eviscerate** (Assassin), and **Vanish** initial hit (Assassin). DoT ticks and burn stacks never crit independently.

### Mana Regeneration

Every round, mana classes regenerate **5% of max mana** regardless of the action taken. The Sorceress has a higher passive regen rate: **10% of max mana every turn** via the **Mind over Matter** passive. Her two abilities cost **no mana** — only their cooldowns gate them.

Fury never regenerates. It starts at 20 per fight and builds by +10 per basic attack (+15 at level 35 with the Madness passive).

Preparation starts at 0 and carries over between fights within the same dungeon run. It gains 1 per basic attack (cap 3) and is spent by Eviscerate and Vanish.

### Ability Cooldown

After using an ability, its cooldown counter is set. It decrements by 1 at the end of every round. While the counter is above 0, the ability button is disabled.

### Potion Cooldown

After drinking a Health Potion it cannot be used again for **3 turns**. The remaining cooldown is shown beside the potion count on the button (the count stays visible; the cooldown appears as a separate pill next to it).

Drinking does not play an attack animation — the sprite stays put and red bubbles rise from above it instead.

### Poison (Necromancer)

When Poison Cloud hits, the target is poisoned for 3 rounds. Each round the poison ticks at the **start of the monster's turn** (after the player acts, before the monster attacks). Poison damage is fixed at cast time:
```
poisonDamage = round(randomInRange(damage) × ability.power × 0.4) + magicDamageBonus
             × virulenceMult  (×1.25 at level 20+)
```
The Necromancer's Soul Siphon passive heals **15% of every magic damage instance** — both the initial hit and each tick. The heal can overheal up to 25% of max life once Blood Barrier (lv.35) is active.

### Eviscerate (Assassin)

Eviscerate deals `1.5× + 0.5× per Preparation` weapon damage (max 3× at 3 Preparation), then spends all Preparation. It always applies Serpent's Kiss (instant poison equal to 10% of the hit's damage) and triggers any equipped life steal. Can critically strike.

### Vanish (Assassin)

Vanish hurls a metal powder burst for `0.75×` weapon damage, then grants immunity to all incoming damage for `1 + (Preparation spent)` turns. Clears all negative effects on the player and spends all Preparation. Can critically strike on the initial hit.

### Status Effects

Active status effects are shown as compact colored pills below each combatant's HP bar (just the **icon + remaining rounds** — tap a pill to reveal its name), and on the sprites themselves. **Both the player and the monster** show the same visuals: poison as rising green bubbles, burn as a flickering orange aura. Both draw on top of the model. The **monster's sprite aura settles in ~1 second after** the status is applied, so it doesn't pop mid-swing (the pill updates immediately; only the on-sprite aura is delayed).

**On the monster:**

| Effect | Trigger | Display |
|---|---|---|
| ☠ Poison N | Necromancer Poison Cloud | Green pill, remaining tick count |
| 💫 Stunned N | Necromancer Golem Defense | Yellow pill, remaining stunned turns; monster cannot act |
| ❄ Frozen N | Huntress Freezing Shot | Blue pill, remaining frozen turns |
| ⚡ Electrocute N | Huntress — Stormstring bow on hit | Yellow pill, remaining turns; enemy takes 20% increased damage from all sources |
| 🔥 Burn N | Demon's Tail belt — every hit/ability | Orange pill per active stack; shows source and damage per turn |
| 🩸 Bleed N | Druid Vine Whip (35% on hit) | Red pill per stack; 15% of the hit per turn for 3 turns |
| ☠ Poison N | Druid Nature's Wrath — every basic attack (lv.35) | Green pill per stack; 20% of the hit per turn for 3 turns |
| 🌿 Thorns N/3 | Druid Bramble — every basic attack | Green pill; erupts at 3 stacks for physical damage |

**DoT stacks are independent** — burn (Demon's Tail), bleed (Vine Whip), and poison (Nature's Wrath) all share one stacking system: each hit pushes a `{ rounds, damage, source, kind }` entry, and every active stack ticks on its own timer. **Thorns** are a separate 0–3 counter, not a DoT — they build on basic attacks and erupt at 3.

**Stunned** prevents the monster from acting for the duration. Applied by Golem Defense on cast.

**Frozen** prevents the monster from acting entirely for the duration.

**Electrocute** increases all damage the monster receives by 20% for 2 turns. Does not stack — refreshes the duration instead.

**On the player:**

| Effect | Trigger | Display |
|---|---|---|
| Blood Fury N | Barbarian Blood Fury | Red pill, remaining turns; red pulsing glow on sprite |
| ✦ Regen Nova N | Paladin Regenerating Nova | Green pill, pulsing green glow |
| ❄ Frost Shield N | Sorceress Frost Shield | Cyan pill, pulsing icy blue glow |
| 🌳 Grove N | Druid Grove | Brown pill, remaining blocked turns (all damage negated) |
| ◌ Vanish N | Assassin Vanish | Purple pill, remaining immune turns |
| ☠ Poison N | Monster Poison DoT spell | Green pill, green glow |
| 🔥 Burn N | Monster Burn DoT spell | Orange pill, orange glow |

Poison and Burn applied to the player tick at the start of the monster's turn. Damage per tick:
```
round(spellDmg × 0.4)  ×  3 rounds
```

### Sprite Motion

When the player acts, their sprite reacts. Melee classes lunge forward with a hop; ranged and caster classes are pushed **backwards** by their own shot instead, since they never close the distance. The recoil applies to both basic attacks and abilities.

| Class | Reaction on attack / ability |
|---|---|
| Huntress, Sorceress, Necromancer | Recoil backwards, snapping back fast and drifting forward slowly |
| Barbarian, Paladin, Druid, Assassin, Monk | Forward hop |

Taking a hit shakes the sprite horizontally; death drops and fades it.

### Basic Attack Animations

Most classes show only the sprite reaction on a basic attack. Four have a dedicated SVG effect (all `motion`-driven):

| Class | Basic attack animation |
|---|---|
| Barbarian | Heavy axe cleave — a thick orange-red arc sweeping down, slower than the paladin's slash |
| Huntress | Single small green arrow (with feather fletching) flying toward the enemy, rolling slightly on its axis |
| Paladin | Gold sword slash with a blurred light trail |
| Druid | Quick tan/brown leather-whip crack |

### Ability Animations

Each class ability triggers a short SVG overlay animation over the battle arena when used. All effects are **`motion`-driven** (no CSS keyframes):

| Class | Ability | Animation |
|---|---|---|
| Barbarian | Blood Fury | Red rage rings + shout wave arcs + core flash at player |
| Barbarian | Whirlwind | Red spinning vortex that expands across the arena |
| Necromancer | Poison Cloud | Green toxic cloud flies toward the enemy and billows on impact |
| Necromancer | Golem Defense | Stone boulder rolls in with dust trails; golem stands guard next to the Necromancer |
| Sorceress | Frost Bolt | Hand-painted icy bolt (loaded from a skill-art SVG) that flies over and shatters into frost shards on impact |
| Huntress | Multishot | Three green arrows fanning out toward the enemy |
| Huntress | Freezing Shot | Icy blue arrow flying toward the enemy + frost explosion on impact |
| Paladin | Holy Bolt | Golden holy nova on impact — twin crossing light beams, expanding rings, gilded spokes, and scattering motes |
| Paladin | Regenerating Nova | Green healing rings expand from the player with rising sparkles |
| Druid | Vine Whip | Green vine lashes out (with flicking leaves) and cracks against the enemy, triggering the bleed |
| Druid | Grove | Standing summoned tree model — **appears the instant the skill is pressed**, fades after 2 turns |
| Assassin | Eviscerate | Red diagonal slash + impact burst + poison drip at the enemy |
| Assassin | Vanish | Smoke burst at the player + metal shards scatter at the enemy |
| Sorceress | Frost Shield | Expanding frost rings with ice crystal shards radiating from the player |
| Monk | Spinning Crane Kick | Green cyclone spinning on the enemy's left flank + three sequential kick-impact bursts (one per hit) |
| Monk | Serenity | Blooming green lotus — calm rings, unfolding petals, and rising motes around the player |

> Class abilities can carry hand-painted SVG art (dropped into `src/assets/skills/<class>/<slot>/`); if art is present it's shown, otherwise the drawn effect is used. The Frost Bolt is the current reference.

### Monster Spells

Each dungeon boss has a unique spell that replaces its normal attack when it fires. Spells have a **4-round cooldown** after casting and a **35–45% cast chance** per eligible round. Regular wave monsters with spells follow the same timing rules.

**Spell damage** = `round(randomInRange(monster.damage) × power)`.

For Dot/Burn spells, the initial hit is 40% of spell damage; each tick is also 40% of spell damage over 3 rounds.

The Paladin's Divine Retribution passive (15% of damage taken converted to life) applies to spell damage.

### Escape Tokens

Each character starts with **1 Escape Token**. Using the **Flee** action in combat consumes the token and immediately ends the dungeon run, returning the player to the Hub without dying. The save is preserved. Once the token is spent it is gone permanently — it does not replenish.

**Softcore exception:** Softcore characters ignore Escape Tokens entirely — they can flee any time, but each flee costs **30% of their current gold**.

---

## Skills & Abilities

### Barbarian — Blood Fury
- **Kind**: buff (no damage roll — activates a combat stance)
- **Fury Cost**: 40
- **Cooldown**: 6 turns — starts immediately on cast
- **Duration**: 3 turns
- **Effect**: While active, grants +20% Life Steal on all hits, +25% Double Swing chance (stacks with the base 25%), and +20% bonus damage on all attacks. A red pulsing glow appears on the character.
- **Special**: Does **not** end the turn — the player also attacks on the activation turn

### Barbarian — Whirlwind *(Ability 2)*
- **Kind**: physical (no magic bonus)
- **Fury Cost**: All current Fury
- **Cooldown**: 3 turns
- **Damage**: `round(randomInRange(damage) × (1.0 + 0.03 × furySpent) × madnessMult)`
- **Effect**: Spends every point of Fury for a spinning strike. More Fury = more damage. Can critically strike and triggers life steal.
- **Madness interaction**: if Fury exceeded 30 before spending, the Madness 15% bonus applies

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
- **Display**: Golem appears on the player side of the arena as an SVG with a round countdown badge; cannot be re-summoned while active

### Sorceress — Frost Bolt
- **Kind**: burst (magic — gains `magicDamageBonus`)
- **Mana Cost**: 0
- **Cooldown**: 0 (can cast every turn)
- **Damage**: `round(randomInRange(damage) × 1.0 + magicDamageBonus × 2)` — **can crit** (plus +5% while mana is above 50%, from Mind over Matter)
- Every **3rd** cast also drops a **Frostfire comet** at level 20+ — see the Frostfire passive.

### Sorceress — Frost Shield *(Ability 2)*
- **Kind**: buff (no damage)
- **Mana Cost**: 0
- **Cooldown**: 9 turns — starts immediately on cast
- **Duration**: 3 turns
- **Effect**: Reduces all incoming damage (physical and spell) by **60%** for the duration
- **Damage formula while shielded**: `dmg = max(1, round(dmg × 0.40))`

### Huntress — Multishot
- **Kind**: multi (physical — no magic bonus, 2 hits)
- **Mana Cost**: 18
- **Cooldown**: 2 turns
- **Damage per hit**: `round(randomInRange(damage) × 0.55)` — each hit rolls crit independently

### Huntress — Freezing Shot *(Ability 2)*
- **Kind**: freeze (physical — no magic bonus)
- **Mana Cost**: 40
- **Cooldown**: 5 turns
- **Damage**: `randomInRange(weaponDamage) + round(dexterity × 0.5)`
- **Freeze**: on hit, sets `frozenRounds = 2` — the monster skips its action entirely for 2 turns

### Paladin — Holy Bolt
- **Kind**: heal (magic — gains `magicDamageBonus`)
- **Mana Cost**: 20
- **Cooldown**: 3 turns
- **Damage**: `round(round(randomInRange(damage) × 1.2) + magicDamageBonus × 1.5)` — **can crit**
- **Heal**: `round(damage × 0.35)` life restored — derived from the final damage value, so a crit naturally increases the heal

### Paladin — Regenerating Nova *(Ability 2)*
- **Kind**: regen (no damage roll)
- **Mana Cost**: 50
- **Cooldown**: 6 turns — starts immediately on cast
- **Duration**: 3 turns
- **Heal per turn**: `round(maxLife × 0.10)` — 10% of maximum life
- **Special**: Does **not** end the turn — the player also attacks on the activation turn

### Druid — Vine Whip
- **Kind**: vine_whip (physical — no magic bonus)
- **Mana Cost**: 20
- **Cooldown**: 2 turns
- **Damage**: `round(randomInRange(weaponDamage) × 1.2 + dexterity × 1.0)` — **can crit**
- **Bleed**: 35% chance on hit to apply a bleed stack — 15% of the hit's damage per turn for 3 turns

### Druid — Grove *(Ability 2)*
- **Kind**: bark_wall (`canMiss: false`, no damage)
- **Mana Cost**: 45
- **Cooldown**: 6 turns
- **Effect**: For **2 turns** the enemy's attacks are fully blocked — the monster deals **0 damage** and no status effect gets through
- Cannot be recast while active (`barkWallRounds`)

### Assassin — Eviscerate
- **Kind**: eviscerate (physical — no magic bonus)
- **Preparation Cost**: all current Preparation (0–3)
- **Cooldown**: 2 turns
- **Damage**: `round(randomInRange(damage) × (1.5 + 0.5 × preparationSpent))` — **can crit**; max multiplier 3.0× at full Preparation
- **Serpent's Kiss**: always deals an additional 10% of the hit's damage as instant poison (logged separately)
- **Lifesteal**: triggers any equipped life steal affix

### Assassin — Vanish *(Ability 2)*
- **Kind**: vanish (physical — no damage bonus)
- **Preparation Cost**: all current Preparation (0–3)
- **Cooldown**: 8 turns
- **Initial hit**: `round(randomInRange(damage) × 0.75)` — **can crit**
- **Immunity**: player takes 0 damage for `1 + preparationSpent` turns after the hit
- **Cleanse**: removes all active negative effects (poison, burn) before granting immunity
- **Status display**: ◌ Vanish N pill on the player for each remaining immune turn

### Monk — Spinning Crane Kick
- **Kind**: multi (physical — no magic bonus, **3 hits**, or **4** with the Stormfist unique equipped)
- **Chi Cost**: 50
- **Cooldown**: 2 turns
- **Damage per hit**: `round(randomInRange(damage) × 0.75)` — each kick rolls hit and crit independently
- **Sweeping Wind proc**: each kick has an additional 30% chance to deal 25% bonus damage of that hit's value

### Monk — Serenity *(Ability 2)*
- **Kind**: heal + cleanse + blind (no damage roll, `canMiss: false`)
- **Chi Cost**: 75
- **Cooldown**: 6 turns
- **Heal**: `round(maxLife × 0.30)` — 30% of maximum life
- **Cleanse**: removes all player negative effects (poison ticks, burn ticks)
- **Blind**: enemy **cannot act** this turn (single-turn only, no follow-up)

### General Ability Damage Formula

For `burst`, `dot`, `multi`, and `heal` kinds:
```
base   = round(randomInRange(damage) × power)
result = magic ? base + magicDamageBonus × magicPower : base
```

---

## Class Passives

Passives are always active — no activation required.

### Barbarian — Double Swing *(always active)*
- After every basic attack, **25% chance to strike a second time** (50% with Blood Fury active).
- The follow-up rolls hit, miss, and crit **independently**.

### Barbarian — Iron Skin *(unlocks at level 20)*
- Reduces all incoming damage (physical and spell) based on how much life is missing:
```
reduction = floor(missingLifePct / 5) × 2%
```

### Barbarian — Madness *(unlocks at level 35)*
- While **Fury exceeds 30**, all damage is increased by **15%**.
- Basic attacks generate **+5 Fury** (15 total per attack instead of 10).

### Necromancer — Soul Siphon *(always active)*
- All magic damage heals the Necromancer for **15% of the damage dealt** — applies to Poison Cloud's initial hit and every poison tick.

### Necromancer — Virulence *(unlocks at level 20)*
- All damage-over-time effects deal **25% increased damage** (multiplicative multiplier applied at cast time).

### Necromancer — Blood Barrier *(unlocks at level 35)*
- Soul Siphon heals and life steal can overheal up to **25% of maximum life**.
- Overheal is shown as a **blue glow** on the HP bar and a **+X** badge next to the HP display.

### Sorceress — Mind over Matter *(always active)*
- Passively regenerates **10% of max mana every turn**, regardless of the action taken.
- **35% of all damage taken is drained from mana before life** — applies to every damage source (physical hits, spell bursts, drains, and poison/fire/bleed DoT ticks). The drain is capped at the mana available, so when mana is low or 0 only what mana can cover is absorbed and the rest falls through to life.
- While **mana is above 50%**, deal **5% more magic damage** (applies to Frost Bolt and the Frostfire comet).

### Sorceress — Frostfire *(unlocks at level 20)*
- Every **3rd Frost Bolt** calls down a **fire comet**. The cast builds a stack (up to 2); the next Frost Bolt after 2 stacks fires the comet and resets the counter.
- **Comet damage** = `Frost Bolt damage × 1.25` — rolls its **own crit** independently.
- The comet **ignites** the enemy for **25% of its damage per turn for 2 turns** (a burn DoT stack).
- Stacks **persist between waves** within a stage, and **reset on entering a new dungeon and on each Eternal Spire floor**.
- The Frost Bolt button glows and reads "Comet ready!" when the next cast will drop the comet.

### Sorceress — Time Anomaly *(unlocks at level 35)*
- The **first time life drops below 35%** during a stage, instantly restore **25% of maximum mana and 25% of maximum life**. Fires **once per dungeon run / Eternal Spire floor**.
- While **below 35% life**, take **10% less damage** from all sources.

### Huntress — Dodge *(always active)*
- **15% chance** to completely avoid any incoming attack or spell.

### Huntress — Find Weakness *(unlocks at level 20)*
- Increases Critical Strike Chance by **+15%** (recapped at 90%).

### Huntress — Heartseeker *(unlocks at level 35)*
- After any Critical Strike, fires a **bonus follow-up arrow** dealing **50% of the crit's damage** (70% with Doomcrier equipped). The follow-up arrow cannot itself critically strike.
- Triggers on basic attacks and on each individual Multishot arrow that crits.

### Paladin — Divine Retribution *(always active)*
- On every hit taken (physical or spell), heals **15% of the incoming damage**.

### Paladin — Defensive Aura *(unlocks at level 20)*
- Increases effective Defense by **10%** when calculating monster physical hit chance.
- Health Potions restore an additional **10% of maximum life**.

### Paladin — Judgement *(unlocks at level 35)*
- Each basic attack deals bonus holy damage equal to **25% of total Magic Damage** plus **25% of Strength**.

### Druid — Bramble *(always active)*
- Each **basic attack** embeds a thorn stack in the enemy (`thornStacks`, 0–3).
- At **3 stacks** the thorns erupt for `round(0.5 × Vine Whip formula)` pure physical damage, then reset to 0.

### Druid — Lifebloom *(unlocks at level 20)*
- **Direct hits** (basic attack + Vine Whip) heal the player for **8% of damage dealt**. Does not trigger on DoT ticks.

### Druid — Nature's Wrath *(unlocks at level 35)*
- Every **basic attack** applies an independent **stacking poison** — 20% of the hit's damage per turn for 3 turns. Separate from Bramble's thorn stacks.

### Assassin — Serpent's Kiss *(always active)*
- Basic attacks and Eviscerate deal an additional **10% of damage dealt as instant poison damage**. The poison damage is applied immediately and logged as a separate hit.

### Assassin — Blur *(unlocks at level 20)*
- **25% chance** to reduce incoming damage by **25%** when hit.

### Assassin — Shadow Bond *(unlocks at level 35)*
- Using an ability (Eviscerate or Vanish) at **full Preparation (3)** heals **12% of max life** and empowers the next basic attack by **+50% damage**.
- If a basic attack would grant Preparation beyond the cap (3), instead heals **4% of max life per excess point**.

### Monk — Sweeping Wind *(always active)*
- After every basic attack, **30% chance** to deliver a follow-up strike at **70% damage**.
- Each individual hit of **Spinning Crane Kick** also has a **30% chance** to deal **25% bonus damage** of that hit (separate roll per kick).

### Monk — Transcendence *(unlocks at level 20)*
- Passively restores **7% of maximum life** each turn.

### Monk — Counter Attack *(unlocks at level 35)*
- **12% chance** to instantly strike back with a full weapon-damage attack immediately after the enemy attacks.

---

## Items & Equipment

### Equipment Slots

| Slot | Description |
|---|---|
| weapon | Main-hand weapon |
| shield | Off-hand (or a second one-handed weapon for Barbarian/Assassin/Monk) |
| helm | Head armor |
| armor | Body armor |
| gloves | Hand armor |
| boots | Foot armor |
| belt | Grants **potion slots** (1–3), not defense — see Consumables |
| amulet | Jewelry |
| ring1 / ring2 | Two jewelry slots |

### Two-Handed Weapons

War Staff (Necromancer/Sorceress), Bow (Huntress), and Whip (Druid) are two-handed. Equipping one unequips the shield slot.

### Dual-Wielding & Off-Hand Uniques

Barbarian, Assassin, and Monk may place a one-handed weapon in the off-hand (shield) slot. An off-hand weapon grants **half its average base damage** plus all of its affixes — and its **unique effect applies from either hand**, so a unique fist/sword/etc. works whether it's main- or off-hand.

### Belts & Potion Slots

Belts grant **no defense**. Their base stat is **potion slots**, rolled 1–3 (weights 50% / 33% / 17%), capped by rarity: Normal 1, Magic 2, Rare and above 3. Each slot is one extra Health Potion carried into a dungeon.

### Barbarian Dual-Wield

The Barbarian can equip an Axe in both the weapon and shield slots. The off-hand contributes **50% of its average damage as flat bonus damage**:
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
| Bow | Huntress | 3 | 7 | Yes |
| Sword | Paladin | 3 | 4 | No |
| Whip | Druid | 2 | 6 | Yes |
| Claw | Assassin | 2 | 5 | No |
| Katar | Monk | 2 | 5 | No |

Item level scaling adds `+0.25 to min` and `+0.35 to max` per level, applied after the rarity multiplier.

---

## Item Affixes

Affixes are random bonuses rolled when an item generates. Items can have 0–4 affixes depending on rarity. **Normal (white) items never have affixes** — they show only their base stat.

**Jewelry (amulets, rings)** always drops at minimum **Magic** rarity. White jewelry does not exist.

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
| of Warding | Magic Damage Reduced % | +3–6% | Helms, armors, boots | Item level 25+ only |
| of Fortitude | Physical Damage Reduced % | +3–6% | Helms, armors, boots | Item level 25+ only |

Most affix values scale with item level:
```
finalAffixValue = round(baseRoll × (1 + itemLevel × 0.08))
```

Warding / Fortitude use item-level scaling starting from item level 25:
```
scale = 1 + (itemLevel − 25) × 0.04
finalValue = round(baseRoll × scale)
```

**Capped affixes never roll a guaranteed maximum.** Some affixes have a hard ceiling (e.g. Gold Find 125%, crit-damage +20%, crit-chance 6%, Warding / Fortitude 12%). Rather than clamping the final value to the cap — which at high item levels would pin every roll to exactly the cap — the whole roll **range is compressed proportionally** so the top of the range equals the cap and the minimum keeps the same fraction of the max as the base range. The cap is reachable only on a near-perfect roll, and there is always a real spread (the same behavior as an uncapped affix like "of Life").

---

## Item Rarity

| Rarity | Drop Weight | Affixes | Base Stat Multiplier |
|---|---|---|---|
| Normal | 55% | 0 | ×1.00 |
| Magic | 30% | 1 | ×1.15 |
| Rare | 12% | 3 | ×1.30 |
| Very Rare | 3% | 4 | ×1.50 |

**Rare items always roll exactly 3 affixes.** A 4th affix is exclusively a **Forge** reward. **Very Rare** items (named "… of the Ancients") drop with 4 affixes natively. **Unique** items are separate — fixed stats from `UNIQUE_DROP_TABLE`, not part of this rarity roll.

**Shop rarity is level-gated:**

| Character Level | Max Shop Rarity |
|---|---|
| 1–4 | Magic |
| 5–9 | Rare |
| 10+ | Unique |

### Sell / Buy Values

```
sellValue = max(1, round(itemLevel × 2 × rarityMult))
buyValue  = round(sellValue × max(6, itemLevel × 0.25))
```

Gold rarity multipliers: Normal ×1, Magic ×2, Rare ×4, Unique ×8.

The buy multiplier scales with item level: items at ilvl ≤ 24 use the floor of 6×; at ilvl 45 it reaches ~11×; at ilvl 90 it reaches ~22.5×. This makes late-game shop items significantly more expensive relative to gold rewards.

### Sell options

- **Sell Junk** — instantly sells all Normal and Magic items. Skips favorited items.
- **Sell All** — sells every inventory item; requires a confirmation step. Skips favorited items.

### Favorite Items

Mark any item with the **★** icon in its top-left corner. Active star turns gold.

- Favorited items **cannot be sold** individually, via Sell Junk, or via Sell All.
- A favorited item shows a **★ favorite** label in the shop panel instead of the sell button.

### Shop Restock

```
restockFee = round(10 + (level − 1) × 8)
```

### Unique Items

Unique items have fixed stats and are not generated through the normal rarity roll. Drop logic lives in `src/game/data/drops.ts` (`UNIQUE_DROP_TABLE`) — each entry rolls independently on every boss kill.

**Drop gating rules:**
- `minLevel` — player must be at or above this level for the entry to roll.
- `maxLevel` — only applies to entries with **no** dungeon restriction. Compares against the **boss's level**: if the boss is above `maxLevel`, the entry is skipped. Location-pinned items (those with a `dungeons` list) always roll from their dedicated encounters regardless of boss level.
- `classId` — only rolls for that class.

| Name | Slot | Drop Source | Chance | Stats / Effect |
|---|---|---|---|---|
| Spellblade's Mask | Helm | Goblins' Path, Bandit's Town Hall, any Act II boss | 0.25% | +15 Damage, +15 Magic Damage; each basic attack fires a bonus magic hit equal to 10% of physical damage dealt + 10% of magic damage bonus |
| Peasant Hood | Helm | Any boss (early Act I) | 5% | +10 Damage, +10 Vitality, +25% Gold Find |
| Ragpicker's Sash | Belt | Any boss (boss lv ≤ 30) | 0.25% | +5 Vitality, +20% Gold Find |
| Cracked Lens | Helm | Any boss (lv 5+, boss lv ≤ 35) | 0.25% | +15 Magic Damage, +10 Energy, −10 Defense |
| Thornback | Armor | Any boss (lv 12+, boss lv ≤ 40) | 0.25% | +30 Defense; reflects 10% of all physical damage taken back to the attacker |
| Sharp Fangs | Gloves | Any boss (lv 15+, boss lv ≤ 45) | 0.2% | +30 Strength, +30 Dexterity, +30 Damage, +30 Magic Damage |
| Venomweave Wrap | Belt | Act I mid-to-late bosses (lv 15+) | 0.25% | +20 Dexterity; +25% Poison Damage |
| Mirror Ring | Ring | Bandit's Town Hall endgame | 1% | Mirrors all affixes of the other ring slot |
| Eye of the Storm | Ring | Any boss (lv 18+, boss lv ≤ 50) | 0.25% | +25 Energy, −15 Strength; +15% Mana Regeneration |
| Boneweave Gloves | Gloves | Any boss (lv 20+, boss lv ≤ 50) | 0.25% | +20 Vitality, +15 Defense; 5% chance to reduce an incoming hit to 1 damage |
| Mask of Midnight | Helm | Any boss (lv 25+, boss lv ≤ 55) | 0.25% | +25–35 Vitality, +25–35 Damage, +5% Crit Chance |
| Mask of Twilight | Helm | Any boss (lv 25+, boss lv ≤ 55) | 0.25% | +25–35 Energy, +25–35 Magic Damage, +5% Crit Chance |
| Stone Husk | Armor | Any boss (lv 25+, boss lv ≤ 55) | 0.5% | +20–30 Vitality, +40–60 Life, 5–10% Phys Dmg Reduced, 5–10% Magic Dmg Reduced |
| Heavy Stompers | Boots | Any boss (boss lv ≤ 35) | 0.5% | +200 Life, +100 Defense, −20 Strength, −20 Dexterity, −20 Energy |
| The Pentagram | Amulet | Any Act II boss | 0.5% | +100 Damage, −100 Life |
| Demon's Tail | Belt | Any Act II boss | 0.25% | Every direct hit pushes an independent burn stack: 30% of that hit's damage per turn for 2 turns |
| Reaper's Hood | Helm | Act II late bosses | 0.5% | +4–7% Life Leech, +35–50 Vitality, +35–50 Damage; 20% chance to disorient on attack for 2 turns |
| Crown of the Fallen | Helm | Any boss (lv 45+, boss lv ≤ 75) | 0.25% | Low-life damage bonus +25% (below 35% HP) |
| Harvester | Weapon (Necromancer) | Act II late bosses, Necromancer only | 6% | Base 18–28 dmg; +50–75 Damage, +50–75 Magic Damage, +25–40 Vitality, +25–40 Energy |
| Blooddrinker | Weapon (Barbarian) | Any boss (lv 10+, boss lv ≤ 40), Barbarian only | 0.15% | Base 6–14 dmg; 8–12% Life Leech, +15–20 Strength, −8 Defense |
| Ironjaw | Weapon (Barbarian) | Any boss (lv 28+, boss lv ≤ 60), Barbarian only | 0.15% | Base 16–26 dmg; +35–50 Damage, +25–35 Vitality, +5% Crit Chance |
| Worldbreaker | Weapon (Barbarian) | Any boss (lv 50+), Barbarian only | 0.15% | Base 28–44 dmg; +55–75 Damage, +40–55 Strength, +30–45 Vitality, −25 Dexterity |
| Penitent's Grace | Weapon (Paladin) | Any boss (lv 10+, boss lv ≤ 35), Paladin only | 0.15% | Base 5–10 dmg; +10–15 Energy, +8–12 Mana Regen/Turn, +10–15 Magic Damage, +10–15 Vitality |
| Justicar | Weapon (Paladin) | Any boss (lv 28+), Paladin only | 0.15% | Base 14–22 dmg; +30–45 Damage, +20–30 Energy, +15–25 Magic Damage, −15 Strength |
| Sanctifier | Weapon (Paladin) | Any boss (lv 50+), Paladin only | 0.15% | Base 24–38 dmg; +50–70 Magic Damage, +35–45 Damage, +40–55 Vitality, +6% Crit Chance |
| Whisper | Weapon (Huntress) | Any boss (lv 8+, boss lv ≤ 38), Huntress only | 0.15% | Base 5–12 dmg; +10–15 Dexterity, +10–15 Vitality, +10–15 Damage |
| Stormstring | Weapon (Huntress) | Any boss (lv 28+, boss lv ≤ 60), Huntress only | 0.15% | Base 16–28 dmg; +30–45 Dexterity, +25–35 Damage, −15 Strength; Electrocute on hit — enemy takes 20% more damage for 2 turns |
| Doomcrier | Weapon (Huntress) | Any boss (lv 50+), Huntress only | 0.15% | Base 28–46 dmg; +55–75 Damage, +40–55 Dexterity, +8% Crit Chance; Heartseeker fires at 70% instead of 50% |
| Apprentice's Focus | Weapon (Sorceress) | Act I bosses, Sorceress only | 0.2% | Base 4–11 dmg; +12–18 Energy, +12–18 Magic Damage, +8–12 Mana |
| The Arcanist | Weapon (Sorceress) | Bandit's Town Hall + Act II early bosses, Sorceress only | 0.1% | Base 9–18 dmg; +30–45 Magic Damage, +20–30 Energy, −15 Vitality; Frost Bolt deals +40% damage while Frost Shield is active |
| Eternity's Edge | Weapon (Sorceress) | Act II late bosses, Sorceress only | 0.1% | Base 15–26 dmg; +55–75 Magic Damage, +40–55 Energy, +6% Crit Chance; 30% chance for Frost Bolt to echo at 50% power |
| Shadowfang | Weapon (Assassin) | Bandit's Town Hall + Act II early bosses, Assassin only | 0.2% | Base 9–15 dmg; +30–45 Dexterity, +20–30 Damage, −15 Vitality; 20% chance after each hit to call a phantom strike at 50% damage |
| Tanglewhip | Weapon (Druid) | Act I bosses (lv 8+), Druid only | 0.3% | Base 5–10 dmg; +12–18 Dexterity, +8–14 Damage, +8–12 Vitality; Vine Whip bleed chance increased to 50% |
| Worldroot | Weapon (Druid) | Bandit's Town Hall + Act II early bosses (lv 20+), Druid only | 0.3% | Base 9–15 dmg; +22–32 Dexterity, +16–24 Damage, +10–16 Vitality; Grove lasts 3 turns instead of 2 |
| Verdant Coil | Weapon (Druid) | Act II mid–late bosses (lv 33+), Druid only | 0.15% | Base 12–21 dmg; +32–46 Dexterity, +22–32 Damage, +14–20 Energy; Lifebloom heals 12% of damage dealt instead of 8% |
| Thornweave Effigy | Weapon (Druid) | Act III mid–late bosses (lv 54+), Druid only | 0.15% | Base 17–28 dmg; +46–62 Dexterity, +36–50 Damage, +26–36 Vitality; Nature's Wrath poison stacks deal 35% of hit per turn instead of 20% |
| Bloodbriar | Weapon (Druid) | Any boss (lv 74+), Druid only | 0.15% | Base 24–38 dmg; +66–86 Dexterity, +52–72 Damage, +6% Crit Chance; Bramble erupts at 2 stacks instead of 3 |

---

## The Forge

The **Forge** sub-tab appears inside the **Merchant** tab after clearing **The Frostforge** dungeon for the first time. It lets players strengthen rare items using **Frozen Alloys** — a crafting currency that drops from bosses.

### Frozen Alloy

- Shown as **❄ X/10** in the Hub sidebar (visible after The Frostforge is cleared).
- Drops from bosses of level **40 or higher** (all bosses from Summit Peak onward), but only **after The Frostforge has been cleared**.
- Clearing The Frostforge for the first time grants **3 Frozen Alloys** outright.
- Maximum stack: **10** (all sources are capped here).

| Boss level vs. player level | Drop Chance |
|---|---|
| Boss is at, above, or within 6 levels below the player | 6% |
| Player out-levels the boss by 7 or more | 0.5% |

Being *under*-levelled carries no bonus — it simply avoids the penalty. Only out-levelling a boss by 7+ reduces the rate.

### Smelting Uniques for Alloys

The Forge has two sub-tabs: **Reforge** (below) and **Smelt**. In **Smelt**, any **Unique** item of **item level 40 or higher** in your inventory can be smelted down into **1 Frozen Alloy**. This permanently destroys the item. Smelting is disabled while Frozen Alloys are already at the 10 cap.

### Crafting Rules

Place any **Rare** or **Very Rare** item in the Forge slot. Which operations are available depends on the item's affix count:

**3-affix rare → Add 4th Affix**
- Costs 1 Frozen Alloy.
- A random 4th affix is added that does not duplicate any existing affix on the item.
- The new affix is **locked** as the slot that can be re-rolled going forward.
- Only the added (locked) affix may be re-rolled after this point.
- If the item's slot has **no eligible stat left** to add (every possible affix for that slot/item level is already present), the button is disabled ("No new affix for this slot") and **no alloy is spent**.

**4-affix item (rare or very rare) → Re-roll an Affix**
- Costs 1 Frozen Alloy.
- Click any of the four affixes to select it, then confirm with **Yes / No**. That affix becomes permanently locked as the re-rollable slot; further re-rolls show "Re-roll again?".
- The re-roll draws from the whole slot pool **excluding the item's other affixes**. The selected affix's **own stat stays in the pool**, so a re-roll can land the same stat with a fresh (hopefully higher) value — i.e. it doubles as a **value re-roll** for a weak roll — or swap to a different stat.
- Re-rolls are capped (5 per item, or 3 once a 4th affix was Forge-added). No alloy is spent once the cap is reached.

**Very Rare** items already carry 4 affixes, so they only ever **re-roll** — the "Add 4th Affix" step doesn't apply to them.

### Visual Indicators

- **Forge-crafted / re-rolled affixes** appear in **light blue** in the item tooltip.
- Items with 4 affixes show a light blue "4 affixes" label in the Forge's inventory list.
- Items that can't be improved any further (rare with no eligible stat to add, or any item out of re-rolls) are marked **depleted** in the inventory list.

### Gheedon the Gambler

The **Gambler** tab in the Hub lets players purchase mystery items from Gheedon for a flat **2500 gold** each. All eight equipment slots are available (nine for the Paladin).

**Rarity distribution per purchase:**

| Rarity | Chance |
|---|---|
| Unique | 2% |
| Rare | 35% |
| Magic | 63% |

Unique items from gambling follow the same progression gates as dungeon drops. Class-restricted weapon uniques can only roll for the matching class; Druid and Monk have no weapon uniques in the pool and always receive a Rare weapon instead.

### Inventory Sort

The **Sort** button (next to the "Inventory" label) sorts all items in place by: **rarity** (Unique first) → **item level** (descending) → **slot**. Subsequent drops continue to appear at the top of the list regardless.

### Game Modes

Each character is created as **Hardcore** or **Softcore** (chosen at creation; a HC/SC badge shows on the character-select card). The mode is fixed for the character's life.

- **Hardcore** — permadeath. On death the character is **permanently deleted**; a death summary shows final stats before returning to character selection. Fleeing costs one **Escape Token**.
- **Softcore** — no permadeath. On death the character loses **all gold and all current-level XP** (both reset to 0; the level itself never drops), then drops **straight back to town with no death-summary screen**, keeping all gear. Fleeing needs **no token** but costs **30% of current gold** (unlimited uses).

---

## Consumables

Health Potions are the only consumable — **Mana Potions no longer exist**, and potions are **not purchasable** (the Merchant has no potion section).

Instead, entering a dungeon grants a fresh stock of **1 + your belt's potion slots** Health Potions (so 1 with no belt, up to 4). Leftovers do **not** carry between runs — each dungeon entry overwrites the stock.

- **Restore amount**: a flat **40% of max life**, at every act (no act scaling).
- **Cooldown**: **3 turns**.
- Paladin's Defensive Aura (lv.20) adds a flat +10% max life to each drink on top.

---

## Dungeons

The game is split into four acts. Each act has eight regular dungeons followed by an endgame dungeon, unlocked after all eight regulars are cleared. Clearing each act's endgame opens the next act.

Dungeons are linear: wave fights followed by a boss. Life carries over between fights within the same run. Mana resets to full between fights; Fury resets to 20; Preparation carries over.

### Act I — The Road Out

| Dungeon | Monster Levels | Boss |
|---|---|---|
| Sewers | 1–3 | The Rat King |
| Dark Forest | 2–4 | Forest Hag |
| Cave | 4–6 | Alpha Wolf |
| Foggy Fields | 7–9 | Living Shadow |
| Graveyard | 9–11 | Mass of Bones |
| Crypt | 11–13 | Niktag |
| Goblins' Path | 13–15 | Goblin King |
| Bandit Town | 15–17 | Exiled City Guard |
| Bandit's Town Hall *(endgame)* | 20–23 | Bandit Chieftain |

### Act II — The Frozen Peaks

Unlocked after clearing Bandit's Town Hall.

| Dungeon | Monster Levels | Boss |
|---|---|---|
| Frostfang Pass | 22–24 | Ice Golem |
| Icy Cave | 24–26 | Crystal Colossus |
| Tundra | 27–29 | The Pale Stag |
| Moonglass Lake | 29–31 | Moon Reflection |
| Whispering Glacier | 31–33 | White Chimera |
| The Crystal Labyrinth | 33–35 | Frozen Taur |
| The Frostforge | 36–38 | Core of the Frozen Forge |
| Summit Peak | 39–41 | Ghost of the Mountain |
| The White Maw *(endgame)* | 40–43 | Sikktharkk |

### Act III — The Jungle Depths

Unlocked after clearing The White Maw.

| Dungeon | Monster Levels | Boss |
|---|---|---|
| Overgrown Entrance | 43–45 | Ancient Treant |
| Serpent Marsh | 45–49 | Mother of the Swamp |
| Whispering River | 48–51 | The Great Emerald Crocolisk |
| Village of Lost Souls | 51–54 | The Soul Collector |
| Bloodvine Jungle | 54–58 | The Devourer Bloom |
| Temple of Forgotten Gods | 54–58 | Golden Idol |
| Heart of the Jungle | 58–62 | The Green Warden |
| The Black Ziggurat | 60–64 | Ancient Loa |
| Sacrificial Altar *(endgame)* | 64–66 | Zam'Koro, The Loa of Endless Night |

### Act IV — Realm of Endless Night

Unlocked after clearing Sacrificial Altar.

| Dungeon | Monster Levels | Boss |
|---|---|---|
| The Shattered Veil | 70–72 | The Gatekeeper |
| Graveyard of Kings | 72–75 | Prince Valdris the Damned |
| The Ashen Forest | 74–77 | The Pale Huntress |
| River of Lost Souls | 75–78 | The Abyssal Hydra |
| Citadel of Ash | 77–80 | General Morrath |
| The Shadow Cathedral | 79–82 | High Inquisitor Varek |
| Realm of Nightmares | 81–83 | The Dreaming Horror |
| The Obsidian Spire | 82–85 | Seraphel the Undying |
| Throne of Endless Night *(endgame)* | 84–90 | Reltih, the Void Devourer |

### Item Drops

- Regular wave kill: **35% chance** to drop one item.
- Boss kill: **100% chance** to drop one item + independent rolls from `UNIQUE_DROP_TABLE`.
- Dropped item level equals the monster's level.

---

## The Eternal Spire

An endless scaling tower — endgame content unlocked at **character level 50**. Entered from a card at the top of the Dungeons tab.

### Structure

- **One monster per floor.** Difficulty scales **linearly** with floor number; the displayed monster level is `50 + floor`.
- **The roster is drawn from every dungeon across all four acts.** Regular floors pull a random wave monster; Warden floors pull a random boss (inheriting that boss's own spell). The lineup is **seeded per character** (name + class + mode), so each hero gets its own fixed tower that stays consistent across re-renders and resumes, and differs between heroes.
- **A Warden guards every 5th floor** (5, 10, 15…) — tougher (~2.5× life), hits harder, and casts a spell.
- After **every** floor kill the player chooses: **Descend** (next floor) or **Leave the Spire** (bank everything and return to the Hub). There is no forced advance.
- **Each floor is a separate stage fight.** Descending resets life, mana, cooldowns and potions to a fresh start — nothing carries over between floors.

### Loot & reward cards

- **Loot drops only from Wardens.** Regular floors drop nothing. A Warden drops items (including a chance at uniques).
- Clearing a **Warden on a floor not previously cleared** also presents **2 reward cards** (drawn at random from the pool below) — pick one. Re-killing a Warden on a floor you've already cleared (e.g. re-entering at Floor 1 with a higher best) grants **no reward cards** — only its gold and XP.

| Card | Reward |
|---|---|
| ❄ Frozen Alloy | +1 alloy (capped at 10) |
| 💰 Gold Hoard | a large gold pile (scales with floor) |
| 💪 Ascension | +5 stat points (like a level's worth, without leveling) |
| 🗡 Unique Relic | a random unique with item level from **40 up to the slain Warden's level** |
| ⚔ Rare Weapon | a class-restricted **rare** weapon with **4 affixes** at the Warden's item level |
| 💍 Rare Jewelry | a **rare** ring or amulet with **4 affixes** at the Warden's item level |

XP inside the Spire respects the normal XP cap (the Spire is post-cap content — power comes from the cards and loot, not XP).

### Death, resume, records

- **Death is as final as anywhere** — Hardcore permadeath, Softcore loses gold + current-level XP and exits. Fleeing works as in dungeons.
- The run **auto-saves per floor** and resumes on reload. Clearing a floor immediately banks progress to the **next** floor, so leaving (or reloading) never forces a re-fight — the Dungeons card offers **Resume — Floor (highest cleared + 1)**.
- Each hero records its **highest floor cleared**. A **leaderboard** shows the single top record for **Hardcore** and **Softcore** (requires the app to be signed in to submit; anyone can view). The record is submitted the moment a new best floor is cleared — before any death.

---

## Journal

The **Journal** tab in the Hub records every story popup message the player has seen, organized by act.

Each entry appears as a compact bar showing the message's icon and title. **Hover** (or tap on mobile) to expand the bar and read the full text. Entries from acts not yet reached appear locked and greyed out, giving a preview of story content to come.

| Act | Entries |
|---|---|
| Act I — The Road Out | Thrown Into the Sewers · You Escaped the Sewers · A Man in a Cage · The Gate Opens |
| Act II — The Frozen Peaks | The Frostforge · The Mountain Falls |
| Act III — The Jungle Depths | The Veil Has Torn |
| Act IV — Realm of Endless Night | The Void Collapses |

---

## Save System

Up to **6 heroes** can be saved simultaneously. Saves persist in `localStorage` under `"diabolo-saves"`.

Each save slot stores:
- Full character state (name, class, level, XP, gold, allocated stats, Escape Token count, Frozen Alloy count)
- All equipped items and inventory contents (including Forge-crafted affixes and locked affix indices)
- Cleared dungeon list
- Consumable stack counts
- Current shop stock
- Active dungeon run state (current life, mana/fury/preparation, cooldowns) — allows resuming an interrupted run on reload

The game **auto-saves after every action**. Death permanently deletes the slot (Hardcore).

### Hero Transfer (export / import)

Any single hero can be moved between devices from the character-select screen:

- **Export** (📤 on a hero card) produces a short transfer code (`DIABOLO2:…` — the save is gzip-compressed then base64url-encoded) or lets you **download it as a `.txt` file**.
- **Import** (📥 **Import Hero**) accepts a pasted code **or a loaded file**, and adds it as a **new** hero (existing saves are untouched).

The file path is the most reliable on phones, where programmatic clipboard access is often blocked. Compression keeps the code short enough to copy in one piece.

### Cloud Accounts & Sync (optional)

Signing in (email/password or Google, via Supabase) links your heroes to an account:

- On sign-in, local and cloud heroes are **merged** — nothing is deleted; for a hero present in both, the one with the newer last-played time wins.
- While signed in, every save (including in-combat autosaves) is mirrored to the cloud, so heroes follow you across devices.
- **No account is required** — offline play on `localStorage` works exactly as before; the sign-in button only appears when the app is configured with Supabase.
