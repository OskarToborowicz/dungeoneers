import type { ConsumableDefinition, ConsumableId } from "../types";

// Flat at every act — clearing Act 1 no longer upgrades potency.
export const POTION_RESTORE_RATE = 0.4;
export const POTION_COOLDOWN = 3;

export const CONSUMABLES: Record<ConsumableId, ConsumableDefinition> = {
  healthPotion: {
    id: "healthPotion",
    name: "Health Potion",
    description: `Restores ${Math.round(POTION_RESTORE_RATE * 100)}% of max life instantly. ${POTION_COOLDOWN}-turn cooldown.`,
    cost: 0,
    restoreAmount: 0,
  },
};

export const EMPTY_CONSUMABLES: Record<ConsumableId, number> = {
  healthPotion: 0,
};

/**
 * Potions carried into a stage: one guaranteed, plus one per belt potion slot.
 * Potions are no longer purchasable, so this is the only source.
 */
export const BASE_POTIONS_PER_STAGE = 1;

export function getPotionsForStage(beltPotionSlots: number): number {
  return BASE_POTIONS_PER_STAGE + beltPotionSlots;
}
