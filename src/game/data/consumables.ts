import type { ConsumableDefinition, ConsumableId } from "../types";

export const POTION_RESTORE_RATE = 0.35;
export const POTION_RESTORE_RATE_ACT2 = 0.50;
export const POTION_COST_ACT2 = 250;
export const POTION_COOLDOWN = 3;

export function getPotionRestoreRate(clearedDungeons: string[]): number {
  return clearedDungeons.includes("diablo") ? POTION_RESTORE_RATE_ACT2 : POTION_RESTORE_RATE;
}

export const POTION_COST_BASE = 12;

export function getPotionCost(clearedDungeons: string[]): number {
  return clearedDungeons.includes("diablo") ? POTION_COST_ACT2 : POTION_COST_BASE;
}

export const CONSUMABLES: Record<ConsumableId, ConsumableDefinition> = {
  healthPotion: {
    id: "healthPotion",
    name: "Health Potion",
    description: `Restores 35% of max life instantly. ${POTION_COOLDOWN}-turn cooldown.`,
    cost: POTION_COST_BASE,
    restoreAmount: 0,
  },
  manaPotion: {
    id: "manaPotion",
    name: "Mana Potion",
    description: `Restores 35% of max mana instantly. ${POTION_COOLDOWN}-turn cooldown.`,
    cost: POTION_COST_BASE,
    restoreAmount: 0,
  },
};

export const CONSUMABLE_LIST = Object.values(CONSUMABLES);

export const EMPTY_CONSUMABLES: Record<ConsumableId, number> = {
  healthPotion: 0,
  manaPotion: 0,
};
