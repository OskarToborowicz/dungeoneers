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
const SORCERESS_ATTACK_MANA_REGEN_RATE = 0.2;
const PALADIN_DAMAGE_TAKEN_HEAL = 0.15;
const NECROMANCER_POISON_LIFESTEAL = 0.1;

function getIronSkinReduction(character: Character, currentLife: number, maxLife: number): number {
  if (character.classId !== "barbarian" || character.level < 20) return 0;
  const missingPct = Math.max(0, (1 - currentLife / maxLife) * 100);
  return Math.floor(missingPct / 5) * BARBARIAN_IRON_SKIN_REDUCTION_PER_5PCT;
}

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
    bloodFuryRounds: 0,
    ability2Cooldown: 0,
    frozenRounds: 0,
    regenRounds: 0,
    disorientRounds: 0,
    blindRounds: 0,
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

  if (ability.kind === "buff") {
    return { label: "3 turns", type: "Buff" };
  }
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

export function getAbility2Preview(character: Character, stats: DerivedStats): DamagePreview {
  const def = CLASSES[character.classId];
  if (!def.ability2) return { label: "—", type: "Physical" };
  const ability = def.ability2;
  if (ability.kind === "obliterate") {
    const avg = Math.round((stats.damage[0] + stats.damage[1]) / 2);
    const est = avg + stats.stats.strength;
    return { label: `~${est} + kill heal`, type: "Physical" };
  }
  if (ability.kind === "freeze") {
    const avg = Math.round((stats.damage[0] + stats.damage[1]) / 2);
    const dexBonus = Math.round(stats.stats.dexterity * 0.5);
    return { label: `~${avg + dexBonus} + freeze`, type: "Physical" };
  }
  if (ability.kind === "blind_powder") {
    return { label: "Blind 2t + Disorient 4t", type: "Debuff" };
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

  let { playerLife, playerMana, monsterLife, abilityCooldown, healthPotionCooldown, manaPotionCooldown, poisonRounds, poisonDamage, monsterSpellCooldown, playerPoisonRounds, playerPoisonDamage, playerBurnRounds, playerBurnDamage, trapRounds, bloodFuryRounds, ability2Cooldown, frozenRounds, regenRounds, disorientRounds, blindRounds } = state;
  let damageDealt = 0;
  let trapDetonated = false;

  const doBasicAttack = () => {
    const hitChance = 1 - ALWAYS_MISS_CHANCE;
    let damageMult = 1.0;
    if (bloodFuryRounds > 0) damageMult *= 1 + BARBARIAN_BLOOD_FURY_DAMAGE_BONUS;
    if (character.classId === "barbarian" && character.level >= 35 && playerMana > BARBARIAN_MADNESS_FURY_THRESHOLD) damageMult *= 1 + BARBARIAN_MADNESS_DAMAGE_BONUS;
    if (character.classId === "assassin" && character.level >= 35) damageMult *= 1.10;
    const assassinAdvantageCrit = character.classId === "assassin" && character.level >= 35 && poisonRounds > 0 ? 0.05 : 0;
    let basicHitDmg = 0;
    let basicHitCrit = false;

    if (Math.random() < hitChance) {
      const isCrit = Math.random() < critChance + assassinAdvantageCrit;
      basicHitCrit = isCrit;
      let dmg = Math.round(randomInRange(stats.damage) * damageMult);
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
      log.push({ actor: "player", message: attackMsg, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    } else {
      log.push({ actor: "player", message: "Your attack misses.", playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }

    if (def.resourceType === "fury") {
      const madnessFuryBonus = character.classId === "barbarian" && character.level >= 35 ? BARBARIAN_MADNESS_FURY_BONUS : 0;
      playerMana = Math.min(stats.maxMana, playerMana + FURY_PER_ATTACK + madnessFuryBonus);
    }

    if (character.classId === "amazon" && character.level >= 35 && basicHitCrit && basicHitDmg > 0 && monsterLife > 0) {
      const heartseekerDmg = Math.round(basicHitDmg * 0.5);
      monsterLife -= heartseekerDmg;
      damageDealt += heartseekerDmg;
      log.push({ actor: "player", message: `Heartseeker fires for ${heartseekerDmg} damage!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
    }

    if (character.classId === "assassin" && character.level >= 20 && basicHitDmg > 0) {
      poisonRounds = 2;
      poisonDamage = Math.round(basicHitDmg * 0.30);
      log.push({ actor: "player", message: `Venom seeps in — ${poisonDamage} poison per turn for 2 turns.`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
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
        log.push({ actor: "player", message: swingMsg, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
      } else {
        log.push({ actor: "player", message: "Double Swing! Your second strike misses.", playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
      }
    }
  };

  if (monsterLife > 0) {
    const useAbility = action === "ability" && playerMana >= def.ability.manaCost && abilityCooldown <= 0;

    if (useAbility) {
      playerMana -= def.ability.manaCost;
      if (def.ability.kind !== "buff") {
        abilityCooldown = def.ability.cooldown;
      }

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

          if (character.classId === "amazon" && character.level >= 35 && isHitCrit && monsterLife > 0) {
            const heartseekerDmg = Math.round(hitDmg * 0.5);
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
          let dmg = baseDmg + dexBonus;
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
        }
      } else if (def.ability2.kind === "obliterate") {
        const madnessMult = character.classId === "barbarian" && character.level >= 35 && furyBeforeCost > BARBARIAN_MADNESS_FURY_THRESHOLD ? 1 + BARBARIAN_MADNESS_DAMAGE_BONUS : 1.0;
        const baseDmg = randomInRange(stats.damage);
        const strBonus = Math.round(stats.stats.strength * 0.5);
        const dmg = Math.round((baseDmg + strBonus) * madnessMult);
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
      } else if (def.ability2.kind === "blind_powder") {
        disorientRounds = 4;
        blindRounds = 2;
        log.push({
          actor: "player",
          message: "You hurl Blinding Powder! The enemy is blinded (2 turns) and disoriented (4 turns).",
          playerLife: Math.max(0, playerLife),
          monsterLife: Math.max(0, monsterLife),
        });
      } else if (def.ability2.kind === "regen") {
        ability2Cooldown = 0; // cooldown set when buff fades, not on cast
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
    if (bloodFuryRounds === 0) abilityCooldown = def.ability.cooldown;
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
      if (def.ability2 && def.ability2.kind === "regen") ability2Cooldown = def.ability2.cooldown;
      log.push({
        actor: "player",
        message: "Regenerating Nova fades.",
        playerLife: Math.max(0, playerLife),
        monsterLife: Math.max(0, monsterLife),
      });
    }
  }
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
      bloodFuryRounds,
      ability2Cooldown,
      frozenRounds,
      regenRounds,
      disorientRounds,
      blindRounds,
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
    const fadedSpell = character.classId === "assassin" && Math.random() < 0.25;
    if (fadedSpell) spellDmg = Math.max(1, Math.round(spellDmg * 0.55));
    const ironSkinSpell = getIronSkinReduction(character, playerLife, stats.maxLife);
    if (ironSkinSpell > 0) spellDmg = Math.max(1, Math.round(spellDmg * (1 - ironSkinSpell)));

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
      if (character.level >= 35) {
        const thornsDmg = Math.round(spellDmg * 0.20);
        monsterLife -= thornsDmg;
        damageDealt += thornsDmg;
        log.push({ actor: "player", message: `Thorns Aura reflects ${thornsDmg} damage back!`, playerLife: Math.max(0, playerLife), monsterLife: Math.max(0, monsterLife) });
      }
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

  // Fire Trap detonation — after monster acts
  if (trapRounds === 0 && state.trapRounds > 0) {
    const trapDmg = Math.round(stats.stats.dexterity * def.ability.power);
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
    if (monsterLife <= 0) {
      return { state: makeState(), log, status: "victory", damageDealt, trapDetonated };
    }
  }

  const status: BattleStatus = playerLife <= 0 ? "defeat" : "ongoing";
  return { state: makeState(), log, status, damageDealt, monsterSpellCast: monsterSpellCastName, trapDetonated };
}
