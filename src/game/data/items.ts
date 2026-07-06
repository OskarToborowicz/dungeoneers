import type { ClassId, EquipmentSlot, Item, ItemAffix, ItemRarity } from "../types";

interface ItemBase {
  name: string;
  slot: EquipmentSlot;
  baseDamage?: [number, number];
  baseDefense?: number;
  twoHanded?: boolean;
  allowedClasses?: ClassId[];
}

const WEAPON_BASES: ItemBase[] = [
  { name: "Axe",      slot: "weapon", baseDamage: [2, 6], twoHanded: false, allowedClasses: ["barbarian"] },
  { name: "War Staff",slot: "weapon", baseDamage: [2, 8], twoHanded: true,  allowedClasses: ["necromancer", "sorceress"] },
  { name: "Bow",      slot: "weapon", baseDamage: [3, 7], twoHanded: true,  allowedClasses: ["amazon"] },
  { name: "Mace",     slot: "weapon", baseDamage: [3, 4], twoHanded: false, allowedClasses: ["paladin"] },
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

const RARITY_ROLLS: { rarity: ItemRarity; weight: number; affixCount: number; multiplier: number }[] = [
  { rarity: "normal", weight: 55, affixCount: 0, multiplier: 1 },
  { rarity: "magic", weight: 30, affixCount: 1, multiplier: 1.15 },
  { rarity: "rare", weight: 12, affixCount: 3, multiplier: 1.3 },
  { rarity: "unique", weight: 3, affixCount: 4, multiplier: 1.5 },
];

const AFFIX_POOL: { label: string; stat: ItemAffix["stat"]; min: number; max: number }[] = [
  { label: "of Strength", stat: "strength", min: 2, max: 8 },
  { label: "of Dexterity", stat: "dexterity", min: 2, max: 8 },
  { label: "of Vitality", stat: "vitality", min: 2, max: 8 },
  { label: "of Energy", stat: "energy", min: 2, max: 8 },
  { label: "of Power", stat: "damage", min: 2, max: 10 },
  { label: "of Protection", stat: "defense", min: 2, max: 10 },
  { label: "of Life", stat: "life", min: 5, max: 20 },
  { label: "of Mana", stat: "mana", min: 5, max: 20 },
];

function rollRarity(): (typeof RARITY_ROLLS)[number] {
  const total = RARITY_ROLLS.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  for (const entry of RARITY_ROLLS) {
    if (roll < entry.weight) return entry;
    roll -= entry.weight;
  }
  return RARITY_ROLLS[0];
}

function rollAffixes(count: number, itemLevel: number): ItemAffix[] {
  const affixes: ItemAffix[] = [];
  const pool = [...AFFIX_POOL];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    const [chosen] = pool.splice(index, 1);
    const scale = 1 + itemLevel * 0.08;
    const value = Math.round((chosen.min + Math.random() * (chosen.max - chosen.min)) * scale);
    affixes.push({ label: chosen.label, stat: chosen.stat, value });
  }
  return affixes;
}

let itemCounter = 0;

export function generateRandomItem(itemLevel: number, classId?: ClassId): Item {
  const weapons = classId
    ? WEAPON_BASES.filter((w) => !w.allowedClasses || w.allowedClasses.includes(classId))
    : WEAPON_BASES;
  const bag = [...weapons, ...ARMOR_BASES, ...JEWELRY_BASES];
  const base = bag[Math.floor(Math.random() * bag.length)];
  const rarityEntry = rollRarity();
  const slot: EquipmentSlot =
    base.slot === "ring1" && Math.random() < 0.5 ? "ring2" : base.slot;

  itemCounter += 1;
  const id = `item-${Date.now()}-${itemCounter}`;

  const isJewelry = base.slot === "amulet" || base.slot === "ring1";
  const affixCount = isJewelry ? Math.max(1, rarityEntry.affixCount) : rarityEntry.affixCount;

  const item: Item = {
    id,
    name: rarityEntry.rarity === "normal" ? base.name : `${base.name} ${rarityEntry.rarity === "unique" ? "of the Ancients" : ""}`.trim(),
    slot,
    rarity: rarityEntry.rarity,
    itemLevel,
    affixes: rollAffixes(affixCount, itemLevel),
  };

  if (base.baseDamage) {
    item.baseDamage = [
      Math.round(base.baseDamage[0] * rarityEntry.multiplier + itemLevel * 0.25),
      Math.round(base.baseDamage[1] * rarityEntry.multiplier + itemLevel * 0.35),
    ];
    item.twoHanded = base.twoHanded ?? false;
  }
  if (base.baseDefense) {
    item.baseDefense = Math.round(base.baseDefense * rarityEntry.multiplier + itemLevel * 0.25);
  }

  if (rarityEntry.rarity !== "normal" && item.affixes.length > 0) {
    const prefix = item.affixes[0].label.replace("of ", "");
    item.name = `${prefix} ${base.name}${item.affixes.length > 1 ? " " + item.affixes[item.affixes.length - 1].label : ""}`;
  }

  return item;
}

export function sellValue(item: Item): number {
  const rarityMult = { normal: 1, magic: 2, rare: 4, unique: 8 }[item.rarity];
  return Math.max(1, Math.round(item.itemLevel * 2 * rarityMult));
}

export function buyValue(item: Item): number {
  return sellValue(item) * 4;
}

export function generateShopStock(characterLevel: number, classId?: ClassId, count = 4): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateRandomItem(Math.max(1, characterLevel), classId));
  }
  return items;
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  normal: "#c7c7c7",
  magic: "#6f8fff",
  rare: "#ffd54a",
  unique: "#c99a4b",
};
