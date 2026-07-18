import { useEffect, useRef, useState } from "react";
import { CLASSES } from "../game/data/classes";
import { CONSUMABLES } from "../game/data/consumables";
import { xpToNextLevel } from "../game/character";
import { isSoundMuted } from "../game/sound";
import type { DerivedStats } from "../game/character";
import {
  canUseAbility,
  canUseAbility2,
  createBattleState,
  resolveRound,
  rollGoldReward,
  getAttackPreview,
  getAbilityPreview,
  getAbility2Preview,
  type BattleState,
  type BattleStatus,
  type CombatLogEntry,
  type CombatResult,
  type PlayerActionKind,
} from "../game/combat";
import type {
  Character,
  ConsumableId,
  EquipmentSlot,
  Item,
  MonsterDefinition,
} from "../game/types";
import { CharacterSprite, type SpriteState } from "./sprites/CharacterSprite";
import { MonsterSprite } from "./sprites/MonsterSprite";
import { AbilityEffect, ATTACK_EFFECT_CLASSES } from "./AbilityEffect";
import { MonsterSpellEffect } from "./MonsterSpellEffect";
import { PotionIcon } from "./PotionIcon";
import druidGroveUrl from "../assets/classes/druid/skill_2.svg";

// The log is a scrolling box that only ever shows the tail. Keeping every entry
// from a long fight grew the rendered node count without bound — each render
// re-mapped the whole array and the scroll-to-bottom effect reflowed it — which
// is why frames got heavier the longer combat ran. Cap to the recent tail.
const MAX_LOG = 60;

interface Props {
  character: Character;
  derived: DerivedStats;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  monster: MonsterDefinition;
  startingLife: number;
  startingMana: number;
  startingCooldown: number;
  startingCooldown2: number;
  startingPreparation?: number;
  startingHolyLightCharges?: number;
  consumables: Record<ConsumableId, number>;
  escapeTokens: number;
  xpCapped: boolean;
  xpMultiplier: number;
  clearedDungeons: string[];
  onUsePotion: (id: ConsumableId) => void;
  onFinished: (result: CombatResult) => void;
  onEscape: () => void;
}

export function CombatScreen({
  character,
  derived,
  equipment,
  monster,
  startingLife,
  startingMana,
  startingCooldown,
  startingCooldown2,
  startingPreparation = 0,
  startingHolyLightCharges = 0,
  consumables,
  escapeTokens,
  xpCapped,
  xpMultiplier,
  clearedDungeons,
  onUsePotion,
  onFinished,
  onEscape,
}: Props) {
  const def = CLASSES[character.classId];
  const logRef = useRef<HTMLDivElement | null>(null);

  const [battle, setBattle] = useState<BattleState>(() =>
    createBattleState(
      monster,
      startingLife,
      startingMana,
      startingCooldown,
      startingCooldown2,
      startingPreparation,
      startingHolyLightCharges,
    ),
  );
  const [log, setLog] = useState<CombatLogEntry[]>([]);
  const [status, setStatus] = useState<BattleStatus>("ongoing");
  const [reward, setReward] = useState<{ xp: number; gold: number } | null>(
    null,
  );
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [playerAnim, setPlayerAnim] = useState<SpriteState>("idle");
  const [potionFx, setPotionFx] = useState<{
    type: "health" | "mana";
    key: number;
  } | null>(null);
  const [monsterAnim, setMonsterAnim] = useState<SpriteState>("idle");
  const [abilityEffect, setAbilityEffect] = useState(0);
  const [ability2Effect, setAbility2Effect] = useState(0);
  const [attackEffect, setAttackEffect] = useState(0);
  const [trapDetonateEffect, setTrapDetonateEffect] = useState(false);
  const [monsterSpellEffect, setMonsterSpellEffect] = useState<string | null>(
    null,
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFleePrompt, setShowFleePrompt] = useState(false);
  const [critFlash, setCritFlash] = useState(false);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    if (status !== "victory" || !reward || xpCapped) return;
    const pendingXp = Math.round(reward.xp * xpMultiplier);
    let simXp = character.xp + pendingXp;
    let simLevel = character.level;
    let levelsGained = 0;
    while (simXp >= xpToNextLevel(simLevel)) {
      simXp -= xpToNextLevel(simLevel);
      simLevel++;
      levelsGained++;
    }
    if (levelsGained > 0 && !isSoundMuted()) {
      const sfx = new Audio(import.meta.env.BASE_URL + "levelup.mp3");
      sfx.volume = 1;
      sfx.play().catch(() => {});
    }
  }, [status]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === " " && status !== "ongoing") {
        e.preventDefault();
        handleContinue();
      } else if (e.key === "1" && status === "ongoing" && !isAnimating)
        handleAction("attack");
      else if (e.key === "2" && abilityUsable) handleAction("ability");
      else if (e.key === "3" && ability2Usable) handleAction("ability2");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function handleAction(action: PlayerActionKind) {
    if (status !== "ongoing" || isAnimating) return;
    if (
      action === "healthPotion" &&
      (consumables.healthPotion <= 0 || battle.healthPotionCooldown > 0)
    )
      return;
    if (
      action === "manaPotion" &&
      (consumables.manaPotion <= 0 || battle.manaPotionCooldown > 0)
    )
      return;

    const wasAbility = action === "ability" && canUseAbility(character, battle);
    const wasAbility2 =
      action === "ability2" && canUseAbility2(character, battle);
    // Drinking is not a swing — skip the lunge, show bubbles instead.
    const isPotion = action === "healthPotion" || action === "manaPotion";
    if (isPotion) {
      setPotionFx((p) => ({
        type: action === "healthPotion" ? "health" : "mana",
        key: (p?.key ?? 0) + 1,
      }));
      setTimeout(() => setPotionFx(null), 900);
    }
    const result = resolveRound(
      character,
      derived,
      monster,
      battle,
      action,
      clearedDungeons,
    );

    // These three are identical across all branches — could be hoisted here
    // if (wasAbility) setAbilityEffect(n => n + 1);
    // if (wasAbility2) setAbility2Effect(n => n + 1);
    // if (!wasAbility && !wasAbility2 && ATTACK_EFFECT_CLASSES.has(character.classId)) setAttackEffect(n => n + 1);

    if (result.status === "victory") {
      if (
        result.log.some(
          (e) => e.actor === "player" && e.message.includes("Critical hit!"),
        )
      ) {
        setCritFlash(true);
        setTimeout(() => setCritFlash(false), 600);
      }
      if (wasAbility) setAbilityEffect((n) => n + 1);
      if (wasAbility2) setAbility2Effect((n) => n + 1);
      if (
        action === "attack" &&
        !wasAbility &&
        !wasAbility2 &&
        ATTACK_EFFECT_CLASSES.has(character.classId)
      )
        setAttackEffect((n) => n + 1);
      setBattle(result.state);
      setLog((prev) => [...prev, ...result.log].slice(-MAX_LOG));
      setStatus(result.status);
      setTotalDamageDealt((d) => d + result.damageDealt);
      setReward({
        xp: monster.xpReward,
        gold: rollGoldReward(monster, derived.goldFindBonus),
      });
      if (!isPotion) setPlayerAnim("attack");
      setTimeout(() => {
        setPlayerAnim("idle");
        setMonsterAnim("dead");
      }, 500);
    } else if (result.status === "defeat") {
      if (wasAbility) setAbilityEffect((n) => n + 1);
      if (wasAbility2) setAbility2Effect((n) => n + 1);
      if (
        action === "attack" &&
        !wasAbility &&
        !wasAbility2 &&
        ATTACK_EFFECT_CLASSES.has(character.classId)
      )
        setAttackEffect((n) => n + 1);
      setBattle(result.state);
      setLog((prev) => [...prev, ...result.log].slice(-MAX_LOG));
      setStatus(result.status);
      setTotalDamageDealt((d) => d + result.damageDealt);
      if (!isPotion) setPlayerAnim("attack");
      setTimeout(() => setPlayerAnim("dead"), 500);
    } else {
      // Sequential animation: player first, then monster
      // HP drops at the START of each animation
      const playerEntries = result.log.filter((e) => e.actor === "player");
      const monsterEntries = result.log.filter((e) => e.actor === "monster");
      const lastPlayer =
        playerEntries.length > 0
          ? playerEntries[playerEntries.length - 1]
          : null;
      const lastMonster =
        monsterEntries.length > 0
          ? monsterEntries[monsterEntries.length - 1]
          : null;

      const hasCrit = playerEntries.some((e) =>
        e.message.includes("Critical hit!"),
      );
      setIsAnimating(true);
      if (!isPotion) setPlayerAnim("attack");
      if (hasCrit) {
        setCritFlash(true);
        setTimeout(() => setCritFlash(false), 600);
      }
      if (wasAbility) setAbilityEffect((n) => n + 1);
      if (wasAbility2) setAbility2Effect((n) => n + 1);
      if (
        action === "attack" &&
        !wasAbility &&
        !wasAbility2 &&
        ATTACK_EFFECT_CLASSES.has(character.classId)
      )
        setAttackEffect((n) => n + 1);
      // Monster HP drops immediately as player starts swinging
      if (lastPlayer) {
        setBattle((b) => ({
          ...b,
          monsterLife: lastPlayer.monsterLife,
          playerLife: lastPlayer.playerLife,
        }));
      }

      setTimeout(() => {
        setPlayerAnim("idle");
        setLog((prev) => [...prev, ...playerEntries].slice(-MAX_LOG));
        const monsterAttacked = monsterEntries.length > 0;
        if (monsterAttacked) {
          setMonsterAnim("attack");
          if (result.monsterSpellCast)
            setMonsterSpellEffect(result.monsterSpellCast);
          if (result.trapDetonated) setTrapDetonateEffect(true);
          // Player HP drops as monster starts attacking
          if (lastMonster) {
            setBattle((b) => ({
              ...b,
              playerLife: lastMonster.playerLife,
              monsterLife: lastMonster.monsterLife,
            }));
          }
          setTimeout(() => {
            setMonsterAnim("idle");
            setBattle(result.state);
            setLog((prev) => [...prev, ...monsterEntries].slice(-MAX_LOG));
            setStatus(result.status);
            setTotalDamageDealt((d) => d + result.damageDealt);
            setIsAnimating(false);
          }, 550);
        } else {
          if (result.trapDetonated) setTrapDetonateEffect(true);
          setBattle(result.state);
          setStatus(result.status);
          setTotalDamageDealt((d) => d + result.damageDealt);
          setIsAnimating(false);
        }
      }, 550);
    }

    if (action === "healthPotion" || action === "manaPotion") {
      onUsePotion(action);
    }
  }

  function handleContinue() {
    onFinished({
      victory: status === "victory",
      xpReward: reward?.xp ?? 0,
      goldReward: reward?.gold ?? 0,
      endingLife: battle.playerLife,
      endingMana: battle.playerMana,
      endingPreparation: battle.preparation,
      endingCooldown: battle.abilityCooldown,
      endingCooldown2: battle.ability2Cooldown,
      endingHolyLightCharges: battle.holyLightCharges,
      damageDealt: totalDamageDealt,
    });
  }

  const abilityUsable =
    status === "ongoing" && !isAnimating && canUseAbility(character, battle);
  const ability2Usable =
    status === "ongoing" && !isAnimating && canUseAbility2(character, battle);
  const attackPreview = getAttackPreview(character, derived);
  const abilityPreview = getAbilityPreview(character, derived);
  const ability2Preview = getAbility2Preview(character, derived);

  return (
    <div className="screen combat-screen">
      <div className="combat-middle">
        <h2 className="combat-title">
          {monster.name}{" "}
          <span className="monster-level">Lv.{monster.level}</span>
        </h2>

        <div className="battle-arena">
          {attackEffect > 0 && (
            <AbilityEffect
              key={`atk-${attackEffect}`}
              classId={character.classId}
              useAttack={true}
              onDone={() => setAttackEffect(0)}
            />
          )}
          {abilityEffect > 0 && (
            <AbilityEffect
              key={abilityEffect}
              classId={character.classId}
              onDone={() => setAbilityEffect(0)}
            />
          )}
          {ability2Effect > 0 && (
            <AbilityEffect
              key={-ability2Effect}
              classId={character.classId}
              useAbility2={true}
              onDone={() => setAbility2Effect(0)}
            />
          )}
          {monsterSpellEffect && (
            <MonsterSpellEffect
              spellName={monsterSpellEffect}
              onDone={() => setMonsterSpellEffect(null)}
            />
          )}
          {trapDetonateEffect && (
            <AbilityEffect
              classId="assassin"
              detonation={true}
              onDone={() => setTrapDetonateEffect(false)}
            />
          )}
          {battle.golemRounds > 0 && (
            <div className="golem-on-field">
              <svg viewBox="0 0 60 76" overflow="visible">
                <g className="golem-field-body">
                  {/* shoulders / arms */}
                  <rect
                    x="4"
                    y="34"
                    width="12"
                    height="20"
                    rx="4"
                    fill="#6a6050"
                    opacity="0.88"
                  />
                  <rect
                    x="44"
                    y="34"
                    width="12"
                    height="20"
                    rx="4"
                    fill="#6a6050"
                    opacity="0.88"
                  />
                  {/* torso */}
                  <rect
                    x="12"
                    y="28"
                    width="36"
                    height="36"
                    rx="7"
                    fill="#7a7060"
                    opacity="0.94"
                  />
                  {/* chest crack detail */}
                  <path
                    d="M27 34 L30 42 L33 34"
                    fill="none"
                    stroke="#4a4030"
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  {/* head */}
                  <rect
                    x="16"
                    y="10"
                    width="28"
                    height="22"
                    rx="5"
                    fill="#8a8070"
                    opacity="0.95"
                  />
                  {/* eyes */}
                  <circle
                    cx="24"
                    cy="21"
                    r="4"
                    fill="#aadd88"
                    opacity="0.97"
                    className="golem-field-eye"
                  />
                  <circle
                    cx="36"
                    cy="21"
                    r="4"
                    fill="#aadd88"
                    opacity="0.97"
                    className="golem-field-eye"
                  />
                  {/* eye glow */}
                  <circle
                    cx="24"
                    cy="21"
                    r="2.2"
                    fill="#ccff99"
                    opacity="0.8"
                    className="golem-field-eye"
                  />
                  <circle
                    cx="36"
                    cy="21"
                    r="2.2"
                    fill="#ccff99"
                    opacity="0.8"
                    className="golem-field-eye"
                  />
                  {/* legs */}
                  <rect
                    x="16"
                    y="62"
                    width="11"
                    height="10"
                    rx="3"
                    fill="#6a6050"
                    opacity="0.88"
                  />
                  <rect
                    x="33"
                    y="62"
                    width="11"
                    height="10"
                    rx="3"
                    fill="#6a6050"
                    opacity="0.88"
                  />
                </g>
                <text
                  x="30"
                  y="74"
                  textAnchor="middle"
                  fill="#aadd88"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {battle.golemRounds}
                </text>
              </svg>
            </div>
          )}
          {battle.barkWallRounds > 0 && (
            <div className="grove-on-field">
              {/* Standing summoned model from src/assets/classes/druid/skill_2.svg
                  (swap that file to replace the art). Fades in on cast, unmounts
                  when barkWallRounds hits 0. */}
              <svg viewBox="0 0 60 90" overflow="visible">
                <image
                  className="grove-field-body"
                  href={druidGroveUrl}
                  x="0"
                  y="0"
                  width="60"
                  height="90"
                  preserveAspectRatio="xMidYMax meet"
                />
                <text
                  x="35"
                  y="80"
                  textAnchor="end"
                  fill="#94B030"
                  fontSize="9"
                  stroke="#000"
                  strokeWidth="3"
                  fontWeight=""
                  paintOrder="stroke"
                >
                  {battle.barkWallRounds}
                </text>
              </svg>
            </div>
          )}
          {battle.trapRounds > 0 && !trapDetonateEffect && (
            <div className="trap-on-field">
              <svg viewBox="0 0 44 28" overflow="visible">
                <g className="trap-field-glow">
                  <rect
                    x="10"
                    y="14"
                    width="24"
                    height="8"
                    rx="3"
                    fill="#33aacc"
                    opacity="0.9"
                  />
                  <rect
                    x="18"
                    y="10"
                    width="8"
                    height="4"
                    rx="1"
                    fill="#55ccee"
                    opacity="0.85"
                  />
                  <line
                    x1="22"
                    y1="14"
                    x2="22"
                    y2="6"
                    stroke="#33aacc"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="22"
                    y1="14"
                    x2="30"
                    y2="8"
                    stroke="#33aacc"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="22"
                    y1="14"
                    x2="14"
                    y2="8"
                    stroke="#33aacc"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </g>
                <text
                  x="22"
                  y="28"
                  textAnchor="middle"
                  fill="#55ccee"
                  fontSize="7"
                  fontWeight="bold"
                >
                  {battle.trapRounds}
                </text>
              </svg>
            </div>
          )}
          <div
            className={`battle-side player-side${battle.bloodFuryRounds > 0 ? " blood-fury-active" : ""}${battle.holyLightCharges > 0 ? " holy-light-active" : ""}${battle.frostShieldRounds > 0 ? " frost-shield-active" : ""}${critFlash ? " crit-flash" : ""}`}
          >
            {potionFx && (
              <div
                key={potionFx.key}
                className={`potion-bubbles ${potionFx.type}`}
              >
                <span />
                <span />
                <span />
                <span />
              </div>
            )}
            <CharacterSprite
              classId={character.classId}
              size={80}
              state={playerAnim}
              isUniqueWeapon={
                equipment.weapon?.rarity === "very rare" ||
                equipment.weapon?.rarity === "unique"
              }
              isUniqueOffHand={
                equipment.shield?.rarity === "very rare" ||
                equipment.shield?.rarity === "unique"
              }
              statusEffects={[
                ...(battle.playerPoisonRounds > 0 ? ["poison" as const] : []),
                ...(battle.playerBurnRounds > 0 ? ["burn" as const] : []),
              ]}
            />
          </div>
          <div className="battle-side monster-side">
            <MonsterSprite
              name={monster.name}
              size={80}
              state={monsterAnim}
              statusEffects={[
                ...(battle.poisonRounds > 0 ||
                battle.burnStacks.some((s) => s.kind === "poison")
                  ? ["poison" as const]
                  : []),
                ...(battle.burnStacks.some((s) => s.kind === "burn")
                  ? ["burn" as const]
                  : []),
                ...(battle.burnStacks.some((s) => s.kind === "bleed")
                  ? ["bleed" as const]
                  : []),
              ]}
            />
          </div>
        </div>

        <div className="combat-log" ref={logRef}>
          {log.map((e, i) => (
            <div key={i} className={`log-entry ${e.actor}`}>
              {e.message}
            </div>
          ))}
        </div>

        {status !== "ongoing" && (
          <div className="combat-result">
            <h3
              className={status === "victory" ? "victory-text" : "defeat-text"}
            >
              {status === "victory" ? "Victory!" : "You Have Died"}
            </h3>
            {status === "victory" &&
              reward &&
              (() => {
                const pendingXp = !xpCapped
                  ? Math.round(reward.xp * xpMultiplier)
                  : 0;
                let simXp = character.xp + pendingXp;
                let simLevel = character.level;
                let levelsGained = 0;
                while (simXp >= xpToNextLevel(simLevel)) {
                  simXp -= xpToNextLevel(simLevel);
                  simLevel++;
                  levelsGained++;
                }
                return (
                  <>
                    <p>
                      {!xpCapped && <>{pendingXp} XP &middot; </>}
                      {reward.gold} gold
                    </p>
                    {levelsGained > 0 && (
                      <p className="level-up-notice">
                        Level up! Now level {simLevel}
                      </p>
                    )}
                  </>
                );
              })()}
            {status === "defeat" && (
              <p>Your journey ends here. All progress will be lost.</p>
            )}
            <button className="primary-button" onClick={handleContinue}>
              {status === "victory" ? "Continue" : "Accept Your Fate"}
            </button>
          </div>
        )}
      </div>
      {/* end combat-middle */}

      <div className="combat-bars">
        <div className="combat-bar-block">
          <div className="combat-bar-label">
            {character.name}{" "}
            <span className="monster-level">Lv.{character.level}</span>
          </div>
          {(() => {
            const overhealFrac = Math.max(
              0,
              Math.min(0.25, battle.absorbShield / derived.maxLife),
            );
            const glowT = overhealFrac / 0.25;
            const glowPx = Math.round(glowT * 14);
            const glowAlpha = (0.4 + glowT * 0.6).toFixed(2);
            const barStyle =
              overhealFrac > 0
                ? {
                    boxShadow: `0 0 ${glowPx}px rgba(80,160,255,0.75), inset 0 0 ${Math.round(glowT * 8)}px rgba(80,160,255,0.25)`,
                    borderColor: `rgba(80,160,255,${glowAlpha})`,
                  }
                : {};
            return (
              <div className="hp-bar" style={barStyle}>
                <div
                  className="hp-bar-fill player"
                  style={{
                    width: `${Math.max(0, Math.min(100, (battle.playerLife / derived.maxLife) * 100))}%`,
                  }}
                />
                <span className="bar-num">
                  {Math.min(battle.playerLife, derived.maxLife)}/
                  {derived.maxLife}
                </span>
              </div>
            );
          })()}
          {def.resourceType === "preparation" ? (
            <div className="preparation-globes">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`prep-globe${battle.preparation > i ? " filled" : ""}`}
                />
              ))}
            </div>
          ) : (
            <div className={`resource-bar ${def.resourceType}`}>
              <div
                className={`resource-bar-fill ${def.resourceType}`}
                style={{
                  width: `${Math.max(0, (battle.playerMana / derived.maxMana) * 100)}%`,
                }}
              />
              <span className="bar-num">
                {battle.playerMana}/{derived.maxMana}
              </span>
            </div>
          )}
          <div className="xp-bar-combat">
            <div
              className="xp-bar-combat-fill"
              style={{
                width: `${Math.min(100, (character.xp / xpToNextLevel(character.level)) * 100)}%`,
              }}
            />
            <span className="xp-bar-combat-label">
              {character.xp} / {xpToNextLevel(character.level)} XP
            </span>
          </div>
          <div className="combat-stat-row">
            <span className="combat-stat hp">
              <svg viewBox="0 0 10 9" width="10" height="9">
                <path
                  d="M5 8 C5 8 1 5 1 3a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2-4 5-4 5z"
                  fill="#cc3333"
                />
              </svg>
              {Math.min(battle.playerLife, derived.maxLife)}/{derived.maxLife}
              {battle.absorbShield > 0 && (
                <span className="overheal-badge">+{battle.absorbShield}</span>
              )}
            </span>
            {def.resourceType !== "preparation" && (
              <span className={`combat-stat ${def.resourceType}`}>
                {def.resourceType === "mana" ? (
                  <svg viewBox="0 0 8 10" width="8" height="10">
                    <path
                      d="M4 1 C4 1 7 5 7 7a3 3 0 0 1-6 0c0-2 3-6 3-6z"
                      fill="#4477ff"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 10 10" width="10" height="10">
                    <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#cc3300" />
                  </svg>
                )}
                {battle.playerMana}/{derived.maxMana}
              </span>
            )}
            {def.resourceType === "preparation" && (
              <span className="combat-stat preparation">
                <svg viewBox="0 0 10 10" width="10" height="10">
                  <circle cx="5" cy="5" r="4" fill="#cc1111" />
                </svg>
                {battle.preparation}/3 Prep
              </span>
            )}
          </div>
          <div className="potion-row">
            <button
              className={`potion-compact health${battle.healthPotionCooldown > 0 ? " on-cooldown" : ""}`}
              disabled={
                isAnimating ||
                consumables.healthPotion <= 0 ||
                battle.healthPotionCooldown > 0
              }
              onClick={() => handleAction("healthPotion")}
              title={
                battle.healthPotionCooldown > 0
                  ? `Cooldown: ${battle.healthPotionCooldown}`
                  : CONSUMABLES.healthPotion.description
              }
            >
              <PotionIcon type="health" size={16} />
              <span>
                {battle.healthPotionCooldown > 0
                  ? battle.healthPotionCooldown
                  : consumables.healthPotion}
                /5
              </span>
            </button>
            {def.resourceType === "mana" && (
              <button
                className={`potion-compact mana${battle.manaPotionCooldown > 0 ? " on-cooldown" : ""}`}
                disabled={
                  isAnimating ||
                  consumables.manaPotion <= 0 ||
                  battle.manaPotionCooldown > 0
                }
                onClick={() => handleAction("manaPotion")}
                title={
                  battle.manaPotionCooldown > 0
                    ? `Cooldown: ${battle.manaPotionCooldown}`
                    : CONSUMABLES.manaPotion.description
                }
              >
                <PotionIcon type="mana" size={16} />
                <span>
                  {battle.manaPotionCooldown > 0
                    ? battle.manaPotionCooldown
                    : consumables.manaPotion}
                  /5
                </span>
              </button>
            )}
          </div>
          {(battle.playerPoisonRounds > 0 ||
            battle.playerBurnRounds > 0 ||
            battle.bloodFuryRounds > 0 ||
            battle.holyLightCharges > 0 ||
            battle.frostShieldRounds > 0 ||
            battle.barkWallRounds > 0 ||
            battle.vanishRounds > 0) && (
            <div className="status-effects">
              {battle.vanishRounds > 0 && (
                <span className="status-pill vanish">
                  ◌ Vanish {battle.vanishRounds}
                </span>
              )}
              {battle.bloodFuryRounds > 0 && (
                <span className="status-pill blood-fury">
                  Blood Fury {battle.bloodFuryRounds}
                </span>
              )}
              {battle.holyLightCharges > 0 && (
                <span className="status-pill holy-light">
                  ✦ Holy Light ×{battle.holyLightCharges}
                </span>
              )}
              {battle.frostShieldRounds > 0 && (
                <span className="status-pill frost-shield">
                  ❄ Frost Shield {battle.frostShieldRounds}
                </span>
              )}
              {battle.barkWallRounds > 0 && (
                <span className="status-pill bark-wall">
                  🌳 Grove {battle.barkWallRounds}
                </span>
              )}
              {battle.playerPoisonRounds > 0 && (
                <span className="status-pill poison">
                  ☠ Poison {battle.playerPoisonRounds}
                </span>
              )}
              {battle.playerBurnRounds > 0 && (
                <span className="status-pill burn">
                  🔥 Burn {battle.playerBurnRounds}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="combat-bar-block">
          <div className="combat-bar-label landscape-hide">{monster.name}</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill monster"
              style={{
                width: `${Math.max(0, (battle.monsterLife / monster.life) * 100)}%`,
              }}
            />
            <span className="bar-num">
              {battle.monsterLife}/{monster.life}
            </span>
          </div>
          <div className="combat-stat-row landscape-hide">
            <span className="combat-stat hp">
              <svg viewBox="0 0 10 9" width="10" height="9">
                <path
                  d="M5 8 C5 8 1 5 1 3a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2-4 5-4 5z"
                  fill="#cc3333"
                />
              </svg>
              {battle.monsterLife}/{monster.life}
            </span>
          </div>
          {(battle.poisonRounds > 0 ||
            battle.frozenRounds > 0 ||
            battle.stunnedRounds > 0 ||
            battle.blindRounds > 0 ||
            battle.disorientRounds > 0 ||
            battle.burnStacks.some((s) => s.rounds > 0) ||
            battle.thornStacks > 0 ||
            battle.electrocuteRounds > 0) && (
            <div className="status-effects">
              {battle.poisonRounds > 0 && (
                <span className="status-pill poison">
                  ☠ Poison {battle.poisonRounds}
                </span>
              )}
              {battle.stunnedRounds > 0 && (
                <span className="status-pill stunned">
                  💫 Stunned {battle.stunnedRounds}
                </span>
              )}
              {battle.frozenRounds > 0 && (
                <span className="status-pill frozen">
                  ❄ Frozen {battle.frozenRounds}
                </span>
              )}
              {battle.blindRounds > 0 && (
                <span className="status-pill blind">
                  ◉ Blind {battle.blindRounds}
                </span>
              )}
              {battle.disorientRounds > 0 && (
                <span className="status-pill disorient">
                  ◌ Disorient {battle.disorientRounds}
                </span>
              )}
              {battle.thornStacks > 0 && (
                <span
                  className="status-pill poison"
                  title="Bramble — erupts at 3 stacks"
                >
                  🌿 Thorns {battle.thornStacks}/3
                </span>
              )}
              {battle.burnStacks.map((s, i) => {
                if (s.rounds <= 0) return null;
                const dot =
                  s.kind === "poison"
                    ? {
                        cls: "poison",
                        icon: "☠",
                        label: "Poison",
                        unit: "poison",
                      }
                    : s.kind === "bleed"
                      ? {
                          cls: "bleed",
                          icon: "🩸",
                          label: "Bleed",
                          unit: "bleed",
                        }
                      : {
                          cls: "burn",
                          icon: "🔥",
                          label: "Burn",
                          unit: "fire",
                        };
                return (
                  <span
                    key={i}
                    className={`status-pill ${dot.cls}`}
                    title={`${s.source}: ${s.damage} ${dot.unit}/turn · ${s.rounds} turn${s.rounds !== 1 ? "s" : ""} remaining`}
                  >
                    {dot.icon} {dot.label} {s.rounds}
                  </span>
                );
              })}
              {battle.electrocuteRounds > 0 && (
                <span className="status-pill electrocute">
                  ⚡ Electrocute {battle.electrocuteRounds}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {status === "ongoing" && (
        <div className="combat-actions">
          <div className="combat-spells">
            <button
              className="action-button"
              disabled={isAnimating}
              onClick={() => handleAction("attack")}
            >
              <span className="hotkey-badge">1</span>
              Attack
              <span className="action-cost">{attackPreview.label}</span>
              <span className="action-dmg-type">{attackPreview.type}</span>
            </button>
            <button
              className="action-button ability"
              disabled={!abilityUsable}
              onClick={() => handleAction("ability")}
              title={def.ability.description}
            >
              <span className="hotkey-badge">2</span>
              {def.ability.name}
              <span className="action-cost">
                {battle.trapRounds > 0
                  ? `Trap detonates in ${battle.trapRounds}`
                  : battle.bloodFuryRounds > 0
                    ? `Active: ${battle.bloodFuryRounds} turns`
                    : battle.abilityCooldown > 0
                      ? `Cooldown: ${battle.abilityCooldown}`
                      : `${def.ability.manaCost} ${def.resourceName.toLowerCase()}`}
              </span>
              <span className="action-dmg-type">
                {abilityPreview.label} · {abilityPreview.type}
              </span>
            </button>
            {def.ability2 && (
              <button
                className="action-button ability"
                disabled={!ability2Usable}
                onClick={() => handleAction("ability2")}
                title={def.ability2.description}
              >
                <span className="hotkey-badge">3</span>
                {def.ability2.name}
                <span className="action-cost">
                  {battle.holyLightCharges > 0 &&
                  def.ability2.kind === "holy_light"
                    ? `Active: ×${battle.holyLightCharges}`
                    : battle.frostShieldRounds > 0 &&
                        def.ability2.kind === "frost_shield"
                      ? `Active: ${battle.frostShieldRounds} turns`
                      : battle.golemRounds > 0 && def.ability2.kind === "golem"
                        ? `Golem Guard: ${battle.golemRounds} turns`
                        : battle.ability2Cooldown > 0
                          ? `Cooldown: ${battle.ability2Cooldown}`
                          : `${def.ability2.manaCost} ${def.resourceName.toLowerCase()}`}
                </span>
                <span className="action-dmg-type">
                  {ability2Preview.label} · {ability2Preview.type}
                </span>
              </button>
            )}
          </div>
          <div className="combat-flee">
            <div className="landscape-monster-name">
              {monster.name}{" "}
              <span className="monster-level">Lv.{monster.level}</span>
            </div>
            <div className="landscape-monster-hp">
              <div className="hp-bar">
                <div
                  className="hp-bar-fill monster"
                  style={{
                    width: `${Math.max(0, (battle.monsterLife / monster.life) * 100)}%`,
                  }}
                />
                <span className="bar-num">
                  {battle.monsterLife}/{monster.life}
                </span>
              </div>
            </div>
            <button
              className="action-button run"
              disabled={isAnimating || escapeTokens <= 0}
              onClick={() => setShowFleePrompt(true)}
              title="Flee the battle. Ends the dungeon run. One use per character."
            >
              Flee
              <span className="action-cost">
                {escapeTokens > 0 ? `${escapeTokens} token` : "No tokens"}
              </span>
            </button>
          </div>
        </div>
      )}

      {status !== "ongoing" && (
        <div className="combat-result-actions">
          <button className="primary-button" onClick={handleContinue}>
            {status === "victory" ? "Continue" : "Accept Your Fate"}
          </button>
        </div>
      )}

      {showFleePrompt && (
        <div className="flee-overlay">
          <div className="flee-modal">
            <p className="flee-question">Are you really this bad?</p>
            <div className="flee-buttons">
              <button
                className="flee-confirm"
                onClick={() => {
                  setShowFleePrompt(false);
                  onEscape();
                }}
              >
                Yes
              </button>
              <button
                className="flee-cancel"
                onClick={() => setShowFleePrompt(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
