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

Six classes are available, each with a unique resource type, active ability, and passive skill.

| Class | Resource | Weapon | Playstyle |
|---|---|---|---|
| Barbarian | Fury | Axe | Melee berserker, high crit |
| Necromancer | Mana | Scythe | Poison DoT with lifesteal |
| Sorceress | Mana | War Staff | Magic burst damage |
| Amazon | Mana | Bow | Multi-hit ranged |
| Paladin | Mana | Mace | Tank/sustain, converts damage to life |
| Druid | Mana | Totem | Dex-scaling melee with lifesteal and damage reduction |

All classes start with **10 in every base stat** (Strength, Dexterity, Vitality, Energy) and **10 free stat points** to allocate.

**Weapons are class-locked.** Each class can only equip their designated weapon type. Unique weapons display a golden glow on the character sprite.

**Starting equipment.** Every new character begins with a Normal-quality version of their class weapon (item level 1, no affixes). This weapon occupies the main-hand slot immediately on character creation.

**Shield restrictions.** Only the Paladin can equip shields. The Barbarian can equip a second Axe in the off-hand slot (see Dual-Wield below). All other classes leave the shield slot empty.

---

## Stats

Every character has four base stats. Their final value is `classBase + allocatedPoints + gearAffixes`.

### Strength
Increases physical damage output.
```
flatStrengthDamage = strength / 5
```
Every 5 Strength adds +1 to both minimum and maximum weapon damage.

### Dexterity
Increases defense and critical strike chance, and powers the Druid's passive and active ability.
```
defense      += dexterity / 4
critChance    = min(0.60, 0.05 + dexterity × 0.001)
```
Base crit chance is 5% and scales to a soft cap of 60%. The Barbarian's passive adds 10% on top (recapped at 90%).

- Druid passive (Thick Hide): `reduction = min(0.25, dexterity × 0.002)` — caps at 25% damage reduction at 125 Dexterity.
- Druid ability (Werewolf Bite): deals `dexterity × 1.5` flat bonus damage on top of weapon damage.

### Vitality
Directly increases maximum life.
```
maxLife = 30 + (vitality × 3) + (level × 5) + gear life bonuses
```

### Energy
Adds flat bonus damage to all magic-typed abilities (spells).
```
magicDamageBonus = floor(energy / 5)
```
Every 5 Energy grants +1 flat damage added to each magic ability hit. At 50 Energy a spell gains +10 damage; at 100 Energy it gains +20. This is added after the power multiplier, so it is more valuable on spells with smaller base multipliers (e.g. the Necromancer's initial hit) than on high-power bursts. Non-magic abilities (Barbarian, Amazon, Druid) receive no benefit from Energy.

---

## Derived Stats

These are recomputed each frame from current stats + equipped gear.

### Max Life
```
maxLife = 30 + (vitality × 3) + (level × 5) + gear life bonuses
```

### Max Mana / Fury
- **Mana classes**: base 100 + gear mana bonuses.
- **Barbarian (Fury)**: fixed at 100. Starts every combat at 20. Gains +10 Fury per basic attack. Never regenerates passively.

### Damage Range
```
weaponDamage  = equipped weapon [min, max], or [1, 3] if unarmed
flatStrBonus  = strength / 5
damage[min]   = round(weaponDamage[min] + flatStrBonus + gear damage bonuses)
damage[max]   = round(weaponDamage[max] + flatStrBonus + gear damage bonuses)
```

### Defense
```
defense = round(gear defense bonuses + dexterity / 4)
```

### Crit Chance
```
critChance = min(0.60, 0.05 + dexterity × 0.001)
```
Barbarian adds +10% after this calculation; combined value is re-capped at 90%.

### Magic Damage Bonus
```
magicDamageBonus = floor(energy / 5)
```
Added as flat damage to the final result of every magic ability hit (after the power multiplier).

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

New characters start with **10 stat points** to allocate and a Normal-quality starting weapon.

---

## XP Cap & Dungeon Progression

To prevent infinite farming before advancing to harder content, XP is capped based on dungeon progression.

### How the cap works

The maximum player level before XP stops is:
```
xpCapLevel = highestClearedDungeonBossLevel + 5
```

If no dungeons have been cleared yet, the cap uses the first dungeon's boss level (Blood Moor, boss level 3):
```
xpCapLevel = 3 + 5 = 8
```

When `character.level >= xpCapLevel`, battles award **0 XP**. Gold drops and item drops are unaffected.

### Cap progression table

| Highest dungeon cleared | Boss level | XP cap (max level) |
|---|---|---|
| None | — | 8 |
| Blood Moor | 3 | 8 |
| Cold Plains | 5 | 10 |
| Stony Field | 8 | 13 |
| Dark Wood | 12 | 17 |
| Ruins of Tristram | 18 | 23 |

Clearing each dungeon raises the cap, forcing the player to progress rather than over-level an earlier zone.

---

## Combat

Combat is turn-based. The player chooses one action per round; the monster then attacks back.

**Animations are sequential.** The player's attack animation plays first (~550 ms), then the monster's animation fires. Action buttons are locked during the sequence. The damage preview on each button (range, crit ceiling, type) reflects pre-combat expected values.

### Player Actions

| Action | Effect |
|---|---|
| Attack | Basic weapon hit, 98% hit rate, crit possible |
| Ability | Class active skill (costs mana/fury, has cooldown) |
| Health Potion | Restores 35% of max life; 3-turn cooldown |
| Mana Potion | Restores 35% of max mana/fury; 3-turn cooldown |
| Flee | Spends an Escape Token to end the dungeon run safely |

### Hit Chance

**Player attacks**: 2% always-miss chance. No defense roll — player attacks are not blocked by monster defense.

**Monster attacks** use a rating-vs-defense formula:
```
hitChance = attackRating / (attackRating + defense × 2)
hitChance = clamp(hitChance, 0.15, 0.98)
```
Monsters always have at least a 15% chance to hit regardless of the player's defense.

### Critical Strikes

| | Crit Chance | Crit Multiplier |
|---|---|---|
| Player (base) | 5% + dex×0.001 (cap 60%) | ×1.50 |
| Barbarian passive | +10% (combined cap 90%) | ×1.25 |
| Monster | 10% | ×1.75 |

### Mana Regeneration

Every round, mana classes regenerate **5% of max mana** regardless of the action taken (including rounds when an ability is used). The Sorceress replaces this with **20% of max mana** on rounds where she uses a basic attack.

Fury never regenerates. It starts at 20 per fight and builds by +10 per basic attack.

### Ability Cooldown

After using an ability, its cooldown counter is set. It decrements by 1 at the end of every round. While the counter is above 0, the ability button is disabled.

### Potion Cooldown

Potions share an individual cooldown per type. After drinking a Health or Mana Potion, that specific potion type cannot be used for **3 turns**. Both types count down independently. The remaining cooldown is shown on the button.

### Poison (Necromancer)

When Poison Dagger hits, the target is poisoned for 3 rounds. Each round the poison ticks at the **start of the monster's turn** (after the player acts, before the monster attacks). Poison damage is fixed at cast time:
```
poisonDamage = round(randomInRange(damage) × ability.power × 0.4) + magicDamageBonus
```
The Necromancer's Soul Siphon passive heals 10% of every poison tick. The heal amount is shown in the combat log.

### Status Effects

Active status effects are shown as colored pills below each combatant's HP bar and as a pulsing aura on the player sprite.

**On the monster:**

| Effect | Trigger | Display |
|---|---|---|
| ☠ Poison N | Necromancer Poison Dagger | Green pill, remaining tick count |

**On the player** (applied by boss spells):

| Effect | Trigger | Aura | Damage per tick |
|---|---|---|---|
| ☠ Poison N | Andariel — Poison Nova | Green glow | `round(spellDmg × 0.4)` × 3 rounds |
| 🔥 Burn N | Bishibosh — Fire Wall | Orange glow | `round(spellDmg × 0.4)` × 3 rounds |

Both DoTs tick at the start of the monster's turn (after the player acts, before the monster attacks).

### Ability Animations

Each class ability triggers a short SVG overlay animation (≈800 ms) over the battle arena when used:

| Class | Animation |
|---|---|
| Barbarian | Red spinning whirlwind |
| Necromancer | Dagger thrust + green/purple poison clouds |
| Sorceress | Expanding fireball with rays |
| Amazon | Two arrows flying toward the enemy |
| Paladin | Golden holy cross with radiant pulse |
| Druid | Three green claw slashes |

### Monster Spells

Each dungeon boss has a unique spell that replaces its normal attack when it fires. Spells have a **3-round cooldown** after casting and a **35–40% cast chance** per eligible round. A spell animation overlay plays when the boss casts.

| Boss | Spell | Kind | Power | Effect |
|---|---|---|---|---|
| Corpsefire | Corpse Explosion | Burst | ×1.8 | Instant damage |
| Bishibosh | Fire Wall | Burn | ×1.6 | Initial hit + 3 burn ticks |
| Rakanishu | Chain Lightning | Burst | ×2.0 | Instant damage |
| Treehead Woodfist | Ground Slam | Burst | ×2.2 | Instant damage |
| The Countess | Blood Drain | Drain | ×1.5 | Deals damage, heals monster |
| Andariel | Poison Nova | Dot | ×2.4 | Initial hit + 3 poison ticks |

**Spell damage** = `round(randomInRange(monster.damage) × power)`.

For Dot/Burn spells, the initial hit is 40% of spell damage; each tick is also 40% of spell damage over 3 rounds.

The Paladin's Divine Retribution passive (15% of damage taken converted to life) applies to spell damage.

### Escape Tokens

Each character starts with **1 Escape Token**. Using the **Flee** action in combat consumes the token and immediately ends the dungeon run, returning the player to the Hub without dying. The save is preserved. Once the token is spent it is gone permanently — it does not replenish.

---

## Skills & Abilities

### Barbarian — Whirlwind
- **Kind**: burst (physical — no magic bonus)
- **Fury Cost**: 15
- **Cooldown**: 3 turns
- **Damage**: `round(randomInRange(damage) × 2.2)`

### Necromancer — Poison Dagger
- **Kind**: dot (magic — gains `magicDamageBonus` per tick)
- **Mana Cost**: 20
- **Cooldown**: 2 turns
- **Initial hit**: `round(randomInRange(damage) × 0.4) + magicDamageBonus`
- **Poison ticks**: 3 rounds of `round(randomInRange(damage) × 1.4 × 0.4) + magicDamageBonus` each

### Sorceress — Fireball
- **Kind**: burst (magic — gains `magicDamageBonus`)
- **Mana Cost**: 25
- **Cooldown**: 0 (can cast every turn)
- **Damage**: `round(randomInRange(damage) × 2.6) + magicDamageBonus`

### Amazon — Multishot
- **Kind**: multi (physical — no magic bonus, 2 hits)
- **Mana Cost**: 18
- **Cooldown**: 2 turns
- **Damage per hit**: `round(randomInRange(damage) × 0.55)` — each hit rolls crit independently

### Paladin — Holy Bolt
- **Kind**: heal (magic — gains `magicDamageBonus`)
- **Mana Cost**: 20
- **Cooldown**: 3 turns
- **Damage**: `round(randomInRange(damage) × 1.6) + magicDamageBonus`
- **Heal**: `round(damage × 0.35)` life restored to the player

### Druid — Werewolf Bite
- **Kind**: bite (physical — no magic bonus)
- **Mana Cost**: 18
- **Cooldown**: 3 turns
- **Damage**: `randomInRange(weaponDamage) + round(dexterity × 1.5)` — bypasses the power multiplier entirely
- **Lifesteal**: heals the player for **15% of damage dealt**

### General Ability Damage Formula

For `burst`, `dot`, `multi`, and `heal` kinds:
```
base   = round(randomInRange(damage) × power)
result = magic ? base + magicDamageBonus : base
```
`randomInRange` picks a uniformly random integer between damage min and max.

---

## Class Passives

Passives are always active — no activation required.

### Barbarian — Berserker's Edge
- +10% crit chance (stacks on top of the Dexterity formula; combined value capped at 90%).
- Crit multiplier is ×1.25 (25% bonus damage on crit), replacing the default ×1.50.

### Necromancer — Soul Siphon
- Each poison tick heals the Necromancer for **10% of that tick's damage**.

### Sorceress — Arcane Flow
- On a basic attack, regenerates **20% of max mana** (replaces the standard 5% regen for that round).

### Amazon — Precise Strikes
- Each of Multishot's two arrows rolls its own critical hit independently, so both can crit in a single cast.

### Paladin — Divine Retribution
- On every hit taken, heals **15% of the incoming damage**.

### Druid — Thick Hide
- On every monster hit, reduces incoming damage by a percentage based on Dexterity:
```
reduction = min(0.25, dexterity × 0.002)
```
At 50 Dex: 10% reduction. At 100 Dex: 20%. The 25% cap is reached at 125 Dex.

---

## Items & Equipment

### Equipment Slots

| Slot | Description |
|---|---|
| weapon | Main-hand weapon |
| shield | Off-hand (or second weapon for Barbarian) |
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

### Weapon Base Damage (before item level scaling)

| Weapon | Class | Min | Max | Two-Handed |
|---|---|---|---|---|
| Axe | Barbarian | 2 | 6 | No |
| Scythe | Necromancer | 3 | 8 | Yes |
| War Staff | Sorceress | 2 | 8 | Yes |
| Bow | Amazon | 3 | 7 | Yes |
| Mace | Paladin | 3 | 4 | No |
| Totem | Druid | 2 | 6 | Yes |

Item level scaling adds `+0.25 to min` and `+0.35 to max` per level, applied after the rarity multiplier.

---

## Item Affixes

Affixes are random bonuses rolled when an item generates. Items can have 0–4 affixes depending on rarity. **Normal (white) items never have affixes** — they show only their base stat.

**Jewelry (amulets, rings)** always drops at minimum **Magic** rarity, so it always has at least 1 affix. White jewelry does not exist in drops or shops.

| Affix Label | Stat Affected | Base Range |
|---|---|---|
| of Strength | Strength | +2–8 |
| of Dexterity | Dexterity | +2–8 |
| of Vitality | Vitality | +2–8 |
| of Energy | Energy | +2–8 |
| of Power | Flat Damage | +2–10 |
| of Protection | Flat Defense | +2–10 |
| of Life | Max Life | +5–20 |
| of Mana | Max Mana | +5–20 |

Affix values scale with item level:
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

Bought from the Shop tab. Prices are fixed.

| Item | Cost | Effect | Cooldown |
|---|---|---|---|
| Health Potion | 12 gold | Restores 35% of max life | 3 turns |
| Mana Potion | 12 gold | Restores 35% of max mana | 3 turns |

Potions are used as an action during combat. The restored amount scales with the character's current max life/mana (including all gear bonuses), making them more powerful as the character grows stronger. Each potion type has its own independent cooldown timer shown on the button.

**Stack cap**: each potion type is limited to **5 per character**. The shop buy button shows "Full (5/5)" and is disabled at the cap.

---

## Dungeons

Dungeons are linear: three regular wave fights followed by a boss. Life carries over between fights within the same run. Mana resets to full between fights; Fury always resets to 20.

Completing a dungeon marks it as cleared (shown with a badge) but it can be replayed for loot and XP.

| Dungeon | Monster Levels | Boss | Boss Life |
|---|---|---|---|
| Blood Moor | 1–3 | Corpsefire | 60 |
| Cold Plains | 3–5 | Bishibosh | 110 |
| Stony Field | 6–8 | Rakanishu | 180 |
| Dark Wood | 10–12 | Treehead Woodfist | 320 |
| Ruins of Tristram | 15–18 | The Countess | 520 |
| Rogue Monastery | 20–25 | Andariel | 800 |

Each boss casts a unique spell — see the [Monster Spells](#monster-spells) section.

### Item Drops

- Regular wave kill: **35% chance** to drop one item.
- Boss kill: **100% chance** to drop one item.
- Dropped item level equals the monster's level.
- Items are always appropriate for the active character's class (class-locked weapon filtering applies).

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
