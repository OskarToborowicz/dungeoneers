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
}

export type PlayerActionKind = "attack" | "ability" | "healthPotion" | "manaPotion";

export type BattleStatus = "ongoing" | "victory" | "defeat";

export interface CombatResult {
  victory: boolean;
  xpReward: number;
  goldReward: number;
  endingLife: number;
  endingMana: number;
  endingCooldown: number;
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
const BARBARIAN_BONUS_CRIT_CHANCE = 0.10;
const BARBARIAN_CRIT_MULTIPLIER = 1.25;
const SORCERESS_ATTACK_MANA_REGEN_RATE = 0.2;
const PALADIN_DAMAGE_TAKEN_HEAL = 0.15;
const NECROMANCER_POISON_LIFESTEAL = 0.1;

function rollHitChance(attackRating: number, defense: number): number {
  const chance = attackRating / (attackRating + defense * 2);
  return Math.max(0.15, Math.min(1 - ALWAYS_MISS_CHANCE, chance));
}

function randomInRange([min, max]: [number, number]): number {
  return Math.round(min + Math.random() * (max - min));
}

function rollAbilityDamage(stats: DerivedStats, power: number, magic: boolean): number {
  const base = Math.round(randomInRange(stats.damage) * power);
  return magic ? base + stats.magicDamageBonus : base;
}

export function createBattleState(
  monster: MonsterDefinition,
  startingLife: number,
  startingMana: number,
  startingCooldown: number
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
  };
}

export function canUseAbility(character: Character, state: BattleState): boolean {
  const def = CLASSES[character.classId];
  if (def.ability.kind === "trap" && state.trapRounds > 0) return false;
  return state.playerMana >= def.ability.manaCost && state.abilityCooldown <= 0;
}

export function getEffectiveCritChance(character: Character, stats: DerivedStats): number {
  return Math.min(0.9, stats.critChance + (character.classId === "barbarian" ? BARBARIAN_BONUS_CRIT_CHANCE : 0));
}

export function getCritMultiplier(character: Character): number {
  return character.classId === "barbarian" ? BARBARIAN_CRIT_MULTIPLIER : DEFAULT_CRIT_MULTIPLIER;
}

export function rollGoldReward(monster: MonsterDefinition): number {
  return randomInRange(monster.goldReward);
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

  if (ability.kind === "burst") {
    const est = Math.round(avg * ability.power + bonus);
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
    return { label: `~${est} (3 turn delay)`, type: "Physical" };
  }
  return { label: "—", type: dmgType };
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

  let { playerLife, playerMana, monsterLife, abilityCooldown, healthPotionCooldown, manaPotionCooldown, poisonRounds, poisonDamage, monsterSpellCooldown, playerPoisonRounds, playerPoisonDamage, playerBurnRounds, playerBurnDamage, trapRounds } = state;
  let damageDealt = 0;
  let trapDetonated = false;

  if (monsterLife > 0) {
    const useAbility = action === "ability" && playerMana >= def.ability.manaCost && abilityCooldown <= 0;

    if (useAbility) {
      playerMana -= def.ability.manaCost;
      if (def.ability.kind !== "trap") abilityCooldown = def.ability.cooldown;

      if (Math.random() < ALWAYS_MISS_CHANCE) {
        log.push({
          actor: "player",
          message: `Your ${def.ability.name} fails to connect.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability.kind === "burst") {
        const dmg = rollAbilityDamage(stats, def.ability.power, def.ability.magic);
        monsterLife -= dmg;
        damageDealt += dmg;
        log.push({
          actor: "player",
          message: `You unleash ${def.ability.name} for ${dmg} damage!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability.kind === "dot") {
        const dmg = rollAbilityDamage(stats, 0.4, def.ability.magic);
        monsterLife -= dmg;
        damageDealt += dmg;
        poisonRounds = 3;
        poisonDamage = rollAbilityDamage(stats, def.ability.power * 0.4, def.ability.magic);
        log.push({
          actor: "player",
          message: `You strike with ${def.ability.name} for ${dmg} damage, poisoning the enemy!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability.kind === "multi") {
        const hitCount = def.ability.hits ?? 3;
        for (let i = 0; i < hitCount; i++) {
          if (monsterLife <= 0) break;

          let hitDmg = rollAbilityDamage(stats, def.ability.power, def.ability.magic);
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
        }
      } else if (def.ability.kind === "heal") {
        const dmg = rollAbilityDamage(stats, def.ability.power, def.ability.magic);
        const healAmt = Math.round(dmg * 0.35);
        monsterLife -= dmg;
        damageDealt += dmg;
        playerLife = Math.min(stats.maxLife, playerLife + healAmt);
        log.push({
          actor: "player",
          message: `You call upon ${def.ability.name}, dealing ${dmg} damage and healing ${healAmt} life!`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability.kind === "bite") {
        const baseDmg = randomInRange(stats.damage);
        const dexBonus = Math.round(stats.stats.dexterity * 1.5);
        const dmg = baseDmg + dexBonus;
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
      } else if (def.ability.kind === "trap") {
        trapRounds = 3;
        log.push({
          actor: "player",
          message: "You plant a Fire Trap!",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    } else if (action === "healthPotion" && healthPotionCooldown <= 0) {
      const before = playerLife;
      playerLife = Math.min(stats.maxLife, playerLife + Math.round(stats.maxLife * POTION_RESTORE_RATE));
      healthPotionCooldown = POTION_COOLDOWN;
      log.push({
        actor: "player",
        message: `You drink a Health Potion, restoring ${playerLife - before} life.`,
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
      const hitChance = 1 - ALWAYS_MISS_CHANCE;
      let basicHitDmg = 0;
      if (Math.random() < hitChance) {
        const isCrit = Math.random() < critChance;
        let dmg = randomInRange(stats.damage);
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
        basicHitDmg = dmg;
        log.push({
          actor: "player",
          message: isCrit ? `Critical hit! You deal ${dmg} damage.` : `You attack for ${dmg} damage.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else {
        log.push({
          actor: "player",
          message: "Your attack misses.",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }

      if (def.resourceType === "fury") {
        playerMana = Math.min(stats.maxMana, playerMana + FURY_PER_ATTACK);
      }
      if (character.classId === "assassin" && character.level >= 20 && basicHitDmg > 0) {
        poisonRounds = 2;
        poisonDamage = Math.round(basicHitDmg * 0.30);
        log.push({
          actor: "player",
          message: `Venom seeps in — ${poisonDamage} poison per turn for 2 turns.`,
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      }
    }
  }

  if (abilityCooldown > 0) abilityCooldown -= 1;
  if (healthPotionCooldown > 0) healthPotionCooldown -= 1;
  if (manaPotionCooldown > 0) manaPotionCooldown -= 1;
  if (def.resourceType === "mana" && playerMana < stats.maxMana) {
    const isSorceressAttackRegen = character.classId === "sorceress" && action === "attack";
    const regenRate = isSorceressAttackRegen ? SORCERESS_ATTACK_MANA_REGEN_RATE : MANA_REGEN_RATE;
    playerMana = Math.min(stats.maxMana, playerMana + stats.maxMana * regenRate);
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

  if (trapRounds > 0) trapRounds -= 1;

  if (monsterSpellCooldown > 0) monsterSpellCooldown -= 1;

  // Monster spell (replaces normal attack when cast)
  const spell = monster.spell;
  const castSpell = spell && monsterSpellCooldown <= 0 && Math.random() < spell.chance;
  let monsterSpellCastName: string | undefined;
  if (castSpell && spell) {
    monsterSpellCastName = spell.name;
    monsterSpellCooldown = spell.cooldown;
    let spellDmg = Math.round(randomInRange(monster.damage) * spell.power);
    const fadedSpell = character.classId === "assassin" && Math.random() < 0.25;
    if (fadedSpell) spellDmg = Math.max(1, Math.round(spellDmg * 0.55));

    if (spell.kind === "burst") {
      playerLife -= spellDmg;
      log.push({
        actor: "monster",
        message: `${monster.name} casts ${spell.name} for ${spellDmg} damage!`,
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
    }
  } else {
    // Normal attack
    const monsterHitChance = rollHitChance(monster.attackRating, stats.defense);
    if (Math.random() < monsterHitChance) {
      const isMonsterCrit = Math.random() < MONSTER_CRIT_CHANCE;
      let dmg = randomInRange(monster.damage);
      if (isMonsterCrit) dmg = Math.round(dmg * 1.75);

      if (character.classId === "druid") {
        const reduction = Math.min(0.25, stats.stats.dexterity * 0.002);
        dmg = Math.max(1, Math.round(dmg * (1 - reduction)));
      }

      const fadedNormal = character.classId === "assassin" && Math.random() < 0.25;
      if (fadedNormal) dmg = Math.max(1, Math.round(dmg * 0.55));

      playerLife -= dmg;

      let message = isMonsterCrit
        ? `Critical hit! ${monster.name} deals ${dmg} damage.`
        : `${monster.name} hits you for ${dmg} damage.`;

      if (character.classId === "druid") {
        const reductionPct = Math.round(Math.min(25, stats.stats.dexterity * 0.2));
        message += ` Thick Hide absorbs ${reductionPct}%.`;
      }
      if (fadedNormal) message += " Fade reduces the blow by 45%.";

      if (character.classId === "paladin") {
        const healBack = Math.round(dmg * PALADIN_DAMAGE_TAKEN_HEAL);
        playerLife = Math.min(stats.maxLife, playerLife + healBack);
        message += ` Divine Retribution restores ${healBack} life.`;
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

  // Fire Trap detonation — after monster acts
  if (trapRounds === 0 && state.trapRounds > 0) {
    const trapDmg = Math.round(stats.stats.dexterity * def.ability.power);
    const isCrit = Math.random() < critChance;
    const finalTrapDmg = isCrit ? Math.round(trapDmg * critMultiplier) : trapDmg;
    monsterLife -= finalTrapDmg;
    damageDealt += finalTrapDmg;
    abilityCooldown = def.ability.cooldown;
    trapDetonated = true;
    log.push({
      actor: "monster",
      message: isCrit
        ? `Critical hit! Fire Trap explodes for ${finalTrapDmg} damage!`
        : `Fire Trap explodes for ${finalTrapDmg} damage!`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
    if (monsterLife <= 0) {
      return { state: makeState(), log, status: "victory", damageDealt, trapDetonated };
    }
  }

  const status: BattleStatus = playerLife <= 0 ? "defeat" : "ongoing";
  return { state: makeState(), log, status, damageDealt, monsterSpellCast: monsterSpellCastName, trapDetonated };
}
