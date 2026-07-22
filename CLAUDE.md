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

Balance sim: `npm run sim` (`scripts/balance-sim.mts`, run via `tsx`). Headless —
plays any class through the real combat engine (`resolveRound`) across the whole
dungeon table, many trials each, reports clear-rate + avg ending life per dungeon.
Flags: `--class=<id|all>`, `--gear=start|rare` (rare = 3-affix rares at ilvl =
boss level), `--act=1..4|all`, `--runs=N`, `--verbose`. The AI is a per-class
heuristic (emergency potion → situational ability2 → main ability → attack), not
optimal play — trust *relative* comparisons more than absolute clear-rates, since
a weak class could reflect a weak policy rather than weak tuning. Sustain classes
(Paladin, Monk) fire their healing regardless of policy, so their edge is real.

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
| `src/styles/*.css` | One file per section (e.g. `combat-screen.css`, `responsive-mobile.css`, `responsive-hub-landscape.css`, `responsive-gameover-landscape.css`). **Import order in `App.css` is load-bearing** — several responsive rules rely on later-in-cascade wins between equal-specificity selectors across files (e.g. `responsive-tablet-touch.css` must stay after `responsive-hub-landscape.css`). Adding a new file requires adding its `@import` line in the correct position, not just alphabetically. |
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

### Game modes (Hardcore / Softcore)

`Character.mode: "hardcore" | "softcore"` (chosen at creation, fixed for life). Saves from before this field default to `"hardcore"` via `migrateSlot()` in `storage.ts` (runs on every read; persists on next auto-save). Death handling lives in `handleFightFinished`'s `!result.victory` branch in `App.tsx`:
- **Hardcore** — permadeath: `deleteSave`, wipe state, show `GameOverScreen`.
- **Softcore** — no summary screen: lose all gold + all current-level XP (both set to 0; level never drops since `character.xp` is progress within the level), keep gear, drop straight back to hub. Fleeing needs no Escape Token but costs 30% gold (`handleEscape` + the flee button branch on `character.mode`).

`GameOverScreen` is **hardcore-only** now — softcore never reaches it.

### Clear Again

After a boss clear the victory screen shows a **Clear Again** button (gated on `isBossFight`, passed from `App` as `dungeonRun.index === queue.length - 1`). It calls `onFinished(result, /*clearAgain*/ true)`. In `App`, the boss-victory branch banks rewards as usual, then sets `pendingRestart = dungeonId` + `setDungeonRun(null)` instead of returning to the hub. A **`useLayoutEffect`** watches `pendingRestart` and calls `handleStartDungeon(id)` — deferred so the fresh run's save is written *after* the reward state commits (avoids stale saves), and pre-paint so the hub never flashes. **`onClick` must be `() => handleContinue()`**, not `handleContinue` — the bare ref passes the event as the `clearAgain` arg (truthy).

To inject a test save in the browser console:
```js
const saves = JSON.parse(localStorage.getItem('diabolo-saves') || '[]');
saves.push({ id: '99', lastPlayedAt: Date.now(), save: { character: { name: 'TestGod', classId: 'amazon', mode: 'hardcore', level: 50, xp: 0, gold: 99999, unspentStatPoints: 0, allocatedStats: { strength: 50, dexterity: 50, vitality: 50, energy: 50 }, abilityCooldown: 0, escapeTokens: 99, runStats: { damageDealt: 0, goldEarned: 0, kills: 0 } }, equipment: {}, inventory: [], clearedDungeons: ['sewers','dark-forest','cave','foggy-fields','graveyard','crypt','goblins-path','bandit-town','bandits-town-hall'], consumables: { healthPotion: 99, manaPotion: 99 }, shopStock: [] } });
localStorage.setItem('diabolo-saves', JSON.stringify(saves));
location.reload();
```

To clear all saves: `localStorage.clear(); location.reload();`

---

## Game Systems

### Acts

Four acts, each **8 regular dungeons + 1 endgame dungeon**. The endgame unlocks
after all 8 regulars in that act are cleared; clearing it opens the next act.
`DungeonDefinition.act` (1–4) drives the act tabs in `DungeonsTab`.

| Act | Name | Endgame dungeon (id) | Endgame boss |
|---|---|---|---|
| 1 | The Road Out | Bandit's Town Hall (`bandits-town-hall`) | Bandit Chieftain |
| 2 | The Frozen Peaks | The White Maw (`the-white-maw`) | Sikktharkk |
| 3 | The Jungle Depths | Sacrificial Altar (`sacrificial-altar`) | Zam'Koro |
| 4 | Realm of Endless Night | Throne of Endless Night (`throne-of-endless-night`) | Reltih |

Act 1 dungeon ids in order: `sewers`, `dark-forest`, `cave`, `foggy-fields`,
`graveyard`, `crypt`, `goblins-path`, `bandit-town`, `bandits-town-hall`.
See `src/game/data/dungeons.ts` for the full list — **README.md has the
authoritative per-dungeon table** (monster levels + bosses for all four acts).

### Combat flow (per turn)

1. Player action (attack / ability / potion / flee)
2. Trap countdown (`trapRounds -= 1`)
3. Monster spell or normal attack
4. Trap detonation (when `trapRounds` hits 0)
5. Player DoT ticks (poison / burn)
6. Monster burn stacks tick (`burnStacks[]` — each stack independent)

### DoT stacks (`burnStacks`)

`BattleState.burnStacks` is `{ rounds: number; damage: number; source: string; kind: "burn" | "poison" | "bleed" }[]` — a **generic stacking-DoT system**, not just fire. Each source pushes its own independent entry. Every turn each active stack ticks, deals its damage, decrements rounds, then expired stacks are filtered out. The tick log verb and the status-pill icon/color derive from `kind` (burn 🔥 orange, poison ☠ green, bleed 🩸 red). Sources: `Demon's Tail` (burn, via `tryIgnite`), `Vine Whip` (bleed), `Nature's Wrath` (poison). `burnStacks` is transient (not serialized in the save), so the shape is safe to extend.

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

**Golem Defense** (`kind: "golem"`, `canMiss: false`): Summons a stone golem for 3 turns and stuns the enemy for 1 turn on cast. While the golem is up, **30% of all incoming damage (physical + spell) is reflected back at the enemy** — the player takes only the remaining 70%. There is no detonation.
- BattleState fields: `golemRounds: number` (countdown), `stunnedRounds: number` (set to 1 on cast)
- Shown on the battlefield like the Assassin's Fire Trap — SVG with countdown badge
- `canUseAbility2` blocks re-summoning while `golemRounds > 0`

**Soul Siphon** (always active): All magic damage heals 15% of damage dealt — applies to Poison Cloud's initial hit AND every poison tick. Constant: `NECROMANCER_SOUL_SIPHON = 0.15`.

**Virulence** (lv.20): DoT deals 25% increased damage. Applied as `virulenceMult = 1.25` multiplied into `poisonDamage` at cast time. Constant: `NECROMANCER_VIRULENCE_MULT = 1.25`.

**Blood Barrier** (lv.35): Soul Siphon heals can exceed max life by up to 25% (heal cap: `stats.maxLife * 1.25`). Does NOT apply to health potions. Overheal is shown as a blue glow on the HP bar (scales with overheal fraction 0–25%) and a `+X` badge next to the HP number (class `overheal-badge`).

### Huntress passives (3-passive system)

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

**Spinning Crane Kick** (`kind: "multi"`, 3 hits, `power: 0.75`): Three rapid kicks, each rolling hit/crit independently. Chi cost: 50, cooldown: 1.

**Serenity** (`kind: "serenity"`, `canMiss: false`): Heals 30% max life, restores 50% max chi, cleanses all player negative effects (poison + burn), and blinds the enemy for this turn only (no disorient follow-up). Chi cost: 75, cooldown: 6.

**Combat Reflexes** (always active): 30% chance after basic attack → follow-up strike at 70% damage. Each Spinning Crane Kick hit also has 30% chance to deal 25% bonus damage of that specific kick (separate roll per kick, min 1 dmg).

**Transcendence** (lv.20): Passively restores 7% of max life per turn. Constant: `MONK_TRANSCENDENCE_REGEN = 0.07`.

**Counter Attack** (lv.35): 12% chance to strike back after the enemy acts, full weapon damage. Fires in step 10b (after `monsterActsThisTurn` block). Constant: `MONK_COUNTER_ATTACK_CHANCE = 0.12`.

**Color**: `#54E396`. **Weapon**: Katar (non-two-handed, monk only).

### Druid abilities and passives (forest rework)

**Vine Whip** (`kind: "vine_whip"`, ability 1): physical, can crit. `weaponDmg × 1.2 + Dex × 1.0`. **35%** chance on hit to apply a `bleed` DoT stack (15% of the hit/turn, 3 turns). Triggers Lifebloom.

**Grove** (`kind: "bark_wall"`, `canMiss: false`, ability 2 — display name "Grove", internal id stays `bark_wall`/`barkWallRounds`): sets `barkWallRounds = 2`. While > 0, the **entire monster action is short-circuited** — an early branch in the monster-acts block logs "The Grove blocks…" and skips all attack/spell resolution, so no damage and no status gets through. Decrements in the Step 11 duration block next to `frostShieldRounds`. Can't recast while active. Rendered on the battlefield as a standing model (like the golem) gated on `barkWallRounds > 0` in `CombatScreen`.

**Bramble** (passive, lv1): every basic attack does `thornStacks += 1`; at 3 it resets to 0 and erupts for `round(0.5 × vineWhipDamage())` pure physical (shares the `vineWhipDamage()` helper; `DRUID_VINE_WHIP_POWER` must match `ability.power` in classes.ts). `thornStacks` is a plain 0–3 counter, **not** a DoT.

**Lifebloom** (passive2, lv20): direct hits (basic attack + Vine Whip) heal 8% of damage dealt. Explicitly **not** on DoT ticks.

**Nature's Wrath** (passive3, lv35): every basic attack pushes an independent `poison` DoT stack (20% of the hit/turn, 3 turns) into `burnStacks`. Separate from Bramble.

The druid hooks (Lifebloom, Bramble, Nature's Wrath) live in `doBasicAttack` after the landed-hit block, gated on `character.classId === "druid"`. **Thick Hide is gone** — its Dex-based physical reduction was removed from the monster-attack branch.

### Passive system in types

`ClassDefinition` supports:
- `passive` — always active
- `passive2?: { levelRequirement: number }` — unlocks at given level
- `passive3?: { levelRequirement: number }` — unlocks at given level

Huntress, Necromancer, Monk, and Druid all use passive3. All classes can be extended to use it.

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

### Sprite motion and status effects

`getAnimate()` / `getTransition()` in `CharacterSprite.tsx` take `classId`.
`RECOIL_ATTACK_CLASSES` (`amazon`, `sorceress`, `necromancer`) get a backwards
recoil `x: [0, -8*scale, 0]` on the `attack` state instead of the default
forward hop `y: [0, -12*scale, 5*scale, 0]`. Character sprites face right (only
`MonsterSprite` has `scaleX(-1)`), so backwards is **negative x**.

Both `CharacterSprite` and `MonsterSprite` accept `statusEffects?: Array<"poison" | "burn">`
and render identically — burn aura (`.status-aura-burn` ellipse) then poison
bubbles (`.poisoned` circles), **both after the model so they draw on top**.
Wired in `CombatScreen`: player from `playerPoisonRounds` / `playerBurnRounds`,
monster from `poisonRounds` / `burnStacks.length`.

**Potion bubbles:** drinking sets `potionFx: { type: "health" | "mana"; key: number }`
in `CombatScreen`; the `key` counter forces a remount so the animation replays.
Rendered as `.potion-bubbles` inside `.battle-side.player-side` (which needs
`position: relative`). Potions must **not** set `playerAnim("attack")` — guard
all three branches (normal / victory / defeat) with `isPotion`, since a poison
tick can kill the monster and the monster can kill the player on a drink turn.

### MonsterSprite (`src/components/sprites/MonsterSprite.tsx`)

Monsters map by name to a `type` key in `MONSTER_TYPES`. Several monsters share
one type on purpose (`Fallen One`, `Devilkin`, `Dark One` → `fallen`). Each type has:
- A color in `MONSTER_COLORS`
- An animation style in `TYPE_ANIM` (`float | sway | stomp | skitter | pulse | lurch`)
- Art: either a silhouette SVG file (preferred) **or** inline paths in `SPRITES`

**Monster art assets.** `src/components/sprites/monsterAssets.ts` globs
`src/assets/monsters/*.svg` eagerly at build time and keys them by filename.
Dropping `<type>.svg` into that folder makes `MonsterSprite` render it as an
`<image>` — **no code change**. Types without a file fall back to `SPRITES`, so
both styles coexist and migration can go one monster at a time.

Unlike class sprites, monster art is **one flat file per type — silhouette only,
no body/weapon/offhand split**, because monsters have no gear. Art spec (artboard
1024×1536, fill `#120e0a`, transparent background, no baked glow) lives in
`src/assets/monsters/README.md`.

**Facing:** inline `SPRITES` art is drawn facing right and mirrored by the
`scaleX(-1)` on the `<svg>`. Asset art is drawn **facing left, toward the hero**,
so `MONSTER_IMG` carries `transform="translate(64,0) scale(-1,1)"` to cancel that
mirror — the double flip renders the file as authored. Do not "simplify" it away.

The `<image>` renders inside the same `motion.g` as inline art, so `fill`/`stroke`
on that group are ignored but the `drop-shadow` glow from `MONSTER_COLORS` still
applies — which is why the glow must not be baked into the file.

Adding a monster with inline art still needs entries in all three records.

---

## Style conventions

- No comments unless the WHY is non-obvious
- No unused variables — TypeScript strict mode will catch them
- CSS class names use kebab-case matching the component name (e.g. `.combat-screen`, `.flee-modal`)
- All new overlay/modal elements need `position: relative` on their parent container
- Dark theme only — all colors are hardcoded dark palette values in `src/styles/*.css`
- **Viewport height on mobile: use `var(--app-vh, <fallback>)`, never bare `100dvh`/`100svh`.** `main.tsx` keeps `--app-vh` synced to `visualViewport.height` (skipped while pinch-zoomed) — iOS Safari's dvh/svh units ignore the landscape tab bar and report a too-tall viewport, cutting off the bottom of the game. Used by `#root` height-locks in `index.css` and `.combat-screen` in `responsive-combat-landscape.css`.
- `src/index.css` height-lock uses two separate media queries:
  - `@media (max-width: 768px)` → `#root { overflow: hidden }` — portrait mobile, no scroll
  - `@media (orientation: landscape) and (max-height: 500px) and (max-width: 960px)` → `#root { overflow-y: auto }` — landscape, allows character select to scroll while hub manages its own overflow internally
- Mobile responsive breakpoint at `@media (max-width: 768px)` in `src/styles/responsive-mobile.css`:
  - Hub sidebar collapses to a horizontal top bar (sprite shrinks, tabs go horizontal)
  - `derived-grid` switches from 3-col to 2-col
  - Padding reduced to 12px
  - `.reset-button` (desktop sidebar) hidden; `.mobile-menu-button` (top-right) shown instead with inline "Exit? Yes/No" confirm — button uses a custom SVG arrow icon (13×13px, `fillRule="nonzero"`)
  - Combat log uses `flex: 1; min-height: 0; height: auto` so action buttons are never cut off on short screens (iPhone SE 375×667)
  - Inventory tab: page is scroll-locked (`.hub-content:has(.inventory-wrapper) { overflow: hidden }`); only `.inventory-dropzone` (the item grid) scrolls — paperdoll + stats stay fixed above it, same containment pattern as landscape
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
- Heights are measured via `scrollHeight` (never `offsetHeight` — it gets clamped by the previous item's `maxHeight` and locks the measurement)
- Three layout modes: side-by-side (desktop), stacked tooltip-over-compare (portrait phones / fallback, shared `stackedLayout()` math so they can't overlap), and a horizontal centered strip `[compare panels][tooltip]` on short viewports (`innerHeight <= 500` — must match the `@media (max-height: 500px)` rule in `shared-ui.css` that flips `.compare-group` to `flex-direction: row`)
- In `InventoryTab`, tap-selecting an item **pins** its tooltip for the whole selection; hover events are suppressed while a selection is active and every branch that ends the selection calls `clearHover()`
- On touch devices (`hover: none`) the hook ignores synthetic `mouseenter`/`mouseleave` entirely — tooltips open only via the tap/click path (`showTooltip`). Touch browsers fire mouseenter *before* click, so the hover tooltip used to cover mid-screen cells and swallow the click; every tab's item cells must therefore have an `onClick` that calls `showTooltip`

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

**Result button:** on victory/defeat `.combat-actions` is not rendered, so the
`flee` grid area is free. `.combat-result-actions` (a direct child of
`.combat-screen`, `display: none` by default) takes `grid-area: flee` +
`align-self: end` in landscape, putting Continue at the bottom-right where the
thumb is. The button is **duplicated in JSX** — the copy inside `.combat-result`
is hidden in landscape. Changing its label or `onClick` means editing both.

**Game over screen:** `responsive-gameover-landscape.css` shrinks the whole
death screen (title 44→22px, sprite 90→40px via `!important` on `svg`, tighter
stat rows) so it fits ~430px without scrolling. Nothing is hidden.

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

### Inventory drag-and-drop on touch

`InventoryTab` uses **`MouseSensor` + `TouchSensor`, never `PointerSensor`**. On
touch devices both a pointer and a touch sensor fire; `PointerSensor` wins after
8px of movement and hijacks the scroll gesture, so every attempt to scroll the
grid started a drag instead. `TouchSensor` with `delay: 250` handles touch alone.

Drag handles use `touchAction: "pan-y"`, **not `"none"`**. The handle covers the
whole cell, so `none` blocks vertical scrolling anywhere the finger lands on an
item — which is the entire grid.

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

**All FX are `motion`-driven.** Every effect declares its timeline inline
(`initial`/`animate`/`transition`) on the element — there are **no CSS keyframes
or `.ae-*` classes** anymore (they were all removed; only the two inline SVG
filter ids `ae-barb-glow` / `ae-pal-glow` remain, defined in-component). The
overlay unmounts after 1200ms (`onDone`), so every timeline must finish by then.

**Basic attack animation system:** `ATTACK_EFFECT_CLASSES` (exported `Set<ClassId>`) controls which classes show an attack animation — currently `amazon`, `paladin`, `barbarian`, `druid`. `CombatScreen` imports and checks it — adding a new class requires only editing `AbilityEffect.tsx`:
1. Add classId to `ATTACK_EFFECT_CLASSES`
2. Add `{classId === "newclass" && useAttack && <NewClassFx />}` in the render
3. **Add `&& !useAttack` to that class's existing ability-1 render line** — ability 1 is gated on `!useAbility2` alone, so without this the ability animation also fires on every basic attack
4. Write the component (motion-based)

**SVG coordinate system:** All animations use a `200×120` viewBox. Player sprite center: `cx=32`. Monster sprite center: `cx=168`. Travel distance = 136 SVG units (168−32). `launchX` / `impactX` (measured by `CombatScreen`, defaulting to 32 / 168) map the FX onto the real sprite positions at any arena width; projectiles fly `launchX − impactX` inside a group translated onto the monster.

### Skill art assets (per-class SVG)

Optional hand-painted SVG art for abilities, discovered the same way as monster
art. Loader: `src/components/skillAssets.ts` globs
`src/assets/skills/<folder>/<slot>/<name>.svg` eagerly and keys by
`"<folder>/<slot>/<name>"`.

- `<folder>` — class folder name. **Amazon's folder is `huntress`** (matches
  `src/assets/classes/`); `FOLDER_FOR` maps `ClassId → folder`.
- `<slot>` — `"attack" | "ability_1" | "ability_2"`. A slot may hold several
  SVGs (e.g. `frost_bolt_projectile` + `frost_bolt_impact`).
- API: `skillAsset(classId, slot, name?)` → one URL (first in slot if `name`
  omitted); `skillAssets(classId, slot)` → all `{name, url}` in filename order.

**Color is painted INTO the file.** Skill SVGs are full-color (unlike the
single-fill monster silhouettes) — they render via `<image href>`, which shows
the file's own fills/gradients and **ignores any `fill` on the parent group**.
Code can only add an outer glow (an SVG `drop-shadow` filter in the class color);
it cannot recolor the shape. To theme a shape from code you'd have to inline the
SVG and use `currentColor` instead of `<image>`.

**Usage in `AbilityEffect.tsx`:** load the URL once at module scope
(`const ART = skillAsset(...)`), then render `<image href={ART} …/>` inside the
`motion.g` that drives the motion. Derive height from the file's aspect so it
never distorts (frost bolt is 230:153 → `H = W * 153.03/230`). Always fall back
to the drawn FX when the asset is absent (`ART ? <image…/> : <>…drawn…</>`), so
classes without art still animate. See `FrostBoltFx` for the reference pattern.

**Adding art:** drop `<name>.svg` into the slot folder → run
`npm run optimize-svg` (it now walks `skills/` recursively, slims raw Inkscape
exports, and **warns + skips** any file that embeds a raster bitmap — export as
vector paths, never a placed/traced bitmap) → wire it in the relevant FX via
`skillAsset(...)`.

**`travelDist` is always 136** — DOM measurement was removed because with `xMidYMid meet`, SVG coordinate distance between fixed positions is scale-invariant.

### Paladin starting equipment

`generateStartingEquipment()` in `items.ts` returns `{ weapon, shield }` for Paladin (and `{ weapon }` for all other classes). The shield is a Normal-quality item generated from the first `ARMOR_BASES` entry with `slot === "shield"`.
