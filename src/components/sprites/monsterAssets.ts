// Monster silhouette art, auto-discovered from src/assets/monsters/.
// Drop `<type>.svg` in that folder and MonsterSprite picks it up — no code
// change needed. `<type>` must match a value in MONSTER_TYPES (MonsterSprite.tsx),
// e.g. "boss_rat.svg" backs every monster mapped to the "boss_rat" type.
// Types with no file fall back to the inline paths in SPRITES.
const files = import.meta.glob<string>("../../assets/monsters/*.svg", {
  eager: true,
  import: "default",
});

export const MONSTER_ASSETS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -".svg".length),
    url,
  ]),
);

// This box MUST keep the 2:3 aspect of the spec'd artboard (96/144 = 0.667, same
// as the 64×96 viewBox). Match the file's aspect and there is no letterboxing at
// all: the art maps 1:1 and lands exactly where it was drawn, so placement is an
// art decision, not a code one. Break the aspect and the browser has to park the
// slack somewhere — and an embedded <svg> brings its own preserveAspectRatio that
// composes with the one below, so where the slack goes is not reliably ours to
// pick. Slightly larger than the viewBox (the <svg> is overflow="visible") purely
// so monsters read bigger.
//
// Two invariants when touching these numbers:
//   - centred on x=32 (-16 + 96/2), or the mirror transform below stops lining up
//   - bottom edge at y=96 (-48 + 144), the arena floor
//
// This is a ceiling, not a size: because the mapping is 1:1, each monster's size
// is decided by how much of its artboard it fills. A rat occupies the bottom
// third and stays small; a boss drawn edge to edge fills all of this and towers.
//
// xMidYMax is a no-op for spec-compliant 2:3 art. It is kept as a safety net so
// an off-spec file at least keeps its feet on the floor instead of floating.
//
// The <svg> carries a CSS scaleX(-1) that mirrors the legacy inline paths (they
// are drawn facing right). Asset art is drawn facing LEFT, already toward the
// hero, so this transform cancels that mirror within the 64-wide box: the double
// flip renders the file exactly as authored. Removing it would turn every
// asset-backed monster around to face away from the player.
export const MONSTER_IMG = {
  x: -16,
  y: -48,
  width: 96,
  height: 144,
  preserveAspectRatio: "xMidYMax meet",
  transform: "translate(64,0) scale(-1,1)",
} as const;
