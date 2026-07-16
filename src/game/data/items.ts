import type {
  ClassId,
  EquipmentSlot,
  Item,
  ItemAffix,
  ItemRarity,
} from "../types";
import { DUNGEONS } from "./dungeons";

interface ItemBase {
  name: string;
  slot: EquipmentSlot;
  baseDamage?: [number, number];
  baseDefense?: number;
  twoHanded?: boolean;
  allowedClasses?: ClassId[];
  weaponType?: string;
}

const WEAPON_BASES: ItemBase[] = [
  {
    name: "Axe",
    slot: "weapon",
    baseDamage: [2, 6],
    twoHanded: false,
    allowedClasses: ["barbarian"],
  },
  {
    name: "Scythe",
    slot: "weapon",
    baseDamage: [3, 8],
    twoHanded: true,
    allowedClasses: ["necromancer"],
  },
  {
    name: "War Staff",
    slot: "weapon",
    baseDamage: [2, 8],
    twoHanded: true,
    allowedClasses: ["sorceress"],
  },
  {
    name: "Bow",
    slot: "weapon",
    baseDamage: [3, 7],
    twoHanded: true,
    allowedClasses: ["amazon"],
  },
  {
    name: "Mace",
    slot: "weapon",
    baseDamage: [3, 4],
    twoHanded: false,
    allowedClasses: ["paladin"],
  },
  {
    name: "Totem",
    slot: "weapon",
    baseDamage: [2, 6],
    twoHanded: true,
    allowedClasses: ["druid"],
  },
  {
    name: "Claw",
    slot: "weapon",
    baseDamage: [2, 5],
    twoHanded: false,
    allowedClasses: ["assassin"],
  },
  {
    name: "Fists",
    slot: "weapon",
    weaponType: "fist",
    baseDamage: [2, 5],
    twoHanded: false,
    allowedClasses: ["monk"],
  },
];

const ARMOR_BASES: ItemBase[] = [
  { name: "Buckler", slot: "shield", baseDefense: 6 },
  { name: "Cap", slot: "helm", baseDefense: 4 },
  { name: "Quilted Armor", slot: "armor", baseDefense: 10 },
  { name: "Leather Gloves", slot: "gloves", baseDefense: 3 },
  { name: "Boots", slot: "boots", baseDefense: 3 },
  { name: "Sash", slot: "belt", baseDefense: 2 },
];

const JEWELRY_BASES: ItemBase[] = [
  { name: "Amulet", slot: "amulet" },
  { name: "Ring", slot: "ring1" },
];

const RARITY_ROLLS: {
  rarity: ItemRarity;
  weight: number;
  affixCount: number;
  multiplier: number;
}[] = [
  { rarity: "normal", weight: 55, affixCount: 0, multiplier: 1 },
  { rarity: "magic", weight: 30, affixCount: 1, multiplier: 1.15 },
  { rarity: "rare", weight: 12, affixCount: 3, multiplier: 1.3 },
  { rarity: "very rare", weight: 3, affixCount: 4, multiplier: 1.5 },
];

const AFFIX_POOL: {
  label: string;
  stat: ItemAffix["stat"];
  min: number;
  max: number;
  noScale?: boolean;
  cap?: number;
  decimals?: number;
  itemLevelMin?: number;
  scaleFromLevel?: number;
  scaleRate?: number;
}[] = [
  { label: "of Strength", stat: "strength", min: 2, max: 8 },
  { label: "of Dexterity", stat: "dexterity", min: 2, max: 8 },
  { label: "of Vitality", stat: "vitality", min: 2, max: 8 },
  { label: "of Energy", stat: "energy", min: 2, max: 8 },
  { label: "of Power", stat: "damage", min: 2, max: 10 },
  { label: "of Protection", stat: "defense", min: 2, max: 10 },
  { label: "of Life", stat: "life", min: 5, max: 20 },
  { label: "of Mana", stat: "mana", min: 5, max: 20 },
  { label: "of Arcane Power", stat: "magicDamage", min: 2, max: 6 },
  { label: "of Greed", stat: "goldFind", min: 15, max: 25, cap: 125, scaleRate: 0.057 },
  { label: "of Vampirism", stat: "lifeLeech", min: 3, max: 9, noScale: true },
  {
    label: "of Devastation",
    stat: "critDamageBonus",
    min: 5,
    max: 8,
    cap: 20,
    itemLevelMin: 10,
    scaleFromLevel: 10,
    scaleRate: 0.025,
  },
  {
    label: "of Precision",
    stat: "critChance",
    min: 0.5,
    max: 1.5,
    cap: 6,
    decimals: 1,
    itemLevelMin: 10,
    scaleFromLevel: 10,
    scaleRate: 0.05,
  },
  {
    label: "of Warding",
    stat: "magicDmgReduction",
    min: 3,
    max: 6,
    cap: 12,
    itemLevelMin: 25,
    scaleFromLevel: 25,
    scaleRate: 0.04,
  },
  {
    label: "of Fortitude",
    stat: "physDmgReduction",
    min: 3,
    max: 6,
    cap: 12,
    itemLevelMin: 25,
    scaleFromLevel: 25,
    scaleRate: 0.04,
  },
];

function rollRarity(
  maxRarity: ItemRarity = "very rare",
  minRarity: ItemRarity = "normal",
): (typeof RARITY_ROLLS)[number] {
  const order: ItemRarity[] = [
    "normal",
    "magic",
    "rare",
    "very rare",
    "unique",
  ];
  const allowed = RARITY_ROLLS.filter((r) => {
    const idx = order.indexOf(r.rarity);
    return idx >= order.indexOf(minRarity) && idx <= order.indexOf(maxRarity);
  });
  const total = allowed.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  for (const entry of allowed) {
    if (roll < entry.weight) return entry;
    roll -= entry.weight;
  }
  return allowed[0];
}

function shopMaxRarity(characterLevel: number): ItemRarity {
  if (characterLevel < 5) return "magic";
  if (characterLevel < 10) return "rare";
  return "very rare";
}

const DAMAGE_AFFIX_SLOTS: EquipmentSlot[] = [
  "weapon",
  "shield",
  "ring1",
  "ring2",
  "amulet",
  "gloves",
];
const MAGIC_DAMAGE_AFFIX_SLOTS: EquipmentSlot[] = [
  "weapon",
  "shield",
  "ring1",
  "ring2",
  "amulet",
  "gloves",
];
const GOLD_FIND_AFFIX_SLOTS: EquipmentSlot[] = ["ring1", "ring2", "belt"];
const LIFE_LEECH_AFFIX_SLOTS: EquipmentSlot[] = ["ring1", "ring2", "gloves"];
const CRIT_CHANCE_AFFIX_SLOTS: EquipmentSlot[] = ["ring1", "ring2", "amulet"];
const CRIT_DAMAGE_AFFIX_SLOTS: EquipmentSlot[] = ["gloves", "ring1", "ring2", "amulet"];
const MAGIC_RESIST_AFFIX_SLOTS: EquipmentSlot[] = ["helm", "armor", "boots"];

function rollAffixes(
  count: number,
  itemLevel: number,
  slot: EquipmentSlot,
): ItemAffix[] {
  const affixes: ItemAffix[] = [];
  const pool = AFFIX_POOL.filter((a) => {
    if (a.stat === "damage") return DAMAGE_AFFIX_SLOTS.includes(slot);
    if (a.stat === "magicDamage")
      return MAGIC_DAMAGE_AFFIX_SLOTS.includes(slot);
    if (a.stat === "goldFind") return GOLD_FIND_AFFIX_SLOTS.includes(slot);
    if (a.stat === "lifeLeech") return LIFE_LEECH_AFFIX_SLOTS.includes(slot);
    if (a.stat === "critChance")
      return (
        CRIT_CHANCE_AFFIX_SLOTS.includes(slot) &&
        itemLevel >= (a.itemLevelMin ?? 0)
      );
    if (a.stat === "critDamageBonus")
      return (
        CRIT_DAMAGE_AFFIX_SLOTS.includes(slot) &&
        itemLevel >= (a.itemLevelMin ?? 0)
      );
    if (a.stat === "magicDmgReduction")
      return (
        MAGIC_RESIST_AFFIX_SLOTS.includes(slot) &&
        itemLevel >= (a.itemLevelMin ?? 0)
      );
    if (a.stat === "physDmgReduction")
      return (
        MAGIC_RESIST_AFFIX_SLOTS.includes(slot) &&
        itemLevel >= (a.itemLevelMin ?? 0)
      );
    return true;
  });
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    const [chosen] = pool.splice(index, 1);
    const effectiveLevel =
      chosen.scaleFromLevel != null
        ? Math.max(0, itemLevel - chosen.scaleFromLevel)
        : itemLevel;
    const rate = chosen.scaleRate ?? 0.08;
    const scale = chosen.noScale ? 1 : 1 + effectiveLevel * rate;
    const rolled = (chosen.min + Math.random() * (chosen.max - chosen.min)) * scale;
    const factor = chosen.decimals ? Math.pow(10, chosen.decimals) : 1;
    const rawValue = Math.round(rolled * factor) / factor;
    const value = chosen.cap != null ? Math.min(rawValue, chosen.cap) : rawValue;
    affixes.push({ label: chosen.label, stat: chosen.stat, value });
  }
  return affixes;
}

let itemCounter = 0;

export function generateRandomItem(
  itemLevel: number,
  classId?: ClassId,
  maxRarity?: ItemRarity,
): Item {
  const weapons = classId
    ? WEAPON_BASES.filter(
        (w) => !w.allowedClasses || w.allowedClasses.includes(classId),
      )
    : WEAPON_BASES;
  const armor =
    classId && classId !== "paladin"
      ? ARMOR_BASES.filter((a) => a.slot !== "shield")
      : ARMOR_BASES;
  const bag = [...weapons, ...armor, ...JEWELRY_BASES];
  const base = bag[Math.floor(Math.random() * bag.length)];
  const rarityEntry = rollRarity(maxRarity);
  const slot: EquipmentSlot =
    base.slot === "ring1" && Math.random() < 0.5 ? "ring2" : base.slot;

  itemCounter += 1;
  const id = `item-${Date.now()}-${itemCounter}`;

  const isJewelry = base.slot === "amulet" || base.slot === "ring1";
  const effectiveRarityEntry =
    isJewelry && rarityEntry.rarity === "normal"
      ? rollRarity(maxRarity, "magic")
      : rarityEntry;
  const affixCount = isJewelry
    ? Math.max(1, effectiveRarityEntry.affixCount)
    : effectiveRarityEntry.affixCount;

  const item: Item = {
    id,
    name:
      effectiveRarityEntry.rarity === "normal"
        ? base.name
        : `${base.name} ${effectiveRarityEntry.rarity === "very rare" ? "of the Ancients" : ""}`.trim(),
    slot,
    rarity: effectiveRarityEntry.rarity,
    itemLevel,
    affixes: rollAffixes(affixCount, itemLevel, slot),
  };

  if (base.baseDamage) {
    item.baseDamage = [
      Math.round(
        base.baseDamage[0] * rarityEntry.multiplier + itemLevel * 0.25,
      ),
      Math.round(
        base.baseDamage[1] * rarityEntry.multiplier + itemLevel * 0.35,
      ),
    ];
    item.twoHanded = base.twoHanded ?? false;
    if (base.weaponType) item.weaponType = base.weaponType;
  }
  if (base.baseDefense) {
    item.baseDefense = Math.round(
      base.baseDefense * rarityEntry.multiplier + itemLevel * 0.25,
    );
  }

  if (rarityEntry.rarity !== "normal" && item.affixes.length > 0) {
    const prefix = item.affixes[0].label.replace("of ", "");
    item.name = `${prefix} ${base.name}${item.affixes.length > 1 ? " " + item.affixes[item.affixes.length - 1].label : ""}`;
  }

  return item;
}

export function sellValue(item: Item): number {
  const rarityMult = {
    normal: 1,
    magic: 2,
    rare: 4,
    "very rare": 8,
    unique: 12,
  }[item.rarity];
  return Math.max(1, Math.round(item.itemLevel * 2 * rarityMult));
}

export function buyValue(item: Item): number {
  return sellValue(item) * 6;
}

function generateItemFromBase(base: ItemBase, itemLevel: number): Item {
  itemCounter += 1;
  const id = `item-${Date.now()}-${itemCounter}`;
  const slot: EquipmentSlot =
    base.slot === "ring1" && Math.random() < 0.5 ? "ring2" : base.slot;
  const item: Item = {
    id,
    name: base.name,
    slot,
    rarity: "normal",
    itemLevel,
    affixes: [],
  };
  if (base.baseDamage) {
    item.baseDamage = [
      Math.round(base.baseDamage[0] + itemLevel * 0.25),
      Math.round(base.baseDamage[1] + itemLevel * 0.35),
    ];
    item.twoHanded = base.twoHanded ?? false;
    if (base.weaponType) item.weaponType = base.weaponType;
  }
  if (base.baseDefense) {
    item.baseDefense = Math.round(base.baseDefense + itemLevel * 0.25);
  }
  return item;
}

export function generateStartingEquipment(
  classId: ClassId,
): Partial<Record<EquipmentSlot, Item>> {
  const weaponBase =
    WEAPON_BASES.find((w) => w.allowedClasses?.includes(classId)) ??
    WEAPON_BASES[0];
  const weapon = generateItemFromBase(weaponBase, 1);
  if (classId === "paladin") {
    const shieldBase = ARMOR_BASES.find((a) => a.slot === "shield")!;
    const shield = generateItemFromBase(shieldBase, 1);
    return { weapon, shield };
  }
  return { weapon };
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSpellbladesMask(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Spellblade's Mask",
    slot: "helm",
    rarity: "unique",
    itemLevel: 1,
    baseDefense: 8,
    affixes: [
      { label: "", stat: "magicDamage", value: 15 },
      { label: "", stat: "damage", value: 15 },
    ],
    spellbladesMask: true,
  };
}

export function generateMirrorRing(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Mirror Ring",
    slot: "ring1",
    rarity: "unique",
    itemLevel: 30,
    affixes: [],
    mirrorRing: true,
  };
}

export function generateHeavyStompers(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Heavy Stompers",
    slot: "boots",
    rarity: "unique",
    itemLevel: 1,
    baseDefense: 5,
    affixes: [
      { label: "", stat: "life", value: 200 },
      { label: "", stat: "defense", value: 100 },
      { label: "", stat: "strength", value: -20 },
      { label: "", stat: "dexterity", value: -20 },
      { label: "", stat: "energy", value: -20 },
    ],
  };
}

export function generateSharpFangs(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Sharp Fangs",
    slot: "gloves",
    rarity: "unique",
    itemLevel: 15,
    baseDefense: 8,
    affixes: [
      { label: "", stat: "dexterity", value: 30 },
      { label: "", stat: "strength", value: 30 },
      { label: "", stat: "damage", value: 30 },
      { label: "", stat: "magicDamage", value: 30 },
    ],
  };
}

export function generatePentagram(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "The Pentagram",
    slot: "amulet",
    rarity: "unique",
    itemLevel: 1,
    affixes: [
      { label: "", stat: "damage", value: 100 },
      { label: "", stat: "life", value: -100 },
    ],
  };
}

export function generateStoneHusk(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Stone Husk",
    slot: "armor",
    rarity: "unique",
    itemLevel: 25,
    baseDefense: 20,
    affixes: [
      { label: "", stat: "vitality", value: randInt(20, 30) },
      { label: "", stat: "life", value: randInt(40, 60) },
      { label: "", stat: "physDmgReduction", value: randInt(5, 10) },
      { label: "", stat: "magicDmgReduction", value: randInt(5, 10) },
    ],
  };
}

export function generateMaskOfTwilight(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Mask of Twilight",
    slot: "helm",
    rarity: "unique",
    itemLevel: 25,
    baseDefense: 12,
    affixes: [
      { label: "", stat: "energy", value: randInt(25, 35) },
      { label: "", stat: "magicDamage", value: randInt(25, 35) },
      { label: "", stat: "critChance", value: 5 },
    ],
  };
}

export function generateMaskOfMidnight(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Mask of Midnight",
    slot: "helm",
    rarity: "unique",
    itemLevel: 25,
    baseDefense: 12,
    affixes: [
      { label: "", stat: "vitality", value: randInt(25, 35) },
      { label: "", stat: "damage", value: randInt(25, 35) },
      { label: "", stat: "critChance", value: 5 },
    ],
  };
}

export function generatePeasantHood(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Peasant Hood",
    slot: "helm",
    rarity: "unique",
    itemLevel: 1,
    baseDefense: 6,
    affixes: [
      { label: "", stat: "damage", value: 10 },
      { label: "", stat: "vitality", value: 10 },
      { label: "", stat: "goldFind", value: 25 },
    ],
  };
}

export function generateCrownOfTheFallen(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Crown of the Fallen",
    slot: "helm",
    rarity: "unique",
    itemLevel: 45,
    baseDefense: 20,
    affixes: [
      { label: "", stat: "vitality", value: randInt(40, 55) },
      { label: "", stat: "defense", value: randInt(15, 25) },
    ],
    crownOfTheFallen: true,
  };
}

export function generateRagpickersSash(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Ragpicker's Sash",
    slot: "belt",
    rarity: "unique",
    itemLevel: 1,
    baseDefense: 3,
    affixes: [
      { label: "", stat: "vitality", value: 5 },
      { label: "", stat: "goldFind", value: 20 },
    ],
  };
}

export function generateCrackedLens(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Cracked Lens",
    slot: "helm",
    rarity: "unique",
    itemLevel: 5,
    baseDefense: 7,
    affixes: [
      { label: "", stat: "magicDamage", value: 15 },
      { label: "", stat: "energy", value: 10 },
      { label: "", stat: "defense", value: -10 },
    ],
  };
}

export function generateThornback(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Thornback",
    slot: "armor",
    rarity: "unique",
    itemLevel: 12,
    baseDefense: 18,
    affixes: [{ label: "", stat: "defense", value: 30 }],
    thornback: true,
  };
}

export function generateEyeOfTheStorm(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Eye of the Storm",
    slot: "ring1",
    rarity: "unique",
    itemLevel: 18,
    affixes: [
      { label: "", stat: "energy", value: 25 },
      { label: "", stat: "strength", value: -15 },
    ],
    eyeOfTheStorm: true,
  };
}

export function generateBoneweaveGloves(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Boneweave Gloves",
    slot: "gloves",
    rarity: "unique",
    itemLevel: 20,
    baseDefense: 10,
    affixes: [
      { label: "", stat: "vitality", value: 20 },
      { label: "", stat: "defense", value: 15 },
    ],
    boneweaveGloves: true,
  };
}

export function generateVenomweaveWrap(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Venomweave Wrap",
    slot: "belt",
    rarity: "unique",
    itemLevel: 15,
    baseDefense: 7,
    affixes: [{ label: "", stat: "dexterity", value: 20 }],
    venomweaveWrap: true,
  };
}

export function generateDemonsTail(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Demon's Tail",
    slot: "belt",
    rarity: "unique",
    itemLevel: 1,
    baseDefense: 18,
    affixes: [],
    demonsTail: true,
  };
}

export function generateReapersHood(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Reaper's Hood",
    slot: "helm",
    rarity: "unique",
    itemLevel: 57,
    baseDefense: 32,
    affixes: [
      { label: "", stat: "lifeLeech", value: randInt(4, 7) },
      { label: "", stat: "vitality", value: randInt(35, 50) },
      { label: "", stat: "damage", value: randInt(35, 50) },
    ],
    reapersHood: true,
  };
}

export function generateHarvester(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Harvester",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 58,
    baseDamage: [18, 28],
    twoHanded: true,
    weaponType: "scythe",
    affixes: [
      { label: "", stat: "damage", value: randInt(50, 75) },
      { label: "", stat: "magicDamage", value: randInt(50, 75) },
      { label: "", stat: "vitality", value: randInt(25, 40) },
      { label: "", stat: "energy", value: randInt(25, 40) },
    ],
    harvester: true,
  };
}


export function generateJusticar(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Justicar",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 28,
    baseDamage: [14, 22],
    twoHanded: false,
    weaponType: "mace",
    affixes: [
      { label: "", stat: "damage", value: randInt(30, 45) },
      { label: "", stat: "energy", value: randInt(20, 30) },
      { label: "", stat: "magicDamage", value: randInt(15, 25) },
      { label: "", stat: "strength", value: -15 },
    ],
  };
}

export function generateSanctifier(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Sanctifier",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 50,
    baseDamage: [24, 38],
    twoHanded: false,
    weaponType: "mace",
    affixes: [
      { label: "", stat: "magicDamage", value: randInt(50, 70) },
      { label: "", stat: "damage", value: randInt(35, 45) },
      { label: "", stat: "vitality", value: randInt(40, 55) },
      { label: "", stat: "critChance", value: 6 },
    ],
  };
}

export function generateBlooddrinker(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Blooddrinker",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 10,
    baseDamage: [6, 14],
    twoHanded: false,
    weaponType: "axe",
    affixes: [
      { label: "", stat: "lifeLeech", value: randInt(8, 12) },
      { label: "", stat: "strength", value: randInt(15, 20) },
      { label: "", stat: "defense", value: -8 },
    ],
  };
}

export function generateIronjaw(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Ironjaw",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 28,
    baseDamage: [16, 26],
    twoHanded: false,
    weaponType: "axe",
    affixes: [
      { label: "", stat: "damage", value: randInt(35, 50) },
      { label: "", stat: "vitality", value: randInt(25, 35) },
      { label: "", stat: "critChance", value: 5 },
    ],
  };
}

export function generateWorldbreaker(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Worldbreaker",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 50,
    baseDamage: [28, 44],
    twoHanded: false,
    weaponType: "axe",
    affixes: [
      { label: "", stat: "damage", value: randInt(55, 75) },
      { label: "", stat: "strength", value: randInt(40, 55) },
      { label: "", stat: "vitality", value: randInt(30, 45) },
      { label: "", stat: "dexterity", value: -25 },
    ],
  };
}

export function generateWhisper(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Whisper",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 8,
    baseDamage: [5, 12],
    twoHanded: true,
    weaponType: "bow",
    affixes: [
      { label: "", stat: "dexterity", value: randInt(10, 15) },
      { label: "", stat: "vitality", value: randInt(10, 15) },
      { label: "", stat: "damage", value: randInt(10, 15) },
    ],
  };
}

export function generateStormstring(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Stormstring",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 28,
    baseDamage: [16, 28],
    twoHanded: true,
    weaponType: "bow",
    affixes: [
      { label: "", stat: "dexterity", value: randInt(30, 45) },
      { label: "", stat: "damage", value: randInt(25, 35) },
      { label: "", stat: "strength", value: -15 },
    ],
    stormstring: true,
  };
}

export function generateDoomcrier(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Doomcrier",
    slot: "weapon",
    rarity: "unique",
    itemLevel: 50,
    baseDamage: [28, 46],
    twoHanded: true,
    weaponType: "bow",
    affixes: [
      { label: "", stat: "damage", value: randInt(55, 75) },
      { label: "", stat: "dexterity", value: randInt(40, 55) },
      { label: "", stat: "critChance", value: 8 },
    ],
    doomcrier: true,
  };
}

export function generateApprenticesFocus(): Item {
  itemCounter += 1;
  const ilvl = 8;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Apprentice's Focus",
    slot: "weapon",
    rarity: "unique",
    itemLevel: ilvl,
    baseDamage: [4, 11],
    twoHanded: true,
    weaponType: "staff",
    affixes: [
      { label: "", stat: "energy", value: randInt(12, 18) },
      { label: "", stat: "magicDamage", value: randInt(12, 18) },
      { label: "", stat: "mana", value: randInt(8, 12) },
    ],
    apprenticesFocus: true,
  };
}

export function generateTheArcanist(): Item {
  itemCounter += 1;
  const ilvl = 28;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "The Arcanist",
    slot: "weapon",
    rarity: "unique",
    itemLevel: ilvl,
    baseDamage: [9, 18],
    twoHanded: true,
    weaponType: "staff",
    affixes: [
      { label: "", stat: "magicDamage", value: randInt(30, 45) },
      { label: "", stat: "energy", value: randInt(20, 30) },
      { label: "", stat: "vitality", value: -15 },
    ],
    arcanist: true,
  };
}

export function generateEternitysEdge(): Item {
  itemCounter += 1;
  const ilvl = 50;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Eternity's Edge",
    slot: "weapon",
    rarity: "unique",
    itemLevel: ilvl,
    baseDamage: [15, 26],
    twoHanded: true,
    weaponType: "staff",
    affixes: [
      { label: "", stat: "magicDamage", value: randInt(55, 75) },
      { label: "", stat: "energy", value: randInt(40, 55) },
      { label: "", stat: "critChance", value: 6 },
    ],
    eternitysEdge: true,
  };
}

export function generateVipersKiss(): Item {
  itemCounter += 1;
  const ilvl = 8;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Viper's Kiss",
    slot: "weapon",
    rarity: "unique",
    itemLevel: ilvl,
    baseDamage: [4, 8],
    twoHanded: false,
    weaponType: "claw",
    affixes: [
      { label: "", stat: "dexterity", value: randInt(12, 18) },
      { label: "", stat: "damage", value: randInt(10, 15) },
      { label: "", stat: "vitality", value: randInt(8, 12) },
    ],
    vipersKiss: true,
  };
}

export function generateShadowfang(): Item {
  itemCounter += 1;
  const ilvl = 28;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Shadowfang",
    slot: "weapon",
    rarity: "unique",
    itemLevel: ilvl,
    baseDamage: [9, 15],
    twoHanded: false,
    weaponType: "claw",
    affixes: [
      { label: "", stat: "dexterity", value: randInt(30, 45) },
      { label: "", stat: "damage", value: randInt(20, 30) },
      { label: "", stat: "vitality", value: -15 },
    ],
    shadowfang: true,
  };
}

export function generateDeathwhisper(): Item {
  itemCounter += 1;
  const ilvl = 50;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Deathwhisper",
    slot: "weapon",
    rarity: "unique",
    itemLevel: ilvl,
    baseDamage: [15, 23],
    twoHanded: false,
    weaponType: "claw",
    affixes: [
      { label: "", stat: "dexterity", value: randInt(55, 75) },
      { label: "", stat: "damage", value: randInt(35, 50) },
      { label: "", stat: "critChance", value: 6 },
    ],
    deathwhisper: true,
  };
}

export function generateAegisOfTheFortress(): Item {
  itemCounter += 1;
  return {
    id: `item-${Date.now()}-${itemCounter}`,
    name: "Aegis of the Fortress",
    slot: "shield",
    rarity: "unique",
    itemLevel: 20,
    baseDefense: 18,
    affixes: [
      { label: "", stat: "vitality", value: randInt(40, 60) },
      { label: "", stat: "defense", value: randInt(15, 25) },
    ],
    aegisOfTheFortress: true,
  };
}

export function generateItemForSlot(
  slot: EquipmentSlot,
  itemLevel: number,
  classId: ClassId,
  rarity: "magic" | "rare",
  affixCount: number,
): Item {
  let base: ItemBase;

  if (slot === "weapon") {
    const matches = WEAPON_BASES.filter((w) =>
      w.allowedClasses?.includes(classId),
    );
    base =
      matches[Math.floor(Math.random() * matches.length)] ?? WEAPON_BASES[0];
  } else if (slot === "amulet") {
    base = JEWELRY_BASES.find((b) => b.slot === "amulet")!;
  } else if (slot === "ring1") {
    base = JEWELRY_BASES.find((b) => b.slot === "ring1")!;
  } else {
    base = ARMOR_BASES.find((a) => a.slot === slot) ?? ARMOR_BASES[0];
  }

  const rarityEntry =
    RARITY_ROLLS.find((r) => r.rarity === rarity) ?? RARITY_ROLLS[1];

  itemCounter += 1;
  const id = `item-${Date.now()}-${itemCounter}`;
  const affixes = rollAffixes(affixCount, itemLevel, slot);

  const item: Item = {
    id,
    name: base.name,
    slot,
    rarity,
    itemLevel,
    affixes,
  };

  if (base.baseDamage) {
    item.baseDamage = [
      Math.round(
        base.baseDamage[0] * rarityEntry.multiplier + itemLevel * 0.25,
      ),
      Math.round(
        base.baseDamage[1] * rarityEntry.multiplier + itemLevel * 0.35,
      ),
    ];
    item.twoHanded = base.twoHanded ?? false;
    if (base.weaponType) item.weaponType = base.weaponType;
  }
  if (base.baseDefense) {
    item.baseDefense = Math.round(
      base.baseDefense * rarityEntry.multiplier + itemLevel * 0.25,
    );
  }

  if (affixes.length > 0) {
    const prefix = affixes[0].label.replace("of ", "");
    const suffix =
      affixes.length > 1 ? " " + affixes[affixes.length - 1].label : "";
    item.name = `${prefix} ${base.name}${suffix}`.trim();
  }

  return item;
}

export function generateShopStock(
  characterLevel: number,
  classId?: ClassId,
  count = 4,
  clearedDungeons: string[] = [],
): Item[] {
  const maxRarity = shopMaxRarity(characterLevel);
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
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const itemLevel = highestMonsterLevel > 0
      ? Math.max(1, highestMonsterLevel - randInt(3, 5))
      : 1;
    items.push(generateRandomItem(itemLevel, classId, maxRarity));
  }
  return items;
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  normal: "#c7c7c7",
  magic: "#6f8fff",
  rare: "#ffd54a",
  "very rare": "#ffd54a",
  unique: "#ff6a00",
};
