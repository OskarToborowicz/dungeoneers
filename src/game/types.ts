export type ClassId =
  | "barbarian"
  | "necromancer"
  | "sorceress"
  | "amazon"
  | "paladin"
  | "druid";

export interface BaseStats {
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
}

export type ResourceType = "mana" | "fury";

export interface ClassPassive {
  name: string;
  description: string;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  description: string;
  baseStats: BaseStats;
  resourceName: string;
  resourceType: ResourceType;
  passive: ClassPassive;
  ability: {
    name: string;
    description: string;
    manaCost: number;
    cooldown: number;
    kind: "burst" | "dot" | "multi" | "heal" | "bite";
    power: number;
    magic: boolean;
    hits?: number;
  };
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

export type ItemRarity = "normal" | "magic" | "rare" | "unique";

export interface ItemAffix {
  label: string;
  stat: keyof BaseStats | "damage" | "defense" | "life" | "mana";
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
  affixes: ItemAffix[];
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
}
