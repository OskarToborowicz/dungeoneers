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
  };
}

export function canUseAbility(character: Character, state: BattleState): boolean {
  const def = CLASSES[character.classId];
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

  let { playerLife, playerMana, monsterLife, abilityCooldown, healthPotionCooldown, manaPotionCooldown, poisonRounds, poisonDamage, monsterSpellCooldown, playerPoisonRounds, playerPoisonDamage } = state;
  let damageDealt = 0;

  if (monsterLife > 0) {
    const useAbility = action === "ability" && playerMana >= def.ability.manaCost && abilityCooldown <= 0;

    if (useAbility) {
      playerMana -= def.ability.manaCost;
      abilityCooldown = def.ability.cooldown;

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
      if (Math.random() < hitChance) {
        const isCrit = Math.random() < critChance;
        let dmg = randomInRange(stats.damage);
        if (isCrit) dmg = Math.round(dmg * critMultiplier);
        monsterLife -= dmg;
        damageDealt += dmg;
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
      message: `Poison burns you for ${playerPoisonDamage} damage.`,
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
      actor: "player",
      message: `${monster.name} suffers ${poisonDamage} poison damage.${necroHeal > 0 ? ` Soul Siphon heals you for ${necroHeal}.` : ""}`,
      playerLife: Math.max(0, playerLife),
      monsterLife: Math.max(0, monsterLife),
    });
    if (monsterLife <= 0) {
      return { state: makeState(), log, status: "victory", damageDealt };
    }
  }

  if (monsterSpellCooldown > 0) monsterSpellCooldown -= 1;

  // Monster spell (replaces normal attack when cast)
  const spell = monster.spell;
  const castSpell = spell && monsterSpellCooldown <= 0 && Math.random() < spell.chance;
  if (castSpell && spell) {
    monsterSpellCooldown = spell.cooldown;
    const spellDmg = Math.round(randomInRange(monster.damage) * spell.power);

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

      playerLife -= dmg;

      let message = isMonsterCrit
        ? `Critical hit! ${monster.name} deals ${dmg} damage.`
        : `${monster.name} hits you for ${dmg} damage.`;

      if (character.classId === "druid") {
        const reductionPct = Math.round(Math.min(25, stats.stats.dexterity * 0.2));
        message += ` Thick Hide absorbs ${reductionPct}%.`;
      }

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

  const status: BattleStatus = playerLife <= 0 ? "defeat" : "ongoing";
  return { state: makeState(), log, status, damageDealt };
}
