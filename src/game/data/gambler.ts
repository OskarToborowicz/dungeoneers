import type { ClassId, EquipmentSlot, Item } from "../types";
import { DUNGEONS } from "./dungeons";
import {
  generateItemForSlot,
  generateSpellbladesMask,
  generateCrackedLens,
  generateMaskOfTwilight,
  generateMaskOfMidnight,
  generatePeasantHood,
  generateCrownOfTheFallen,
  generateReapersHood,
  generateStoneHusk,
  generateThornback,
  generateRagpickersSash,
  generateDemonsTail,
  generateVenomweaveWrap,
  generateMirrorRing,
  generateEyeOfTheStorm,
  generatePentagram,
  generateBoneweaveGloves,
  generateSharpFangs,
  generateHeavyStompers,
  generateJusticar,
  generateSanctifier,
  generateBlooddrinker,
  generateIronjaw,
  generateWorldbreaker,
  generateWhisper,
  generateStormstring,
  generateDoomcrier,
  generateApprenticesFocus,
  generateTheArcanist,
  generateEternitysEdge,
  generateShadowfang,
  generateTanglewhip,
  generateWorldrootTotem,
  generateVerdantCoil,
  generateThornweaveEffigy,
  generateBloodbriar,
  generatePenitentsGuard,
  generateStoneguard,
  generateHeavensWrath,
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

export interface GambleOffer {
  slot: EquipmentSlot;
  price: number;
}

interface UniquePoolEntry {
  generator: () => Item;
  minLevel?: number;
  clearedAny?: string[];
}
const ACT1 = [
  "sewers",
  "dark-forest",
  "cave",
  "foggy-fields",
  "graveyard",
  "crypt",
  "goblins-path",
  "bandit-town",
  "bandits-town-hall",
];
const ACT2 = [
  "frostfang-pass",
  "icy-cave",
  "tundra",
  "moonglass-lake",
  "whispering-glacier",
  "crystal-labyrinth",
  "frostforge",
  "summit-peak",
  "the-white-maw",
];
const ACT3 = [
  "overgrown-entrance",
  "serpent-marsh",
  "whispering-river",
  "village-lost-souls",
  "bloodvine-jungle",
  "temple-forgotten-gods",
  "heart-of-the-jungle",
  "black-ziggurat",
  "sacrificial-altar",
];

const UNIQUE_POOL: Partial<Record<EquipmentSlot, UniquePoolEntry[]>> = {
  helm: [
    { generator: generatePeasantHood },
    { generator: generateCrackedLens, minLevel: 5 },
    { generator: generateMaskOfTwilight, minLevel: 25 },
    { generator: generateMaskOfMidnight, minLevel: 25 },
    {
      generator: generateSpellbladesMask,
      minLevel: 15,
    },
    { generator: generateCrownOfTheFallen, minLevel: 45 },
    { generator: generateReapersHood, minLevel: 45, clearedAny: ACT2 },
    { generator: generateVoidgaze, minLevel: 58 },
  ],
  armor: [
    { generator: generateThornback, minLevel: 12 },
    { generator: generateStoneHusk, minLevel: 25 },
    { generator: generateRatKingsCoat },
    { generator: generateIroncladHauberk, minLevel: 45 },
    { generator: generateBastionsRemnant, minLevel: 65 },
  ],
  belt: [
    { generator: generateRagpickersSash },
    {
      generator: generateVenomweaveWrap,
      minLevel: 15,
    },
    { generator: generateDemonsTail, clearedAny: ACT2 },
    { generator: generateSoulvoidGirdle, minLevel: 63 },
  ],
  ring1: [
    { generator: generateEyeOfTheStorm, minLevel: 18 },
    { generator: generateMirrorRing, clearedAny: ACT2 },
  ],
  amulet: [
    { generator: generatePentagram, clearedAny: ACT2 },
    { generator: generateForsakenSigil, minLevel: 68 },
  ],
  gloves: [
    { generator: generateSharpFangs, minLevel: 15 },
    { generator: generateBoneweaveGloves, minLevel: 20 },
    { generator: generateBloodfist, minLevel: 60 },
  ],
  boots: [{ generator: generateHeavyStompers }],
  shield: [
    { generator: generatePenitentsGuard },
    { generator: generateStoneguard, minLevel: 30 },
    { generator: generateHeavensWrath, minLevel: 50 },
  ],
};

const CLASS_WEAPON_POOL: Partial<Record<ClassId, UniquePoolEntry[]>> = {
  paladin: [
    { generator: generateJusticar, minLevel: 28 },
    { generator: generateSanctifier, minLevel: 50 },
    { generator: generateTheGavel, minLevel: 30 },
  ],
  barbarian: [
    { generator: generateBlooddrinker, minLevel: 10 },
    { generator: generateIronjaw, minLevel: 28 },
    { generator: generateWorldbreaker, minLevel: 50 },
  ],
  amazon: [
    { generator: generateWhisper, minLevel: 8 },
    { generator: generateStormstring, minLevel: 28 },
    { generator: generateDoomcrier, minLevel: 50 },
  ],
  sorceress: [
    { generator: generateApprenticesFocus, clearedAny: [...ACT1] },
    { generator: generateTheArcanist, clearedAny: [...ACT2] },
    { generator: generateEternitysEdge, clearedAny: [...ACT3] },
  ],
  assassin: [{ generator: generateShadowfang, clearedAny: [...ACT2] }],
  necromancer: [
    { generator: generateGraveToll },
    { generator: generateBonechill, minLevel: 35 },
    { generator: generateEbonreap, minLevel: 50 },
  ],
  monk: [
    { generator: generateJadeKnuckles },
    { generator: generateStormfist, minLevel: 42 },
  ],
  druid: [
    { generator: generateTanglewhip, minLevel: 8 },
    { generator: generateWorldrootTotem, minLevel: 20 },
    { generator: generateVerdantCoil, minLevel: 33 },
    { generator: generateThornweaveEffigy, minLevel: 54 },
    { generator: generateBloodbriar, minLevel: 74 },
  ],
};

export function gamblePrice(_slot: EquipmentSlot, _level: number): number {
  return 2500;
}

function isUnlocked(
  entry: UniquePoolEntry,
  level: number,
  clearedDungeons: string[],
): boolean {
  if (entry.minLevel && level < entry.minLevel) return false;
  if (
    entry.clearedAny &&
    !entry.clearedAny.some((d) => clearedDungeons.includes(d))
  )
    return false;
  return true;
}

export function rollGambleItem(
  slot: EquipmentSlot,
  level: number,
  classId: ClassId,
  clearedDungeons: string[],
): Item {
  const clearedSet = new Set(clearedDungeons);
  let highestMonsterLevel = 0;
  for (const dungeon of DUNGEONS) {
    if (!clearedSet.has(dungeon.id)) continue;
    const maxLevel = Math.max(
      dungeon.boss.level,
      ...dungeon.waves.map((m) => m.level),
    );
    if (maxLevel > highestMonsterLevel) highestMonsterLevel = maxLevel;
  }
  const itemLevel =
    highestMonsterLevel > 0 ? Math.max(1, highestMonsterLevel - 2) : 1;

  const roll = Math.random();

  if (roll < 0.02) {
    const rawPool =
      slot === "weapon" ? CLASS_WEAPON_POOL[classId] : UNIQUE_POOL[slot];
    const pool =
      rawPool?.filter((e) => isUnlocked(e, level, clearedDungeons)) ?? [];
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)].generator();
    }
    return generateItemForSlot(slot, itemLevel, classId, "rare", 4);
  }

  if (roll < 0.37) {
    return generateItemForSlot(slot, itemLevel, classId, "rare", 4);
  }

  return generateItemForSlot(slot, itemLevel, classId, "magic", 2);
}
