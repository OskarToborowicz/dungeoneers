import type { ClassId, Item } from "../types";
import {
  generateAegisOfTheFortress,
  generateSpellbladesMask,
  generateApprenticesFocus,
  generateBlooddrinker,
  generateBoneweaveGloves,
  generateCrackedLens,
  generateCrownOfTheFallen,
  generateDeathwhisper,
  generateDemonsTail,
  generateDoomcrier,
  generateEternitysEdge,
  generateEyeOfTheStorm,
  generateHarvester,
  generateHeavyStompers,
  generateIronjaw,
  generateJusticar,
  generateMaskOfMidnight,
  generateMaskOfTwilight,
  generateMirrorRing,
  generatePeasantHood,
  generatePentagram,
  generateRagpickersSash,
  generateReapersHood,
  generateSanctifier,
  generateShadowfang,
  generateSharpFangs,
  generateStoneHusk,
  generateStormstring,
  generateTheArcanist,
  generateThornback,
  generateVenomweaveWrap,
  generateWhisper,
  generateWorldbreaker,
} from "./items";

export interface UniqueDropEntry {
  generator: () => Item;
  chance: number;
  /** undefined = any boss dungeon */
  dungeons?: string[];
  minLevel?: number;
  classId?: ClassId;
}

const ACT1_DUNGEONS = ["sewers", "dark-forest", "cave", "foggy-fields", "graveyard", "crypt", "goblins-path", "bandit-town", "bandits-town-hall"];
const ACT2_DUNGEONS = ["frostfang-pass", "icy-cave", "tundra", "moonglass-lake", "whispering-glacier", "crystal-labyrinth", "frostforge", "summit-peak", "the-white-maw"];
const ACT3_DUNGEONS = ["overgrown-entrance", "serpent-marsh", "whispering-river", "village-lost-souls", "bloodvine-jungle", "temple-forgotten-gods", "heart-of-the-jungle", "black-ziggurat", "sacrificial-altar"];

export const UNIQUE_DROP_TABLE: UniqueDropEntry[] = [
  // ── Test drop ─────────────────────────────────────────────────────────────────
  { generator: generateSpellbladesMask, chance: 0.0025, dungeons: ["bandit-town", "bandits-town-hall", ...ACT2_DUNGEONS] },

  // ── Any-boss globals ──────────────────────────────────────────────────────────
  { generator: generateRagpickersSash,   chance: 0.0025 },
  { generator: generateHeavyStompers,    chance: 0.005 },
  { generator: generateCrackedLens,      chance: 0.0025, minLevel: 5 },
  { generator: generateSharpFangs,       chance: 0.002,  minLevel: 15 },
  { generator: generateThornback,        chance: 0.0025, minLevel: 12 },
  { generator: generateEyeOfTheStorm,    chance: 0.0025, minLevel: 18 },
  { generator: generateBoneweaveGloves,  chance: 0.0025, minLevel: 20 },
  { generator: generateMaskOfMidnight,   chance: 0.0025, minLevel: 25 },
  { generator: generateMaskOfTwilight,   chance: 0.0025, minLevel: 25 },
  { generator: generateStoneHusk,        chance: 0.005,  minLevel: 25 },
  { generator: generateAegisOfTheFortress, chance: 0.003, minLevel: 20, classId: "paladin" },
  { generator: generateCrownOfTheFallen, chance: 0.0025, minLevel: 45 },

  // ── Act 1 ─────────────────────────────────────────────────────────────────────
  { generator: generatePeasantHood,      chance: 0.05,   dungeons: ["sewers", "dark-forest"] },
  { generator: generateVenomweaveWrap,   chance: 0.0025, dungeons: ["cave", "foggy-fields", "graveyard"], minLevel: 15 },
  { generator: generateMirrorRing,       chance: 0.01,   dungeons: ["bandits-town-hall"] },

  // ── Act 2 ─────────────────────────────────────────────────────────────────────
  { generator: generateDemonsTail,       chance: 0.0025, dungeons: ACT2_DUNGEONS },
  // ── Act 3 ─────────────────────────────────────────────────────────────────────
  // (placeholder — future uniques can reference ACT3_DUNGEONS)
  { generator: generateReapersHood,      chance: 0.002,  dungeons: ACT3_DUNGEONS, minLevel: 60 },
  { generator: generatePentagram,        chance: 0.005,  dungeons: ACT2_DUNGEONS },
  { generator: generateReapersHood,      chance: 0.005,  dungeons: ["the-white-maw"] },
  { generator: generateHarvester,        chance: 0.06,   dungeons: ["the-white-maw"], classId: "necromancer" },

  // ── Class weapons ─────────────────────────────────────────────────────────────
  { generator: generateJusticar,         chance: 0.0015, classId: "paladin",    minLevel: 28 },
  { generator: generateSanctifier,       chance: 0.0015, classId: "paladin",    minLevel: 50 },

  { generator: generateBlooddrinker,     chance: 0.0015, classId: "barbarian",  minLevel: 10 },
  { generator: generateIronjaw,          chance: 0.0015, classId: "barbarian",  minLevel: 28 },
  { generator: generateWorldbreaker,     chance: 0.0015, classId: "barbarian",  minLevel: 50 },

  { generator: generateWhisper,          chance: 0.0015, classId: "amazon",     minLevel: 8 },
  { generator: generateStormstring,      chance: 0.0015, classId: "amazon",     minLevel: 28 },
  { generator: generateDoomcrier,        chance: 0.0015, classId: "amazon",     minLevel: 50 },

  { generator: generateApprenticesFocus, chance: 0.002,  classId: "sorceress",  dungeons: ACT1_DUNGEONS },
  { generator: generateTheArcanist,      chance: 0.001,  classId: "sorceress",  dungeons: ["bandits-town-hall", ...ACT2_DUNGEONS.slice(0, 4)] },
  { generator: generateEternitysEdge,    chance: 0.001,  classId: "sorceress",  dungeons: ACT2_DUNGEONS.slice(3) },

  { generator: generateShadowfang,       chance: 0.002,  classId: "assassin",   dungeons: ["bandits-town-hall", ...ACT2_DUNGEONS.slice(0, 4)] },
  { generator: generateDeathwhisper,     chance: 0.002,  classId: "assassin",   dungeons: ACT2_DUNGEONS.slice(3) },
];
