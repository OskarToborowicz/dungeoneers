import type { ClassId, EquipmentSlot, Item } from "../types";
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
  generateHarvester,
  generatePenitentsGrace,
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
  generateVipersKiss,
  generateShadowfang,
  generateDeathwhisper,
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

const ACT1 = ["blood-moor", "cold-plains", "stony-field", "dark-wood", "tristram", "diablo"];
const ACT2 = ["imp-field", "lava-river", "ashen-caves", "higher-hell", "lower-hell", "hellcore"];
const LATE_ACT2 = ["higher-hell", "lower-hell", "hellcore"];
const MID_ACT2 = ["diablo", "imp-field", "lava-river", "ashen-caves", "higher-hell"];

const UNIQUE_POOL: Partial<Record<EquipmentSlot, UniquePoolEntry[]>> = {
  helm: [
    { generator: generatePeasantHood },
    { generator: generateCrackedLens,      minLevel: 5 },
    { generator: generateMaskOfTwilight,   minLevel: 25 },
    { generator: generateMaskOfMidnight,   minLevel: 25 },
    { generator: generateSpellbladesMask,  clearedAny: ["tristram", "diablo", ...ACT2] },
    { generator: generateCrownOfTheFallen, minLevel: 45 },
    { generator: generateReapersHood,      minLevel: 45, clearedAny: ACT2 },
  ],
  armor: [
    { generator: generateThornback,  minLevel: 12 },
    { generator: generateStoneHusk,  minLevel: 25 },
  ],
  belt: [
    { generator: generateRagpickersSash },
    { generator: generateVenomweaveWrap, minLevel: 15, clearedAny: ["stony-field", "dark-wood", "tristram", "diablo", ...ACT2] },
    { generator: generateDemonsTail,     clearedAny: ACT2 },
  ],
  ring1: [
    { generator: generateEyeOfTheStorm, minLevel: 18 },
    { generator: generateMirrorRing,    clearedAny: ["diablo", ...ACT2] },
  ],
  amulet: [
    { generator: generatePentagram, clearedAny: ACT2 },
  ],
  gloves: [
    { generator: generateSharpFangs,       minLevel: 15 },
    { generator: generateBoneweaveGloves,  minLevel: 20 },
  ],
  boots: [
    { generator: generateHeavyStompers },
  ],
};

const CLASS_WEAPON_POOL: Partial<Record<ClassId, UniquePoolEntry[]>> = {
  paladin: [
    { generator: generatePenitentsGrace, minLevel: 10 },
    { generator: generateJusticar,       minLevel: 28 },
    { generator: generateSanctifier,     minLevel: 50 },
  ],
  barbarian: [
    { generator: generateBlooddrinker, minLevel: 10 },
    { generator: generateIronjaw,      minLevel: 28 },
    { generator: generateWorldbreaker, minLevel: 50 },
  ],
  amazon: [
    { generator: generateWhisper,     minLevel: 8 },
    { generator: generateStormstring, minLevel: 28 },
    { generator: generateDoomcrier,   minLevel: 50 },
  ],
  necromancer: [
    { generator: generateHarvester, clearedAny: ACT2 },
  ],
  sorceress: [
    { generator: generateApprenticesFocus, clearedAny: ACT1 },
    { generator: generateTheArcanist,      clearedAny: MID_ACT2 },
    { generator: generateEternitysEdge,    clearedAny: LATE_ACT2 },
  ],
  assassin: [
    { generator: generateVipersKiss,   clearedAny: ACT1 },
    { generator: generateShadowfang,   clearedAny: MID_ACT2 },
    { generator: generateDeathwhisper, clearedAny: LATE_ACT2 },
  ],
};

export function gamblePrice(_slot: EquipmentSlot, _level: number): number {
  return 2500;
}

function isUnlocked(entry: UniquePoolEntry, level: number, clearedDungeons: string[]): boolean {
  if (entry.minLevel && level < entry.minLevel) return false;
  if (entry.clearedAny && !entry.clearedAny.some((d) => clearedDungeons.includes(d))) return false;
  return true;
}

export function rollGambleItem(slot: EquipmentSlot, level: number, classId: ClassId, clearedDungeons: string[]): Item {
  const roll = Math.random();

  if (roll < 0.02) {
    const rawPool = slot === "weapon" ? CLASS_WEAPON_POOL[classId] : UNIQUE_POOL[slot];
    const pool = rawPool?.filter((e) => isUnlocked(e, level, clearedDungeons)) ?? [];
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)].generator();
    }
    return generateItemForSlot(slot, level, classId, "rare", 4);
  }

  if (roll < 0.37) {
    return generateItemForSlot(slot, level, classId, "rare", 4);
  }

  return generateItemForSlot(slot, level, classId, "magic", 2);
}
