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

export function createCharacter(
  name: string,
  classId: Character["classId"],
): Character {
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

export function getEquipmentStatBonus(
  equipment: Partial<Record<EquipmentSlot, Item>>,
): {
  stats: BaseStats;
  damageBonus: number;
  defenseBonus: number;
  lifeBonus: number;
  manaBonus: number;
  magicDamageBonus: number;
  goldFindBonus: number;
  lifeLeechBonus: number;
  magicDmgReduction: number;
  physDmgReduction: number;
  critChanceBonus: number;
  critDamageBonus: number;
  freezeOnHitBonus: number;
  igniteOnHitBonus: number;
  poisonOnHitBonus: number;
  shockOnHitBonus: number;
  weaponDamage?: [number, number];
} {
  const stats: BaseStats = {
    strength: 0,
    dexterity: 0,
    vitality: 0,
    energy: 0,
  };
  let damageBonus = 0;
  let defenseBonus = 0;
  let lifeBonus = 0;
  let manaBonus = 0;
  let magicDamageBonus = 0;
  let goldFindBonus = 0;
  let lifeLeechBonus = 0;
  let magicDmgReduction = 0;
  let physDmgReduction = 0;
  let critChanceBonus = 0;
  let critDamageBonus = 0;
  let freezeOnHitBonus = 0;
  let igniteOnHitBonus = 0;
  let poisonOnHitBonus = 0;
  let shockOnHitBonus = 0;
  let weaponDamage: [number, number] | undefined;

  for (const item of Object.values(equipment)) {
    if (!item) continue;
    if (item.baseDefense) defenseBonus += item.baseDefense;
    if (item.slot === "weapon" && item.baseDamage) {
      weaponDamage = item.baseDamage;
    } else if (item.slot === "shield" && item.baseDamage) {
      // Off-hand weapon (dual-wield): grants bonus flat damage instead of replacing the main hand.
      damageBonus += Math.round(
        ((item.baseDamage[0] + item.baseDamage[1]) / 2) * 0.5,
      );
    }
    for (const affix of item.affixes) {
      if (affix.stat === "damage") damageBonus += affix.value;
      else if (affix.stat === "defense") defenseBonus += affix.value;
      else if (affix.stat === "life") lifeBonus += affix.value;
      else if (affix.stat === "mana") manaBonus += affix.value;
      else if (affix.stat === "magicDamage") magicDamageBonus += affix.value;
      else if (affix.stat === "goldFind") goldFindBonus += affix.value;
      else if (affix.stat === "lifeLeech") lifeLeechBonus += affix.value;
      else if (affix.stat === "magicDmgReduction")
        magicDmgReduction += affix.value;
      else if (affix.stat === "physDmgReduction")
        physDmgReduction += affix.value;
      else if (affix.stat === "critChance") critChanceBonus += affix.value;
      else if (affix.stat === "critDamageBonus") critDamageBonus += affix.value;
      else if (affix.stat === "freezeOnHit") freezeOnHitBonus += affix.value;
      else if (affix.stat === "igniteOnHit") igniteOnHitBonus += affix.value;
      else if (affix.stat === "poisonOnHit") poisonOnHitBonus += affix.value;
      else if (affix.stat === "shockOnHit") shockOnHitBonus += affix.value;
      else stats[affix.stat] += affix.value;
    }
  }

  const mirrorSource = equipment.ring1?.mirrorRing
    ? equipment.ring2
    : equipment.ring2?.mirrorRing
      ? equipment.ring1
      : null;
  if (mirrorSource) {
    for (const affix of mirrorSource.affixes) {
      if (affix.stat === "damage") damageBonus += affix.value;
      else if (affix.stat === "defense") defenseBonus += affix.value;
      else if (affix.stat === "life") lifeBonus += affix.value;
      else if (affix.stat === "mana") manaBonus += affix.value;
      else if (affix.stat === "magicDamage") magicDamageBonus += affix.value;
      else if (affix.stat === "goldFind") goldFindBonus += affix.value;
      else if (affix.stat === "lifeLeech") lifeLeechBonus += affix.value;
      else if (affix.stat === "magicDmgReduction")
        magicDmgReduction += affix.value;
      else if (affix.stat === "physDmgReduction")
        physDmgReduction += affix.value;
      else if (affix.stat === "critChance") critChanceBonus += affix.value;
      else if (affix.stat === "critDamageBonus") critDamageBonus += affix.value;
      else if (affix.stat === "freezeOnHit") freezeOnHitBonus += affix.value;
      else if (affix.stat === "igniteOnHit") igniteOnHitBonus += affix.value;
      else if (affix.stat === "poisonOnHit") poisonOnHitBonus += affix.value;
      else if (affix.stat === "shockOnHit") shockOnHitBonus += affix.value;
      else stats[affix.stat] += affix.value;
    }
  }

  return {
    stats,
    damageBonus,
    defenseBonus,
    lifeBonus,
    manaBonus,
    magicDamageBonus,
    goldFindBonus,
    lifeLeechBonus,
    magicDmgReduction,
    physDmgReduction,
    critChanceBonus,
    critDamageBonus,
    freezeOnHitBonus,
    igniteOnHitBonus,
    poisonOnHitBonus,
    shockOnHitBonus,
    weaponDamage,
  };
}

export interface DerivedStats {
  stats: BaseStats;
  maxLife: number;
  maxMana: number;
  damage: [number, number];
  defense: number;
  critChance: number;
  critDamageBonus: number;
  magicDamageBonus: number;
  magicDamageMult: number;
  goldFindBonus: number;
  lifeLeechBonus: number;
  magicDmgReduction: number;
  physDmgReduction: number;
  igniteChance: number;
  disorientOnAttackChance: number;
  poisonDamageMult: number;
  thornReflect: number;
  manaRegenMult: number;
  blockChance: number;
  aegisBlockChance: number;
  lowLifeDamageBonus: number;
  electrocuteOnHit: boolean;
  heartseekerBoost: boolean;
  arcanistStaff: boolean;
  burstEchoChance: number;
  shadowfangProc: boolean;
  spellbladesMask: boolean;
  shieldBlockChance: number;
  shieldBlockHealPct: number;
  physReflectPct: number;
  counterOnHitChance: number;
  soulSiphonPct: number;
  bonechillActive: boolean;
  ebonreapActive: boolean;
  stormfistActive: boolean;
  ironcladFlat: number;
  freezeOnHitChance: number;
  igniteOnHitChance: number;
  poisonOnHitChance: number;
  shockOnHitChance: number;
  disorientOnHitChance: number;
  lowLifePhysDmgReduction: number;
  critHealPct: number;
  openerDamageBonus: number;
  dotVictimBonus: number;
}

export function getDerivedStats(
  character: Character,
  equipment: Partial<Record<EquipmentSlot, Item>>,
): DerivedStats {
  const def = CLASSES[character.classId];
  const base = def.baseStats;
  const equip = getEquipmentStatBonus(equipment);

  const stats: BaseStats = {
    strength:
      base.strength + character.allocatedStats.strength + equip.stats.strength,
    dexterity:
      base.dexterity +
      character.allocatedStats.dexterity +
      equip.stats.dexterity,
    vitality:
      base.vitality + character.allocatedStats.vitality + equip.stats.vitality,
    energy: base.energy + character.allocatedStats.energy + equip.stats.energy,
  };

  const maxLife = Math.round(
    30 + stats.vitality * 3 + character.level * 5 + equip.lifeBonus,
  );
  const maxMana =
    def.resourceType === "fury"
      ? FURY_MAX
      : MANA_MAX +
        Math.floor(Math.max(0, stats.energy - 10) / 5) +
        equip.manaBonus;

  const weaponDamage = equip.weaponDamage ?? [1, 3];
  const flatPhysicalDamage = (stats.strength * 2 + stats.dexterity) / 5;
  const damage: [number, number] = [
    Math.round(weaponDamage[0] + flatPhysicalDamage + equip.damageBonus),
    Math.round(weaponDamage[1] + flatPhysicalDamage + equip.damageBonus),
  ];

  const defense = Math.round(equip.defenseBonus + stats.vitality / 4);
  const critChance = Math.min(
    0.6,
    0.05 + stats.dexterity * 0.001 + equip.critChanceBonus / 100,
  );
  const magicDamageBonus =
    Math.floor(stats.energy / 2) + equip.magicDamageBonus;
  const magicDamageMult =
    character.classId === "sorceress" && character.level >= 20 ? 1.2 : 1.0;
  const mindOverMatterBonus =
    character.classId === "sorceress" && character.level >= 35
      ? Math.round(maxMana * 0.15)
      : 0;

  const igniteChance = equipment.belt?.demonsTail ? 20 : 0;
  const disorientOnAttackChance = equipment.helm?.reapersHood ? 20 : 0;
  const poisonDamageMult = equipment.belt?.venomweaveWrap ? 1.1 : 1.0;
  const thornReflect = equipment.armor?.thornback ? 0.1 : 0;
  const manaRegenMult =
    equipment.ring1?.eyeOfTheStorm || equipment.ring2?.eyeOfTheStorm
      ? 1.15
      : 1.0;
  const blockChance = equipment.gloves?.boneweaveGloves ? 5 : 0;
  const aegisBlockChance = equipment.shield?.aegisOfTheFortress ? 15 : 0;
  const lowLifeDamageBonus = equipment.helm?.crownOfTheFallen ? 0.25 : 0;
  const electrocuteOnHit = equipment.weapon?.stormstring === true;
  const heartseekerBoost = equipment.weapon?.doomcrier === true;
  const arcanistStaff = equipment.weapon?.arcanist === true;
  const burstEchoChance = equipment.weapon?.eternitysEdge ? 0.3 : 0;
  const shadowfangProc =
    equipment.weapon?.shadowfang === true ||
    equipment.shield?.shadowfang === true;
  const spellbladesMask = equipment.helm?.spellbladesMask === true;
  const shieldBlockChance = equipment.shield?.heavensWrath ? 12 : 0;
  const shieldBlockHealPct = equipment.shield?.heavensWrath ? 0.08 : 0;
  const physReflectPct = equipment.shield?.stoneguard ? 0.2 : 0;
  const counterOnHitChance = equipment.shield?.penitentsGuard ? 0.18 : 0;
  const soulSiphonPct = equipment.weapon?.graveToll ? 0.2 : 0.15;
  const bonechillActive = equipment.weapon?.bonechill === true;
  const ebonreapActive = equipment.weapon?.ebonreap === true;
  const stormfistActive = equipment.weapon?.stormfist === true;
  const ironcladFlat = equipment.armor?.ironcladHauberk ? 5 : 0;
  const freezeOnHitChance = equip.freezeOnHitBonus;
  const igniteOnHitChance = equip.igniteOnHitBonus;
  const poisonOnHitChance = equip.poisonOnHitBonus;
  const shockOnHitChance = equip.shockOnHitBonus;
  const disorientOnHitChance = equipment.helm?.voidgaze ? 15 : 0;
  const lowLifePhysDmgReduction = equipment.armor?.bastionsRemnant ? 12 : 0;
  const critHealPct = equipment.gloves?.bloodfist ? 0.05 : 0;
  const openerDamageBonus = equipment.belt?.soulvoidGirdle
    ? (equipment.belt.openerBonusPct ?? 20) / 100
    : 0;
  const dotVictimBonus = equipment.amulet?.forsakenSigil ? 0.15 : 0;
  return {
    stats,
    maxLife: maxLife + mindOverMatterBonus,
    maxMana,
    damage,
    defense,
    critChance,
    critDamageBonus: equip.critDamageBonus,
    magicDamageBonus,
    magicDamageMult,
    goldFindBonus: equip.goldFindBonus,
    lifeLeechBonus: equip.lifeLeechBonus,
    magicDmgReduction: equip.magicDmgReduction,
    physDmgReduction: equip.physDmgReduction,
    igniteChance,
    disorientOnAttackChance,
    poisonDamageMult,
    thornReflect,
    manaRegenMult,
    blockChance,
    aegisBlockChance,
    lowLifeDamageBonus,
    electrocuteOnHit,
    heartseekerBoost,
    arcanistStaff,
    burstEchoChance,
    shadowfangProc,
    spellbladesMask,
    shieldBlockChance,
    shieldBlockHealPct,
    physReflectPct,
    counterOnHitChance,
    soulSiphonPct,
    bonechillActive,
    ebonreapActive,
    stormfistActive,
    ironcladFlat,
    freezeOnHitChance,
    igniteOnHitChance,
    poisonOnHitChance,
    shockOnHitChance,
    disorientOnHitChance,
    lowLifePhysDmgReduction,
    critHealPct,
    openerDamageBonus,
    dotVictimBonus,
  };
}

export function getStartingResource(
  character: Character,
  derived: DerivedStats,
  previousEnding?: number,
): number {
  const def = CLASSES[character.classId];
  if (def.resourceType === "fury") return FURY_START;
  if (def.resourceType === "preparation") return 0; // Preparation always starts at 0 per dungeon
  return previousEnding ?? derived.maxMana;
}

export function grantXp(
  character: Character,
  xp: number,
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
