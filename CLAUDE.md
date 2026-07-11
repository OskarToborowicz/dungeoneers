# Diabolo — Claude Code Context

## Project

Browser-based Diablo-style dungeon crawler. React 18 + TypeScript + Vite.
Working directory: `C:\nowy poczatek\diabolo`

Dev server: `npm run dev` (port 5173)
Build check: `npx tsc --noEmit`

---

## Architecture

### Key source files

| File | Purpose |
|---|---|
| `src/game/types.ts` | All shared types: `ClassDefinition`, `DungeonDefinition`, `SaveGame`, etc. |
| `src/game/combat.ts` | Turn-based combat engine — single `simulateTurn()` export |
| `src/game/character.ts` | Stat derivation, XP/level math |
| `src/game/data/classes.ts` | All 7 class definitions |
| `src/game/data/dungeons.ts` | All dungeon + monster definitions, `getXpCapLevel()` |
| `src/game/data/items.ts` | Item generation — random items + all `generate*` unique functions |
| `src/game/data/drops.ts` | `UNIQUE_DROP_TABLE` — declarative unique drop entries, looped in `App.tsx` on boss kill |
| `src/game/storage.ts` | localStorage read/write (`SaveSlot[]` array — NOT an object) |
| `src/App.tsx` | Root state, routing between screens |
| `src/App.css` | All styles |
| `src/components/useItemHover.ts` | Shared hook for fixed-position item tooltip + compare panel on hover |
| `src/components/ItemTooltip.tsx` | `UniqueEffectLines` — renders unique effect text per boolean flag; `sortAffixes()` — display order |

### Component tree

```
App
├── CharacterSelect
├── CharacterCreation
├── Hub
│   ├── CharacterTab
│   ├── InventoryTab
│   ├── ShopTab
│   └── DungeonsTab
├── CombatScreen
└── GameOverScreen
```

### localStorage format

```
"diabolo-saves" → SaveSlot[]   (array, NOT object)

SaveSlot {
  id: string
  lastPlayedAt: number
  save: SaveGame {
    character, equipment, inventory,
    clearedDungeons, consumables, shopStock,
    inCombat?: boolean,
    activeDungeonRun?: { dungeonId, index, currentLife, currentMana, currentCooldown, currentCooldown2 }
  }
}
```

On load: if `inCombat && activeDungeonRun` → resume from checkpoint. F5 during combat shows `beforeunload` confirmation.

To inject a test save in the browser console:
```js
const saves = JSON.parse(localStorage.getItem('diabolo-saves') || '[]');
saves.push({ id: '99', lastPlayedAt: Date.now(), save: { character: { name: 'TestGod', classId: 'amazon', level: 50, xp: 0, gold: 99999, unspentStatPoints: 0, allocatedStats: { strength: 50, dexterity: 50, vitality: 50, energy: 50 }, abilityCooldown: 0, escapeTokens: 99, runStats: { damageDealt: 0, goldEarned: 0, kills: 0 } }, equipment: {}, inventory: [], clearedDungeons: ['blood-moor','cold-plains','stony-field','dark-wood','tristram','diablo'], consumables: { healthPotion: 99, manaPotion: 99 }, shopStock: [] } });
localStorage.setItem('diabolo-saves', JSON.stringify(saves));
location.reload();
```

To clear all saves: `localStorage.clear(); location.reload();`

---

## Game Systems

### Acts

- **Act 1**: 5 regular dungeons + Rogue Monastery endgame (boss: Andariel)
- **Act 2**: unlocks after clearing Andariel (`clearedDungeons.includes("diablo")`)
  - 5 regular dungeons + Hellcore endgame (boss: Core of Hell)
  - Act 2 tab appears in DungeonsTab when Act 2 is unlocked

### Combat flow (per turn)

1. Player action (attack / ability / potion / flee)
2. Trap countdown (`trapRounds -= 1`)
3. Monster spell or normal attack
4. Trap detonation (when `trapRounds` hits 0)
5. Player DoT ticks (poison / burn)
6. Monster burn stacks tick (`burnStacks[]` — each stack independent)

### Burn stacks (`burnStacks`)

`BattleState.burnStacks` is `{ rounds: number; damage: number; source: string }[]`. Each source of ignite pushes its own entry — they are completely independent. Every turn each active stack ticks, deals its damage, decrements rounds, then expired stacks are filtered out. The log message and badge both show the source name and remaining rounds. Currently only `Demon's Tail` calls `tryIgnite()`, but any future item or skill can pass a different `source` string.

**Log order rule:** ignite message always appears AFTER the attack/skill damage line that triggered it.

### Unique item drop system

All unique drop logic lives in `src/game/data/drops.ts` as `UNIQUE_DROP_TABLE: UniqueDropEntry[]`.

```ts
interface UniqueDropEntry {
  generator: () => Item;   // one of the generate* functions from items.ts
  chance: number;          // flat independent roll per boss kill (0–1)
  dungeons?: string[];     // undefined = any boss; otherwise only these dungeon IDs
  minLevel?: number;       // player level gate
  classId?: ClassId;       // class-restricted drops
}
```

`App.tsx` iterates the table on every boss kill — each entry rolls independently.

**Adding a new unique — checklist:**
1. `types.ts` — add `myItem?: boolean` to `Item`
2. `items.ts` — write `generateMyItem(): Item` with hardcoded affixes using `randInt(min, max)`
3. `character.ts` — add field to `DerivedStats`, derive it from the boolean flag in `getDerivedStats()`
4. `combat.ts` — implement the gameplay effect (follow existing unique blocks as pattern)
5. `ItemTooltip.tsx` — add effect text line in `UniqueEffectLines`
6. `drops.ts` — add entry to `UNIQUE_DROP_TABLE`
7. Ask the user to test in-browser (browser automation is not reliable in this environment)

### Ability `canMiss` flag

All abilities have a 2% `ALWAYS_MISS_CHANCE`. Set `canMiss: false` on an ability to bypass it. Currently Fire Trap and Golem Defense use this.

### Necromancer abilities and passives

**Poison Cloud** (`kind: "dot"`, magic): DoT ability — initial hit + 3 poison ticks. `power: 1.4`, `magic: true`.

**Golem Defense** (`kind: "golem"`, `canMiss: false`): Summons a stone golem that absorbs 20% of all incoming damage (physical + spell) for 3 turns, then detonates on the enemy for total absorbed damage. Can crit on detonation.
- BattleState fields: `golemRounds: number` (countdown), `golemAbsorbed: number` (damage absorbed so far)
- Shown on the battlefield like the Assassin's Fire Trap — SVG with countdown badge
- `canUseAbility2` blocks re-summoning while `golemRounds > 0`
- Detonation fires after monster attacks on the turn the counter hits 0

**Soul Siphon** (always active): All magic damage heals 15% of damage dealt — applies to Poison Cloud's initial hit AND every poison tick. Constant: `NECROMANCER_SOUL_SIPHON = 0.15`.

**Virulence** (lv.20): DoT deals 25% increased damage. Applied as `virulenceMult = 1.25` multiplied into `poisonDamage` at cast time. Constant: `NECROMANCER_VIRULENCE_MULT = 1.25`.

**Blood Barrier** (lv.35): Soul Siphon heals can exceed max life by up to 25% (heal cap: `stats.maxLife * 1.25`). Does NOT apply to health potions. Overheal is shown as a blue glow on the HP bar (scales with overheal fraction 0–25%) and a `+X` badge next to the HP number (class `overheal-badge`).

### Amazon passives (3-passive system)

| Passive | Level | Effect |
|---|---|---|
| Dodge | 1 | 15% chance to dodge any attack or spell |
| Find Weakness | 20 | +15% crit chance |
| Heartseeker | 35 | After a crit, fire a 50%-damage follow-up arrow (cannot crit) |

Heartseeker fires after crits from both basic attack and each Multishot arrow.

### Assassin Fire Trap

- Placed on ability use → `trapRounds = 3`
- Decrements each turn during the monster phase
- Detonates after monster acts on the turn it hits 0
- Damage: `dexterity × 2.5`, can crit
- `canMiss: false` — always places successfully

### Passive system in types

`ClassDefinition` supports:
- `passive` — always active
- `passive2?: { levelRequirement: number }` — unlocks at given level
- `passive3?: { levelRequirement: number }` — unlocks at given level

Amazon and Necromancer both use passive3. All classes can be extended to use it.

---

## Sprites

### CharacterSprite system (V2)

SVG sprites in a `64×96` viewBox with `overflow="visible"` (weapons extend outside).

```
src/components/sprites/
  CharacterSprite.tsx        pure assembler — no SVG art inside
  shared/
    colors.ts                CLASS_COLORS, UNIQUE_COLOR, BODY_FILL
    sharedTypes.ts           SpriteState, ClassSpriteModule interface
  classes/
    barbarian.tsx            all bezier paths
    necromancer.tsx
    sorceress.tsx
    amazon.tsx
    paladin.tsx
    assassin.tsx
    druid.tsx
  weapons/
    axe.tsx                  parametric Axe component
    staff.tsx                StaffShaft, OrbHead, ScytheBlade, TotemHead
    bow.tsx                  Bow component
    claws.tsx                Claws component
    mace.tsx                 Mace component
```

Each class file exports three **named** functions (import style is `import * as barbarian`):
- `body(): ReactNode` — body silhouette, uses `currentColor` / parent group fill
- `weapon(color: string): ReactNode` — normal weapon
- `uniqueWeapon(color: string): ReactNode` — very rare / unique weapon

`CharacterSprite.tsx` re-exports `CLASS_COLORS` and `SpriteState` for API compatibility.

**Design language (V2):** bold filled paths, colored stroke with drop-shadow glow, `overflow="visible"` for weapons. No `rect`/`polygon` for body shapes — bezier curves only.

**Barbarian weapons render BEFORE body** (axes behind character). All other classes render weapons AFTER body.

**XP cap per dungeon:** `getXpCapLevel(clearedDungeons, currentDungeonId)` returns `currentDungeon.boss.level + 5`.

### MonsterSprite (`src/components/sprites/MonsterSprite.tsx`)

Monsters map by name to a `type` key in `MONSTER_TYPES`. Each type has:
- A sprite shape in `SPRITES`
- A color in `MONSTER_COLORS`
- An animation style in `TYPE_ANIM` (`float | sway | stomp | skitter | pulse | lurch`)

All Act 1 and Act 2 monsters have unique sprites. New monsters need entries in all three records.

---

## Style conventions

- No comments unless the WHY is non-obvious
- No unused variables — TypeScript strict mode will catch them
- CSS class names use kebab-case matching the component name (e.g. `.combat-screen`, `.flee-modal`)
- All new overlay/modal elements need `position: relative` on their parent container
- Dark theme only — all colors are hardcoded dark palette values in App.css
- Mobile responsive breakpoint at `@media (max-width: 600px)` at the bottom of App.css:
  - Hub sidebar collapses to a horizontal top bar (sprite shrinks, tabs go horizontal)
  - `derived-grid` switches from 3-col to 2-col
  - Padding reduced to 12px

### Item tooltip system

**Never use `position: absolute` for inventory/shop tooltips** — `.hub-content` has `overflow-y: auto` which also clips horizontal overflow, cutting off any absolute-positioned child that goes outside the scroll container.

Instead use `useItemHover` hook (`src/components/useItemHover.ts`):
- Tracks hovered item + its `DOMRect` via `onMouseEnter`/`onMouseLeave`
- Returns `tooltipStyle()` → `position: fixed`, tooltip to the **right** of the cell
- Returns `compareStyle()` → `position: fixed`, compare panel to the **left** of the cell
- Both use `z-index: 9999` so they always render above everything

**Paperdoll equipped items** (`.slot-item`) use plain CSS absolute positioning — they live inside the paperdoll which is not scroll-clipped, so no hook needed.

### Affix display order (tooltips)

`sortAffixes()` in `ItemTooltip.tsx` controls display order:
```
defense → damage → magicDamage → strength → dexterity → vitality → energy → (rest)
```
This is render-only — it never mutates the stored `item.affixes` array.

### Drop banner

Auto-dismisses after **3 seconds** via `setTimeout` in Hub's `useEffect`. Unique item drops also play `divine_drop.mp3` at volume 0.3. Asset path must use `import.meta.env.BASE_URL` prefix (Vite base is `/dungeoneers/`).
