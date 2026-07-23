import type { MonsterDefinition, MonsterSpell } from "../types";

// ── The Eternal Spire ────────────────────────────────────────────────────────
// Endless scaling tower unlocked at level 50. One monster per floor; every 5th
// floor is a Warden (tougher, has a spell) and grants a reward card + checkpoint.
// Stats scale LINEARLY with floor for now — easy to tune, and `npm run sim` can
// validate the curve. Displayed monster level = SPIRE_BASE_LEVEL + floor.
//
// Names are pulled from the Act 4 (void/undead) roster so existing sprite art
// is reused — MonsterSprite maps by name, so these MUST match MONSTER_TYPES.

export const SPIRE_UNLOCK_LEVEL = 50;
export const SPIRE_BASE_LEVEL = 50;
export const WARDEN_INTERVAL = 5;

export function isWardenFloor(floor: number): boolean {
  return floor > 0 && floor % WARDEN_INTERVAL === 0;
}

/** The last Warden floor at or below `floor` (0 if none) — a resume checkpoint. */
export function checkpointForFloor(floor: number): number {
  return Math.floor(floor / WARDEN_INTERVAL) * WARDEN_INTERVAL;
}

const REGULAR_NAMES = [
  "Veil Wraith",
  "Hollow Specter",
  "Tomb Knight",
  "Void Cultist",
  "Bone Herald",
  "Shadow Stalker",
  "Drowned Revenant",
  "Wailing Banshee",
  "Phantom Crossbowman",
  "Nightmare Gargoyle",
  "Void Sentinel",
  "Lost Soul",
];

const WARDEN_NAMES = [
  "The Gatekeeper",
  "Prince Valdris the Damned",
  "The Pale Huntress",
  "General Morrath",
  "High Inquisitor Varek",
  "The Dreaming Horror",
  "Seraphel the Undying",
];

const WARDEN_SPELLS: Omit<MonsterSpell, "cooldown">[] = [
  { name: "Void Lance", kind: "burst", power: 1.7, chance: 0.4 },
  { name: "Withering Curse", kind: "dot", power: 1.4, chance: 0.4 },
  { name: "Soul Drain", kind: "drain", power: 1.5, chance: 0.4 },
  { name: "Hellfire", kind: "burn", power: 1.5, chance: 0.4 },
];

// Final stats (no monster() helper) so the curve is fully explicit here.
function baseStats(floor: number) {
  return {
    life: Math.round(240 + floor * 300),
    damage: [
      Math.round(22 + floor * 5),
      Math.round(36 + floor * 8),
    ] as [number, number],
    defense: Math.round(28 + floor * 3.4),
    attackRating: Math.round(70 + floor * 9),
    xpReward: Math.round(240 + floor * 130),
    goldReward: [
      Math.round(30 + floor * 14),
      Math.round(60 + floor * 26),
    ] as [number, number],
  };
}

/** The single monster for a given floor. Warden floors are ~2.5× tankier, hit
 *  harder, and carry a spell. */
export function generateSpireFloor(floor: number): MonsterDefinition {
  const s = baseStats(floor);
  const level = SPIRE_BASE_LEVEL + floor;

  if (isWardenFloor(floor)) {
    const wardenIdx = floor / WARDEN_INTERVAL - 1;
    const spell = WARDEN_SPELLS[wardenIdx % WARDEN_SPELLS.length];
    return {
      name: WARDEN_NAMES[wardenIdx % WARDEN_NAMES.length],
      level,
      life: Math.round(s.life * 2.5),
      damage: [Math.round(s.damage[0] * 1.4), Math.round(s.damage[1] * 1.4)],
      defense: Math.round(s.defense * 1.25),
      attackRating: Math.round(s.attackRating * 1.2),
      xpReward: Math.round(s.xpReward * 3),
      goldReward: [
        Math.round(s.goldReward[0] * 3),
        Math.round(s.goldReward[1] * 3),
      ],
      spell: { ...spell, cooldown: 4 },
    };
  }

  return {
    name: REGULAR_NAMES[(floor - 1) % REGULAR_NAMES.length],
    level,
    life: s.life,
    damage: s.damage,
    defense: s.defense,
    attackRating: s.attackRating,
    xpReward: s.xpReward,
    goldReward: s.goldReward,
  };
}

// ── Reward cards (offered after each Warden) ─────────────────────────────────
// A card describes WHAT to grant; App resolves the concrete effect (generating a
// unique, adding gold/stats/alloys) so this module stays free of item-gen deps.

export type SpireCard =
  | { kind: "alloy"; amount: number }
  | { kind: "gold"; amount: number }
  | { kind: "stats"; amount: number }
  | { kind: "unique"; itemLevel: number }
  | { kind: "rareWeapon"; itemLevel: number }
  | { kind: "rareJewelry"; itemLevel: number };

export interface RewardCardOptions {
  floor: number;
  currentAlloys: number; // to drop the alloy card once capped at 10
}

const CARD_COUNT = 2; // small pool for now — bump when more card types exist

export function rollRewardCards({
  floor,
  currentAlloys,
}: RewardCardOptions): SpireCard[] {
  const pool: SpireCard[] = [
    { kind: "gold", amount: Math.round(600 + floor * 320) },
    { kind: "stats", amount: 5 },
    { kind: "unique", itemLevel: SPIRE_BASE_LEVEL + floor },
    { kind: "rareWeapon", itemLevel: SPIRE_BASE_LEVEL + floor },
    { kind: "rareJewelry", itemLevel: SPIRE_BASE_LEVEL + floor },
  ];
  if (currentAlloys < 10) pool.push({ kind: "alloy", amount: 1 });

  // Shuffle and take CARD_COUNT distinct cards.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(CARD_COUNT, pool.length));
}
