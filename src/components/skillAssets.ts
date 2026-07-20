// Per-class skill art, auto-discovered from src/assets/skills/<class>/<slot>/.
// Drop `<name>.svg` into a slot folder and it is picked up — no code change.
//
// Layout:  src/assets/skills/<folder>/<slot>/<name>.svg
//   <folder> — class folder name (note: the Amazon class uses "huntress",
//              matching src/assets/classes/); see FOLDER_FOR below.
//   <slot>   — "attack" | "ability_1" | "ability_2"
//   <name>   — free-form (e.g. "frost_bolt_projectile", "frost_bolt_impact");
//              a slot may hold several SVGs (projectile + impact + charge …).
//
// Run `npm run optimize-svg` after adding a file — it slims raw Inkscape
// exports in place (and warns if one still embeds a raster bitmap).
import type { ClassId } from "../game/types";

export type SkillSlot = "attack" | "ability_1" | "ability_2";

// classId → asset folder name. Only the Amazon differs (folder "huntress").
const FOLDER_FOR: Record<ClassId, string> = {
  barbarian: "barbarian",
  necromancer: "necromancer",
  sorceress: "sorceress",
  amazon: "huntress",
  paladin: "paladin",
  druid: "druid",
  assassin: "assassin",
  monk: "monk",
};

const files = import.meta.glob<string>("../assets/skills/*/*/*.svg", {
  eager: true,
  import: "default",
});

// key: "<folder>/<slot>/<name>" → url
const SKILL_ASSETS: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/skills\/([^/]+)\/([^/]+)\/([^/]+)\.svg$/);
  if (m) SKILL_ASSETS[`${m[1]}/${m[2]}/${m[3]}`] = url;
}

// All SVGs in a class's slot, in filename order. Empty if none authored yet.
export function skillAssets(
  classId: ClassId,
  slot: SkillSlot,
): { name: string; url: string }[] {
  const prefix = `${FOLDER_FOR[classId]}/${slot}/`;
  return Object.entries(SKILL_ASSETS)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, url]) => ({ name: key.slice(prefix.length), url }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// A single named SVG (or the first in the slot if `name` is omitted).
export function skillAsset(
  classId: ClassId,
  slot: SkillSlot,
  name?: string,
): string | undefined {
  if (name) return SKILL_ASSETS[`${FOLDER_FOR[classId]}/${slot}/${name}`];
  return skillAssets(classId, slot)[0]?.url;
}
