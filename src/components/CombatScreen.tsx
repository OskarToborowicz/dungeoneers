import { useEffect, useRef, useState } from "react";
import { CLASSES } from "../game/data/classes";
import { CONSUMABLES } from "../game/data/consumables";
import { xpToNextLevel } from "../game/character";
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
import type { Character, ConsumableId, EquipmentSlot, Item, MonsterDefinition } from "../game/types";
import { CharacterSprite, type SpriteState } from "./sprites/CharacterSprite";
import { MonsterSprite } from "./sprites/MonsterSprite";
import { AbilityEffect } from "./AbilityEffect";
import { MonsterSpellEffect } from "./MonsterSpellEffect";
import { PotionIcon } from "./PotionIcon";

interface Props {
  character: Character;
  derived: DerivedStats;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  monster: MonsterDefinition;
  startingLife: number;
  startingMana: number;
  startingCooldown: number;
  startingCooldown2: number;
  consumables: Record<ConsumableId, number>;
  escapeTokens: number;
  xpCapped: boolean;
  xpMultiplier: number;
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
  consumables,
  escapeTokens,
  xpCapped,
  xpMultiplier,
  onUsePotion,
  onFinished,
  onEscape,
}: Props) {
  const def = CLASSES[character.classId];
  const logRef = useRef<HTMLDivElement | null>(null);

  const [battle, setBattle] = useState<BattleState>(() =>
    createBattleState(monster, startingLife, startingMana, startingCooldown, startingCooldown2)
  );
  const [log, setLog] = useState<CombatLogEntry[]>([]);
  const [status, setStatus] = useState<BattleStatus>("ongoing");
  const [reward, setReward] = useState<{ xp: number; gold: number } | null>(null);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [playerAnim, setPlayerAnim] = useState<SpriteState>("idle");
  const [monsterAnim, setMonsterAnim] = useState<SpriteState>("idle");
  const [abilityEffect, setAbilityEffect] = useState(false);
  const [ability2Effect, setAbility2Effect] = useState(false);
  const [trapDetonateEffect, setTrapDetonateEffect] = useState(false);
  const [monsterSpellEffect, setMonsterSpellEffect] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFleePrompt, setShowFleePrompt] = useState(false);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === " " && status !== "ongoing") { e.preventDefault(); handleContinue(); }
      else if (e.key === "1") handleAction("attack");
      else if (e.key === "2") handleAction("ability");
      else if (e.key === "3") handleAction("ability2");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function handleAction(action: PlayerActionKind) {
    if (status !== "ongoing" || isAnimating) return;
    if (action === "healthPotion" && (consumables.healthPotion <= 0 || battle.healthPotionCooldown > 0)) return;
    if (action === "manaPotion" && (consumables.manaPotion <= 0 || battle.manaPotionCooldown > 0)) return;

    const wasAbility = action === "ability" && canUseAbility(character, battle);
    const wasAbility2 = action === "ability2" && canUseAbility2(character, battle);
    const result = resolveRound(character, derived, monster, battle, action);

    if (result.status === "victory") {
      if (wasAbility) setAbilityEffect(true);
      if (wasAbility2) setAbility2Effect(true);
      setBattle(result.state);
      setLog((prev) => [...prev, ...result.log]);
      setStatus(result.status);
      setTotalDamageDealt((d) => d + result.damageDealt);
      setReward({ xp: monster.xpReward, gold: rollGoldReward(monster, derived.goldFindBonus) });
      setPlayerAnim("attack");
      setTimeout(() => { setPlayerAnim("idle"); setMonsterAnim("dead"); }, 500);
    } else if (result.status === "defeat") {
      if (wasAbility) setAbilityEffect(true);
      if (wasAbility2) setAbility2Effect(true);
      setBattle(result.state);
      setLog((prev) => [...prev, ...result.log]);
      setStatus(result.status);
      setTotalDamageDealt((d) => d + result.damageDealt);
      setPlayerAnim("attack");
      setTimeout(() => setPlayerAnim("dead"), 500);
    } else {
      // Sequential animation: player first, then monster
      // HP drops at the START of each animation
      const playerEntries = result.log.filter((e) => e.actor === "player");
      const monsterEntries = result.log.filter((e) => e.actor === "monster");
      const lastPlayer = playerEntries.length > 0 ? playerEntries[playerEntries.length - 1] : null;
      const lastMonster = monsterEntries.length > 0 ? monsterEntries[monsterEntries.length - 1] : null;

      setIsAnimating(true);
      setPlayerAnim("attack");
      if (wasAbility) setAbilityEffect(true);
      if (wasAbility2) setAbility2Effect(true);
      // Monster HP drops immediately as player starts swinging
      if (lastPlayer) {
        setBattle((b) => ({ ...b, monsterLife: lastPlayer.monsterLife, playerLife: lastPlayer.playerLife }));
      }

      setTimeout(() => {
        setPlayerAnim("idle");
        setLog((prev) => [...prev, ...playerEntries]);
        const monsterAttacked = monsterEntries.length > 0;
        if (monsterAttacked) {
          setMonsterAnim("attack");
          if (result.monsterSpellCast) setMonsterSpellEffect(result.monsterSpellCast);
          if (result.trapDetonated) setTrapDetonateEffect(true);
          // Player HP drops as monster starts attacking
          if (lastMonster) {
            setBattle((b) => ({ ...b, playerLife: lastMonster.playerLife, monsterLife: lastMonster.monsterLife }));
          }
          setTimeout(() => {
            setMonsterAnim("idle");
            setBattle(result.state);
            setLog((prev) => [...prev, ...monsterEntries]);
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
      endingCooldown: battle.abilityCooldown,
      endingCooldown2: battle.ability2Cooldown,
      damageDealt: totalDamageDealt,
    });
  }

  const abilityUsable = status === "ongoing" && !isAnimating && canUseAbility(character, battle);
  const ability2Usable = status === "ongoing" && !isAnimating && canUseAbility2(character, battle);
  const attackPreview = getAttackPreview(character, derived);
  const abilityPreview = getAbilityPreview(character, derived);
  const ability2Preview = getAbility2Preview(character, derived);

  return (
    <div className="screen combat-screen">
      <h2>{monster.name} <span className="monster-level">Lv.{monster.level}</span></h2>

      <div className="battle-arena">
        {abilityEffect && (
          <AbilityEffect classId={character.classId} onDone={() => setAbilityEffect(false)} />
        )}
        {ability2Effect && (
          <AbilityEffect classId={character.classId} useAbility2={true} onDone={() => setAbility2Effect(false)} />
        )}
        {monsterSpellEffect && (
          <MonsterSpellEffect spellName={monsterSpellEffect} onDone={() => setMonsterSpellEffect(null)} />
        )}
        {trapDetonateEffect && (
          <AbilityEffect classId="assassin" detonation={true} onDone={() => setTrapDetonateEffect(false)} />
        )}
        {battle.trapRounds > 0 && !trapDetonateEffect && (
          <div className="trap-on-field">
            <svg viewBox="0 0 44 28" overflow="visible">
              <g className="trap-field-glow">
                <rect x="10" y="14" width="24" height="8" rx="3" fill="#33aacc" opacity="0.9" />
                <rect x="18" y="10" width="8" height="4" rx="1" fill="#55ccee" opacity="0.85" />
                <line x1="22" y1="14" x2="22" y2="6" stroke="#33aacc" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="22" y1="14" x2="30" y2="8" stroke="#33aacc" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="22" y1="14" x2="14" y2="8" stroke="#33aacc" strokeWidth="1.2" strokeLinecap="round" />
              </g>
              <text x="22" y="28" textAnchor="middle" fill="#55ccee" fontSize="7" fontWeight="bold">{battle.trapRounds}</text>
            </svg>
          </div>
        )}
        <div className={`battle-side player-side${battle.regenRounds > 0 ? " regen-aura-active" : ""}${battle.frostShieldRounds > 0 ? " frost-shield-active" : ""}`}>
          <CharacterSprite
              classId={character.classId}
              size={80}
              state={playerAnim}
              isUnique={equipment.weapon?.rarity === "very rare" || equipment.weapon?.rarity === "unique"}
              statusEffects={[
                ...(battle.playerPoisonRounds > 0 ? ["poison" as const] : []),
                ...(battle.playerBurnRounds > 0 ? ["burn" as const] : []),
              ]}
            />
        </div>
        <div className="battle-side monster-side">
          <MonsterSprite name={monster.name} size={80} state={monsterAnim} />
        </div>
      </div>

      <div className="combat-bars">
        <div className="combat-bar-block">
          <div className="combat-bar-label">{character.name} <span className="monster-level">Lv.{character.level}</span></div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill player"
              style={{ width: `${Math.max(0, (battle.playerLife / derived.maxLife) * 100)}%` }}
            />
          </div>
          <div className={`resource-bar ${def.resourceType}`}>
            <div
              className={`resource-bar-fill ${def.resourceType}`}
              style={{ width: `${Math.max(0, (battle.playerMana / derived.maxMana) * 100)}%` }}
            />
          </div>
          <div className="xp-bar-combat">
            <div
              className="xp-bar-combat-fill"
              style={{ width: `${Math.min(100, (character.xp / xpToNextLevel(character.level)) * 100)}%` }}
            />
            <span className="xp-bar-combat-label">{character.xp} / {xpToNextLevel(character.level)} XP</span>
          </div>
          <div className="combat-stat-row">
            <span className="combat-stat hp">
              <svg viewBox="0 0 10 9" width="10" height="9"><path d="M5 8 C5 8 1 5 1 3a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2-4 5-4 5z" fill="#cc3333"/></svg>
              {battle.playerLife}/{derived.maxLife}
            </span>
            <span className={`combat-stat ${def.resourceType}`}>
              {def.resourceType === "mana"
                ? <svg viewBox="0 0 8 10" width="8" height="10"><path d="M4 1 C4 1 7 5 7 7a3 3 0 0 1-6 0c0-2 3-6 3-6z" fill="#4477ff"/></svg>
                : <svg viewBox="0 0 10 10" width="10" height="10"><path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#cc3300"/></svg>
              }
              {battle.playerMana}/{derived.maxMana}
            </span>
          </div>
          <div className="potion-row">
            <button
              className={`potion-compact health${battle.healthPotionCooldown > 0 ? " on-cooldown" : ""}`}
              disabled={isAnimating || consumables.healthPotion <= 0 || battle.healthPotionCooldown > 0}
              onClick={() => handleAction("healthPotion")}
              title={battle.healthPotionCooldown > 0 ? `Cooldown: ${battle.healthPotionCooldown}` : CONSUMABLES.healthPotion.description}
            >
              <PotionIcon type="health" size={16} />
              <span>{battle.healthPotionCooldown > 0 ? battle.healthPotionCooldown : consumables.healthPotion}/5</span>
            </button>
            {def.resourceType === "mana" && (
              <button
                className={`potion-compact mana${battle.manaPotionCooldown > 0 ? " on-cooldown" : ""}`}
                disabled={isAnimating || consumables.manaPotion <= 0 || battle.manaPotionCooldown > 0}
                onClick={() => handleAction("manaPotion")}
                title={battle.manaPotionCooldown > 0 ? `Cooldown: ${battle.manaPotionCooldown}` : CONSUMABLES.manaPotion.description}
              >
                <PotionIcon type="mana" size={16} />
                <span>{battle.manaPotionCooldown > 0 ? battle.manaPotionCooldown : consumables.manaPotion}/5</span>
              </button>
            )}
          </div>
          {(battle.playerPoisonRounds > 0 || battle.playerBurnRounds > 0 || battle.bloodFuryRounds > 0 || battle.regenRounds > 0 || battle.frostShieldRounds > 0) && (
            <div className="status-effects">
              {battle.bloodFuryRounds > 0 && (
                <span className="status-pill blood-fury">Blood Fury {battle.bloodFuryRounds}</span>
              )}
              {battle.regenRounds > 0 && (
                <span className="status-pill regen">✦ Regen Nova {battle.regenRounds}</span>
              )}
              {battle.frostShieldRounds > 0 && (
                <span className="status-pill frost-shield">❄ Frost Shield {battle.frostShieldRounds}</span>
              )}
              {battle.playerPoisonRounds > 0 && (
                <span className="status-pill poison">☠ Poison {battle.playerPoisonRounds}</span>
              )}
              {battle.playerBurnRounds > 0 && (
                <span className="status-pill burn">🔥 Burn {battle.playerBurnRounds}</span>
              )}
            </div>
          )}
        </div>

        <div className="combat-bar-block">
          <div className="combat-bar-label">{monster.name}</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill monster"
              style={{ width: `${Math.max(0, (battle.monsterLife / monster.life) * 100)}%` }}
            />
          </div>
          <div className="combat-stat-row">
            <span className="combat-stat hp">
              <svg viewBox="0 0 10 9" width="10" height="9"><path d="M5 8 C5 8 1 5 1 3a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2-4 5-4 5z" fill="#cc3333"/></svg>
              {battle.monsterLife}/{monster.life}
            </span>
          </div>
          {(battle.poisonRounds > 0 || battle.frozenRounds > 0 || battle.blindRounds > 0 || battle.disorientRounds > 0) && (
            <div className="status-effects">
              {battle.poisonRounds > 0 && (
                <span className="status-pill poison">☠ Poison {battle.poisonRounds}</span>
              )}
              {battle.frozenRounds > 0 && (
                <span className="status-pill frozen">❄ Frozen {battle.frozenRounds}</span>
              )}
              {battle.blindRounds > 0 && (
                <span className="status-pill blind">◉ Blind {battle.blindRounds}</span>
              )}
              {battle.disorientRounds > 0 && (
                <span className="status-pill disorient">◌ Disorient {battle.disorientRounds}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="combat-log" ref={logRef}>
        {log.map((e, i) => (
          <div key={i} className={`log-entry ${e.actor}`}>
            {e.message}
          </div>
        ))}
      </div>

      {status === "ongoing" && (
        <div className="combat-actions">
          <button className="action-button" disabled={isAnimating} onClick={() => handleAction("attack")}>
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
            <span className="action-dmg-type">{abilityPreview.label} · {abilityPreview.type}</span>
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
                {battle.regenRounds > 0 && def.ability2.kind === "regen"
                  ? `Active: ${battle.regenRounds} turns`
                  : battle.frostShieldRounds > 0 && def.ability2.kind === "frost_shield"
                  ? `Active: ${battle.frostShieldRounds} turns`
                  : battle.ability2Cooldown > 0
                  ? `Cooldown: ${battle.ability2Cooldown}`
                  : `${def.ability2.manaCost} ${def.resourceName.toLowerCase()}`}
              </span>
              <span className="action-dmg-type">{ability2Preview.label} · {ability2Preview.type}</span>
            </button>
          )}
          <button
            className="action-button run"
            disabled={isAnimating || escapeTokens <= 0}
            onClick={() => setShowFleePrompt(true)}
            title="Flee the battle. Ends the dungeon run. One use per character."
          >
            Flee
            <span className="action-cost">{escapeTokens > 0 ? `${escapeTokens} token` : "No tokens"}</span>
          </button>
        </div>
      )}

      {status !== "ongoing" && (
        <div className="combat-result">
          <h3 className={status === "victory" ? "victory-text" : "defeat-text"}>
            {status === "victory" ? "Victory!" : "You Have Died"}
          </h3>
          {status === "victory" && reward && (
            <p>
              {!xpCapped && <>+{Math.round(reward.xp * xpMultiplier)} XP &middot; </>}+{reward.gold} gold
            </p>
          )}
          {status === "defeat" && <p>Your journey ends here. All progress will be lost.</p>}
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
              <button className="flee-confirm" onClick={() => { setShowFleePrompt(false); onEscape(); }}>Yes</button>
              <button className="flee-cancel" onClick={() => setShowFleePrompt(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
