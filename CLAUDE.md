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
| `src/game/data/items.ts` | Item generation |
| `src/game/storage.ts` | localStorage read/write (`SaveSlot[]` array — NOT an object) |
| `src/App.tsx` | Root state, routing between screens |
| `src/App.css` | All styles |

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

### Ability `canMiss` flag

All abilities have a 2% `ALWAYS_MISS_CHANCE`. Set `canMiss: false` on an ability to bypass it. Currently only Fire Trap uses this.

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

Currently only Amazon uses passive3. All classes can be extended to use it.

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
