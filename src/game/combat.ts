import { CLASSES } from "./data/classes";
import { POTION_COOLDOWN, getPotionRestoreRate } from "./data/consumables";
import { FURY_PER_ATTACK } from "./character";
import type { DerivedStats } from "./character";
import type { Character, MonsterDefinition } from "./types";

export interface CombatLogEntry {
  actor: "player" | "monster";
  message: string;
  playerLife: number;
  monsterLife: number;
}

// All mutable per-combat state. Persisted to localStorage so fights survive a page refresh.
export interface BattleState {
  playerLife: number;
  playerMana: number; // Fury for Barbarian
  monsterLife: number;
  abilityCooldown: number; // Ability 1 turns remaining before it can be used again
  healthPotionCooldown: number;
  manaPotionCooldown: number;
  poisonRounds: number; // Monster poison ticks remaining (Necromancer Poison Cloud / Assassin Venom)
  poisonDamage: number; // Damage per tick, fixed at cast time
  monsterSpellCooldown: number; // Turns until boss can cast its spell again
  playerPoisonRounds: number; // Player poison ticks remaining (monster dot spell)
  playerPoisonDamage: number;
  playerBurnRounds: number; // Player burn ticks remaining (monster burn spell)
  playerBurnDamage: number;
  trapRounds: number; // Assassin Fire Trap: turns until detonation (0 = detonates this turn)
  bloodFuryRounds: number; // Barbarian Blood Fury active turns remaining
  ability2Cooldown: number;
  frozenRounds: number; // Amazon Freezing Shot: monster cannot act
  regenRounds: number; // Paladin Regenerating Nova: heals player each turn
  disorientRounds: number; // After Blind fades: monster deals 25% reduced damage
  blindRounds: number; // Assassin Blinding Powder: monster cannot act
  frostShieldRounds: number; // Sorceress Frost Shield: incoming damage reduced 60%
  burnStacks: { rounds: number; damage: number; source: string }[]; // Each Demon's Tail hit pushes an independent stack
  electrocuteRounds: number; // Stormstring on-hit: monster takes 20% more damage
  golemRounds: number; // Necromancer Golem Defense: turns remaining, redirects 30% of incoming dmg
  stunnedRounds: number; // Necromancer Golem Defense cast: monster cannot act for 1 turn
  absorbShield: number; // Temporary absorb buffer — damage hits this before playerLife; resets each round
}

export type PlayerActionKind =
  | "attack"
  | "ability"
  | "ability2"
  | "healthPotion"
  | "manaPotion";

export type BattleStatus = "ongoing" | "victory" | "defeat";

export interface CombatResult {
  victory: boolean;
  xpReward: number;
  goldReward: number;
  endingLife: number;
  endingMana: number;
  endingCooldown: number;
  endingCooldown2: number;
  damageDealt: number;
}

export interface RoundResult {
  state: BattleState;
  log: CombatLogEntry[];
  status: BattleStatus;
  damageDealt: number;
  monsterSpellCast?: string;
  trapDetonated?: boolean;
}

const ALWAYS_MISS_CHANCE = 0.02; // All player abilities/attacks have a flat 2% miss chance
const MONSTER_CRIT_CHANCE = 0.1;
const DEFAULT_CRIT_MULTIPLIER = 1.5;
const MANA_REGEN_RATE = 0.05; // 5% of max mana per turn (all mana classes except Sorceress)

// ─── Class passive constants ────────────────────────────────────────────────

// Barbarian
const BARBARIAN_DOUBLE_SWING_CHANCE = 0.25; // Base 25%; +25% while Blood Fury is active
const BARBARIAN_BLOOD_FURY_DAMAGE_BONUS = 0.2; // +20% damage while Blood Fury active
const BARBARIAN_BLOOD_FURY_LIFESTEAL = 0.2; // Steals 20% of all hit damage while active
const BARBARIAN_BLOOD_FURY_DOUBLE_SWING_BONUS = 0.25; // Extra Double Swing chance during Blood Fury
const BARBARIAN_IRON_SKIN_REDUCTION_PER_5PCT = 0.02; // 2% dmg reduction per 5% missing life (lv.20)
const BARBARIAN_MADNESS_DAMAGE_BONUS = 0.15; // +15% damage when Fury > 30 (lv.35)
const BARBARIAN_MADNESS_FURY_BONUS = 5; // +5 extra Fury per basic attack (lv.35)
const BARBARIAN_MADNESS_FURY_THRESHOLD = 30;

// Sorceress
const SORCERESS_MANA_REGEN_RATE = 0.1; // 10% mana per turn via Arcane Flow (lv.1)

// Paladin
const PALADIN_DAMAGE_TAKEN_HEAL = 0.15; // Divine Retribution: 15% of damage taken → life

// Necromancer
const NECROMANCER_SOUL_SIPHON = 0.15; // 15% of all magic damage dealt → life
const NECROMANCER_VIRULENCE_MULT = 1.25; // DoT ticks deal 25% more damage (lv.20)

// Monk
const MONK_SWEEPING_WIND_CHANCE = 0.3; // 30% bonus strike after basic attack
const MONK_SWEEPING_WIND_DAMAGE = 0.7; // Follow-up hits at 70% damage
const MONK_TRANSCENDENCE_REGEN = 0.07; // 7% max life regen per turn (lv.35)
const MONK_SERENITY_HEAL = 0.3; // Serenity heals 30% of max life
const MONK_COUNTER_ATTACK_CHANCE = 0.12; // 12% chance to counter-attack after monster hits

// Helpers

// Iron Skin: scales with missing life; 0 at full HP, ~16% at 40% missing.
function getIronSkinReduction(
  character: Character,
  currentLife: number,
  maxLife: number,
): number {
  if (character.classId !== "barbarian" || character.level < 20) return 0;
  const missingPct = Math.max(0, (1 - currentLife / maxLife) * 100);
  return Math.floor(missingPct / 5) * BARBARIAN_IRON_SKIN_REDUCTION_PER_5PCT;
}

// Monster physical hit chance: clamped between 15% and 98%.
function rollHitChance(attackRating: number, defense: number): number {
  const chance = attackRating / (defense * 1.5);
  return Math.max(0.15, Math.min(1 - ALWAYS_MISS_CHANCE, chance));
}

function randomInRange([min, max]: [number, number]): number {
  return Math.round(min + Math.random() * (max - min));
}

// Base formula for burst/dot/multi/heal abilities.
// magic abilities add flat magicDamageBonus (scaled by magicPower) and apply magicDamageMult.
function rollAbilityDamage(
  stats: DerivedStats,
  power: number,
  magic: boolean,
  magicPower = 1,
): number {
  const base = Math.round(randomInRange(stats.damage) * power);
  return magic
    ? Math.round(
        (base + stats.magicDamageBonus * magicPower) * stats.magicDamageMult,
      )
    : base;
}

export function createBattleState(
  monster: MonsterDefinition,
  startingLife: number,
  startingMana: number,
  startingCooldown: number,
  startingCooldown2 = 0,
): BattleState {
  return {
    playerLife: startingLife,
    playerMana: startingMana,
    monsterLife: monster.life,
    abilityCooldown: startingCooldown,
    healthPotionCooldown: 0,
    manaPotionCooldown: 0,
    poisonRounds: 0,
    poisonDamage: 0,
    monsterSpellCooldown: 0,
    playerPoisonRounds: 0,
    playerPoisonDamage: 0,
    playerBurnRounds: 0,
    playerBurnDamage: 0,
    trapRounds: 0,
    bloodFuryRounds: 0,
    ability2Cooldown: startingCooldown2,
    frozenRounds: 0,
    regenRounds: 0,
    disorientRounds: 0,
    blindRounds: 0,
    frostShieldRounds: 0,
    burnStacks: [],
    electrocuteRounds: 0,
    golemRounds: 0,
    stunnedRounds: 0,
    absorbShield: 0,
  };
}

export function canUseAbility(
  character: Character,
  state: BattleState,
): boolean {
  const def = CLASSES[character.classId];
  if (def.ability.kind === "trap" && state.trapRounds > 0) return false;
  if (def.ability.kind === "buff" && state.bloodFuryRounds > 0) return false;
  return state.playerMana >= def.ability.manaCost && state.abilityCooldown <= 0;
}

export function canUseAbility2(
  character: Character,
  state: BattleState,
): boolean {
  const def = CLASSES[character.classId];
  if (!def.ability2) return false;
  if (def.ability2.kind === "regen" && state.regenRounds > 0) return false;
  if (def.ability2.kind === "frost_shield" && state.frostShieldRounds > 0)
    return false;
  if (def.ability2.kind === "golem" && state.golemRounds > 0) return false; // Can't re-summon while active
  return (
    state.playerMana >= def.ability2.manaCost && state.ability2Cooldown <= 0
  );
}

const AMAZON_FIND_WEAKNESS_CRIT = 0.15;
const AMAZON_DODGE_CHANCE = 0.15;

export function getEffectiveCritChance(
  character: Character,
  stats: DerivedStats,
): number {
  const amazonBonus =
    character.classId === "amazon" && character.level >= 20
      ? AMAZON_FIND_WEAKNESS_CRIT
      : 0;
  return Math.min(0.9, stats.critChance + amazonBonus);
}

export function getCritMultiplier(_character: Character): number {
  return DEFAULT_CRIT_MULTIPLIER;
}

export function rollGoldReward(
  monster: MonsterDefinition,
  goldFindBonus = 0,
): number {
  const base = randomInRange(monster.goldReward);
  return Math.round(base * (1 + goldFindBonus / 100));
}

export interface DamagePreview {
  label: string;
  type: string;
}

export function getAttackPreview(
  character: Character,
  stats: DerivedStats,
): DamagePreview {
  const [min, max] = stats.damage;
  const critChance = getEffectiveCritChance(character, stats);
  const critMult = getCritMultiplier(character);
  const critHigh = Math.round(max * critMult);
  const critPct = Math.round(critChance * 100);
  return {
    label: `${min}–${max} (${critPct}% crit → ${critHigh})`,
    type: "Physical",
  };
}

export function getAbilityPreview(
  character: Character,
  stats: DerivedStats,
): DamagePreview {
  const def = CLASSES[character.classId];
  const ability = def.ability;
  const avg = (stats.damage[0] + stats.damage[1]) / 2;
  const bonus = ability.magic ? stats.magicDamageBonus : 0;
  const dmgType = ability.magic ? "Magic" : "Physical";

  if (ability.kind === "buff") {
    return { label: "—", type: "Buff" };
  }
  if (ability.kind === "burst") {
    const est = Math.round(
      (avg * ability.power + bonus * (ability.magicPower ?? 1)) *
        stats.magicDamageMult,
    );
    return { label: `~${est}`, type: dmgType };
  }
  if (ability.kind === "dot") {
    const initial = Math.round(avg * 0.4 + bonus);
    const tick = Math.round(avg * ability.power * 0.4 + bonus);
    return { label: `~${initial} + 3×${tick}`, type: "Poison" };
  }
  if (ability.kind === "multi") {
    const hits = ability.hits ?? 2;
    const est = Math.round(avg * ability.power + bonus);
    return { label: `${hits}× ~${est}`, type: dmgType };
  }
  if (ability.kind === "heal") {
    const est = Math.round(avg * ability.power + bonus);
    const heal = Math.round(est * 0.35);
    return { label: `~${est} + ${heal} heal`, type: dmgType };
  }
  if (ability.kind === "bite") {
    const est = Math.round(avg + stats.stats.dexterity * 1.5);
    const heal = Math.round(est * 0.15);
    return { label: `~${est} + ${heal} heal`, type: "Physical" };
  }
  if (ability.kind === "trap") {
    const est = Math.round(stats.stats.dexterity * ability.power);
    return { label: `~${est}`, type: "Physical" };
  }
  return { label: "—", type: dmgType };
}

export function getAbility2Preview(
  character: Character,
  stats: DerivedStats,
): DamagePreview {
  const def = CLASSES[character.classId];
  if (!def.ability2) return { label: "—", type: "Physical" };
  const ability = def.ability2;
  if (ability.kind === "obliterate") {
    const avg = Math.round((stats.damage[0] + stats.damage[1]) / 2);
    const est = avg + Math.round(stats.stats.strength * 0.5);
    return { label: `~${est}`, type: "Physical" };
  }
  if (ability.kind === "freeze") {
    const avg = Math.round((stats.damage[0] + stats.damage[1]) / 2);
    const dexBonus = Math.round(stats.stats.dexterity * 0.5);
    return { label: `~${avg + dexBonus}`, type: "Physical" };
  }
  if (ability.kind === "blind_powder") {
    return { label: "—", type: "Debuff" };
  }
  if (ability.kind === "frost_shield") {
    return { label: "—", type: "Buff" };
  }
  if (ability.kind === "regen") {
    const healPerTick = Math.round(stats.maxLife * 0.1);
    return { label: `3× ${healPerTick} heal`, type: "Heal" };
  }
  if (ability.kind === "golem") {
    return { label: "Stun 1 turn + 30% reflect × 3", type: "Buff" };
  }
  if (ability.kind === "serenity") {
    const healAmt = Math.round(stats.maxLife * 0.3);
    return { label: `${healAmt} heal + cleanse + blind`, type: "Heal" };
  }
  return { label: "—", type: "Physical" };
}

// ─── Main turn resolver ──────────────────────────────────────────────────────
//
// Turn order:
//   1. Player action (attack / ability / ability2 / potion)
//   2. Post-action cooldowns & buffs tick down
//   3. Mana regen
//   4. [Early return if monster dies]
//   5. Player DoT/burn ticks (monster-sourced)
//   6. Enemy poison ticks (player-sourced)
//   7. Burn stacks tick
//   8. Trap countdown
//   9. Monster spell cooldown tick
//  10. Monster acts (unless stunned / frozen / blinded)
//  11. Frost Shield rounds tick
//  12. Fire Trap detonation (trapRounds just hit 0)
//  13. Golem rounds tick
//  14. Victory / defeat check
export function resolveRound(
  character: Character,
  stats: DerivedStats,
  monster: MonsterDefinition,
  state: BattleState,
  action: PlayerActionKind,
  clearedDungeons: string[] = [],
): RoundResult {
  const def = CLASSES[character.classId];
  const log: CombatLogEntry[] = [];

  const critChance = getEffectiveCritChance(character, stats);
  const critMultiplier = getCritMultiplier(character);

  // Blood Barrier (Necromancer lv.35): Soul Siphon and lifesteal can overheal up to 125% max life.
  // Potions and other class heals always cap at 100%.
  // const bloodBarrierCap = character.classId === "necromancer" && character.level >= 35 ? stats.maxLife * 1.25 : stats.maxLife;

  let {
    playerLife,
    playerMana,
    monsterLife,
    abilityCooldown,
    healthPotionCooldown,
    manaPotionCooldown,
    poisonRounds,
    poisonDamage,
    monsterSpellCooldown,
    playerPoisonRounds,
    playerPoisonDamage,
    playerBurnRounds,
    playerBurnDamage,
    trapRounds,
    bloodFuryRounds,
    ability2Cooldown,
    frozenRounds,
    regenRounds,
    disorientRounds,
    blindRounds,
    frostShieldRounds,
    electrocuteRounds,
    golemRounds,
    stunnedRounds,
  } = state;
  let absorbShield = 0; // Resets every round — overheal from last turn does not carry over
  let burnStacks = state.burnStacks.map((s) => ({ ...s }));
  let serenityBlindThisTurn = false;

  // Multipliers computed once per round from current state
  const electrocuteMult = electrocuteRounds > 0 ? 1.2 : 1.0;
  // Deathwhisper (Assassin unique): +30% all damage while enemy is blinded or disoriented
  const deathwhisperMult =
    stats.deathwhisperBoost && (blindRounds > 0 || disorientRounds > 0)
      ? 1.3
      : 1.0;
  // Heartseeker follow-up arrow: 50% of crit damage, or 70% with Doomcrier equipped
  const heartseekerMult = stats.heartseekerBoost ? 0.7 : 0.5;
  let damageDealt = 0;
  let trapDetonated = false;
  // The Pentagram: +100 damage but only when below 30% life
  const lowLifeMult =
    stats.lowLifeDamageBonus > 0 && playerLife < stats.maxLife * 0.3
      ? 1 + stats.lowLifeDamageBonus
      : 1.0;

  // Blood Barrier (Necromancer lv.35): excess healing beyond maxLife fills absorbShield (cap: 25% of maxLife).
  // Any other class just clamps to maxLife.
  const applyHeal = (amount: number) => {
    if (amount <= 0) return;
    const space = stats.maxLife - playerLife;
    if (
      space >= amount ||
      character.classId !== "necromancer" ||
      character.level < 35
    ) {
      playerLife = Math.min(stats.maxLife, playerLife + amount);
    } else {
      playerLife = stats.maxLife;
      const overflow = amount - space;
      absorbShield = Math.min(stats.maxLife * 0.25, absorbShield + overflow);
    }
  };

  // Demon's Tail belt: every direct hit pushes an independent burn stack (30% of hit, 2 turns).
  const tryIgnite = (dmg: number, source = "Demon's Tail") => {
    if (stats.igniteChance > 0 && dmg > 0 && monsterLife > 0) {
      const igniteDmg = Math.round(dmg * 0.3);
      burnStacks.push({ rounds: 2, damage: igniteDmg, source });
      log.push({
        actor: "player",
        message: `${source} ignites the enemy — ${igniteDmg} fire per turn for 2 turns!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  };

  // ── Basic attack ────────────────────────────────────────────────────────────
  // Shared by direct attacks, Blood Fury activation, and Regenerating Nova activation.
  // Handles: Barbarian Double Swing, Blood Fury lifesteal, Madness, Life Leech,
  //          Electrocute proc, Heartseeker, Assassin Venom, Shadowfang, Fury generation.
  const doBasicAttack = () => {
    const hitChance = 1 - ALWAYS_MISS_CHANCE;
    let damageMult = 1.0;
    if (bloodFuryRounds > 0)
      damageMult *= 1 + BARBARIAN_BLOOD_FURY_DAMAGE_BONUS;
    if (
      character.classId === "barbarian" &&
      character.level >= 35 &&
      playerMana > BARBARIAN_MADNESS_FURY_THRESHOLD
    )
      damageMult *= 1 + BARBARIAN_MADNESS_DAMAGE_BONUS;
    if (character.classId === "assassin" && character.level >= 35)
      damageMult *= 1.1; // Assassin's Advantage
    if (lowLifeMult > 1.0) damageMult *= lowLifeMult;
    // Assassin's Advantage: +5% crit against poisoned enemies
    const assassinAdvantageCrit =
      character.classId === "assassin" &&
      character.level >= 35 &&
      poisonRounds > 0
        ? 0.05
        : 0;
    let basicHitDmg = 0;
    let basicHitCrit = false;

    if (Math.random() < hitChance) {
      const isCrit = Math.random() < critChance + assassinAdvantageCrit;
      basicHitCrit = isCrit;
      let dmg = Math.round(
        randomInRange(stats.damage) *
          damageMult *
          electrocuteMult *
          deathwhisperMult,
      );
      if (isCrit) dmg = Math.round(dmg * critMultiplier);
      monsterLife -= dmg;
      damageDealt += dmg;
      basicHitDmg = dmg;

      let attackMsg = isCrit
        ? `Critical hit! You deal ${dmg} damage.`
        : `You attack for ${dmg} damage.`;

      // Blood Fury lifesteal (Barbarian ability): also uses bloodBarrierCap for Necromancer cross-use safety
      if (bloodFuryRounds > 0) {
        const stolen = Math.round(dmg * BARBARIAN_BLOOD_FURY_LIFESTEAL);
        if (stolen > 0) {
          applyHeal(stolen);
          attackMsg += ` Blood Fury steals ${stolen} life.`;
        }
      }
      // Life Leech affix: heals % of physical damage dealt
      if (stats.lifeLeechBonus > 0) {
        const leeched = Math.round((dmg * stats.lifeLeechBonus) / 100);
        if (leeched > 0) {
          applyHeal(leeched);
          attackMsg += ` Life Leech restores ${leeched} life.`;
        }
      }
      // Stormstring unique bow: applies Electrocute on every hit
      if (stats.electrocuteOnHit) {
        electrocuteRounds = 2;
        attackMsg += ` Electrocute! Enemy takes 20% more damage for 2 turns.`;
      }
      // Reaper's Hood: 20% chance to disorient on attack
      if (
        stats.disorientOnAttackChance > 0 &&
        Math.random() < stats.disorientOnAttackChance / 100
      ) {
        disorientRounds = 2;
        attackMsg += ` Reaper's Hood disorients the enemy!`;
      }
      log.push({
        actor: "player",
        message: attackMsg,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
      tryIgnite(basicHitDmg);
    } else {
      log.push({
        actor: "player",
        message: "Your attack misses.",
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }

    // Fury generation on attack (Barbarian only)
    if (def.resourceType === "fury") {
      const madnessFuryBonus =
        character.classId === "barbarian" && character.level >= 35
          ? BARBARIAN_MADNESS_FURY_BONUS
          : 0;
      playerMana = Math.min(
        stats.maxMana,
        playerMana + FURY_PER_ATTACK + madnessFuryBonus,
      );
    }

    // Heartseeker (Amazon lv.35): fires a follow-up arrow after any crit; cannot itself crit
    if (
      character.classId === "amazon" &&
      character.level >= 35 &&
      basicHitCrit &&
      basicHitDmg > 0 &&
      monsterLife > 0
    ) {
      const heartseekerDmg = Math.round(basicHitDmg * heartseekerMult);
      monsterLife -= heartseekerDmg;
      damageDealt += heartseekerDmg;
      log.push({
        actor: "player",
        message: `Heartseeker fires for ${heartseekerDmg} damage!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }

    // Judgement (Paladin lv.35): bonus holy damage (25% Magic) + strength damage (30% Strength)
    if (
      character.classId === "paladin" &&
      character.level >= 35 &&
      basicHitDmg > 0 &&
      monsterLife > 0
    ) {
      const holyDmg = Math.round(stats.magicDamageBonus * 0.25);
      const strDmg = Math.round(
        (character.allocatedStats.strength + def.baseStats.strength) * 0.25,
      );
      const judgementDmg = holyDmg + strDmg;
      if (judgementDmg > 0) {
        monsterLife -= judgementDmg;
        damageDealt += judgementDmg;
        log.push({
          actor: "player",
          message: `Judgement strikes for ${judgementDmg} holy damage!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    }

    // Venom (Assassin lv.20): basic attacks apply 2-turn poison at 30% of hit damage
    if (
      character.classId === "assassin" &&
      character.level >= 20 &&
      basicHitDmg > 0
    ) {
      poisonRounds = 2;
      poisonDamage = Math.round(basicHitDmg * 0.3 * stats.poisonDamageMult);
      log.push({
        actor: "player",
        message: `Venom seeps in — ${poisonDamage} poison per turn for 2 turns.`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }

    // Spellblade's Mask: converts physical damage into a bonus magic hit (scales with magicDamageBonus)
    if (stats.spellbladesMask && basicHitDmg > 0 && monsterLife > 0) {
      const magicDmg = Math.max(
        1,
        Math.round(
          (basicHitDmg * 0.1 + stats.magicDamageBonus * 0.1) *
            stats.magicDamageMult,
        ),
      );
      monsterLife -= magicDmg;
      damageDealt += magicDmg;
      log.push({
        actor: "player",
        message: `Spellblade's Mask converts the strike — ${magicDmg} magic damage!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }

    // Shadowfang unique claw: 20% chance for a phantom strike at 50% damage after each hit
    if (
      stats.shadowfangProc &&
      basicHitDmg > 0 &&
      monsterLife > 0 &&
      Math.random() < 0.2
    ) {
      const phantomDmg = Math.round(basicHitDmg * 0.5);
      monsterLife -= phantomDmg;
      damageDealt += phantomDmg;
      log.push({
        actor: "player",
        message: `Shadowfang — a phantom strikes for ${phantomDmg} damage!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }

    // Double Swing (Barbarian passive): 25% base chance, +25% during Blood Fury
    const doubleSwingChance =
      BARBARIAN_DOUBLE_SWING_CHANCE +
      (bloodFuryRounds > 0 ? BARBARIAN_BLOOD_FURY_DOUBLE_SWING_BONUS : 0);
    if (
      character.classId === "barbarian" &&
      monsterLife > 0 &&
      Math.random() < doubleSwingChance
    ) {
      const hitChance2 = 1 - ALWAYS_MISS_CHANCE;
      if (Math.random() < hitChance2) {
        const isCrit2 = Math.random() < critChance;
        let dmg2 = Math.round(randomInRange(stats.damage) * damageMult);
        if (isCrit2) dmg2 = Math.round(dmg2 * critMultiplier);
        monsterLife -= dmg2;
        damageDealt += dmg2;

        let swingMsg = isCrit2
          ? `Double Swing! Critical hit — ${dmg2} damage!`
          : `Double Swing! You strike again for ${dmg2} damage.`;
        if (bloodFuryRounds > 0) {
          const stolen2 = Math.round(dmg2 * BARBARIAN_BLOOD_FURY_LIFESTEAL);
          if (stolen2 > 0) {
            applyHeal(stolen2);
            swingMsg += ` Blood Fury steals ${stolen2} life.`;
          }
        }
        if (stats.lifeLeechBonus > 0) {
          const leeched2 = Math.round((dmg2 * stats.lifeLeechBonus) / 100);
          if (leeched2 > 0) {
            applyHeal(leeched2);
            swingMsg += ` Life Leech restores ${leeched2} life.`;
          }
        }
        log.push({
          actor: "player",
          message: swingMsg,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg2);
      } else {
        log.push({
          actor: "player",
          message: "Double Swing! Your second strike misses.",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    }

    // Sweeping Wind (Monk passive): 30% chance for a follow-up strike at 70% damage
    if (
      character.classId === "monk" &&
      monsterLife > 0 &&
      Math.random() < MONK_SWEEPING_WIND_CHANCE
    ) {
      const hitChanceSW = 1 - ALWAYS_MISS_CHANCE;
      if (Math.random() < hitChanceSW) {
        const isCritSW = Math.random() < critChance;
        let dmgSW = Math.round(
          randomInRange(stats.damage) *
            MONK_SWEEPING_WIND_DAMAGE *
            electrocuteMult,
        );
        if (isCritSW) dmgSW = Math.round(dmgSW * critMultiplier);
        monsterLife -= dmgSW;
        damageDealt += dmgSW;
        log.push({
          actor: "player",
          message: isCritSW
            ? `Sweeping Wind! Critical follow-up — ${dmgSW} damage!`
            : `Sweeping Wind! You follow up for ${dmgSW} damage.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmgSW);
      }
    }
  };

  // ── Step 1: Player action ────────────────────────────────────────────────────
  if (monsterLife > 0) {
    const useAbility =
      action === "ability" &&
      playerMana >= def.ability.manaCost &&
      abilityCooldown <= 0;

    if (useAbility) {
      playerMana -= def.ability.manaCost;
      abilityCooldown = def.ability.cooldown;

      if (def.ability.canMiss !== false && Math.random() < ALWAYS_MISS_CHANCE) {
        log.push({
          actor: "player",
          message: `Your ${def.ability.name} fails to connect.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });

        // ── Blood Fury (Barbarian) ────────────────────────────────────────────
        // Activates a 3-turn buff; player still attacks this turn.
      } else if (def.ability.kind === "buff") {
        bloodFuryRounds = 3;
        log.push({
          actor: "player",
          message: "Blood Fury ignites! You surge with primal power.",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        doBasicAttack();

        // ── Fireball / burst abilities (Sorceress) ────────────────────────────
        // Single-hit magic damage. Arcanist staff adds +40% when Frost Shield is up.
        // Eternity's Edge: 30% chance to echo at 50% power.
      } else if (def.ability.kind === "burst") {
        const isCrit = Math.random() < critChance;
        const arcanistMult =
          stats.arcanistStaff && frostShieldRounds > 0 ? 1.4 : 1.0;
        let dmg = Math.round(
          rollAbilityDamage(
            stats,
            def.ability.power,
            def.ability.magic,
            def.ability.magicPower,
          ) *
            lowLifeMult *
            electrocuteMult *
            deathwhisperMult *
            arcanistMult,
        );
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
        const arcanistNote =
          arcanistMult > 1.0 ? " Frost Shield channels the arcane!" : "";
        log.push({
          actor: "player",
          message: isCrit
            ? `Critical hit! ${def.ability.name} strikes for ${dmg} damage!${arcanistNote}`
            : `You unleash ${def.ability.name} for ${dmg} damage!${arcanistNote}`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);
        if (
          stats.burstEchoChance > 0 &&
          monsterLife > 0 &&
          Math.random() < stats.burstEchoChance
        ) {
          const echoDmg = Math.round(dmg * 0.5);
          monsterLife -= echoDmg;
          damageDealt += echoDmg;
          log.push({
            actor: "player",
            message: `Eternity's Edge echoes the spell for ${echoDmg} damage!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }

        // ── Poison Cloud (Necromancer) ────────────────────────────────────────
        // Initial magic hit (can crit) + 3 poison ticks fixed at cast time.
        // Soul Siphon heals 15% of the initial hit. Virulence (lv.20) multiplies tick damage.
      } else if (def.ability.kind === "dot") {
        const isCrit = Math.random() < critChance;
        let dmg = Math.round(
          rollAbilityDamage(stats, 0.4, def.ability.magic) *
            lowLifeMult *
            electrocuteMult *
            deathwhisperMult,
        );
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
        poisonRounds = 3;
        const virulenceMult =
          character.classId === "necromancer" && character.level >= 20
            ? NECROMANCER_VIRULENCE_MULT
            : 1.0;
        poisonDamage = Math.round(
          rollAbilityDamage(stats, def.ability.power * 0.4, def.ability.magic) *
            stats.poisonDamageMult *
            virulenceMult,
        );
        const siphonHitHeal =
          character.classId === "necromancer"
            ? Math.round(dmg * NECROMANCER_SOUL_SIPHON)
            : 0;
        if (siphonHitHeal > 0) {
          applyHeal(siphonHitHeal);
        }
        log.push({
          actor: "player",
          message: isCrit
            ? `Critical hit! ${def.ability.name} strikes for ${dmg} damage, poisoning the enemy!${siphonHitHeal > 0 ? ` Soul Siphon heals ${siphonHitHeal}.` : ""}`
            : `You strike with ${def.ability.name} for ${dmg} damage, poisoning the enemy!${siphonHitHeal > 0 ? ` Soul Siphon heals ${siphonHitHeal}.` : ""}`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);

        // ── Multishot (Amazon) ────────────────────────────────────────────────
        // Multiple independent hits; each can crit and trigger Heartseeker.
      } else if (def.ability.kind === "multi") {
        const hitCount = def.ability.hits ?? 3;
        for (let i = 0; i < hitCount; i++) {
          if (monsterLife <= 0) break;

          let hitDmg = Math.round(
            rollAbilityDamage(stats, def.ability.power, def.ability.magic) *
              lowLifeMult *
              electrocuteMult *
              deathwhisperMult,
          );
          const isHitCrit = Math.random() < critChance;
          if (isHitCrit) hitDmg = Math.round(hitDmg * critMultiplier);

          monsterLife -= hitDmg;
          damageDealt += hitDmg;

          log.push({
            actor: "player",
            message: isHitCrit
              ? `Critical hit! ${def.ability.name} strikes for ${hitDmg} damage!`
              : `${def.ability.name} strikes for ${hitDmg} damage.`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
          tryIgnite(hitDmg);

          // Sweeping Wind (Monk passive): 30% chance per kick to deal 25% extra damage on that hit
          if (
            character.classId === "monk" &&
            monsterLife > 0 &&
            Math.random() < MONK_SWEEPING_WIND_CHANCE
          ) {
            const swDmg = Math.max(1, Math.round(hitDmg * 0.25));
            monsterLife -= swDmg;
            damageDealt += swDmg;
            log.push({
              actor: "player",
              message: `Sweeping Wind empowers the kick for ${swDmg} bonus damage!`,
              playerLife: Math.max(0, playerLife),
              monsterLife: Math.max(0, monsterLife),
            });
          }

          // Heartseeker fires after each Multishot arrow that crits
          if (
            character.classId === "amazon" &&
            character.level >= 35 &&
            isHitCrit &&
            monsterLife > 0
          ) {
            const heartseekerDmg = Math.round(hitDmg * heartseekerMult);
            monsterLife -= heartseekerDmg;
            damageDealt += heartseekerDmg;
            log.push({
              actor: "player",
              message: `Heartseeker fires for ${heartseekerDmg} damage!`,
              playerLife: Math.max(0, playerLife),
              monsterLife: Math.max(0, monsterLife),
            });
          }
        }

        // ── Holy Bolt (Paladin) ───────────────────────────────────────────────
        // Magic damage + heals 35% of damage dealt. Caps heal at maxLife (no Blood Barrier).
      } else if (def.ability.kind === "heal") {
        const isCrit = Math.random() < critChance;
        let dmg = Math.round(
          rollAbilityDamage(
            stats,
            def.ability.power,
            def.ability.magic,
            def.ability.magicPower ?? 1,
          ) *
            lowLifeMult *
            electrocuteMult *
            deathwhisperMult,
        );
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        const healAmt = Math.round(dmg * 0.35);
        monsterLife -= dmg;
        damageDealt += dmg;
        playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        log.push({
          actor: "player",
          message: isCrit
            ? `Critical hit! ${def.ability.name} strikes for ${dmg} damage and heals ${healAmt} life!`
            : `You call upon ${def.ability.name}, dealing ${dmg} damage and healing ${healAmt} life!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);

        // ── Werewolf Bite (Druid) ─────────────────────────────────────────────
        // Physical: weapon roll + 1.5× Dex. Heals 15% of damage. No crit roll.
      } else if (def.ability.kind === "bite") {
        const baseDmg = randomInRange(stats.damage);
        const dexBonus = Math.round(stats.stats.dexterity * 1.5);
        const dmg = Math.round(
          (baseDmg + dexBonus) *
            lowLifeMult *
            electrocuteMult *
            deathwhisperMult,
        );
        const healAmt = Math.round(dmg * 0.15);
        monsterLife -= dmg;
        damageDealt += dmg;
        playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        log.push({
          actor: "player",
          message: `${def.ability.name} tears for ${dmg} damage (${baseDmg} + ${dexBonus} dex) and heals ${healAmt} life!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);

        // ── Fire Trap (Assassin) ──────────────────────────────────────────────
        // Sets trapRounds = 3; detonates after monster acts on the turn it hits 0.
      } else if (def.ability.kind === "trap") {
        trapRounds = 3;
        log.push({
          actor: "player",
          message: "You plant a Fire Trap!",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    } else if (
      action === "ability2" &&
      def.ability2 &&
      playerMana >= def.ability2.manaCost &&
      ability2Cooldown <= 0
    ) {
      const furyBeforeCost = playerMana;
      playerMana -= def.ability2.manaCost;
      ability2Cooldown = def.ability2.cooldown;

      // ── Freezing Shot (Amazon) ────────────────────────────────────────────
      // Physical hit (weapon + 0.5× Dex). On hit, freezes monster for 2 turns.
      if (def.ability2.kind === "freeze") {
        if (
          def.ability2.canMiss !== false &&
          Math.random() < ALWAYS_MISS_CHANCE
        ) {
          log.push({
            actor: "player",
            message: "Your Freezing Shot misses.",
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        } else {
          const baseDmg = randomInRange(stats.damage);
          const dexBonus = Math.round(stats.stats.dexterity * 0.5);
          const isCrit = Math.random() < critChance;
          let dmg = Math.round(
            (baseDmg + dexBonus) *
              lowLifeMult *
              electrocuteMult *
              deathwhisperMult,
          );
          if (isCrit) dmg = Math.round(dmg * critMultiplier);
          monsterLife -= dmg;
          damageDealt += dmg;
          frozenRounds = 2;
          log.push({
            actor: "player",
            message: isCrit
              ? `Critical hit! Freezing Shot strikes for ${dmg} damage (${baseDmg} + ${dexBonus} dex) — the target is frozen!`
              : `Freezing Shot strikes for ${dmg} damage (${baseDmg} + ${dexBonus} dex) — the target is frozen!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
          tryIgnite(dmg);
        }

        // ── Obliterate (Barbarian) ────────────────────────────────────────────
        // Physical hit: weapon + 0.5× Strength. Madness bonus applies if Fury was > 30.
        // Killing blow restores 10% max life.
      } else if (def.ability2.kind === "obliterate") {
        const madnessMult =
          character.classId === "barbarian" &&
          character.level >= 35 &&
          furyBeforeCost > BARBARIAN_MADNESS_FURY_THRESHOLD
            ? 1 + BARBARIAN_MADNESS_DAMAGE_BONUS
            : 1.0;
        const baseDmg = randomInRange(stats.damage);
        const strBonus = Math.round(stats.stats.strength * 0.5);
        const dmg = Math.round(
          (baseDmg + strBonus) *
            madnessMult *
            lowLifeMult *
            electrocuteMult *
            deathwhisperMult,
        );
        const killingBlow = monsterLife - dmg <= 0;
        monsterLife -= dmg;
        damageDealt += dmg;
        const healAmt = killingBlow ? Math.round(stats.maxLife * 0.1) : 0;
        if (healAmt > 0)
          playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        log.push({
          actor: "player",
          message: killingBlow
            ? `Obliterate! You deal ${dmg} damage (${baseDmg} + ${strBonus} str) — killing blow! You recover ${healAmt} life.`
            : `Obliterate! You deal ${dmg} damage (${baseDmg} + ${strBonus} str).`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);

        // ── Blinding Powder (Assassin) ────────────────────────────────────────
        // Blinds for 2 turns (no action); when blind expires → 4 turns of disorient (25% reduced dmg).
      } else if (def.ability2.kind === "blind_powder") {
        blindRounds = 2;
        disorientRounds = 0;
        log.push({
          actor: "player",
          message:
            "You hurl Blinding Powder! The enemy is blinded (2 turns) and disoriented (4 turns).",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });

        // ── Frost Shield (Sorceress) ──────────────────────────────────────────
        // All incoming damage reduced by 60% for 3 turns. Cannot be recast while active.
      } else if (def.ability2.kind === "frost_shield") {
        frostShieldRounds = 3;
        log.push({
          actor: "player",
          message:
            "Frost Shield encases you in magical ice — incoming damage reduced by 60% for 3 turns!",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });

        // ── Regenerating Nova (Paladin) ───────────────────────────────────────
        // Immediate first heal tick + 2 more on subsequent turns. Player also attacks this turn.
      } else if (def.ability2.kind === "regen") {
        regenRounds = 3;
        const firstHeal = Math.round(stats.maxLife * 0.1);
        playerLife = Math.min(stats.maxLife, playerLife + firstHeal);
        log.push({
          actor: "player",
          message: `Regenerating Nova radiates holy light — you recover ${firstHeal} life! (3 turns)`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        doBasicAttack();

        // ── Golem Defense (Necromancer) ───────────────────────────────────────
        // Stuns enemy for 1 turn (stunnedRounds). Golem stands on field for 3 turns,
        // redirecting 30% of all incoming damage back at the enemy each turn.
      } else if (def.ability2.kind === "golem") {
        golemRounds = 3;
        stunnedRounds = 1;
        log.push({
          actor: "player",
          message: `The Stone Golem rolls in and stuns ${monster.name}! It will redirect 30% of incoming damage back for 3 turns.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });

        // ── Serenity (Monk) ───────────────────────────────────────────────────
        // Heals 30% max life, cleanses all negative effects, blinds monster this turn.
      } else if (def.ability2.kind === "serenity") {
        const healAmt = Math.round(stats.maxLife * MONK_SERENITY_HEAL);
        playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        const cleansedPoison = playerPoisonRounds > 0;
        const cleansedBurn = playerBurnRounds > 0;
        playerPoisonRounds = 0;
        playerPoisonDamage = 0;
        playerBurnRounds = 0;
        playerBurnDamage = 0;
        serenityBlindThisTurn = true;
        const chiRestore = Math.round(stats.maxMana * 0.5);
        playerMana = Math.min(stats.maxMana, playerMana + chiRestore);
        const cleanseParts: string[] = [];
        if (cleansedPoison) cleanseParts.push("poison");
        if (cleansedBurn) cleanseParts.push("burn");
        const cleanseText =
          cleanseParts.length > 0
            ? ` Cleansed: ${cleanseParts.join(" and ")}.`
            : "";
        log.push({
          actor: "player",
          message: `Serenity washes over you, restoring ${healAmt} life and ${chiRestore} chi.${cleanseText} ${monster.name} is blinded!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }

      // ── Health Potion ─────────────────────────────────────────────────────────
      // Restores 35% (Act 1) or 50% (Act 2) of max life. Capped at maxLife (Blood Barrier excluded).
      // Paladin Defensive Aura (lv.20) adds a flat +10% max life on top.
    } else if (action === "healthPotion" && healthPotionCooldown <= 0) {
      const before = playerLife;
      const potionRate = getPotionRestoreRate(clearedDungeons);
      const defensiveAuraPotionBonus =
        character.classId === "paladin" && character.level >= 20
          ? Math.round(stats.maxLife * 0.1)
          : 0;
      playerLife = Math.min(
        stats.maxLife,
        playerLife +
          Math.round(stats.maxLife * potionRate) +
          defensiveAuraPotionBonus,
      );
      healthPotionCooldown = POTION_COOLDOWN;
      const potionRestored = playerLife - before;
      log.push({
        actor: "player",
        message:
          defensiveAuraPotionBonus > 0
            ? `You drink a Health Potion, restoring ${potionRestored} life (Defensive Aura bonus included).`
            : `You drink a Health Potion, restoring ${potionRestored} life.`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });

      // ── Mana Potion ───────────────────────────────────────────────────────────
      // Restores 35% (Act 1) or 50% (Act 2) of max mana/fury.
    } else if (action === "manaPotion" && manaPotionCooldown <= 0) {
      const before = playerMana;
      playerMana = Math.min(
        stats.maxMana,
        playerMana +
          Math.round(stats.maxMana * getPotionRestoreRate(clearedDungeons)),
      );
      manaPotionCooldown = POTION_COOLDOWN;
      log.push({
        actor: "player",
        message: `You drink a Mana Potion, restoring ${Math.round(playerMana - before)} ${def.resourceName.toLowerCase()}.`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else {
      doBasicAttack();
    }
  }

  // ── Step 2: Post-action cooldowns & buff tick-downs ──────────────────────────
  if (abilityCooldown > 0) abilityCooldown -= 1;
  if (ability2Cooldown > 0) ability2Cooldown -= 1;
  if (healthPotionCooldown > 0) healthPotionCooldown -= 1;
  if (manaPotionCooldown > 0) manaPotionCooldown -= 1;

  // Blood Fury duration
  if (bloodFuryRounds > 0) bloodFuryRounds -= 1;

  // Electrocute duration (Stormstring)
  if (electrocuteRounds > 0) electrocuteRounds -= 1;

  // Regenerating Nova heals on turns 2 and 3 (turn 1 fired at activation)
  if (regenRounds > 0) {
    regenRounds -= 1;
    if (regenRounds > 0) {
      const regenHeal = Math.round(stats.maxLife * 0.1);
      playerLife = Math.min(stats.maxLife, playerLife + regenHeal);
      log.push({
        actor: "player",
        message: `Regenerating Nova pulses — you recover ${regenHeal} life! (${regenRounds} turn${regenRounds !== 1 ? "s" : ""} remaining)`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else {
      log.push({
        actor: "player",
        message: "Regenerating Nova fades.",
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  }

  // Transcendence (Monk lv.35): passively restore 7% of max life each turn
  if (
    character.classId === "monk" &&
    character.level >= 20 &&
    playerLife < stats.maxLife &&
    monsterLife > 0
  ) {
    const transcendHeal = Math.round(stats.maxLife * MONK_TRANSCENDENCE_REGEN);
    playerLife = Math.min(stats.maxLife, playerLife + transcendHeal);
    log.push({
      actor: "player",
      message: `Transcendence restores ${transcendHeal} life.`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }

  // ── Step 3: Mana regen ────────────────────────────────────────────────────────
  // Sorceress regenerates 10% per turn (Arcane Flow). All other mana classes regenerate 5%.
  // manaRegenMult comes from gear; manaRegenBonus is flat from "of Clarity" affixes.
  if (def.resourceType === "mana" && playerMana < stats.maxMana) {
    const regenRate =
      character.classId === "sorceress"
        ? SORCERESS_MANA_REGEN_RATE
        : MANA_REGEN_RATE;
    playerMana = Math.min(
      stats.maxMana,
      playerMana +
        stats.maxMana * regenRate * stats.manaRegenMult +
        stats.manaRegenBonus,
    );
  }

  // Damage absorption helper — shield takes the hit first, remainder goes to playerLife
  const takeDamage = (amount: number) => {
    if (absorbShield > 0) {
      const blocked = Math.min(absorbShield, amount);
      absorbShield -= blocked;
      amount -= blocked;
    }
    playerLife -= amount;
  };

  // Snapshot state into a plain object for the round result
  function makeState() {
    return {
      playerLife: Math.max(0, playerLife),
      playerMana: Math.max(0, Math.round(playerMana)),
      monsterLife: Math.max(0, monsterLife),
      abilityCooldown,
      healthPotionCooldown,
      manaPotionCooldown,
      poisonRounds,
      poisonDamage,
      monsterSpellCooldown,
      playerPoisonRounds,
      playerPoisonDamage,
      playerBurnRounds,
      playerBurnDamage,
      trapRounds,
      bloodFuryRounds,
      ability2Cooldown,
      frozenRounds,
      regenRounds,
      disorientRounds,
      blindRounds,
      frostShieldRounds,
      burnStacks,
      electrocuteRounds,
      golemRounds,
      stunnedRounds,
      absorbShield: Math.round(absorbShield),
    };
  }

  // ── Step 4: Early victory check ───────────────────────────────────────────────
  if (monsterLife <= 0) {
    return { state: makeState(), log, status: "victory", damageDealt };
  }

  // ── Step 5: Player DoT ticks (monster-sourced) ────────────────────────────────
  // These tick at the start of the monster's phase, before the monster acts.

  // Poison applied to the player by a monster dot spell (e.g. Andariel Poison Nova)
  if (playerPoisonRounds > 0) {
    takeDamage(playerPoisonDamage);
    playerPoisonRounds -= 1;
    log.push({
      actor: "monster",
      message: `Poison courses through you for ${playerPoisonDamage} damage.`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }

  // Burn applied to the player by a monster burn spell (e.g. Bishibosh Fire Wall)
  if (playerBurnRounds > 0) {
    takeDamage(playerBurnDamage);
    playerBurnRounds -= 1;
    log.push({
      actor: "monster",
      message: `Fire burns you for ${playerBurnDamage} damage.`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }

  // ── Step 6: Enemy poison ticks (player-sourced) ───────────────────────────────
  // Necromancer Poison Cloud and Assassin Venom.
  // Soul Siphon heals 15% of each poison tick (Necromancer passive; bloodBarrierCap applies).
  if (poisonRounds > 0) {
    monsterLife -= poisonDamage;
    damageDealt += poisonDamage;
    poisonRounds -= 1;
    const necroHeal =
      character.classId === "necromancer"
        ? Math.round(poisonDamage * NECROMANCER_SOUL_SIPHON)
        : 0;
    if (necroHeal > 0) {
      applyHeal(necroHeal);
    }
    log.push({
      actor: "monster",
      message: `${monster.name} suffers ${poisonDamage} poison damage.${necroHeal > 0 ? ` Soul Siphon heals you for ${necroHeal}.` : ""}`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
    if (monsterLife <= 0) {
      return { state: makeState(), log, status: "victory", damageDealt };
    }
  }

  // ── Step 7: Burn stacks tick (Demon's Tail) ───────────────────────────────────
  // Each stack is independent; multiple can be active simultaneously.
  for (const stack of burnStacks) {
    if (stack.rounds > 0) {
      monsterLife -= stack.damage;
      damageDealt += stack.damage;
      stack.rounds -= 1;
      log.push({
        actor: "player",
        message: `${monster.name} burns for ${stack.damage} fire damage. (${stack.rounds} turn${stack.rounds !== 1 ? "s" : ""} remaining)`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
      if (monsterLife <= 0) {
        burnStacks = burnStacks.filter((s) => s.rounds > 0);
        return { state: makeState(), log, status: "victory", damageDealt };
      }
    }
  }
  burnStacks = burnStacks.filter((s) => s.rounds > 0);

  // ── Step 8: Trap countdown ─────────────────────────────────────────────────────
  // Fire Trap decrements here; detonation is handled after the monster acts (step 12).
  if (trapRounds > 0) trapRounds -= 1;

  // ── Step 9: Monster spell cooldown ────────────────────────────────────────────
  if (monsterSpellCooldown > 0) monsterSpellCooldown -= 1;

  let monsterSpellCastName: string | undefined;

  // ── Step 10: Monster action ────────────────────────────────────────────────────
  // Skipped entirely when stunned (Golem Defense), frozen (Freezing Shot), or blinded (Blinding Powder).
  // Stun takes priority over freeze which takes priority over blind in the skip log message.
  const monsterActsThisTurn =
    frozenRounds <= 0 &&
    stunnedRounds <= 0 &&
    blindRounds <= 0 &&
    !serenityBlindThisTurn;
  if (stunnedRounds > 0) {
    stunnedRounds -= 1;
    log.push({
      actor: "monster",
      message: `${monster.name} is stunned and cannot act!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  } else if (frozenRounds > 0) {
    frozenRounds -= 1;
    log.push({
      actor: "monster",
      message: `${monster.name} is frozen solid and cannot act!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  } else if (serenityBlindThisTurn) {
    log.push({
      actor: "monster",
      message: `${monster.name} is blinded by Serenity and cannot act!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  } else if (blindRounds > 0) {
    blindRounds -= 1;
    if (blindRounds === 0) disorientRounds = 4; // Blind → Disorient transition
    log.push({
      actor: "monster",
      message: `${monster.name} is blinded and cannot act!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }
  // Disorient countdown (independent of blind; 25% dmg reduction applied at hit time)
  if (disorientRounds > 0) disorientRounds -= 1;

  if (monsterActsThisTurn) {
    // Monster either casts its spell or does a normal attack.
    // Spell: boss unique ability on a ~35-45% chance with a 3-turn cooldown.
    const spell = monster.spell;
    const castSpell =
      spell && monsterSpellCooldown <= 0 && Math.random() < spell.chance;
    if (castSpell && spell) {
      monsterSpellCastName = spell.name;
      monsterSpellCooldown = spell.cooldown;

      const amazonDodgedSpell =
        character.classId === "amazon" && Math.random() < AMAZON_DODGE_CHANCE;
      if (amazonDodgedSpell) {
        log.push({
          actor: "monster",
          message: `${monster.name} casts ${spell.name}, but you dodge!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else {
        let spellDmg = Math.round(
          randomInRange(monster.damage) *
            spell.power *
            (disorientRounds > 0 ? 0.75 : 1.0),
        );

        // Damage reduction order: Frost Shield → Golem redirect → Fade → Iron Skin → gear reduction
        if (frostShieldRounds > 0)
          spellDmg = Math.max(1, Math.round(spellDmg * 0.4));
        // Golem Defense: 30% of spell damage is dealt back to the monster; player takes 70%
        if (golemRounds > 0) {
          const reflected = Math.round(spellDmg * 0.3);
          monsterLife -= reflected;
          damageDealt += reflected;
          spellDmg = Math.max(1, spellDmg - reflected);
        }
        const fadedSpell =
          character.classId === "assassin" && Math.random() < 0.25;
        if (fadedSpell) spellDmg = Math.max(1, Math.round(spellDmg * 0.55));
        const ironSkinSpell = getIronSkinReduction(
          character,
          playerLife,
          stats.maxLife,
        );
        if (ironSkinSpell > 0)
          spellDmg = Math.max(1, Math.round(spellDmg * (1 - ironSkinSpell)));
        if (stats.magicDmgReduction > 0)
          spellDmg = Math.max(
            1,
            Math.round(spellDmg * (1 - stats.magicDmgReduction / 100)),
          );

        if (spell.kind === "burst") {
          takeDamage(spellDmg);
          log.push({
            actor: "monster",
            message: `${monster.name} casts ${spell.name} for ${spellDmg} damage!${frostShieldRounds > 0 ? " Frost Shield absorbs 60%." : ""}${golemRounds > 0 ? " Stone Golem reflects 30% back!" : ""}`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        } else if (spell.kind === "dot") {
          // Monster dot spell: initial hit at 40% power + 3 player poison ticks
          const initialHit = Math.round(spellDmg * 0.4);
          takeDamage(initialHit);
          playerPoisonRounds = 3;
          playerPoisonDamage = Math.round(spellDmg * 0.4);
          log.push({
            actor: "monster",
            message: `${monster.name} casts ${spell.name} for ${initialHit} damage, poisoning you!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        } else if (spell.kind === "burn") {
          // Monster burn spell: initial hit at 40% power + 3 player burn ticks
          const initialHit = Math.round(spellDmg * 0.4);
          takeDamage(initialHit);
          playerBurnRounds = 3;
          playerBurnDamage = Math.round(spellDmg * 0.4);
          log.push({
            actor: "monster",
            message: `${monster.name} casts ${spell.name} for ${initialHit} damage, setting you ablaze!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        } else if (spell.kind === "drain") {
          // Drain: damages player and heals monster (capped at full life)
          takeDamage(spellDmg);
          monsterLife = Math.min(monster.life, monsterLife + spellDmg);
          log.push({
            actor: "monster",
            message: `${monster.name} casts ${spell.name}, draining ${spellDmg} life from you!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }

        // Paladin passives apply to spell damage too
        if (character.classId === "paladin" && spellDmg > 0) {
          // Divine Retribution: 15% of spell damage taken → life
          const healBack = Math.round(spellDmg * PALADIN_DAMAGE_TAKEN_HEAL);
          playerLife = Math.min(stats.maxLife, playerLife + healBack);
        }
        // Thornback unique armor: reflects % of any damage taken
        if (stats.thornReflect > 0 && spellDmg > 0) {
          const reflectDmg = Math.round(spellDmg * stats.thornReflect);
          monsterLife -= reflectDmg;
          damageDealt += reflectDmg;
          log.push({
            actor: "player",
            message: `Thornback reflects ${reflectDmg} damage!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }
      } // end !amazonDodgedSpell
    } else {
      // Normal monster attack
      const amazonDodged =
        character.classId === "amazon" && Math.random() < AMAZON_DODGE_CHANCE;
      if (amazonDodged) {
        log.push({
          actor: "monster",
          message: `${monster.name} attacks, but you dodge!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
      // Paladin Defensive Aura (lv.20): +10% effective defense vs physical hits
      const defenseAuraBonus =
        character.classId === "paladin" && character.level >= 20 ? 1.1 : 1.0;
      const monsterHitChance = rollHitChance(
        monster.attackRating,
        Math.round(stats.defense * defenseAuraBonus),
      );
      if (!amazonDodged && Math.random() < monsterHitChance) {
        const isMonsterCrit = Math.random() < MONSTER_CRIT_CHANCE;
        let dmg = Math.round(
          randomInRange(monster.damage) * (disorientRounds > 0 ? 0.75 : 1.0),
        );
        if (isMonsterCrit) dmg = Math.round(dmg * 1.75);

        // Thick Hide (Druid): reduces all physical damage by Dex × 0.2%, capped at 25%
        if (character.classId === "druid") {
          const reduction = Math.min(0.25, stats.stats.dexterity * 0.002);
          dmg = Math.max(1, Math.round(dmg * (1 - reduction)));
        }

        // Damage reduction order: Fade → Iron Skin → gear reduction → Frost Shield → Boneweave → Golem redirect
        const fadedNormal =
          character.classId === "assassin" && Math.random() < 0.25;
        if (fadedNormal) dmg = Math.max(1, Math.round(dmg * 0.55));
        const ironSkin = getIronSkinReduction(
          character,
          playerLife,
          stats.maxLife,
        );
        if (ironSkin > 0) dmg = Math.max(1, Math.round(dmg * (1 - ironSkin)));
        if (stats.physDmgReduction > 0)
          dmg = Math.max(
            1,
            Math.round(dmg * (1 - stats.physDmgReduction / 100)),
          );
        if (frostShieldRounds > 0) dmg = Math.max(1, Math.round(dmg * 0.4));
        // Boneweave Gloves: 5% chance to reduce hit to exactly 1 damage
        const boneweaveBlocked =
          stats.blockChance > 0 && Math.random() < stats.blockChance / 100;
        if (boneweaveBlocked) dmg = 1;
        // Golem Defense: 30% of physical damage reflected; player takes 70%
        if (golemRounds > 0) {
          const reflected = Math.round(dmg * 0.3);
          monsterLife -= reflected;
          damageDealt += reflected;
          dmg = Math.max(1, dmg - reflected);
        }

        takeDamage(dmg);

        let message = isMonsterCrit
          ? `Critical hit! ${monster.name} deals ${dmg} damage.`
          : `${monster.name} hits you for ${dmg} damage.`;

        if (character.classId === "druid") {
          const reductionPct = Math.round(
            Math.min(25, stats.stats.dexterity * 0.2),
          );
          message += ` Thick Hide absorbs ${reductionPct}%.`;
        }
        if (fadedNormal) message += " Fade reduces the blow by 45%.";
        if (ironSkin > 0)
          message += ` Iron Skin absorbs ${Math.round(ironSkin * 100)}%.`;
        if (frostShieldRounds > 0) message += " Frost Shield absorbs 60%.";
        if (golemRounds > 0) message += " Stone Golem reflects 30% back!";
        if (boneweaveBlocked) message += " Boneweave Gloves block the blow!";

        // Paladin passives
        if (character.classId === "paladin") {
          // Divine Retribution: 15% of damage taken → life
          const healBack = Math.round(dmg * PALADIN_DAMAGE_TAKEN_HEAL);
          playerLife = Math.min(stats.maxLife, playerLife + healBack);
          message += ` Divine Retribution restores ${healBack} life.`;
        }
        // Thornback unique armor
        if (stats.thornReflect > 0) {
          const reflectDmg = Math.round(dmg * stats.thornReflect);
          monsterLife -= reflectDmg;
          damageDealt += reflectDmg;
          message += ` Thornback reflects ${reflectDmg} damage!`;
        }

        log.push({
          actor: "monster",
          message,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else {
        log.push({
          actor: "monster",
          message: `${monster.name}'s attack misses.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    }
  } // end monsterActsThisTurn

  // ── Step 10b: Counter Attack (Monk passive) ────────────────────────────────────
  // 12% chance to fire a basic attack after the monster acts (or attempted to act).
  if (
    character.classId === "monk" &&
    character.level >= 35 &&
    monsterLife > 0 &&
    playerLife > 0 &&
    Math.random() < MONK_COUNTER_ATTACK_CHANCE
  ) {
    const isCrit = Math.random() < critChance;
    let counterDmg = Math.round(
      randomInRange(stats.damage) * electrocuteMult * deathwhisperMult,
    );
    if (isCrit) counterDmg = Math.round(counterDmg * critMultiplier);
    monsterLife -= counterDmg;
    damageDealt += counterDmg;
    log.push({
      actor: "player",
      message: isCrit
        ? `Counter Attack! Critical hit for ${counterDmg} damage!`
        : `Counter Attack! You strike back for ${counterDmg} damage.`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
    if (monsterLife <= 0) {
      return { state: makeState(), log, status: "victory", damageDealt };
    }
  }

  // ── Step 11: Frost Shield duration tick ───────────────────────────────────────
  if (frostShieldRounds > 0) {
    frostShieldRounds -= 1;
    if (frostShieldRounds === 0) {
      log.push({
        actor: "player",
        message: "Frost Shield fades.",
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  }

  // ── Step 12: Fire Trap detonation ─────────────────────────────────────────────
  // trapRounds was decremented in step 8 and again via action in step 1 if placed this turn.
  // Detonates the frame trapRounds transitions from 1 → 0 (i.e. state.trapRounds > 0 but now 0).
  if (trapRounds === 0 && state.trapRounds > 0) {
    const trapLowLifeMult =
      stats.lowLifeDamageBonus > 0 && playerLife < stats.maxLife * 0.3
        ? 1 + stats.lowLifeDamageBonus
        : 1.0;
    const trapElectrocuteMult = electrocuteRounds > 0 ? 1.2 : 1.0;
    const trapDeathwhisperMult =
      stats.deathwhisperBoost && (blindRounds > 0 || disorientRounds > 0)
        ? 1.3
        : 1.0;
    const trapDmg = Math.round(
      stats.stats.dexterity *
        def.ability.power *
        trapLowLifeMult *
        trapElectrocuteMult *
        trapDeathwhisperMult,
    );
    const isCrit = Math.random() < critChance;
    const finalTrapDmg = isCrit
      ? Math.round(trapDmg * critMultiplier)
      : trapDmg;
    monsterLife -= finalTrapDmg;
    damageDealt += finalTrapDmg;
    trapDetonated = true;
    log.push({
      actor: "monster",
      message: isCrit
        ? `Critical hit! Fire Trap explodes for ${finalTrapDmg} damage!`
        : `Fire Trap explodes for ${finalTrapDmg} damage!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
    tryIgnite(finalTrapDmg);
    if (monsterLife <= 0) {
      return {
        state: makeState(),
        log,
        status: "victory",
        damageDealt,
        trapDetonated,
      };
    }
  }

  // ── Step 13: Golem duration tick ───────────────────────────────────────────────
  if (golemRounds > 0) {
    golemRounds -= 1;
    if (golemRounds === 0) {
      log.push({
        actor: "player",
        message: "The Stone Golem crumbles and fades.",
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  }

  // ── Step 14: Round outcome ─────────────────────────────────────────────────────
  const status: BattleStatus = playerLife <= 0 ? "defeat" : "ongoing";
  return {
    state: makeState(),
    log,
    status,
    damageDealt,
    monsterSpellCast: monsterSpellCastName,
    trapDetonated,
  };
}
