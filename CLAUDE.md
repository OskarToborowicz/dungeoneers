# Diabolo — Claude Code Context

## Project

Browser-based Diablo-style dungeon crawler. React 18 + TypeScript + Vite.
Working directory: `C:\nowy poczatek\diabolo`

Dev server: `npm run dev` (port 5173)
Build check: `npx tsc -b --force` — NOT `npx tsc --noEmit` at the root. The root
`tsconfig.json` is solution-style (`"files": []`, only `references`), so a bare
`tsc --noEmit` type-checks zero files and always exits clean even with real
errors in `src/`. Only `-b` (build mode) actually follows the references to
`tsconfig.app.json` / `tsconfig.node.json` and type-checks the project.

---

## Architecture

### Key source files

| File | Purpose |
|---|---|
| `src/game/types.ts` | All shared types: `ClassDefinition`, `DungeonDefinition`, `SaveGame`, etc. |
| `src/game/combat.ts` | Turn-based combat engine — single `simulateTurn()` export |
| `src/game/character.ts` | Stat derivation, XP/level math |
| `src/game/data/classes.ts` | All 8 class definitions |
| `src/game/data/dungeons.ts` | All dungeon + monster definitions, `getXpCapLevel()` |
| `src/game/data/items.ts` | Item generation — random items + all `generate*` unique functions |
| `src/game/data/drops.ts` | `UNIQUE_DROP_TABLE` — declarative unique drop entries, looped in `App.tsx` on boss kill |
| `src/game/data/gambler.ts` | `rollGambleItem()`, `UNIQUE_POOL`, `CLASS_WEAPON_POOL`, `gamblePrice()` — Gheedon gambling logic |
| `src/components/GamblerTab.tsx` | Gambler UI — 8/9 slot offer cards + inline inventory |
| `src/game/storage.ts` | localStorage read/write (`SaveSlot[]` array — NOT an object) |
| `src/App.tsx` | Root state, routing between screens |
| `src/App.css` | Aggregator only — `@import`s every file in `src/styles/` in cascade order. Never add rules directly here. |
| `src/styles/*.css` | One file per section (e.g. `combat-screen.css`, `responsive-mobile.css`, `responsive-hub-landscape.css`). **Import order in `App.css` is load-bearing** — several responsive rules rely on later-in-cascade wins between equal-specificity selectors across files (e.g. `responsive-tablet-touch.css` must stay after `responsive-hub-landscape.css`). Adding a new file requires adding its `@import` line in the correct position, not just alphabetically. |
| `src/components/useItemHover.ts` | Shared hook for fixed-position item tooltip + compare panel on hover |
| `src/components/ItemTooltip.tsx` | `UniqueEffectLines` — renders unique effect text per boolean flag; `sortAffixes()` — display order |
| `src/components/AbilityEffect.tsx` | Per-class combat animations (ability, ability2, attack, detonation); exports `ATTACK_EFFECT_CLASSES` |

### Component tree

```
App
├── CharacterSelect
├── CharacterCreation
├── Hub
│   ├── CharacterTab
│   ├── InventoryTab
│   ├── ShopTab
│   ├── DungeonsTab
│   └── GamblerTab
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

### Monk abilities and passives

**Spinning Crane Kick** (`kind: "multi"`, 3 hits, `power: 0.45`): Three rapid kicks, each rolling hit/crit independently. Chi cost: 18, cooldown: 1.

**Serenity** (`kind: "serenity"`, `canMiss: false`): Heals 30% max life, restores 50% max chi, cleanses all player negative effects (poison + burn), and blinds the enemy for this turn only (no disorient follow-up). Chi cost: 40, cooldown: 4.

**Combat Reflexes** (always active): 30% chance after basic attack → follow-up strike at 70% damage. Each Spinning Crane Kick hit also has 30% chance to deal 25% bonus damage of that specific kick (separate roll per kick, min 1 dmg).

**Transcendence** (lv.20): Passively restores 7% of max life per turn. Constant: `MONK_TRANSCENDENCE_REGEN = 0.07`.

**Counter Attack** (lv.35): 12% chance to strike back after the enemy acts, full weapon damage. Fires in step 10b (after `monsterActsThisTurn` block). Constant: `MONK_COUNTER_ATTACK_CHANCE = 0.12`.

**Color**: `#54E396`. **Weapon**: Katar (non-two-handed, monk only).

### Passive system in types

`ClassDefinition` supports:
- `passive` — always active
- `passive2?: { levelRequirement: number }` — unlocks at given level
- `passive3?: { levelRequirement: number }` — unlocks at given level

Amazon, Necromancer, and Monk all use passive3. All classes can be extended to use it.

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
    monk.tsx
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
- Dark theme only — all colors are hardcoded dark palette values in `src/styles/*.css`
- `src/index.css` height-lock uses two separate media queries:
  - `@media (max-width: 768px)` → `#root { overflow: hidden }` — portrait mobile, no scroll
  - `@media (orientation: landscape) and (max-height: 500px) and (max-width: 960px)` → `#root { overflow-y: auto }` — landscape, allows character select to scroll while hub manages its own overflow internally
- Mobile responsive breakpoint at `@media (max-width: 768px)` in `src/styles/responsive-mobile.css`:
  - Hub sidebar collapses to a horizontal top bar (sprite shrinks, tabs go horizontal)
  - `derived-grid` switches from 3-col to 2-col
  - Padding reduced to 12px
  - `.reset-button` (desktop sidebar) hidden; `.mobile-menu-button` (top-right) shown instead with inline "Exit? Yes/No" confirm — button uses a custom SVG arrow icon (13×13px, `fillRule="nonzero"`)
  - Combat log uses `flex: 1; min-height: 0; height: auto` so action buttons are never cut off on short screens (iPhone SE 375×667)
  - Shop potion cards: `grid-template-columns: repeat(2, 1fr)` — both cards in one row
- Hub landscape breakpoint at `@media (orientation: landscape) and (max-height: 500px) and (max-width: 960px)`:
  - Sidebar moves to left column (130px wide, vertical)
  - Shop: potions + merchant wares in one flex row; only inventory items scroll
  - Inventory: paperdoll left (**32px** slots — reduced from default), `doll-shield` label uses `font-size: 0` + `::after { content: "OH" }` to fit "OFF HAND" in tight space; inventory-right column fills remaining space with fixed label + scrollable grid + fixed instruction
  - Scroll containment: `.hub-content .tab-panel:has(.inventory-wrapper) { overflow: hidden }` — only inventory tab gets `overflow: hidden`; other tabs (Character, Dungeons) use `overflow-y: auto` so they scroll normally
  - Shop potion cards show compact `.shop-potion-stat` div (`35% HP` / `35% Mana`), hidden by default, shown in landscape
- Character creation landscape breakpoint at `@media (orientation: landscape) and (max-height: 500px)` (`src/styles/responsive-creation-landscape.css`):
  - Title and subtitle hidden; padding reduced
  - Class buttons become a horizontal wrapping row
  - Skills shown as a 3-column grid (`grid-template-columns: repeat(3, 1fr)`) with `-webkit-line-clamp: 3` on descriptions
  - Footer becomes a single row: Back button | name input (flex: 1) | Begin button
- Combat landscape breakpoint at `@media (orientation: landscape) and (max-height: 500px)`:
  - 3-column grid: `140px 1fr 100px` (bars | arena | flee)
  - Flee button: `height: 48px; flex: none`, centered in column — not stretched full height
  - Monster name: wraps (`word-break: break-word`) instead of truncating with ellipsis

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

### Shop potion buttons

`.potion-buy-button` is the base class for potion buy buttons. Two modifiers:
- `.potion-buy-button--health` — red-tinted border/text (`var(--hp-color-bright)`), red glow on hover
- `.potion-buy-button--mana` — blue-tinted border/text (`#4a7fc1`), blue glow on hover

Button text: `"X/5 · Yg"` when under cap, `"Full (5/5)"` when capped.

### Drop banner

Auto-dismisses after **3 seconds** via `setTimeout` in Hub's `useEffect`. Unique item drops also play `divine_drop.mp3` at volume 0.3. Asset path must use `import.meta.env.BASE_URL` prefix (Vite base is `/dungeoneers/`).

### Landscape combat layout

`@media (orientation: landscape) and (max-height: 500px)` activates a 3-column grid on `.combat-screen`:

```
grid-template-areas: "bars middle flee" / "spells middle flee"
grid-template-columns: 140px 1fr 100px
```

Key rules:
- `.combat-middle` switches from `display: contents` → `display: flex; flex-direction: column` — becomes the middle grid cell
- `.combat-actions` → `display: contents` so `.combat-spells` and `.combat-flee` become direct grid children
- `.combat-title` hidden; `.combat-bars .combat-stat-row` hidden; `.landscape-hide` hidden
- `.combat-bars .combat-bar-block:last-child` (monster HP block) hidden — monster HP is shown separately in the flee column via `.landscape-monster-hp` div
- `.landscape-monster-name` and `.landscape-monster-hp` — hidden in portrait, shown in landscape; both live inside the `combat-flee` DOM element

**Bar-number overlay:** `.bar-num` spans are always in the JSX (inside `.hp-bar`/`.resource-bar`). In portrait they are clipped by `overflow: hidden`. In landscape:
```css
.combat-bars .bar-num,
.landscape-monster-hp .bar-num {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
```
The fill stays as a normal-flow block element (not absolute). The bar-num overlays absolutely on top. **Do NOT use `display: flex` on the bar container + `position: absolute` on the fill** — this breaks on iOS Safari with `overflow: hidden`.

### Gheedon the Gambler

`GamblerTab` (tab `"gambler"` in Hub) — mystery item purchases. Slots: 8 base + shield for Paladin. Price: flat 2500g.

`src/game/data/gambler.ts`:
- `rollGambleItem(slot, level, classId, clearedDungeons)` — 2% unique / 35% rare / 63% magic
- `UNIQUE_POOL` — per-slot uniques with `minLevel?` / `clearedAny?` gates matching UNIQUE_DROP_TABLE progression
- `CLASS_WEAPON_POOL` — per-classId weapon uniques; druid/monk absent → fall back to rare
- `generateItemForSlot()` in `items.ts` — creates magic/rare items for a specific slot/class combo

Gamble result shows via existing drop banner (`setDroppedItem`).

### Inventory: item order and sort

New items (drops, gamble, shop buy) are **prepended** — `[item, ...prev]` — so newest always appears first.

Sort button (`.sort-btn`) in `.inventory-label-row` next to "Inventory (N)" label. Calls `onSort` → `handleSortInventory` in `App.tsx` → `sortInventory()` (exported from `InventoryTab.tsx`). Sort order: rarity → ilvl descending → slot. One-time mutation of inventory state; subsequent drops continue prepending.

### Sell Junk

`handleSellJunk` in `App.tsx` filters `inventory` to `rarity === "normal" || rarity === "magic"` and sells them instantly (no confirmation). Wired through `Hub → ShopTab` as `onSellJunk`. The "Sell Junk (N)" button in `ShopTab` only renders when `junkCount > 0`. Favorited items are always skipped.

### Favorite Items

`Item.favorite?: boolean` in `types.ts`. Toggled via `handleToggleFavorite(itemId)` in `App.tsx`, passed as `onToggleFavorite` through `Hub → InventoryTab` and `Hub → ShopTab`.

- `★` button (`.fav-btn`) in the top-left corner of each `.inv-cell` and each `.shop-item-cell`
- Active color: `#E3A454` (gold), inactive: nearly invisible white
- `handleSell` returns early if `item.favorite`; `handleSellAll` and `handleSellJunk` filter out favorites
- Shop panel shows `★ favorite` label (`.fav-locked`) instead of sell button for favorited items

### Combat animation system

All visual effects during combat live in `AbilityEffect.tsx` (SVG-based, rendered inside `.battle-arena`).

**Props:** `classId`, `onDone`, `detonation?`, `useAbility2?`, `useAttack?`, `travelDist?` (default 136 — SVG units from player cx=32 to monster cx=168)

**Rendering conditions:**
- `useAttack=true` → basic attack animation (e.g. `SingleArrowFx` for amazon)
- neither flag → ability 1
- `useAbility2=true` → ability 2
- `detonation=true` → detonation effect (assassin trap only)

**Basic attack animation system:** `ATTACK_EFFECT_CLASSES` (exported `Set<ClassId>`) controls which classes show an attack animation. `CombatScreen` imports and checks it — adding a new class requires only editing `AbilityEffect.tsx`:
1. Add classId to `ATTACK_EFFECT_CLASSES`
2. Add `{classId === "newclass" && useAttack && <NewClassFx />}` in the render
3. Write the component + CSS keyframes

**SVG coordinate system:** All animations use a `200×120` viewBox. Player sprite center: `cx=32`. Monster sprite center: `cx=168`. Travel distance = 136 SVG units (168−32). CSS variable `--travel-dist: 136px` is set on the SVG element; keyframes use `var(--travel-dist, 136px)` for translateX.

**`travelDist` is always 136** — DOM measurement was removed because with `xMidYMid meet`, SVG coordinate distance between fixed positions is scale-invariant.

### Paladin starting equipment

`generateStartingEquipment()` in `items.ts` returns `{ weapon, shield }` for Paladin (and `{ weapon }` for all other classes). The shield is a Normal-quality item generated from the first `ARMOR_BASES` entry with `slot === "shield"`.
