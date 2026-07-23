import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

// Compact status pill: shows just the icon + remaining-rounds number. Tapping it
// reveals the effect's name inline for a moment (desktop also gets the full
// detail via the native `title` tooltip). Keeps the combat UI tight — especially
// in landscape, where status pills share the column with the action buttons.
function StatusPill({
  className,
  icon,
  count,
  name,
  tip,
}: {
  className: string;
  icon: string;
  count: string | number;
  name: string;
  tip?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 1800);
    return () => clearTimeout(t);
  }, [open]);
  return (
    <span
      className={`status-pill ${className}`}
      title={tip ?? name}
      onClick={() => setOpen((o) => !o)}
    >
      <span className="status-pill-icon">{icon}</span>
      {open && <span className="status-pill-name">{name}</span>}
      <span className="status-pill-count">{count}</span>
    </span>
  );
}

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
  isBossFight: boolean;
  itemsFoundThisRun: number;
  onRollDrops: (monsterLevel: number, isBoss: boolean) => void;
  onUsePotion: (id: ConsumableId) => void;
  onFinished: (result: CombatResult, clearAgain?: boolean) => void;
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
  isBossFight,
  itemsFoundThisRun,
  onRollDrops,
  onUsePotion,
  onFinished,
  onEscape,
}: Props) {
  const def = CLASSES[character.classId];
  // Monk shares the "mana" resourceType but paints its bar in Chi green.
  const resourceClass = character.classId === "monk" ? "chi" : def.resourceType;
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

  // Monster status auras (poison/burn/bleed) are shown ~1s after the status is
  // actually applied, so the aura doesn't pop mid-swing — it settles in once the
  // hit has landed. Mirrors the live battle flags into a delayed display set.
  const wantPoison =
    battle.poisonRounds > 0 ||
    battle.burnStacks.some((s) => s.kind === "poison");
  const wantBurn = battle.burnStacks.some((s) => s.kind === "burn");
  const wantBleed = battle.burnStacks.some((s) => s.kind === "bleed");
  const [monsterStatusFx, setMonsterStatusFx] = useState<
    Array<"poison" | "burn" | "bleed">
  >([]);
  useEffect(() => {
    const next: Array<"poison" | "burn" | "bleed"> = [
      ...(wantPoison ? (["poison"] as const) : []),
      ...(wantBurn ? (["burn"] as const) : []),
      ...(wantBleed ? (["bleed"] as const) : []),
    ];
    const t = setTimeout(() => setMonsterStatusFx(next), 1000);
    return () => clearTimeout(t);
  }, [wantPoison, wantBurn, wantBleed]);

  // Ability-effect overlay uses a 200×120 viewBox letterboxed over the arena, so
  // its authored anchors (player 32 / monster 168) drift off the sprites as the
  // arena widens. Measure the real sprite positions, convert to viewBox units,
  // and feed them to AbilityEffect so effects always land on the sprites.
  // Mirrors the hit count in resolveRound's "multi" branch and getAbilityPreview
  // so the animation shows the same number of kicks the engine actually rolls.
  const abilityHitCount =
    character.classId === "monk" && derived.stormfistActive
      ? 4
      : (def.ability.hits ?? 3);

  const arenaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const monsterRef = useRef<HTMLDivElement>(null);
  const [fxAnchors, setFxAnchors] = useState({ launchX: 32, impactX: 168 });

  useLayoutEffect(() => {
    function measure() {
      const arena = arenaRef.current?.getBoundingClientRect();
      const player = playerRef.current?.getBoundingClientRect();
      const monster = monsterRef.current?.getBoundingClientRect();
      if (!arena || !player || !monster || arena.width === 0) return;
      const scale = Math.min(arena.width / 200, arena.height / 120);
      if (scale === 0) return;
      const offsetX = (arena.width - 200 * scale) / 2;
      const toSvgX = (clientX: number) =>
        (clientX - arena.left - offsetX) / scale;
      const launchX = toSvgX((player.left + player.right) / 2); // player sprite centre
      const impactX = toSvgX((monster.left + monster.right) / 2); // monster sprite centre
      setFxAnchors((prev) =>
        Math.abs(prev.launchX - launchX) < 0.5 &&
        Math.abs(prev.impactX - impactX) < 0.5
          ? prev
          : { launchX, impactX },
      );
    }
    measure();
    // Re-measure after the monster's fade-in transform settles, and on resize.
    const settle = setTimeout(measure, 320);
    const ro = new ResizeObserver(measure);
    if (arenaRef.current) ro.observe(arenaRef.current);
    return () => {
      clearTimeout(settle);
      ro.disconnect();
    };
  }, []);

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
    const wasAbility = action === "ability" && canUseAbility(character, battle);
    const wasAbility2 =
      action === "ability2" && canUseAbility2(character, battle);
    // Drinking is not a swing — skip the lunge, show bubbles instead.
    const isPotion = action === "healthPotion";
    if (isPotion) {
      setPotionFx((p) => ({
        type: "health",
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
      onRollDrops(monster.level, isBossFight);
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
      // Sequential animation: player first, then monster.
      // HP drops at the START of each animation.
      // Split on the engine's phase boundary, NOT on entry.actor — Monk's
      // Counter Attack is a player-actor entry that fires after the monster,
      // and an actor split would show it before the hit that provoked it.
      const splitAt = result.playerPhaseLogCount ?? result.log.length;
      const playerEntries = result.log.slice(0, splitAt);
      const monsterEntries = result.log.slice(splitAt);
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
      // Summoned standing models (Druid Grove) should pop the instant the skill
      // is pressed — not after the turn's ~550ms animation timeout commits the
      // full state. barkWallRounds is 0 for every other cast, so this is a no-op
      // outside the Druid.
      if (wasAbility2)
        setBattle((b) => ({
          ...b,
          barkWallRounds: result.state.barkWallRounds,
        }));
      // Monster HP drops immediately as player starts swinging, and the
      // resource bar moves with it — ability costs and attack gains are both
      // spent by this point, so waiting for the end-of-turn commit made them
      // land a full animation late.
      if (lastPlayer) {
        setBattle((b) => ({
          ...b,
          monsterLife: lastPlayer.monsterLife,
          playerLife: lastPlayer.playerLife,
          playerMana: result.playerPhaseMana ?? b.playerMana,
        }));
      } else if (result.playerPhaseMana != null) {
        setBattle((b) => ({ ...b, playerMana: result.playerPhaseMana! }));
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

    if (action === "healthPotion") {
      onUsePotion(action);
    }
  }

  function handleContinue(clearAgain = false) {
    onFinished(
      {
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
      },
      clearAgain,
    );
  }

  const abilityUsable =
    status === "ongoing" && !isAnimating && canUseAbility(character, battle);
  const ability2Usable =
    status === "ongoing" && !isAnimating && canUseAbility2(character, battle);
  const attackPreview = getAttackPreview(character, derived);
  const abilityPreview = getAbilityPreview(character, derived);
  const ability2Preview = getAbility2Preview(character, derived);
  const softcoreMode = character.mode === "softcore";
  const canFlee = !isAnimating && (softcoreMode || escapeTokens > 0);

  // Monster status pills — rendered in the bars column (portrait/desktop) and
  // duplicated in the flee column for landscape, where the monster's HP lives.
  const monsterStatusActive =
    battle.poisonRounds > 0 ||
    battle.frozenRounds > 0 ||
    battle.stunnedRounds > 0 ||
    battle.blindRounds > 0 ||
    battle.disorientRounds > 0 ||
    battle.burnStacks.some((s) => s.rounds > 0) ||
    battle.thornStacks > 0 ||
    battle.electrocuteRounds > 0;

  const monsterStatusPills = (
    <>
      {battle.poisonRounds > 0 && (
        <StatusPill className="poison" icon="☠" name="Poison" count={battle.poisonRounds} />
      )}
      {battle.stunnedRounds > 0 && (
        <StatusPill className="stunned" icon="💫" name="Stunned" count={battle.stunnedRounds} />
      )}
      {battle.frozenRounds > 0 && (
        <StatusPill className="frozen" icon="❄" name="Frozen" count={battle.frozenRounds} />
      )}
      {battle.blindRounds > 0 && (
        <StatusPill className="blind" icon="◉" name="Blind" count={battle.blindRounds} />
      )}
      {battle.disorientRounds > 0 && (
        <StatusPill className="disorient" icon="◌" name="Disorient" count={battle.disorientRounds} />
      )}
      {battle.thornStacks > 0 && (
        <StatusPill
          className="poison"
          icon="🌿"
          name="Thorns"
          count={`${battle.thornStacks}/3`}
          tip="Bramble — erupts at 3 stacks"
        />
      )}
      {battle.burnStacks.map((s, i) => {
        if (s.rounds <= 0) return null;
        const dot =
          s.kind === "poison"
            ? { cls: "poison", icon: "☠", label: "Poison", unit: "poison" }
            : s.kind === "bleed"
              ? { cls: "bleed", icon: "🩸", label: "Bleed", unit: "bleed" }
              : { cls: "burn", icon: "🔥", label: "Burn", unit: "fire" };
        return (
          <StatusPill
            key={i}
            className={dot.cls}
            icon={dot.icon}
            name={dot.label}
            count={s.rounds}
            tip={`${s.source}: ${s.damage} ${dot.unit}/turn · ${s.rounds} turn${s.rounds !== 1 ? "s" : ""} remaining`}
          />
        );
      })}
      {battle.electrocuteRounds > 0 && (
        <StatusPill className="electrocute" icon="⚡" name="Electrocute" count={battle.electrocuteRounds} />
      )}
    </>
  );

  // On the victory screen, project the XP the player just earned onto the bar so
  // it visually matches the "+X XP" reward line (and rolls over on level-up),
  // instead of showing the stale pre-kill total until Continue is pressed.
  let displayXp = character.xp;
  let displayLevel = character.level;
  if (status === "victory" && reward && !xpCapped) {
    let simXp = character.xp + Math.round(reward.xp * xpMultiplier);
    let simLevel = character.level;
    while (simXp >= xpToNextLevel(simLevel)) {
      simXp -= xpToNextLevel(simLevel);
      simLevel++;
    }
    displayXp = simXp;
    displayLevel = simLevel;
  }

  return (
    <div className="screen combat-screen">
      <div className="combat-middle">
        <h2 className="combat-title">
          {monster.name}{" "}
          <span className="monster-level">Lv.{monster.level}</span>
        </h2>

        <div className="battle-arena" ref={arenaRef}>
          {attackEffect > 0 && (
            <AbilityEffect
              key={`atk-${attackEffect}`}
              classId={character.classId}
              useAttack={true}
              launchX={fxAnchors.launchX}
              impactX={fxAnchors.impactX}
              onDone={() => setAttackEffect(0)}
            />
          )}
          {abilityEffect > 0 && (
            <AbilityEffect
              key={abilityEffect}
              classId={character.classId}
              hitCount={abilityHitCount}
              launchX={fxAnchors.launchX}
              impactX={fxAnchors.impactX}
              onDone={() => setAbilityEffect(0)}
            />
          )}
          {ability2Effect > 0 && (
            <AbilityEffect
              key={-ability2Effect}
              classId={character.classId}
              useAbility2={true}
              launchX={fxAnchors.launchX}
              impactX={fxAnchors.impactX}
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
              launchX={fxAnchors.launchX}
              impactX={fxAnchors.impactX}
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
            ref={playerRef}
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
          <div className="battle-side monster-side" ref={monsterRef}>
            <MonsterSprite
              name={monster.name}
              size={80}
              state={monsterAnim}
              statusEffects={monsterStatusFx}
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
                    <p className="items-found-note">
                      Items found: {itemsFoundThisRun}
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
              <p>
                You are dead.{" "}
                {softcoreMode
                  ? "You lost all gold and exp."
                  : "All progress will be lost."}
              </p>
            )}
            <button
              className={`primary-button${status === "defeat" && softcoreMode ? " respawn-button" : ""}`}
              onClick={() => handleContinue()}
            >
              {status === "victory"
                ? "Continue"
                : softcoreMode
                  ? "Respawn"
                  : "Accept Your Fate"}
            </button>
            {status === "victory" && isBossFight && (
              <button
                className="primary-button clear-again-button"
                onClick={() => handleContinue(true)}
              >
                Clear Again
              </button>
            )}
          </div>
        )}
      </div>
      {/* end combat-middle */}

      <div className="combat-bars">
        <div className="combat-bar-block">
          <div className="combat-bar-label">
            {character.name}{" "}
            <span className="monster-level">Lv.{displayLevel}</span>
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
            <div className={`resource-bar ${resourceClass}`}>
              <div
                className={`resource-bar-fill ${resourceClass}`}
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
                width: `${Math.min(100, (displayXp / xpToNextLevel(displayLevel)) * 100)}%`,
              }}
            />
            <span className="xp-bar-combat-label">
              {displayXp} / {xpToNextLevel(displayLevel)} XP
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
              <span className={`combat-stat ${resourceClass}`}>
                {resourceClass === "chi" ? (
                  <svg viewBox="0 0 10 10" width="10" height="10">
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill="none"
                      stroke="#54e396"
                      strokeWidth="1.6"
                    />
                    <circle cx="5" cy="5" r="1.5" fill="#54e396" />
                  </svg>
                ) : resourceClass === "mana" ? (
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
              <span>{consumables.healthPotion}</span>
              {battle.healthPotionCooldown > 0 && (
                <span className="potion-cooldown">
                  {battle.healthPotionCooldown}
                </span>
              )}
            </button>
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
                <StatusPill className="vanish" icon="◌" name="Vanish" count={battle.vanishRounds} />
              )}
              {battle.bloodFuryRounds > 0 && (
                <StatusPill className="blood-fury" icon="💢" name="Blood Fury" count={battle.bloodFuryRounds} />
              )}
              {battle.holyLightCharges > 0 && (
                <StatusPill className="holy-light" icon="✦" name="Holy Light" count={`×${battle.holyLightCharges}`} />
              )}
              {battle.frostShieldRounds > 0 && (
                <StatusPill className="frost-shield" icon="❄" name="Frost Shield" count={battle.frostShieldRounds} />
              )}
              {battle.barkWallRounds > 0 && (
                <StatusPill className="bark-wall" icon="🌳" name="Grove" count={battle.barkWallRounds} />
              )}
              {battle.playerPoisonRounds > 0 && (
                <StatusPill className="poison" icon="☠" name="Poison" count={battle.playerPoisonRounds} />
              )}
              {battle.playerBurnRounds > 0 && (
                <StatusPill className="burn" icon="🔥" name="Burn" count={battle.playerBurnRounds} />
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
          {monsterStatusActive && (
            <div className="status-effects monster-status-bars">
              {monsterStatusPills}
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
            {monsterStatusActive && (
              <div className="status-effects landscape-monster-status">
                {monsterStatusPills}
              </div>
            )}
            <button
              className="action-button run"
              disabled={!canFlee}
              onClick={() => setShowFleePrompt(true)}
              title={
                softcoreMode
                  ? "Flee the battle. Ends the dungeon run and costs 30% of your gold."
                  : "Flee the battle. Ends the dungeon run. One use per character."
              }
            >
              Flee
              <span className="action-cost">
                {softcoreMode
                  ? "−30% gold"
                  : escapeTokens > 0
                    ? `${escapeTokens} token`
                    : "No tokens"}
              </span>
            </button>
          </div>
        </div>
      )}

      {status !== "ongoing" && (
        <div className="combat-result-actions">
          {status === "victory" && isBossFight && (
            <button
              className="primary-button clear-again-button"
              onClick={() => handleContinue(true)}
            >
              Clear Again
            </button>
          )}
          <button
            className={`primary-button${status === "defeat" && softcoreMode ? " respawn-button" : ""}`}
            onClick={() => handleContinue()}
          >
            {status === "victory"
              ? "Continue"
              : softcoreMode
                ? "Respawn"
                : "Accept Your Fate"}
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
