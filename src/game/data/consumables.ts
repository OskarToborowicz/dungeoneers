import type { ConsumableDefinition, ConsumableId } from "../types";

export const POTION_RESTORE_RATE = 0.35;
export const POTION_COOLDOWN = 3;

export const CONSUMABLES: Record<ConsumableId, ConsumableDefinition> = {
  healthPotion: {
    id: "healthPotion",
    name: "Health Potion",
    description: `Restores 35% of max life instantly. ${POTION_COOLDOWN}-turn cooldown.`,
    cost: 12,
    restoreAmount: 0,
  },
  manaPotion: {
    id: "manaPotion",
    name: "Mana Potion",
    description: `Restores 35% of max mana instantly. ${POTION_COOLDOWN}-turn cooldown.`,
    cost: 12,
    restoreAmount: 0,
  },
};

export const CONSUMABLE_LIST = Object.values(CONSUMABLES);

export const EMPTY_CONSUMABLES: Record<ConsumableId, number> = {
  healthPotion: 0,
  manaPotion: 0,
};
