export type ClassId =
  | "barbarian"
  | "necromancer"
  | "sorceress"
  | "amazon"
  | "paladin"
  | "druid"
  | "assassin"
  | "monk";

export interface BaseStats {
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
}

export type ResourceType = "mana" | "fury" | "preparation";

export interface ClassPassive {
  name: string;
  description: string;
  short?: string;
}

export type AbilityKind =
  | "burst"
  | "dot"
  | "multi"
  | "heal"
  | "bite"
  | "trap"
  | "buff"
  | "whirlwind"
  | "freeze"
  | "holy_light"
  | "blind_powder"
  | "frost_shield"
  | "golem"
  | "serenity"
  | "eviscerate"
  | "vanish";

export interface AbilityDefinition {
  name: string;
  description: string;
  short?: string;
  manaCost: number;
  cooldown: number;
  kind: AbilityKind;
  power: number;
  magicPower?: number;
  magic: boolean;
  hits?: number;
  canMiss?: boolean;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  description: string;
  baseStats: BaseStats;
  resourceName: string;
  resourceType: ResourceType;
  passive: ClassPassive;
  passive2?: ClassPassive & { levelRequirement: number };
  passive3?: ClassPassive & { levelRequirement: number };
  ability: AbilityDefinition;
  ability2?: AbilityDefinition;
}

export type EquipmentSlot =
  | "weapon"
  | "shield"
  | "helm"
  | "armor"
  | "gloves"
  | "boots"
  | "belt"
  | "amulet"
  | "ring1"
  | "ring2";

export type ItemRarity = "normal" | "magic" | "rare" | "very rare" | "unique";

export interface ItemAffix {
  label: string;
  stat:
    | keyof BaseStats
    | "damage"
    | "defense"
    | "life"
    | "mana"
    | "magicDamage"
    | "goldFind"
    | "lifeLeech"
    | "magicDmgReduction"
    | "physDmgReduction"
    | "critChance"
    | "critDamageBonus"
    | "freezeOnHit"
    | "igniteOnHit"
    | "poisonOnHit"
    | "shockOnHit";
  value: number;
}

export interface Item {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  itemLevel: number;
  baseDamage?: [number, number];
  baseDefense?: number;
  twoHanded?: boolean;
  favorite?: boolean;
  weaponType?: string;
  affixes: ItemAffix[];
  mirrorRing?: boolean;
  demonsTail?: boolean;
  reapersHood?: boolean;
  spellbladesMask?: boolean;
  venomweaveWrap?: boolean;
  thornback?: boolean;
  eyeOfTheStorm?: boolean;
  boneweaveGloves?: boolean;
  crownOfTheFallen?: boolean;
  stormstring?: boolean;
  doomcrier?: boolean;
  arcanist?: boolean;
  eternitysEdge?: boolean;
  apprenticesFocus?: boolean;

  shadowfang?: boolean;
  aegisOfTheFortress?: boolean;
  penitentsGuard?: boolean;
  stoneguard?: boolean;
  heavensWrath?: boolean;
  graveToll?: boolean;
  bonechill?: boolean;
  ebonreap?: boolean;
  stormfist?: boolean;
  ironcladHauberk?: boolean;
  theGavel?: boolean;
  voidgaze?: boolean;
  bastionsRemnant?: boolean;
  bloodfist?: boolean;
  soulvoidGirdle?: boolean;
  openerBonusPct?: number;
  forsakenSigil?: boolean;
}

export interface RunStats {
  damageDealt: number;
  goldEarned: number;
  kills: number;
}

export interface Character {
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  gold: number;
  unspentStatPoints: number;
  allocatedStats: BaseStats;
  abilityCooldown: number;
  escapeTokens: number;
  runStats: RunStats;
}

export interface MonsterSpell {
  name: string;
  kind: "burst" | "dot" | "burn" | "drain";
  power: number;
  chance: number;
  cooldown: number;
}

export interface MonsterDefinition {
  name: string;
  level: number;
  life: number;
  damage: [number, number];
  defense: number;
  attackRating: number;
  xpReward: number;
  goldReward: [number, number];
  spell?: MonsterSpell;
}

export interface DungeonDefinition {
  id: string;
  name: string;
  description: string;
  waves: MonsterDefinition[];
  boss: MonsterDefinition;
  act: 1 | 2 | 3 | 4;
  endgame?: boolean;
}

export type ConsumableId = "healthPotion" | "manaPotion";

export interface ConsumableDefinition {
  id: ConsumableId;
  name: string;
  description: string;
  cost: number;
  restoreAmount: number;
}

export interface DeathSummary {
  characterName: string;
  classId: ClassId;
  level: number;
  damageDealt: number;
  goldEarned: number;
  kills: number;
}

export interface SaveGame {
  character: Character;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  inventory: Item[];
  clearedDungeons: string[];
  consumables: Record<ConsumableId, number>;
  shopStock: Item[];
  inCombat?: boolean;
  activeDungeonRun?: {
    dungeonId: string;
    index: number;
    currentLife: number;
    currentMana: number;
    currentCooldown: number;
    currentCooldown2: number;
    currentPreparation?: number;
    currentHolyLightCharges?: number;
  };
}
