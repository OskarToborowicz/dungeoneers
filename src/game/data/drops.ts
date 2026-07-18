import type { ClassId, Item } from "../types";
import {
  generateTanglewhip,
  generateWorldrootTotem,
  generateVerdantCoil,
  generateThornweaveEffigy,
  generateBloodbriar,
  generateAegisOfTheFortress,
  generatePenitentsGuard,
  generateStoneguard,
  generateHeavensWrath,
  generateSpellbladesMask,
  generateApprenticesFocus,
  generateBlooddrinker,
  generateBoneweaveGloves,
  generateCrackedLens,
  generateCrownOfTheFallen,
  generateDemonsTail,
  generateDoomcrier,
  generateEternitysEdge,
  generateEyeOfTheStorm,
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
  generateGraveToll,
  generateBonechill,
  generateEbonreap,
  generateJadeKnuckles,
  generateStormfist,
  generateRatKingsCoat,
  generateIroncladHauberk,
  generateTheGavel,
  generateVoidgaze,
  generateBastionsRemnant,
  generateBloodfist,
  generateSoulvoidGirdle,
  generateForsakenSigil,
} from "./items";

export interface UniqueDropEntry {
  generator: () => Item;
  chance: number;
  /** undefined = any boss dungeon */
  dungeons?: string[];
  minLevel?: number;
  /** Only checked when dungeons is undefined — location-pinned items always drop from their dungeons */
  maxLevel?: number;
  classId?: ClassId;
}

const ACT1_DUNGEONS = ["sewers", "dark-forest", "cave", "foggy-fields", "graveyard", "crypt", "goblins-path", "bandit-town", "bandits-town-hall"];
const ACT2_DUNGEONS = ["frostfang-pass", "icy-cave", "tundra", "moonglass-lake", "whispering-glacier", "crystal-labyrinth", "frostforge", "summit-peak", "the-white-maw"];
const ACT3_DUNGEONS = ["overgrown-entrance", "serpent-marsh", "whispering-river", "village-lost-souls", "bloodvine-jungle", "temple-forgotten-gods", "heart-of-the-jungle", "black-ziggurat", "sacrificial-altar"];

export const UNIQUE_DROP_TABLE: UniqueDropEntry[] = [
  // ── Test drop ─────────────────────────────────────────────────────────────────
  { generator: generateSpellbladesMask, chance: 0.0025, dungeons: ["bandit-town", "bandits-town-hall", ...ACT2_DUNGEONS] },

  // ── Any-boss globals ──────────────────────────────────────────────────────────
  { generator: generateRagpickersSash,   chance: 0.0025, maxLevel: 30 },
  { generator: generateHeavyStompers,    chance: 0.005,  maxLevel: 35 },
  { generator: generateCrackedLens,      chance: 0.0025, minLevel: 5,  maxLevel: 35 },
  { generator: generateSharpFangs,       chance: 0.002,  minLevel: 15, maxLevel: 45 },
  { generator: generateThornback,        chance: 0.0025, minLevel: 12, maxLevel: 40 },
  { generator: generateEyeOfTheStorm,    chance: 0.0025, minLevel: 18, maxLevel: 50 },
  { generator: generateBoneweaveGloves,  chance: 0.0025, minLevel: 20, maxLevel: 50 },
  { generator: generateMaskOfMidnight,   chance: 0.0025, minLevel: 25, maxLevel: 55 },
  { generator: generateMaskOfTwilight,   chance: 0.0025, minLevel: 25, maxLevel: 55 },
  { generator: generateStoneHusk,        chance: 0.005,  minLevel: 25, maxLevel: 55 },
  { generator: generateAegisOfTheFortress, chance: 0.003, minLevel: 20, maxLevel: 55, classId: "paladin" },
  { generator: generatePenitentsGuard,    chance: 0.002,               maxLevel: 35, classId: "paladin" },
  { generator: generateStoneguard,        chance: 0.002, minLevel: 30, maxLevel: 60, classId: "paladin" },
  { generator: generateHeavensWrath,      chance: 0.002, minLevel: 50,               classId: "paladin" },
  { generator: generateCrownOfTheFallen, chance: 0.0025, minLevel: 45, maxLevel: 75 },

  // ── Act 1 ─────────────────────────────────────────────────────────────────────
  { generator: generatePeasantHood,      chance: 0.015,  dungeons: ["sewers", "dark-forest"] },
  { generator: generateRatKingsCoat,    chance: 0.02,   dungeons: ["sewers"] },
  { generator: generateVenomweaveWrap,   chance: 0.0025, dungeons: ["cave", "foggy-fields", "graveyard"], minLevel: 15 },
  { generator: generateMirrorRing,       chance: 0.01,   dungeons: ["bandits-town-hall"] },

  // ── Act 2 ─────────────────────────────────────────────────────────────────────
  { generator: generateDemonsTail,       chance: 0.0025, dungeons: ACT2_DUNGEONS },
  // ── Act 3 ─────────────────────────────────────────────────────────────────────
  // (placeholder — future uniques can reference ACT3_DUNGEONS)
  { generator: generateReapersHood,      chance: 0.002,  dungeons: ACT3_DUNGEONS, minLevel: 60 },
  { generator: generatePentagram,        chance: 0.005,  dungeons: ACT2_DUNGEONS },
  { generator: generateReapersHood,      chance: 0.005,  dungeons: ["the-white-maw"] },

  // ── Class weapons ─────────────────────────────────────────────────────────────
  { generator: generateJusticar,         chance: 0.0015, classId: "paladin",    minLevel: 28 },
  { generator: generateSanctifier,       chance: 0.0015, classId: "paladin",    minLevel: 50 },

  { generator: generateBlooddrinker,     chance: 0.0015, classId: "barbarian",  minLevel: 10, maxLevel: 40 },
  { generator: generateIronjaw,          chance: 0.0015, classId: "barbarian",  minLevel: 28, maxLevel: 60 },
  { generator: generateWorldbreaker,     chance: 0.0015, classId: "barbarian",  minLevel: 50 },

  { generator: generateWhisper,          chance: 0.0015, classId: "amazon",     minLevel: 8,  maxLevel: 38 },
  { generator: generateStormstring,      chance: 0.0015, classId: "amazon",     minLevel: 28, maxLevel: 60 },
  { generator: generateDoomcrier,        chance: 0.0015, classId: "amazon",     minLevel: 50 },

  { generator: generateApprenticesFocus, chance: 0.002,  classId: "sorceress",  dungeons: ACT1_DUNGEONS },
  { generator: generateTheArcanist,      chance: 0.001,  classId: "sorceress",  dungeons: ["bandits-town-hall", ...ACT2_DUNGEONS.slice(0, 4)] },
  { generator: generateEternitysEdge,    chance: 0.001,  classId: "sorceress",  dungeons: ACT2_DUNGEONS.slice(3) },

  { generator: generateShadowfang,       chance: 0.002,  classId: "assassin",   dungeons: ["bandits-town-hall", ...ACT2_DUNGEONS.slice(0, 4)] },

  // ── Druid weapons ─────────────────────────────────────────────────────────────
  { generator: generateTanglewhip,       chance: 0.003,  classId: "druid",      dungeons: ACT1_DUNGEONS,                                   minLevel: 8 },
  { generator: generateWorldrootTotem,   chance: 0.003,  classId: "druid",      dungeons: ["bandits-town-hall", ...ACT2_DUNGEONS.slice(0, 4)], minLevel: 20 },
  { generator: generateVerdantCoil,      chance: 0.0015, classId: "druid",      dungeons: ACT2_DUNGEONS.slice(3),                              minLevel: 33 },
  { generator: generateThornweaveEffigy, chance: 0.0015, classId: "druid",      dungeons: ACT3_DUNGEONS.slice(3),                              minLevel: 54 },
  { generator: generateBloodbriar,       chance: 0.0015, classId: "druid",                                                                     minLevel: 74 },

  // ── New uniques ───────────────────────────────────────────────────────────────
  { generator: generateGraveToll,        chance: 0.0025, classId: "necromancer", minLevel: 10, maxLevel: 42 },
  { generator: generateBonechill,        chance: 0.002,  classId: "necromancer", minLevel: 32, maxLevel: 62 },
  { generator: generateEbonreap,         chance: 0.0015, classId: "necromancer", minLevel: 50 },
  { generator: generateJadeKnuckles,     chance: 0.0025, classId: "monk",                      maxLevel: 40 },
  { generator: generateStormfist,        chance: 0.002,  classId: "monk",        minLevel: 38 },
  { generator: generateIroncladHauberk,  chance: 0.0015, minLevel: 45,           maxLevel: 70 },
  { generator: generateTheGavel,         chance: 0.002,  classId: "paladin", minLevel: 30 },

  // ── Act 3/4 endgame uniques ───────────────────────────────────────────────────
  { generator: generateVoidgaze,         chance: 0.0015, minLevel: 58 },
  { generator: generateBastionsRemnant,  chance: 0.0015, minLevel: 65 },
  { generator: generateBloodfist,        chance: 0.0018, minLevel: 60 },
  { generator: generateSoulvoidGirdle,   chance: 0.0015, minLevel: 63 },
  { generator: generateForsakenSigil,    chance: 0.0015, minLevel: 68 },
];
