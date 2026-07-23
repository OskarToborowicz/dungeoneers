import type { Character, MonsterDefinition, MonsterSpell } from "../types";
import { DUNGEONS } from "./dungeons";

// ── The Eternal Spire ────────────────────────────────────────────────────────
// Endless scaling tower unlocked at level 50. One monster per floor; every 5th
// floor is a Warden (tougher, has a spell) and grants a reward card + checkpoint.
// Stats scale LINEARLY with floor for now — easy to tune, and `npm run sim` can
// validate the curve. Displayed monster level = SPIRE_BASE_LEVEL + floor.
//
// The monster (regular floors) and boss (Warden floors) rosters are pulled from
// EVERY dungeon across all four acts, so the whole bestiary can appear. The
// lineup is seeded per character (name + class + mode), so each hero gets its
// own randomly generated tower that stays stable across renders and resumes.
// Names come straight from the dungeon data, so they already match MONSTER_TYPES.

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

// Full rosters drawn from every dungeon in every act. Regular floors pull a wave
// monster name; Warden floors pull a boss (name + its own spell). Deduped by name
// so repeats across dungeons don't skew the odds.
const SPIRE_MONSTER_NAMES: string[] = Array.from(
  new Set(DUNGEONS.flatMap((d) => d.waves.map((m) => m.name))),
);

const SPIRE_BOSSES: { name: string; spell?: MonsterSpell }[] = (() => {
  const seen = new Set<string>();
  const bosses: { name: string; spell?: MonsterSpell }[] = [];
  for (const d of DUNGEONS) {
    if (seen.has(d.boss.name)) continue;
    seen.add(d.boss.name);
    bosses.push({ name: d.boss.name, spell: d.boss.spell });
  }
  return bosses;
})();

// Deterministic per-character seed so a hero's tower is fixed for that hero but
// differs between heroes. Name is chosen at creation and never changes.
export function spireSeed(character: Character): string {
  return `${character.name}|${character.classId}|${character.mode}`;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 — small, fast, deterministic PRNG. One draw per (seed, floor).
function seededPick(seed: string, floor: number, length: number): number {
  let a = hashString(`${seed}#${floor}`);
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const rand = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return Math.floor(rand * length);
}

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
 *  harder, and carry a spell. The name/boss is picked from the full cross-act
 *  roster, seeded per character so the tower is fixed for that hero. */
export function generateSpireFloor(
  floor: number,
  seed = "",
): MonsterDefinition {
  const s = baseStats(floor);
  const level = SPIRE_BASE_LEVEL + floor;

  if (isWardenFloor(floor)) {
    const boss = SPIRE_BOSSES[seededPick(seed, floor, SPIRE_BOSSES.length)];
    return {
      name: boss.name,
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
      spell: boss.spell ? { ...boss.spell, cooldown: 4 } : undefined,
    };
  }

  return {
    name: SPIRE_MONSTER_NAMES[
      seededPick(seed, floor, SPIRE_MONSTER_NAMES.length)
    ],
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
    { kind: "gold", amount: Math.round((600 + floor * 320) * 9) },
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
