import { CLASSES } from "./data/classes";
import { POTION_COOLDOWN, POTION_RESTORE_RATE } from "./data/consumables";
import { FURY_PER_ATTACK } from "./character";
import type { DerivedStats } from "./character";
import type { Character, MonsterDefinition } from "./types";

export interface CombatLogEntry {
  actor: "player" | "monster";
  message: string;
  playerLife: number;
  monsterLife: number;
}

export interface BattleState {
  playerLife: number;
  playerMana: number;
  monsterLife: number;
  abilityCooldown: number;
  healthPotionCooldown: number;
  manaPotionCooldown: number;
  poisonRounds: number;
  poisonDamage: number;
  monsterSpellCooldown: number;
  playerPoisonRounds: number;
  playerPoisonDamage: number;
  playerBurnRounds: number;
  playerBurnDamage: number;
  trapRounds: number;
  bloodFuryRounds: number;
  ability2Cooldown: number;
  frozenRounds: number;
  regenRounds: number;
  disorientRounds: number;
  blindRounds: number;
  frostShieldRounds: number;
  burnStacks: { rounds: number; damage: number; source: string }[];
  electrocuteRounds: number;
}

export type PlayerActionKind = "attack" | "ability" | "ability2" | "healthPotion" | "manaPotion";

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

const ALWAYS_MISS_CHANCE = 0.02;
const MONSTER_CRIT_CHANCE = 0.1;
const DEFAULT_CRIT_MULTIPLIER = 1.50;
const MANA_REGEN_RATE = 0.05;

// Passives
const BARBARIAN_DOUBLE_SWING_CHANCE = 0.25;
const BARBARIAN_BLOOD_FURY_DAMAGE_BONUS = 0.20;
const BARBARIAN_BLOOD_FURY_LIFESTEAL = 0.20;
const BARBARIAN_BLOOD_FURY_DOUBLE_SWING_BONUS = 0.25;
const BARBARIAN_IRON_SKIN_REDUCTION_PER_5PCT = 0.02;
const BARBARIAN_MADNESS_DAMAGE_BONUS = 0.15;
const BARBARIAN_MADNESS_FURY_BONUS = 5;
const BARBARIAN_MADNESS_FURY_THRESHOLD = 30;
const SORCERESS_MANA_REGEN_RATE = 0.10;
const PALADIN_DAMAGE_TAKEN_HEAL = 0.15;
const NECROMANCER_POISON_LIFESTEAL = 0.1;

function getIronSkinReduction(character: Character, currentLife: number, maxLife: number): number {
  if (character.classId !== "barbarian" || character.level < 20) return 0;
  const missingPct = Math.max(0, (1 - currentLife / maxLife) * 100);
  return Math.floor(missingPct / 5) * BARBARIAN_IRON_SKIN_REDUCTION_PER_5PCT;
}

function rollHitChance(attackRating: number, defense: number): number {
  const chance = attackRating / (defense * 1.5);
  return Math.max(0.15, Math.min(1 - ALWAYS_MISS_CHANCE, chance));
}

function randomInRange([min, max]: [number, number]): number {
  return Math.round(min + Math.random() * (max - min));
}

function rollAbilityDamage(stats: DerivedStats, power: number, magic: boolean, magicPower = 1): number {
  const base = Math.round(randomInRange(stats.damage) * power);
  return magic ? Math.round((base + stats.magicDamageBonus * magicPower) * stats.magicDamageMult) : base;
}

export function createBattleState(
  monster: MonsterDefinition,
  startingLife: number,
  startingMana: number,
  startingCooldown: number,
  startingCooldown2 = 0
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
  };
}

export function canUseAbility(character: Character, state: BattleState): boolean {
  const def = CLASSES[character.classId];
  if (def.ability.kind === "trap" && state.trapRounds > 0) return false;
  if (def.ability.kind === "buff" && state.bloodFuryRounds > 0) return false;
  return state.playerMana >= def.ability.manaCost && state.abilityCooldown <= 0;
}

export function canUseAbility2(character: Character, state: BattleState): boolean {
  const def = CLASSES[character.classId];
  if (!def.ability2) return false;
  if (def.ability2.kind === "regen" && state.regenRounds > 0) return false;
  if (def.ability2.kind === "frost_shield" && state.frostShieldRounds > 0) return false;
  return state.playerMana >= def.ability2.manaCost && state.ability2Cooldown <= 0;
}

const AMAZON_FIND_WEAKNESS_CRIT = 0.15;
const AMAZON_DODGE_CHANCE = 0.15;

export function getEffectiveCritChance(character: Character, stats: DerivedStats): number {
  const amazonBonus = character.classId === "amazon" && character.level >= 20 ? AMAZON_FIND_WEAKNESS_CRIT : 0;
  return Math.min(0.9, stats.critChance + amazonBonus);
}

export function getCritMultiplier(_character: Character): number {
  return DEFAULT_CRIT_MULTIPLIER;
}

export function rollGoldReward(monster: MonsterDefinition, goldFindBonus = 0): number {
  const base = randomInRange(monster.goldReward);
  return Math.round(base * (1 + goldFindBonus / 100));
}

export interface DamagePreview {
  label: string;
  type: string;
}

export function getAttackPreview(character: Character, stats: DerivedStats): DamagePreview {
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

export function getAbilityPreview(character: Character, stats: DerivedStats): DamagePreview {
  const def = CLASSES[character.classId];
  const ability = def.ability;
  const avg = (stats.damage[0] + stats.damage[1]) / 2;
  const bonus = ability.magic ? stats.magicDamageBonus : 0;
  const dmgType = ability.magic ? "Magic" : "Physical";

  if (ability.kind === "buff") {
    return { label: "—", type: "Buff" };
  }
  if (ability.kind === "burst") {
    const est = Math.round((avg * ability.power + bonus * (ability.magicPower ?? 1)) * stats.magicDamageMult);
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

export function getAbility2Preview(character: Character, stats: DerivedStats): DamagePreview {
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
    const healPerTick = Math.round(stats.maxLife * 0.10);
    return { label: `3× ${healPerTick} heal`, type: "Heal" };
  }
  return { label: "—", type: "Physical" };
}

export function resolveRound(
  character: Character,
  stats: DerivedStats,
  monster: MonsterDefinition,
  state: BattleState,
  action: PlayerActionKind
): RoundResult {
  const def = CLASSES[character.classId];
  const log: CombatLogEntry[] = [];

  const critChance = getEffectiveCritChance(character, stats);
  const critMultiplier = getCritMultiplier(character);

  let { playerLife, playerMana, monsterLife, abilityCooldown, healthPotionCooldown, manaPotionCooldown, poisonRounds, poisonDamage, monsterSpellCooldown, playerPoisonRounds, playerPoisonDamage, playerBurnRounds, playerBurnDamage, trapRounds, bloodFuryRounds, ability2Cooldown, frozenRounds, regenRounds, disorientRounds, blindRounds, frostShieldRounds, electrocuteRounds } = state;
  let burnStacks = state.burnStacks.map(s => ({ ...s }));
  const electrocuteMult = electrocuteRounds > 0 ? 1.20 : 1.0;
  const deathwhisperMult = stats.deathwhisperBoost && (blindRounds > 0 || disorientRounds > 0) ? 1.30 : 1.0;
  const heartseekerMult = stats.heartseekerBoost ? 0.70 : 0.50;
  let damageDealt = 0;
  let trapDetonated = false;
  const lowLifeMult = stats.lowLifeDamageBonus > 0 && playerLife < stats.maxLife * 0.30 ? 1 + stats.lowLifeDamageBonus : 1.0;

  const tryIgnite = (dmg: number, source = "Demon's Tail") => {
    if (stats.igniteChance > 0 && dmg > 0 && monsterLife > 0) {
      const igniteDmg = Math.round(dmg * 0.30);
      burnStacks.push({ rounds: 2, damage: igniteDmg, source });
      log.push({ actor: "player", message: `${source} ignites the enemy — ${igniteDmg} fire per turn for 2 turns!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }
  };

  const doBasicAttack = () => {
    const hitChance = 1 - ALWAYS_MISS_CHANCE;
    let damageMult = 1.0;
    if (bloodFuryRounds > 0) damageMult *= 1 + BARBARIAN_BLOOD_FURY_DAMAGE_BONUS;
    if (character.classId === "barbarian" && character.level >= 35 && playerMana > BARBARIAN_MADNESS_FURY_THRESHOLD) damageMult *= 1 + BARBARIAN_MADNESS_DAMAGE_BONUS;
    if (character.classId === "assassin" && character.level >= 35) damageMult *= 1.10;
    if (lowLifeMult > 1.0) damageMult *= lowLifeMult;
    const assassinAdvantageCrit = character.classId === "assassin" && character.level >= 35 && poisonRounds > 0 ? 0.05 : 0;
    let basicHitDmg = 0;
    let basicHitCrit = false;

    if (Math.random() < hitChance) {
      const isCrit = Math.random() < critChance + assassinAdvantageCrit;
      basicHitCrit = isCrit;
      let dmg = Math.round(randomInRange(stats.damage) * damageMult * electrocuteMult * deathwhisperMult);
      if (isCrit) dmg = Math.round(dmg * critMultiplier);
      monsterLife -= dmg;
      damageDealt += dmg;
      basicHitDmg = dmg;

      let attackMsg = isCrit ? `Critical hit! You deal ${dmg} damage.` : `You attack for ${dmg} damage.`;
      if (bloodFuryRounds > 0) {
        const stolen = Math.round(dmg * BARBARIAN_BLOOD_FURY_LIFESTEAL);
        if (stolen > 0) {
          playerLife = Math.min(stats.maxLife, playerLife + stolen);
          attackMsg += ` Blood Fury steals ${stolen} life.`;
        }
      }
      if (stats.lifeLeechBonus > 0) {
        const leeched = Math.round(dmg * stats.lifeLeechBonus / 100);
        if (leeched > 0) {
          playerLife = Math.min(stats.maxLife, playerLife + leeched);
          attackMsg += ` Life Leech restores ${leeched} life.`;
        }
      }
      if (stats.electrocuteOnHit) {
        electrocuteRounds = 2;
        attackMsg += ` Electrocute! Enemy takes 20% more damage for 2 turns.`;
      }
      if (stats.disorientOnAttackChance > 0 && Math.random() < stats.disorientOnAttackChance / 100) {
        disorientRounds = 2;
        attackMsg += ` Reaper's Hood disorients the enemy!`;
      }
      log.push({ actor: "player", message: attackMsg, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
      tryIgnite(basicHitDmg);
    } else {
      log.push({ actor: "player", message: "Your attack misses.", playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }

    if (def.resourceType === "fury") {
      const madnessFuryBonus = character.classId === "barbarian" && character.level >= 35 ? BARBARIAN_MADNESS_FURY_BONUS : 0;
      playerMana = Math.min(stats.maxMana, playerMana + FURY_PER_ATTACK + madnessFuryBonus);
    }

    if (character.classId === "amazon" && character.level >= 35 && basicHitCrit && basicHitDmg > 0 && monsterLife > 0) {
      const heartseekerDmg = Math.round(basicHitDmg * heartseekerMult);
      monsterLife -= heartseekerDmg;
      damageDealt += heartseekerDmg;
      log.push({ actor: "player", message: `Heartseeker fires for ${heartseekerDmg} damage!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }

    if (character.classId === "assassin" && character.level >= 20 && basicHitDmg > 0) {
      poisonRounds = 2;
      poisonDamage = Math.round(basicHitDmg * 0.30 * stats.poisonDamageMult);
      log.push({ actor: "player", message: `Venom seeps in — ${poisonDamage} poison per turn for 2 turns.`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }

    if (stats.shadowfangProc && basicHitDmg > 0 && monsterLife > 0 && Math.random() < 0.20) {
      const phantomDmg = Math.round(basicHitDmg * 0.50);
      monsterLife -= phantomDmg;
      damageDealt += phantomDmg;
      log.push({ actor: "player", message: `Shadowfang — a phantom strikes for ${phantomDmg} damage!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }

    const doubleSwingChance = BARBARIAN_DOUBLE_SWING_CHANCE + (bloodFuryRounds > 0 ? BARBARIAN_BLOOD_FURY_DOUBLE_SWING_BONUS : 0);
    if (character.classId === "barbarian" && monsterLife > 0 && Math.random() < doubleSwingChance) {
      const hitChance2 = 1 - ALWAYS_MISS_CHANCE;
      if (Math.random() < hitChance2) {
        const isCrit2 = Math.random() < critChance;
        let dmg2 = Math.round(randomInRange(stats.damage) * damageMult);
        if (isCrit2) dmg2 = Math.round(dmg2 * critMultiplier);
        monsterLife -= dmg2;
        damageDealt += dmg2;

        let swingMsg = isCrit2 ? `Double Swing! Critical hit — ${dmg2} damage!` : `Double Swing! You strike again for ${dmg2} damage.`;
        if (bloodFuryRounds > 0) {
          const stolen2 = Math.round(dmg2 * BARBARIAN_BLOOD_FURY_LIFESTEAL);
          if (stolen2 > 0) {
            playerLife = Math.min(stats.maxLife, playerLife + stolen2);
            swingMsg += ` Blood Fury steals ${stolen2} life.`;
          }
        }
        if (stats.lifeLeechBonus > 0) {
          const leeched2 = Math.round(dmg2 * stats.lifeLeechBonus / 100);
          if (leeched2 > 0) {
            playerLife = Math.min(stats.maxLife, playerLife + leeched2);
            swingMsg += ` Life Leech restores ${leeched2} life.`;
          }
        }
        log.push({ actor: "player", message: swingMsg, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
        tryIgnite(dmg2);
      } else {
        log.push({ actor: "player", message: "Double Swing! Your second strike misses.", playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
      }
    }
  };

  if (monsterLife > 0) {
    const useAbility = action === "ability" && playerMana >= def.ability.manaCost && abilityCooldown <= 0;

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
      } else if (def.ability.kind === "buff") {
        bloodFuryRounds = 3;
        log.push({
          actor: "player",
          message: "Blood Fury ignites! You surge with primal power.",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        doBasicAttack();
      } else if (def.ability.kind === "burst") {
        const isCrit = Math.random() < critChance;
        const arcanistMult = stats.arcanistStaff && frostShieldRounds > 0 ? 1.40 : 1.0;
        let dmg = Math.round(rollAbilityDamage(stats, def.ability.power, def.ability.magic, def.ability.magicPower) * lowLifeMult * electrocuteMult * deathwhisperMult * arcanistMult);
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
        const arcanistNote = arcanistMult > 1.0 ? " Frost Shield channels the arcane!" : "";
        log.push({
          actor: "player",
          message: isCrit ? `Critical hit! ${def.ability.name} strikes for ${dmg} damage!${arcanistNote}` : `You unleash ${def.ability.name} for ${dmg} damage!${arcanistNote}`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);
        if (stats.burstEchoChance > 0 && monsterLife > 0 && Math.random() < stats.burstEchoChance) {
          const echoDmg = Math.round(dmg * 0.50);
          monsterLife -= echoDmg;
          damageDealt += echoDmg;
          log.push({
            actor: "player",
            message: `Eternity's Edge echoes the spell for ${echoDmg} damage!`,
            playerLife: Math.max(0, playerLife),
            monsterLife: Math.max(0, monsterLife),
          });
        }
      } else if (def.ability.kind === "dot") {
        const isCrit = Math.random() < critChance;
        let dmg = Math.round(rollAbilityDamage(stats, 0.4, def.ability.magic) * lowLifeMult * electrocuteMult * deathwhisperMult);
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
        poisonRounds = 3;
        poisonDamage = Math.round(rollAbilityDamage(stats, def.ability.power * 0.4, def.ability.magic) * stats.poisonDamageMult);
        log.push({
          actor: "player",
          message: isCrit ? `Critical hit! ${def.ability.name} strikes for ${dmg} damage, poisoning the enemy!` : `You strike with ${def.ability.name} for ${dmg} damage, poisoning the enemy!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);
      } else if (def.ability.kind === "multi") {
        const hitCount = def.ability.hits ?? 3;
        for (let i = 0; i < hitCount; i++) {
          if (monsterLife <= 0) break;

          let hitDmg = Math.round(rollAbilityDamage(stats, def.ability.power, def.ability.magic) * lowLifeMult * electrocuteMult * deathwhisperMult);
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

          if (character.classId === "amazon" && character.level >= 35 && isHitCrit && monsterLife > 0) {
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
      } else if (def.ability.kind === "heal") {
        const isCrit = Math.random() < critChance;
        let dmg = Math.round(rollAbilityDamage(stats, def.ability.power, def.ability.magic, def.ability.magicPower ?? 1) * lowLifeMult * electrocuteMult * deathwhisperMult);
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        const healAmt = Math.round(dmg * 0.35);
        monsterLife -= dmg;
        damageDealt += dmg;
        playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        log.push({
          actor: "player",
          message: isCrit ? `Critical hit! ${def.ability.name} strikes for ${dmg} damage and heals ${healAmt} life!` : `You call upon ${def.ability.name}, dealing ${dmg} damage and healing ${healAmt} life!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);
      } else if (def.ability.kind === "bite") {
        const baseDmg = randomInRange(stats.damage);
        const dexBonus = Math.round(stats.stats.dexterity * 1.5);
        const dmg = Math.round((baseDmg + dexBonus) * lowLifeMult * electrocuteMult * deathwhisperMult);
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
      } else if (def.ability.kind === "trap") {
        trapRounds = 3;
        log.push({
          actor: "player",
          message: "You plant a Fire Trap!",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    } else if (action === "ability2" && def.ability2 && playerMana >= def.ability2.manaCost && ability2Cooldown <= 0) {
      const furyBeforeCost = playerMana;
      playerMana -= def.ability2.manaCost;
      ability2Cooldown = def.ability2.cooldown;

      if (def.ability2.kind === "freeze") {
        if (def.ability2.canMiss !== false && Math.random() < ALWAYS_MISS_CHANCE) {
          log.push({ actor: "player", message: "Your Freezing Shot misses.", playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
        } else {
          const baseDmg = randomInRange(stats.damage);
          const dexBonus = Math.round(stats.stats.dexterity * 0.5);
          const isCrit = Math.random() < critChance;
          let dmg = Math.round((baseDmg + dexBonus) * lowLifeMult * electrocuteMult * deathwhisperMult);
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
      } else if (def.ability2.kind === "obliterate") {
        const madnessMult = character.classId === "barbarian" && character.level >= 35 && furyBeforeCost > BARBARIAN_MADNESS_FURY_THRESHOLD ? 1 + BARBARIAN_MADNESS_DAMAGE_BONUS : 1.0;
        const baseDmg = randomInRange(stats.damage);
        const strBonus = Math.round(stats.stats.strength * 0.5);
        const dmg = Math.round((baseDmg + strBonus) * madnessMult * lowLifeMult * electrocuteMult * deathwhisperMult);
        const killingBlow = monsterLife - dmg <= 0;
        monsterLife -= dmg;
        damageDealt += dmg;
        const healAmt = killingBlow ? Math.round(stats.maxLife * 0.10) : 0;
        if (healAmt > 0) playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        log.push({
          actor: "player",
          message: killingBlow
            ? `Obliterate! You deal ${dmg} damage (${baseDmg} + ${strBonus} str) — killing blow! You recover ${healAmt} life.`
            : `Obliterate! You deal ${dmg} damage (${baseDmg} + ${strBonus} str).`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        tryIgnite(dmg);
      } else if (def.ability2.kind === "blind_powder") {
        blindRounds = 2;
        disorientRounds = 0;
        log.push({
          actor: "player",
          message: "You hurl Blinding Powder! The enemy is blinded (2 turns) and disoriented (4 turns).",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability2.kind === "frost_shield") {
        frostShieldRounds = 3;
        log.push({
          actor: "player",
          message: "Frost Shield encases you in magical ice — incoming damage reduced by 60% for 3 turns!",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability2.kind === "regen") {
        regenRounds = 3;
        const firstHeal = Math.round(stats.maxLife * 0.10);
        playerLife = Math.min(stats.maxLife, playerLife + firstHeal);
        log.push({
          actor: "player",
          message: `Regenerating Nova radiates holy light — you recover ${firstHeal} life! (3 turns)`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
        doBasicAttack();
      }
    } else if (action === "healthPotion" && healthPotionCooldown <= 0) {
      const before = playerLife;
      const defensiveAuraPotionBonus = character.classId === "paladin" && character.level >= 20
        ? Math.round(stats.maxLife * 0.10) : 0;
      playerLife = Math.min(stats.maxLife, playerLife + Math.round(stats.maxLife * POTION_RESTORE_RATE) + defensiveAuraPotionBonus);
      healthPotionCooldown = POTION_COOLDOWN;
      const potionRestored = playerLife - before;
      log.push({
        actor: "player",
        message: defensiveAuraPotionBonus > 0
          ? `You drink a Health Potion, restoring ${potionRestored} life (Defensive Aura bonus included).`
          : `You drink a Health Potion, restoring ${potionRestored} life.`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else if (action === "manaPotion" && manaPotionCooldown <= 0) {
      const before = playerMana;
      playerMana = Math.min(stats.maxMana, playerMana + Math.round(stats.maxMana * POTION_RESTORE_RATE));
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

  if (abilityCooldown > 0) abilityCooldown -= 1;
  if (ability2Cooldown > 0) ability2Cooldown -= 1;
  if (healthPotionCooldown > 0) healthPotionCooldown -= 1;
  if (manaPotionCooldown > 0) manaPotionCooldown -= 1;
  if (bloodFuryRounds > 0) {
    bloodFuryRounds -= 1;
  }
  if (electrocuteRounds > 0) {
    electrocuteRounds -= 1;
  }
  if (regenRounds > 0) {
    regenRounds -= 1;
    if (regenRounds > 0) {
      const regenHeal = Math.round(stats.maxLife * 0.10);
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
  if (def.resourceType === "mana" && playerMana < stats.maxMana) {
    const regenRate = character.classId === "sorceress" ? SORCERESS_MANA_REGEN_RATE : MANA_REGEN_RATE;
    playerMana = Math.min(stats.maxMana, playerMana + stats.maxMana * regenRate * stats.manaRegenMult + stats.manaRegenBonus);
  }

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
    };
  }

  if (monsterLife <= 0) {
    return { state: makeState(), log, status: "victory", damageDealt };
  }

  // Player-poison tick from monster dot spell (start of monster turn)
  if (playerPoisonRounds > 0) {
    playerLife -= playerPoisonDamage;
    playerPoisonRounds -= 1;
    log.push({
      actor: "monster",
      message: `Poison courses through you for ${playerPoisonDamage} damage.`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }

  // Player-burn tick from monster burn spell (start of monster turn)
  if (playerBurnRounds > 0) {
    playerLife -= playerBurnDamage;
    playerBurnRounds -= 1;
    log.push({
      actor: "monster",
      message: `Fire burns you for ${playerBurnDamage} damage.`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }

  // Enemy poison tick (start of monster turn)
  if (poisonRounds > 0) {
    monsterLife -= poisonDamage;
    damageDealt += poisonDamage;
    poisonRounds -= 1;
    const necroHeal = character.classId === "necromancer"
      ? Math.round(poisonDamage * NECROMANCER_POISON_LIFESTEAL)
      : 0;
    if (necroHeal > 0) playerLife = Math.min(stats.maxLife, playerLife + necroHeal);
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

  // Burn stacks tick
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
        burnStacks = burnStacks.filter(s => s.rounds > 0);
        return { state: makeState(), log, status: "victory", damageDealt };
      }
    }
  }
  burnStacks = burnStacks.filter(s => s.rounds > 0);

  if (trapRounds > 0) trapRounds -= 1;

  if (monsterSpellCooldown > 0) monsterSpellCooldown -= 1;

  let monsterSpellCastName: string | undefined;

  // Frozen or blinded — monster skips its action entirely
  const monsterActsThisTurn = frozenRounds <= 0 && blindRounds <= 0;
  if (frozenRounds > 0) {
    frozenRounds -= 1;
    log.push({
      actor: "monster",
      message: `${monster.name} is frozen solid and cannot act!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  } else if (blindRounds > 0) {
    blindRounds -= 1;
    if (blindRounds === 0) disorientRounds = 4;
    log.push({
      actor: "monster",
      message: `${monster.name} is blinded and cannot act!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
  }
  if (disorientRounds > 0) disorientRounds -= 1;

  if (monsterActsThisTurn) {

  // Monster spell (replaces normal attack when cast)
  const spell = monster.spell;
  const castSpell = spell && monsterSpellCooldown <= 0 && Math.random() < spell.chance;
  if (castSpell && spell) {
    monsterSpellCastName = spell.name;
    monsterSpellCooldown = spell.cooldown;
    const amazonDodgedSpell = character.classId === "amazon" && Math.random() < AMAZON_DODGE_CHANCE;
    if (amazonDodgedSpell) {
      log.push({
        actor: "monster",
        message: `${monster.name} casts ${spell.name}, but you dodge!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else {
    let spellDmg = Math.round(randomInRange(monster.damage) * spell.power * (disorientRounds > 0 ? 0.75 : 1.0));
    if (frostShieldRounds > 0) spellDmg = Math.max(1, Math.round(spellDmg * 0.40));
    const fadedSpell = character.classId === "assassin" && Math.random() < 0.25;
    if (fadedSpell) spellDmg = Math.max(1, Math.round(spellDmg * 0.55));
    const ironSkinSpell = getIronSkinReduction(character, playerLife, stats.maxLife);
    if (ironSkinSpell > 0) spellDmg = Math.max(1, Math.round(spellDmg * (1 - ironSkinSpell)));
    if (stats.magicDmgReduction > 0) spellDmg = Math.max(1, Math.round(spellDmg * (1 - stats.magicDmgReduction / 100)));

    if (spell.kind === "burst") {
      playerLife -= spellDmg;
      log.push({
        actor: "monster",
        message: `${monster.name} casts ${spell.name} for ${spellDmg} damage!${frostShieldRounds > 0 ? " Frost Shield absorbs 60%." : ""}`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else if (spell.kind === "dot") {
      const initialHit = Math.round(spellDmg * 0.4);
      playerLife -= initialHit;
      playerPoisonRounds = 3;
      playerPoisonDamage = Math.round(spellDmg * 0.4);
      log.push({
        actor: "monster",
        message: `${monster.name} casts ${spell.name} for ${initialHit} damage, poisoning you!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else if (spell.kind === "burn") {
      const initialHit = Math.round(spellDmg * 0.4);
      playerLife -= initialHit;
      playerBurnRounds = 3;
      playerBurnDamage = Math.round(spellDmg * 0.4);
      log.push({
        actor: "monster",
        message: `${monster.name} casts ${spell.name} for ${initialHit} damage, setting you ablaze!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    } else if (spell.kind === "drain") {
      playerLife -= spellDmg;
      monsterLife = Math.min(monster.life, monsterLife + spellDmg);
      log.push({
        actor: "monster",
        message: `${monster.name} casts ${spell.name}, draining ${spellDmg} life from you!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }

    if (character.classId === "paladin" && spellDmg > 0) {
      const healBack = Math.round(spellDmg * PALADIN_DAMAGE_TAKEN_HEAL);
      playerLife = Math.min(stats.maxLife, playerLife + healBack);
      if (character.level >= 35) {
        const thornsDmg = Math.round(spellDmg * 0.20);
        monsterLife -= thornsDmg;
        damageDealt += thornsDmg;
        log.push({ actor: "player", message: `Thorns Aura reflects ${thornsDmg} damage back!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
      }
    }
    if (stats.thornReflect > 0 && spellDmg > 0) {
      const reflectDmg = Math.round(spellDmg * stats.thornReflect);
      monsterLife -= reflectDmg;
      damageDealt += reflectDmg;
      log.push({ actor: "player", message: `Thornback reflects ${reflectDmg} damage!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }
    } // end !amazonDodgedSpell
  } else {
    // Normal attack
    const amazonDodged = character.classId === "amazon" && Math.random() < AMAZON_DODGE_CHANCE;
    if (amazonDodged) {
      log.push({
        actor: "monster",
        message: `${monster.name} attacks, but you dodge!`,
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
    const defenseAuraBonus = character.classId === "paladin" && character.level >= 20 ? 1.10 : 1.0;
    const monsterHitChance = rollHitChance(monster.attackRating, Math.round(stats.defense * defenseAuraBonus));
    if (!amazonDodged && Math.random() < monsterHitChance) {
      const isMonsterCrit = Math.random() < MONSTER_CRIT_CHANCE;
      let dmg = Math.round(randomInRange(monster.damage) * (disorientRounds > 0 ? 0.75 : 1.0));
      if (isMonsterCrit) dmg = Math.round(dmg * 1.75);

      if (character.classId === "druid") {
        const reduction = Math.min(0.25, stats.stats.dexterity * 0.002);
        dmg = Math.max(1, Math.round(dmg * (1 - reduction)));
      }

      const fadedNormal = character.classId === "assassin" && Math.random() < 0.25;
      if (fadedNormal) dmg = Math.max(1, Math.round(dmg * 0.55));
      const ironSkin = getIronSkinReduction(character, playerLife, stats.maxLife);
      if (ironSkin > 0) dmg = Math.max(1, Math.round(dmg * (1 - ironSkin)));
      if (stats.physDmgReduction > 0) dmg = Math.max(1, Math.round(dmg * (1 - stats.physDmgReduction / 100)));
      if (frostShieldRounds > 0) dmg = Math.max(1, Math.round(dmg * 0.40));
      const boneweaveBlocked = stats.blockChance > 0 && Math.random() < stats.blockChance / 100;
      if (boneweaveBlocked) dmg = 1;

      playerLife -= dmg;

      let message = isMonsterCrit
        ? `Critical hit! ${monster.name} deals ${dmg} damage.`
        : `${monster.name} hits you for ${dmg} damage.`;

      if (character.classId === "druid") {
        const reductionPct = Math.round(Math.min(25, stats.stats.dexterity * 0.2));
        message += ` Thick Hide absorbs ${reductionPct}%.`;
      }
      if (fadedNormal) message += " Fade reduces the blow by 45%.";
      if (ironSkin > 0) message += ` Iron Skin absorbs ${Math.round(ironSkin * 100)}%.`;
      if (frostShieldRounds > 0) message += " Frost Shield absorbs 60%.";
      if (boneweaveBlocked) message += " Boneweave Gloves block the blow!";

      if (character.classId === "paladin") {
        const healBack = Math.round(dmg * PALADIN_DAMAGE_TAKEN_HEAL);
        playerLife = Math.min(stats.maxLife, playerLife + healBack);
        message += ` Divine Retribution restores ${healBack} life.`;
        if (character.level >= 35) {
          const thornsDmg = Math.round(dmg * 0.20);
          monsterLife -= thornsDmg;
          damageDealt += thornsDmg;
          message += ` Thorns Aura reflects ${thornsDmg} damage!`;
        }
      }
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

  if (frostShieldRounds > 0) {
    frostShieldRounds -= 1;
    if (frostShieldRounds === 0) {
      log.push({ actor: "player", message: "Frost Shield fades.", playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }
  }

  // Fire Trap detonation — after monster acts
  if (trapRounds === 0 && state.trapRounds > 0) {
    const trapLowLifeMult = stats.lowLifeDamageBonus > 0 && playerLife < stats.maxLife * 0.30 ? 1 + stats.lowLifeDamageBonus : 1.0;
    const trapElectrocuteMult = electrocuteRounds > 0 ? 1.20 : 1.0;
    const trapDeathwhisperMult = stats.deathwhisperBoost && (blindRounds > 0 || disorientRounds > 0) ? 1.30 : 1.0;
    const trapDmg = Math.round(stats.stats.dexterity * def.ability.power * trapLowLifeMult * trapElectrocuteMult * trapDeathwhisperMult);
    const isCrit = Math.random() < critChance;
    const finalTrapDmg = isCrit ? Math.round(trapDmg * critMultiplier) : trapDmg;
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
      return { state: makeState(), log, status: "victory", damageDealt, trapDetonated };
    }
  }

  const status: BattleStatus = playerLife <= 0 ? "defeat" : "ongoing";
  return { state: makeState(), log, status, damageDealt, monsterSpellCast: monsterSpellCastName, trapDetonated };
}
