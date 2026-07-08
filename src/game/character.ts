import { CLASSES } from "./data/classes";
import type { BaseStats, Character, EquipmentSlot, Item } from "./types";

export const FURY_MAX = 100;
export const FURY_START = 20;
export const FURY_PER_ATTACK = 10;
export const MANA_MAX = 100;
export const STARTING_STAT_POINTS = 10;

export function xpToNextLevel(level: number): number {
  return Math.round(40 * Math.pow(level, 1.55));
}

export function createCharacter(name: string, classId: Character["classId"]): Character {
  return {
    name,
    classId,
    level: 1,
    xp: 0,
    gold: 50,
    unspentStatPoints: STARTING_STAT_POINTS,
    allocatedStats: { strength: 0, dexterity: 0, vitality: 0, energy: 0 },
    abilityCooldown: 0,
    escapeTokens: 1,
    runStats: { damageDealt: 0, goldEarned: 0, kills: 0 },
  };
}

export function getEquipmentStatBonus(equipment: Partial<Record<EquipmentSlot, Item>>): {
  stats: BaseStats;
  damageBonus: number;
  defenseBonus: number;
  lifeBonus: number;
  manaBonus: number;
  magicDamageBonus: number;
  goldFindBonus: number;
  weaponDamage?: [number, number];
} {
  const stats: BaseStats = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
  let damageBonus = 0;
  let defenseBonus = 0;
  let lifeBonus = 0;
  let manaBonus = 0;
  let magicDamageBonus = 0;
  let goldFindBonus = 0;
  let lifeLeechBonus = 0;
  let manaRegenBonus = 0;
  let magicDmgReduction = 0;
  let physDmgReduction = 0;
  let weaponDamage: [number, number] | undefined;

  for (const item of Object.values(equipment)) {
    if (!item) continue;
    if (item.baseDefense) defenseBonus += item.baseDefense;
    if (item.slot === "weapon" && item.baseDamage) {
      weaponDamage = item.baseDamage;
    } else if (item.slot === "shield" && item.baseDamage) {
      // Off-hand weapon (dual-wield): grants bonus flat damage instead of replacing the main hand.
      damageBonus += Math.round(((item.baseDamage[0] + item.baseDamage[1]) / 2) * 0.5);
    }
    for (const affix of item.affixes) {
      if (affix.stat === "damage") damageBonus += affix.value;
      else if (affix.stat === "defense") defenseBonus += affix.value;
      else if (affix.stat === "life") lifeBonus += affix.value;
      else if (affix.stat === "mana") manaBonus += affix.value;
      else if (affix.stat === "magicDamage") magicDamageBonus += affix.value;
      else if (affix.stat === "goldFind") goldFindBonus += affix.value;
      else if (affix.stat === "lifeLeech") lifeLeechBonus += affix.value;
      else if (affix.stat === "manaRegen") manaRegenBonus += affix.value;
      else if (affix.stat === "magicDmgReduction") magicDmgReduction += affix.value;
      else if (affix.stat === "physDmgReduction") physDmgReduction += affix.value;
      else stats[affix.stat] += affix.value;
    }
  }

  return { stats, damageBonus, defenseBonus, lifeBonus, manaBonus, magicDamageBonus, goldFindBonus, lifeLeechBonus, manaRegenBonus, magicDmgReduction, physDmgReduction, weaponDamage };
}

export interface DerivedStats {
  stats: BaseStats;
  maxLife: number;
  maxMana: number;
  damage: [number, number];
  defense: number;
  critChance: number;
  magicDamageBonus: number;
  magicDamageMult: number;
  goldFindBonus: number;
  lifeLeechBonus: number;
  manaRegenBonus: number;
  magicDmgReduction: number;
  physDmgReduction: number;
}

export function getDerivedStats(
  character: Character,
  equipment: Partial<Record<EquipmentSlot, Item>>
): DerivedStats {
  const def = CLASSES[character.classId];
  const base = def.baseStats;
  const equip = getEquipmentStatBonus(equipment);

  const stats: BaseStats = {
    strength: base.strength + character.allocatedStats.strength + equip.stats.strength,
    dexterity: base.dexterity + character.allocatedStats.dexterity + equip.stats.dexterity,
    vitality: base.vitality + character.allocatedStats.vitality + equip.stats.vitality,
    energy: base.energy + character.allocatedStats.energy + equip.stats.energy,
  };

  const maxLife = Math.round(30 + stats.vitality * 3 + character.level * 5 + equip.lifeBonus);
  const maxMana = def.resourceType === "fury" ? FURY_MAX : MANA_MAX + Math.floor(Math.max(0, stats.energy - 10) / 5) + equip.manaBonus;

  const weaponDamage = equip.weaponDamage ?? [1, 3];
  const flatPhysicalDamage = (stats.strength * 2 + stats.dexterity) / 5;
  const damage: [number, number] = [
    Math.round(weaponDamage[0] + flatPhysicalDamage + equip.damageBonus),
    Math.round(weaponDamage[1] + flatPhysicalDamage + equip.damageBonus),
  ];

  const defense = Math.round(equip.defenseBonus + stats.vitality / 4);
  const critChance = Math.min(0.6, 0.05 + stats.dexterity * 0.001);
  const magicDamageBonus = Math.floor(stats.energy / 2) + equip.magicDamageBonus;
  const magicDamageMult = character.classId === "sorceress" && character.level >= 20 ? 1.20 : 1.0;
  const mindOverMatterBonus = character.classId === "sorceress" && character.level >= 35 ? Math.round(maxMana * 0.15) : 0;

  return { stats, maxLife: maxLife + mindOverMatterBonus, maxMana, damage, defense, critChance, magicDamageBonus, magicDamageMult, goldFindBonus: equip.goldFindBonus, lifeLeechBonus: equip.lifeLeechBonus, manaRegenBonus: equip.manaRegenBonus, magicDmgReduction: equip.magicDmgReduction, physDmgReduction: equip.physDmgReduction };
}

export function getStartingResource(character: Character, derived: DerivedStats, previousEnding?: number): number {
  const def = CLASSES[character.classId];
  if (def.resourceType === "fury") return FURY_START;
  return previousEnding ?? derived.maxMana;
}

export function grantXp(
  character: Character,
  xp: number
): { character: Character; leveledUp: boolean; levelsGained: number } {
  let updated = { ...character, xp: character.xp + xp };
  let levelsGained = 0;

  while (updated.xp >= xpToNextLevel(updated.level)) {
    updated.xp -= xpToNextLevel(updated.level);
    updated.level += 1;
    updated.unspentStatPoints += 5;
    levelsGained += 1;
  }

  return { character: updated, leveledUp: levelsGained > 0, levelsGained };
}
