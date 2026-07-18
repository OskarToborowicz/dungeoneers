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
  frozenRounds: number; // Huntress Freezing Shot: monster cannot act
  holyLightCharges: number; // Paladin Holy Light: remaining empowered-attack charges
  disorientRounds: number; // After Blind fades: monster deals 25% reduced damage
  blindRounds: number; // Assassin Blinding Powder: monster cannot act
  frostShieldRounds: number; // Sorceress Frost Shield: incoming damage reduced 60%
  barkWallRounds: number; // Druid Bark Wall: monster deals 0 damage while > 0
  thornStacks: number; // Druid Bramble: 0–3, +1 per basic attack, explodes at 3
  burnStacks: {
    rounds: number;
    damage: number;
    source: string;
    kind: "burn" | "poison" | "bleed";
  }[]; // Independent DoT stacks — Demon's Tail (burn), Vine Whip (bleed), Nature's Wrath (poison)
  electrocuteRounds: number; // Stormstring on-hit: monster takes 20% more damage
  golemRounds: number; // Necromancer Golem Defense: turns remaining, redirects 30% of incoming dmg
  stunnedRounds: number; // Necromancer Golem Defense cast: monster cannot act for 1 turn
  absorbShield: number; // Temporary absorb buffer — damage hits this before playerLife; resets each round
  preparation: number; // Assassin: 0–3 charges, gained on basic attack, spent by abilities
  vanishRounds: number; // Assassin Vanish: turns of 55% damage reduction remaining
  shadowBondAutoBonus: boolean; // Assassin Shadow Bond (lv.35): next basic attack deals +50%
  bonechillTurns: number; // Bonechill scythe: remaining turns of doubled Soul Siphon
  ebonreapCounter: number; // Ebonreap scythe: basic attack counter (proc at 3)
  openerBonusUsed: boolean; // Soulvoid Girdle: first ability use bonus already fired
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
  endingPreparation: number;
  endingCooldown: number;
  endingCooldown2: number;
  endingHolyLightCharges: number;
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
const NECROMANCER_VIRULENCE_MULT = 1.25; // DoT ticks deal 25% more damage (lv.20)

// Assassin
const ASSASSIN_MAX_PREPARATION = 3;
const ASSASSIN_SERPENTS_KISS = 0.1; // +10% of damage as instant poison on basic attack and Eviscerate
const ASSASSIN_BLUR_CHANCE = 0.25;
const ASSASSIN_BLUR_REDUCTION = 0.25;
const ASSASSIN_SHADOW_BOND_ABILITY_HEAL = 0.12; // Heal 12% max life when ability uses 3 preparation
const ASSASSIN_SHADOW_BOND_OVERFLOW_HEAL = 0.04; // Heal 4% max life per overflow preparation point
const ASSASSIN_SHADOW_BOND_AUTO_BONUS = 0.5; // +50% next basic attack damage

// Monk
const MONK_SWEEPING_WIND_CHANCE = 0.3; // 30% bonus strike after basic attack
const MONK_SWEEPING_WIND_DAMAGE = 0.7; // Follow-up hits at 70% damage
const MONK_TRANSCENDENCE_REGEN = 0.07; // 7% max life regen per turn (lv.35)
const MONK_SERENITY_HEAL = 0.3; // Serenity heals 30% of max life
const MONK_COUNTER_ATTACK_CHANCE = 0.12; // 12% chance to counter-attack after monster hits

const DRUID_VINE_WHIP_POWER = 1.2; // Vine Whip weapon multiplier — must match ability.power in classes.ts
const DRUID_VINE_WHIP_DEX = 1.0; // Vine Whip: + Dexterity × this, on top of weapon × ability.power
const DRUID_BLEED_CHANCE = 0.35; // Vine Whip: chance to apply bleed on hit
const DRUID_BLEED_FRACTION = 0.15; // Bleed ticks for 15% of the hit's damage per round
const DRUID_BLEED_ROUNDS = 3;
const DRUID_LIFEBLOOM = 0.08; // Direct hits heal 8% of damage dealt (lv.20)
const DRUID_THORN_EXPLODE = 0.5; // Bramble burst = half of the Vine Whip formula (pure physical)
const DRUID_NATURES_WRATH_FRACTION = 0.2; // Nature's Wrath poison stack: 20% of hit damage/round (lv.35)
const DRUID_NATURES_WRATH_ROUNDS = 3;

// Vine Whip / Bramble share one damage formula: weapon × power + Dexterity.
function vineWhipDamage(stats: DerivedStats, power: number): number {
  return (
    randomInRange(stats.damage) * power +
    stats.stats.dexterity * DRUID_VINE_WHIP_DEX
  );
}

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
  startingPreparation = 0,
  startingHolyLightCharges = 0,
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
    holyLightCharges: startingHolyLightCharges,
    disorientRounds: 0,
    blindRounds: 0,
    frostShieldRounds: 0,
    barkWallRounds: 0,
    thornStacks: 0,
    burnStacks: [],
    electrocuteRounds: 0,
    golemRounds: 0,
    stunnedRounds: 0,
    absorbShield: 0,
    preparation: startingPreparation,
    vanishRounds: 0,
    shadowBondAutoBonus: false,
    bonechillTurns: 3,
    ebonreapCounter: 0,
    openerBonusUsed: false,
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
  if (def.ability2.kind === "holy_light" && state.holyLightCharges > 0)
    return false;
  if (def.ability2.kind === "frost_shield" && state.frostShieldRounds > 0)
    return false;
  if (def.ability2.kind === "golem" && state.golemRounds > 0) return false; // Can't re-summon while active
  if (def.ability2.kind === "bark_wall" && state.barkWallRounds > 0)
    return false; // Can't recast while active
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

export function getCritMultiplier(stats: DerivedStats): number {
  return DEFAULT_CRIT_MULTIPLIER + stats.critDamageBonus / 100;
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
  const critMult = getCritMultiplier(stats);
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
  if (ability.kind === "vine_whip") {
    const est = Math.round(avg * ability.power + stats.stats.dexterity * 1.0);
    return { label: `~${est} + ${stats.tanglewhipActive ? "50%" : "35%"} bleed`, type: "Physical" };
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
  if (ability.kind === "whirlwind") {
    const avg = Math.round((stats.damage[0] + stats.damage[1]) / 2);
    return { label: `~${avg}+`, type: "Physical" };
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
  if (ability.kind === "bark_wall") {
    return { label: "Block all damage · 2 turns", type: "Buff" };
  }
  if (ability.kind === "holy_light") {
    const healPerHit = Math.round(stats.maxLife * 0.12);
    return { label: `3× ${healPerHit} heal`, type: "Heal" };
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
  const critMultiplier = getCritMultiplier(stats);

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
    holyLightCharges,
    disorientRounds,
    blindRounds,
    frostShieldRounds,
    barkWallRounds,
    thornStacks,
    electrocuteRounds,
    golemRounds,
    stunnedRounds,
  } = state;
  let preparation = state.preparation;
  let vanishRounds = state.vanishRounds;
  let shadowBondAutoBonus = state.shadowBondAutoBonus;
  let bonechillTurns = state.bonechillTurns ?? 3;
  let ebonreapCounter = state.ebonreapCounter ?? 0;
  let openerBonusUsed = state.openerBonusUsed ?? false;
  let absorbShield = 0; // Resets every round — overheal from last turn does not carry over
  let burnStacks = state.burnStacks.map((s) => ({ ...s }));
  let serenityBlindThisTurn = false;
  // Snapshot whether the monster is afflicted at the start of this turn (Forsaken Sigil)
  const hasDoT = poisonRounds > 0 || burnStacks.length > 0;

  // Multipliers computed once per round from current state
  const electrocuteMult = electrocuteRounds > 0 ? 1.2 : 1.0;
  // Heartseeker follow-up arrow: 50% of crit damage, or 70% with Doomcrier equipped
  const heartseekerMult = stats.heartseekerBoost ? 0.7 : 0.5;
  let damageDealt = 0;
  let trapDetonated = false;
  // The Pentagram: +100 damage but only when below 30% life
  const lowLifeMult =
    stats.lowLifeDamageBonus > 0 && playerLife < stats.maxLife * 0.4
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
      const igniteDmg = Math.round(dmg * 0.25);
      burnStacks.push({ rounds: 2, damage: igniteDmg, source, kind: "burn" });

      log.push({
        actor: "player",
        message: `${source} ignites the enemy — ${igniteDmg} fire per turn for 2 turns!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  };

  // ── Basic attack ────────────────────────────────────────────────────────────
  // Shared by direct attacks, Blood Fury activation, and Holy Light activation.
  // Handles: Barbarian Double Swing, Blood Fury lifesteal, Madness, Life Leech,
  //          Electrocute proc, Heartseeker, Holy Light heal, Assassin Venom, Shadowfang, Fury generation.
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
    // Shadow Bond (Assassin lv.35): next basic attack deals +50% damage
    if (character.classId === "assassin" && shadowBondAutoBonus) {
      damageMult *= 1 + ASSASSIN_SHADOW_BOND_AUTO_BONUS;
      shadowBondAutoBonus = false;
    }
    if (lowLifeMult > 1.0) damageMult *= lowLifeMult;
    let basicHitDmg = 0;
    let basicHitCrit = false;

    if (Math.random() < hitChance) {
      const isCrit = Math.random() < critChance;
      basicHitCrit = isCrit;
      let dmg = Math.round(
        randomInRange(stats.damage) * damageMult * electrocuteMult,
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
      // Holy Light (Paladin ability2): each empowered attack heals 12% max life
      if (character.classId === "paladin" && holyLightCharges > 0) {
        const holyHeal = Math.round(stats.maxLife * 0.12);
        applyHeal(holyHeal);
        holyLightCharges -= 1;
        attackMsg += ` Holy Light restores ${holyHeal} life! (${holyLightCharges} charge${holyLightCharges !== 1 ? "s" : ""} remaining)`;
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

      // ── Druid passives on a landed basic attack ──
      if (character.classId === "druid" && basicHitDmg > 0 && monsterLife > 0) {
        // Lifebloom (lv.20): direct hits heal 8% of damage dealt (not DoT ticks)
        if (character.level >= 20) {
          const bloom = Math.round(basicHitDmg * (stats.verdantCoilActive ? 0.12 : DRUID_LIFEBLOOM));
          if (bloom > 0) {
            applyHeal(bloom);
            log.push({
              actor: "player",
              message: `Lifebloom restores ${bloom} life.`,
              playerLife: Math.max(0, playerLife),
              monsterLife: Math.max(0, monsterLife),
            });
          }
        }
        // Nature's Wrath (lv.35): each attack stacks an independent poison DoT
        if (character.level >= 35) {
          const poisonDmg = Math.max(
            1,
            Math.round(basicHitDmg * (stats.thornweaveEffigy ? 0.35 : DRUID_NATURES_WRATH_FRACTION)),
          );
          burnStacks.push({
            rounds: DRUID_NATURES_WRATH_ROUNDS,
            damage: poisonDmg,
            source: "Nature's Wrath",
            kind: "poison",
          });
        }
        // Bramble (lv.1): +1 thorn stack; at 3 it erupts for pure physical damage
        thornStacks += 1;
        if (thornStacks >= (stats.bloodbriarActive ? 2 : 3)) {
          thornStacks = 0;
          const burst = Math.max(
            1,
            Math.round(
              vineWhipDamage(stats, DRUID_VINE_WHIP_POWER) *
                DRUID_THORN_EXPLODE,
            ),
          );
          monsterLife -= burst;
          damageDealt += burst;
          log.push({
            actor: "player",
            message: `Thorns erupt from the enemy for ${burst} damage!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }
      }
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

    // Heartseeker (Huntress lv.35): fires a follow-up arrow after any crit; cannot itself crit
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

    // Preparation gain (Assassin): +1 on hit, +2 on crit. Shadow Bond lv.35 heals on overflow.
    if (character.classId === "assassin" && basicHitDmg > 0) {
      const prepGain = basicHitCrit ? 2 : 1;
      const overflow = Math.max(
        0,
        preparation + prepGain - ASSASSIN_MAX_PREPARATION,
      );
      if (overflow > 0 && character.level >= 35) {
        const overflowHeal = Math.round(
          stats.maxLife * ASSASSIN_SHADOW_BOND_OVERFLOW_HEAL * overflow,
        );
        applyHeal(overflowHeal);
        log[log.length - 1].message +=
          ` Shadow Bond — overflow restores ${overflowHeal} life.`;
      }
      preparation = Math.min(ASSASSIN_MAX_PREPARATION, preparation + prepGain);
      // Serpent's Kiss: +10% of hit damage as instant poison
      const serpentDmg = Math.round(basicHitDmg * ASSASSIN_SERPENTS_KISS);
      if (serpentDmg > 0 && monsterLife > 0) {
        monsterLife -= serpentDmg;
        damageDealt += serpentDmg;
        log[log.length - 1].message +=
          ` Serpent's Kiss deals ${serpentDmg} poison.`;
      }
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

    // Ebonreap scythe: every 3rd basic attack hit fires a spectral strike (80% weapon dmg, magic)
    if (stats.ebonreapActive && basicHitDmg > 0 && monsterLife > 0) {
      ebonreapCounter += 1;
      if (ebonreapCounter >= 3) {
        ebonreapCounter = 0;
        const spectralDmg = Math.max(
          1,
          Math.round(randomInRange(stats.damage) * 0.8 * stats.magicDamageMult),
        );
        monsterLife -= spectralDmg;
        damageDealt += spectralDmg;
        log.push({
          actor: "player",
          message: `Ebonreap — a spectral scythe sweeps for ${spectralDmg} magic damage!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    }

    // On-hit procs (Sword of the Elements): each rolls independently after the main hit
    if (basicHitDmg > 0 && monsterLife > 0) {
      if (
        stats.freezeOnHitChance > 0 &&
        Math.random() < stats.freezeOnHitChance / 100
      ) {
        frozenRounds = 2;
        log.push({
          actor: "player",
          message: `Sword of the Elements freezes ${monster.name} for 2 turns!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
      if (
        stats.igniteOnHitChance > 0 &&
        Math.random() < stats.igniteOnHitChance / 100
      ) {
        const igDmg = Math.round(basicHitDmg * 0.3);
        burnStacks.push({
          rounds: 2,
          damage: igDmg,
          source: "Sword of the Elements",
          kind: "burn",
        });
        log.push({
          actor: "player",
          message: `Sword of the Elements ignites for ${igDmg} fire damage per turn!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
      if (
        stats.poisonOnHitChance > 0 &&
        Math.random() < stats.poisonOnHitChance / 100
      ) {
        poisonRounds = 2;
        poisonDamage = Math.round(basicHitDmg * 0.3);
        log.push({
          actor: "player",
          message: `Sword of the Elements poisons for ${poisonDamage} damage per turn!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
      if (
        stats.shockOnHitChance > 0 &&
        Math.random() < stats.shockOnHitChance / 100
      ) {
        electrocuteRounds = 2;
        log.push({
          actor: "player",
          message: `Sword of the Elements electrocutes ${monster.name}! Enemy takes 20% more damage for 2 turns.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
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
  const useAbility =
    action === "ability" &&
    playerMana >= def.ability.manaCost &&
    abilityCooldown <= 0;
  if (monsterLife > 0) {
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

        // ── Frost Bolt / burst abilities (Sorceress) ───────────────────────────
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
        if (!def.ability.magic && stats.lifeLeechBonus > 0) {
          const leeched = Math.round((dmg * stats.lifeLeechBonus) / 100);
          if (leeched > 0) {
            applyHeal(leeched);
            log[log.length - 1].message +=
              ` Life Leech restores ${leeched} life.`;
          }
        }
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
            electrocuteMult,
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
        const siphonPct =
          stats.soulSiphonPct *
          (stats.bonechillActive && bonechillTurns > 0 ? 2 : 1);
        const siphonHitHeal =
          character.classId === "necromancer" ? Math.round(dmg * siphonPct) : 0;
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

        // ── Multishot (Huntress) ────────────────────────────────────────────────
        // Multiple independent hits; each can crit and trigger Heartseeker.
      } else if (def.ability.kind === "multi") {
        const hitCount =
          character.classId === "monk" && stats.stormfistActive
            ? 4
            : (def.ability.hits ?? 3);
        for (let i = 0; i < hitCount; i++) {
          if (monsterLife <= 0) break;

          let hitDmg = Math.round(
            rollAbilityDamage(stats, def.ability.power, def.ability.magic) *
              lowLifeMult *
              electrocuteMult,
          );
          const isHitCrit = Math.random() < critChance;
          if (isHitCrit) hitDmg = Math.round(hitDmg * critMultiplier);

          monsterLife -= hitDmg;
          damageDealt += hitDmg;

          let multiMsg = isHitCrit
            ? `Critical hit! ${def.ability.name} strikes for ${hitDmg} damage!`
            : `${def.ability.name} strikes for ${hitDmg} damage.`;

          if (stats.lifeLeechBonus > 0) {
            const leeched = Math.round((hitDmg * stats.lifeLeechBonus) / 100);
            if (leeched > 0) {
              applyHeal(leeched);
              multiMsg += ` Life Leech restores ${leeched} life.`;
            }
          }

          log.push({
            actor: "player",
            message: multiMsg,
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
            electrocuteMult,
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

        // ── Vine Whip (Druid) ─────────────────────────────────────────────────
        // Physical: weapon × power + Dex. Can crit. 35% chance to apply bleed.
        // Lifebloom (lv.20) heals 8% of the hit.
      } else if (def.ability.kind === "vine_whip") {
        if (Math.random() > ALWAYS_MISS_CHANCE) {
          const isCrit = Math.random() < critChance;
          let dmg = Math.round(
            vineWhipDamage(stats, def.ability.power) *
              lowLifeMult *
              electrocuteMult,
          );
          if (isCrit) dmg = Math.round(dmg * critMultiplier);
          monsterLife -= dmg;
          damageDealt += dmg;
          let msg = isCrit
            ? `Critical hit! ${def.ability.name} lashes for ${dmg} damage.`
            : `${def.ability.name} lashes for ${dmg} damage.`;
          if (Math.random() < (stats.tanglewhipActive ? 0.5 : DRUID_BLEED_CHANCE)) {
            const bleedDmg = Math.max(
              1,
              Math.round(dmg * DRUID_BLEED_FRACTION),
            );
            burnStacks.push({
              rounds: DRUID_BLEED_ROUNDS,
              damage: bleedDmg,
              source: "Vine Whip",
              kind: "bleed",
            });
            msg += ` The enemy is left bleeding.`;
          }
          if (character.level >= 20) {
            const bloom = Math.round(dmg * (stats.verdantCoilActive ? 0.12 : DRUID_LIFEBLOOM));
            if (bloom > 0) {
              applyHeal(bloom);
              msg += ` Lifebloom restores ${bloom} life.`;
            }
          }
          if (stats.lifeLeechBonus > 0) {
            const leeched = Math.round((dmg * stats.lifeLeechBonus) / 100);
            if (leeched > 0) {
              applyHeal(leeched);
              msg += ` Life Leech restores ${leeched} life.`;
            }
          }
          log.push({
            actor: "player",
            message: msg,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
          tryIgnite(dmg);
        } else {
          log.push({
            actor: "player",
            message: `${def.ability.name} misses.`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }

        // ── Eviscerate (Assassin) ─────────────────────────────────────────────
        // 1× + 0.5× per Preparation spent (max 2.5×). Spends all Preparation.
        // Shadow Bond triggers at 3 prep.
      } else if (def.ability.kind === "eviscerate") {
        if (Math.random() > ALWAYS_MISS_CHANCE) {
          const prepSpent = preparation;
          preparation = 0;
          const power = 1.0 + 0.5 * prepSpent;
          const isCrit = Math.random() < critChance;
          let dmg = Math.round(
            randomInRange(stats.damage) * power * electrocuteMult * lowLifeMult,
          );
          if (isCrit) dmg = Math.round(dmg * critMultiplier);
          monsterLife -= dmg;
          damageDealt += dmg;
          let evisMsg = isCrit
            ? `Critical hit! Eviscerate tears for ${dmg} damage (${prepSpent} Preparation spent)!`
            : `Eviscerate strikes for ${dmg} damage (${prepSpent} Preparation spent).`;
          // Serpent's Kiss: +10% of Eviscerate damage as instant poison
          const serpentDmg = Math.round(dmg * ASSASSIN_SERPENTS_KISS);
          if (serpentDmg > 0) {
            monsterLife -= serpentDmg;
            damageDealt += serpentDmg;
            evisMsg += ` Serpent's Kiss deals ${serpentDmg} bonus poison damage.`;
          }
          // Lifesteal
          if (stats.lifeLeechBonus > 0) {
            const leeched = Math.round((dmg * stats.lifeLeechBonus) / 100);
            if (leeched > 0) {
              applyHeal(leeched);
              evisMsg += ` Life Leech restores ${leeched} life.`;
            }
          }
          // Shadow Bond (lv.35): 3 prep used → heal + empower next auto
          if (prepSpent === ASSASSIN_MAX_PREPARATION && character.level >= 35) {
            const bondHeal = Math.round(
              stats.maxLife * ASSASSIN_SHADOW_BOND_ABILITY_HEAL,
            );
            applyHeal(bondHeal);
            shadowBondAutoBonus = true;
            evisMsg += ` Shadow Bond — healed ${bondHeal} life and next attack empowered!`;
          }
          log.push({
            actor: "player",
            message: evisMsg,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
          tryIgnite(dmg);
        } else {
          preparation = 0;
          log.push({
            actor: "player",
            message: "Eviscerate misses!",
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }
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

      // ── Freezing Shot (Huntress) ────────────────────────────────────────────
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
            (baseDmg + dexBonus) * lowLifeMult * electrocuteMult,
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
          if (stats.lifeLeechBonus > 0) {
            const leeched = Math.round((dmg * stats.lifeLeechBonus) / 100);
            if (leeched > 0) {
              applyHeal(leeched);
              log[log.length - 1].message +=
                ` Life Leech restores ${leeched} life.`;
            }
          }
          tryIgnite(dmg);
        }

        // ── Whirlwind (Barbarian) ─────────────────────────────────────────────
        // Spends ALL Fury for 1× + 0.03× per Fury spent weapon damage. Can crit, applies lifesteal.
      } else if (def.ability2.kind === "whirlwind") {
        const furySpent = furyBeforeCost; // furyBeforeCost === playerMana since manaCost=0
        playerMana = 0; // spend all Fury
        const madnessMult =
          character.classId === "barbarian" &&
          character.level >= 35 &&
          furySpent > BARBARIAN_MADNESS_FURY_THRESHOLD
            ? 1 + BARBARIAN_MADNESS_DAMAGE_BONUS
            : 1.0;
        const power = 1.0 + 0.03 * furySpent;
        const isCrit = Math.random() < critChance;
        let dmg = Math.round(
          randomInRange(stats.damage) *
            power *
            madnessMult *
            lowLifeMult *
            electrocuteMult,
        );
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
        log.push({
          actor: "player",
          message: isCrit
            ? `Critical hit! Whirlwind spends ${furySpent} Fury and tears for ${dmg} damage!`
            : `Whirlwind spends ${furySpent} Fury and strikes for ${dmg} damage.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        if (stats.lifeLeechBonus > 0) {
          const leeched = Math.round((dmg * stats.lifeLeechBonus) / 100);
          if (leeched > 0) {
            applyHeal(leeched);
            log[log.length - 1].message +=
              ` Life Leech restores ${leeched} life.`;
          }
        }
        tryIgnite(dmg);

        // ── Vanish (Assassin) ─────────────────────────────────────────────────
        // 0.75× weapon damage burst + 55% damage reduction for 1+prepSpent turns. Clears player debuffs.
      } else if (def.ability2.kind === "vanish") {
        const prepSpent = preparation;
        preparation = 0;
        vanishRounds = 1 + prepSpent;
        // Clear player debuffs
        playerPoisonRounds = 0;
        playerBurnRounds = 0;
        // Powder burst: 0.75× weapon damage
        const baseDmg = randomInRange(stats.damage);
        let burstDmg = Math.round(
          baseDmg * def.ability2.power * electrocuteMult,
        );
        const isCrit = Math.random() < critChance;
        if (isCrit) burstDmg = Math.round(burstDmg * critMultiplier);
        monsterLife -= burstDmg;
        damageDealt += burstDmg;
        let vanishMsg = isCrit
          ? `Critical hit! Metal powder bursts for ${burstDmg} damage — Vanish! Damage reduced 55% for ${vanishRounds} turn${vanishRounds !== 1 ? "s" : ""}.`
          : `Metal powder bursts for ${burstDmg} damage — Vanish! Damage reduced 55% for ${vanishRounds} turn${vanishRounds !== 1 ? "s" : ""}.`;
        // Shadow Bond (lv.35): 3 prep used → heal + empower next auto
        if (prepSpent === ASSASSIN_MAX_PREPARATION && character.level >= 35) {
          const bondHeal = Math.round(
            stats.maxLife * ASSASSIN_SHADOW_BOND_ABILITY_HEAL,
          );
          applyHeal(bondHeal);
          shadowBondAutoBonus = true;
          vanishMsg += ` Shadow Bond — healed ${bondHeal} life and next attack empowered!`;
        }
        log.push({
          actor: "player",
          message: vanishMsg,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(burstDmg);

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

        // ── Bark Wall (Druid) ─────────────────────────────────────────────────
        // Full damage block for 2 rounds. Cannot be recast while active.
      } else if (def.ability2.kind === "bark_wall") {
        barkWallRounds = stats.worldrootTotem ? 3 : 2;
        log.push({
          actor: "player",
          message:
            "A protective Grove rises around you — the enemy's attacks are blocked for 2 turns!",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });

        // ── Holy Light (Paladin) ──────────────────────────────────────────────
        // Coats player in holy radiance, immediately attacks, and empowers next 3 auto attacks to heal.
      } else if (def.ability2.kind === "holy_light") {
        holyLightCharges = 3;
        log.push({
          actor: "player",
          message: `Holy Light surrounds you! Your next 3 attacks will restore life.`,
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

  // Soulvoid Girdle: first ability use each combat deals 20% increased damage
  if (
    useAbility &&
    stats.openerDamageBonus > 0 &&
    !openerBonusUsed &&
    monsterLife > 0 &&
    damageDealt > 0
  ) {
    const bonus = Math.round(damageDealt * stats.openerDamageBonus);
    if (bonus > 0) {
      monsterLife -= bonus;
      damageDealt += bonus;
      log.push({
        actor: "player",
        message: `Soulvoid Girdle amplifies the strike — ${bonus} bonus damage!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
    openerBonusUsed = true;
  }

  // Forsaken Sigil: +15% damage against poisoned or burning enemies
  if (
    stats.dotVictimBonus > 0 &&
    hasDoT &&
    damageDealt > 0 &&
    monsterLife > 0
  ) {
    const bonus = Math.round(damageDealt * stats.dotVictimBonus);
    if (bonus > 0) {
      monsterLife -= bonus;
      damageDealt += bonus;
      log.push({
        actor: "player",
        message: `Forsaken Sigil strikes the afflicted for ${bonus} bonus damage!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  }

  // ── Step 2: Post-action cooldowns & buff tick-downs ──────────────────────────
  if (abilityCooldown > 0) abilityCooldown -= 1;
  if (ability2Cooldown > 0) ability2Cooldown -= 1;
  if (healthPotionCooldown > 0) healthPotionCooldown -= 1;
  if (manaPotionCooldown > 0) manaPotionCooldown -= 1;

  // Blood Fury duration
  if (bloodFuryRounds > 0) bloodFuryRounds -= 1;

  // Bonechill scythe: doubled Soul Siphon fades after 3 turns
  if (bonechillTurns > 0) bonechillTurns -= 1;

  // Electrocute duration (Stormstring)
  if (electrocuteRounds > 0) electrocuteRounds -= 1;

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
      playerMana + stats.maxMana * regenRate * stats.manaRegenMult,
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
      holyLightCharges,
      disorientRounds,
      blindRounds,
      frostShieldRounds,
      barkWallRounds,
      thornStacks,
      burnStacks,
      electrocuteRounds,
      golemRounds,
      stunnedRounds,
      absorbShield: Math.round(absorbShield),
      preparation,
      vanishRounds,
      shadowBondAutoBonus,
      bonechillTurns,
      ebonreapCounter,
      openerBonusUsed,
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
    const tickSiphonPct =
      stats.soulSiphonPct *
      (stats.bonechillActive && bonechillTurns > 0 ? 2 : 1);
    const necroHeal =
      character.classId === "necromancer"
        ? Math.round(poisonDamage * tickSiphonPct)
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

  // ── Step 7: DoT stacks tick (Demon's Tail burn, Vine Whip bleed, Nature's Wrath poison) ─
  // Each stack is independent; multiple can be active simultaneously.
  const DOT_VERB: Record<"burn" | "poison" | "bleed", string> = {
    burn: "burns for {d} fire damage",
    poison: "takes {d} poison damage",
    bleed: "bleeds for {d} damage",
  };
  for (const stack of burnStacks) {
    if (stack.rounds > 0) {
      monsterLife -= stack.damage;
      damageDealt += stack.damage;
      stack.rounds -= 1;
      log.push({
        actor: "player",
        message: `${monster.name} ${DOT_VERB[stack.kind].replace("{d}", String(stack.damage))}. (${stack.rounds} turn${stack.rounds !== 1 ? "s" : ""} remaining)`,
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

  if (monsterActsThisTurn && barkWallRounds > 0) {
    // Bark Wall (Druid): the monster attacks but the wall blocks it entirely —
    // no damage and no status effect gets through.
    log.push({
      actor: "monster",
      message: `The Grove blocks ${monster.name}'s attack!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  } else if (monsterActsThisTurn) {
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

        // Damage reduction order: Ironclad flat → Frost Shield → Golem redirect → Blur → Iron Skin → gear reduction
        if (stats.ironcladFlat > 0)
          spellDmg = Math.max(0, spellDmg - stats.ironcladFlat);
        if (frostShieldRounds > 0)
          spellDmg = Math.max(1, Math.round(spellDmg * 0.4));
        // Golem Defense: 30% of spell damage is dealt back to the monster; player takes 70%
        if (golemRounds > 0) {
          const reflected = Math.round(spellDmg * 0.3);
          monsterLife -= reflected;
          damageDealt += reflected;
          spellDmg = Math.max(1, spellDmg - reflected);
        }
        const blurSpell =
          character.classId === "assassin" &&
          character.level >= 20 &&
          Math.random() < ASSASSIN_BLUR_CHANCE;
        if (blurSpell)
          spellDmg = Math.max(
            1,
            Math.round(spellDmg * (1 - ASSASSIN_BLUR_REDUCTION)),
          );
        const spellVanished = vanishRounds > 0;
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
        if (spellVanished) spellDmg = Math.max(1, Math.round(spellDmg * 0.45));

        if (spell.kind === "burst") {
          takeDamage(spellDmg);
          log.push({
            actor: "monster",
            message: `${monster.name} casts ${spell.name} for ${spellDmg} damage!${frostShieldRounds > 0 ? " Frost Shield absorbs 60%." : ""}${golemRounds > 0 ? " Stone Golem reflects 30% back!" : ""}${blurSpell ? " Blur reduces 25%." : ""}${spellVanished ? " Vanish reduces 55%." : ""}`,
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
            message: `${monster.name} casts ${spell.name} for ${initialHit} damage, poisoning you!${spellVanished ? " Vanish reduces 55%." : ""}`,
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
            message: `${monster.name} casts ${spell.name} for ${initialHit} damage, setting you ablaze!${spellVanished ? " Vanish reduces 55%." : ""}`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        } else if (spell.kind === "drain") {
          // Drain: damages player and heals monster (capped at full life)
          takeDamage(spellDmg);
          monsterLife = Math.min(monster.life, monsterLife + spellDmg);
          log.push({
            actor: "monster",
            message: `${monster.name} casts ${spell.name}, draining ${spellDmg} life from you!${spellVanished ? " Vanish reduces 55%." : ""}`,
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
        // Voidgaze: 15% chance to disorient attacker when taking spell damage
        if (
          stats.disorientOnHitChance > 0 &&
          monsterLife > 0 &&
          Math.random() < stats.disorientOnHitChance / 100
        ) {
          disorientRounds = 2;
          log.push({
            actor: "player",
            message: `Voidgaze disorients ${monster.name}!`,
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

        // Ironclad Hauberk: flat 5 damage reduction before all other reductions
        if (stats.ironcladFlat > 0) dmg = Math.max(0, dmg - stats.ironcladFlat);

        // Thick Hide (Druid): reduces all physical damage by Dex × 0.2%, capped at 25%
        if (character.classId === "druid") {
          const reduction = Math.min(0.25, stats.stats.dexterity * 0.002);
          dmg = Math.max(1, Math.round(dmg * (1 - reduction)));
        }

        // Damage reduction order: Blur → Iron Skin → gear reduction → Frost Shield → Boneweave → Golem redirect
        const blurNormal =
          character.classId === "assassin" &&
          character.level >= 20 &&
          Math.random() < ASSASSIN_BLUR_CHANCE;
        if (blurNormal)
          dmg = Math.max(1, Math.round(dmg * (1 - ASSASSIN_BLUR_REDUCTION)));
        const normalVanished = vanishRounds > 0;
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
        const bastionsActive =
          stats.lowLifePhysDmgReduction > 0 && playerLife < stats.maxLife * 0.5;
        if (bastionsActive)
          dmg = Math.max(
            1,
            Math.round(dmg * (1 - stats.lowLifePhysDmgReduction / 100)),
          );
        if (frostShieldRounds > 0) dmg = Math.max(1, Math.round(dmg * 0.4));
        // Aegis of the Fortress: 15% chance to fully block the hit
        const aegisBlocked =
          stats.aegisBlockChance > 0 &&
          Math.random() < stats.aegisBlockChance / 100;
        if (aegisBlocked) dmg = 0;
        // Boneweave Gloves: 5% chance to reduce hit to exactly 1 damage
        const boneweaveBlocked =
          !aegisBlocked &&
          stats.blockChance > 0 &&
          Math.random() < stats.blockChance / 100;
        if (boneweaveBlocked) dmg = 1;
        // Penitent's Guard: 12% chance to block the hit entirely
        const penitentsBlocked =
          !aegisBlocked &&
          !boneweaveBlocked &&
          stats.shieldBlockChance > 0 &&
          Math.random() < stats.shieldBlockChance / 100;
        if (penitentsBlocked) dmg = 0;
        // Golem Defense: 30% of physical damage reflected; player takes 70%
        if (golemRounds > 0) {
          const reflected = Math.round(dmg * 0.3);
          monsterLife -= reflected;
          damageDealt += reflected;
          dmg = Math.max(1, dmg - reflected);
        }

        if (normalVanished) dmg = Math.max(1, Math.round(dmg * 0.45));

        takeDamage(dmg);

        let message = isMonsterCrit
          ? `Critical hit! ${monster.name} deals ${dmg} damage.`
          : `${monster.name} hits you for ${dmg} damage.`;

        if (blurNormal) message += " Blur reduces the blow by 25%.";
        if (ironSkin > 0)
          message += ` Iron Skin absorbs ${Math.round(ironSkin * 100)}%.`;
        if (frostShieldRounds > 0) message += " Frost Shield absorbs 60%.";
        if (golemRounds > 0) message += " Stone Golem reflects 30% back!";
        if (aegisBlocked)
          message = `${monster.name} attacks — Aegis of the Fortress blocks the blow entirely!`;
        if (boneweaveBlocked) message += " Boneweave Gloves block the blow!";
        if (penitentsBlocked)
          message = `${monster.name} attacks — Heaven's Wrath blocks the blow!`;
        if (normalVanished) message += " Vanish reduces damage by 55%.";
        if (bastionsActive) message += " Bastion's Remnant absorbs 12%.";

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
        // Heaven's Wrath: heal 8% max life on block
        if (penitentsBlocked && stats.shieldBlockHealPct > 0) {
          const blockHeal = Math.round(
            stats.maxLife * stats.shieldBlockHealPct,
          );
          applyHeal(blockHeal);
          message += ` Heaven's Wrath restores ${blockHeal} life!`;
        }
        // Stoneguard: reflect 20% of physical damage back
        if (stats.physReflectPct > 0 && dmg > 0) {
          const reflectDmg = Math.round(dmg * stats.physReflectPct);
          monsterLife -= reflectDmg;
          damageDealt += reflectDmg;
          message += ` Stoneguard reflects ${reflectDmg} damage!`;
        }

        log.push({
          actor: "monster",
          message,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        // Heaven's Wrath: 18% chance to retaliate after taking damage
        if (
          stats.counterOnHitChance > 0 &&
          dmg > 0 &&
          monsterLife > 0 &&
          Math.random() < stats.counterOnHitChance
        ) {
          const retDmg = Math.round(
            randomInRange(stats.damage) * stats.magicDamageMult,
          );
          monsterLife -= retDmg;
          damageDealt += retDmg;
          log.push({
            actor: "player",
            message: `Penitent's Guard retaliates for ${retDmg} holy damage!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }
        // Voidgaze: 15% chance to disorient attacker when taking physical damage
        if (
          stats.disorientOnHitChance > 0 &&
          dmg > 0 &&
          monsterLife > 0 &&
          Math.random() < stats.disorientOnHitChance / 100
        ) {
          disorientRounds = 2;
          log.push({
            actor: "player",
            message: `Voidgaze disorients ${monster.name}!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }
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
    let counterDmg = Math.round(randomInRange(stats.damage) * electrocuteMult);
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

  // ── Step 11: Duration ticks ────────────────────────────────────────────────────
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
  if (barkWallRounds > 0) {
    barkWallRounds -= 1;
    if (barkWallRounds === 0) {
      log.push({
        actor: "player",
        message: "The Grove withers away.",
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  }
  if (vanishRounds > 0) {
    vanishRounds -= 1;
    if (vanishRounds === 0) {
      log.push({
        actor: "player",
        message: "Vanish fades — you reappear.",
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
      stats.lowLifeDamageBonus > 0 && playerLife < stats.maxLife * 0.4
        ? 1 + stats.lowLifeDamageBonus
        : 1.0;
    const trapElectrocuteMult = electrocuteRounds > 0 ? 1.2 : 1.0;
    const trapDmg = Math.round(
      stats.stats.dexterity *
        def.ability.power *
        trapLowLifeMult *
        trapElectrocuteMult,
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
    if (stats.lifeLeechBonus > 0) {
      const leeched = Math.round((finalTrapDmg * stats.lifeLeechBonus) / 100);
      if (leeched > 0) {
        applyHeal(leeched);
        log[log.length - 1].message += ` Life Leech restores ${leeched} life.`;
      }
    }
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
