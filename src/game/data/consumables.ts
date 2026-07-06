import type { ConsumableDefinition, ConsumableId } from "../types";

export const CONSUMABLES: Record<ConsumableId, ConsumableDefinition> = {
  healthPotion: {
    id: "healthPotion",
    name: "Health Potion",
    description: "Restores 60 life instantly.",
    cost: 12,
    restoreAmount: 60,
  },
  manaPotion: {
    id: "manaPotion",
    name: "Mana Potion",
    description: "Restores 45 mana instantly.",
    cost: 12,
    restoreAmount: 45,
  },
};

export const CONSUMABLE_LIST = Object.values(CONSUMABLES);

export const EMPTY_CONSUMABLES: Record<ConsumableId, number> = {
  healthPotion: 0,
  manaPotion: 0,
};
