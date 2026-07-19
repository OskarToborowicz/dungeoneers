# Monster silhouette art

Drop `<type>.svg` here and `MonsterSprite` renders it automatically — no code
change. The registry (`src/components/sprites/monsterAssets.ts`) globs this
folder at build time.

**After dropping a raw Inkscape export, run `npm run optimize-svg`.** Inkscape
SVGs are huge (300–500 KB each, mostly coordinate precision + editor metadata);
SVGO slims them ~60% with no visible change. The script only touches files that
still carry Inkscape/sodipodi metadata, so already-optimized art is left
untouched — safe to run any time.

## Filename = monster **type**, not monster name

Types are the values of `MONSTER_TYPES` in `src/components/sprites/MonsterSprite.tsx`.
Several monsters share one type on purpose — `Fallen One`, `Devilkin`, and
`Dark One` all map to `fallen`, so `fallen.svg` backs all three.

```
src/assets/monsters/
  fallen.svg        ← Fallen One, Devilkin, Dark One
  boss_rat.svg      ← The Rat King
  zombie.svg        ← Zombie, Drowned Corpse
```

Any type without a file keeps using its inline paths in `SPRITES`. Both styles
can coexist, so the migration can go one monster at a time.

## Art spec

| | |
|---|---|
| Artboard | **1024×1536 — the 2:3 ratio is mandatory.** Never "resize page to drawing". |
| Placement | Position the creature **inside** that artboard exactly as it should appear on screen: standing on the bottom edge, filling the width. Empty space above is normal and correct. |
| Contents | **Silhouette only.** No weapons, no separate layers, no props — one shape. |
| Fill | `#120e0a` |
| Stroke | The type's colour from `MONSTER_COLORS` — **must be baked into the file** (see below) |
| Facing | Draw facing **left, toward the hero** — exactly as it should appear in game. The file is rendered as authored; no mirroring to compensate for. |
| Bleed | Keep art inside the artboard; it is not clipped, but anything outside overlaps the arena |

The legacy inline paths in `SPRITES` are drawn facing right and flipped by a
`scaleX(-1)` on the sprite. Asset files are **not** subject to that flip — it is
cancelled for them in `monsterAssets.ts` — so ignore it and just draw the monster
the way it should look on screen.

## Why the 2:3 artboard is not negotiable

The render box in `monsterAssets.ts` is 2:3. A 2:3 file maps onto it **1:1** —
nothing is scaled to fit, nothing is centred, and the creature appears exactly
where you drew it. Position, size and ground contact all become art decisions you
control directly in Inkscape.

Any other ratio and the browser has to fit a mismatched shape into the box, which
leaves slack it must park somewhere. Worse, an embedded SVG carries its own
`preserveAspectRatio` that composes with the sprite's, so where that slack ends up
is not reliably controllable from code. A wide creature on a tight artboard is the
worst case: it scales down until its **width** fits, then floats with the leftover
height above and below it — looking small and hovering off the floor.

So a wide animal like a rat is drawn **small-looking on the artboard**: touching
the left, right and bottom edges, with the top ~half of the artboard empty. That
empty space is what puts it on the ground at the right size. Do not crop it away.

## Glow — transparent background is mandatory

The glow matches the hero's: two stacked drop-shadows at 6px and 2px in the
type's colour, applied at runtime. Do **not** bake it into the file — it stays in
sync with `MONSTER_COLORS` only if it comes from the runtime.

`drop-shadow` derives the glow from the image's **alpha channel**. With a
transparent background it traces the creature's outline, exactly like the hero.
If the export includes an opaque background rect — Illustrator and Figma both
add one by default — the glow traces **that rectangle** and you get a glowing
box instead of a glowing monster. Check the export has no background layer.

## Why silhouettes only

Class sprites split body/weapon/offhand because gear is swappable and unique
weapons recolour. Monsters have no gear — one shape per type is all the sprite
needs, which is why this folder is flat instead of one directory per monster.
