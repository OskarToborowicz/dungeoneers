import { useEffect, useRef, useState } from "react";
import { CLASSES } from "../game/data/classes";
import { CONSUMABLES } from "../game/data/consumables";
import type { DerivedStats } from "../game/character";
import {
  canUseAbility,
  createBattleState,
  resolveRound,
  rollGoldReward,
  type BattleState,
  type BattleStatus,
  type CombatLogEntry,
  type CombatResult,
  type PlayerActionKind,
} from "../game/combat";
import type { Character, ConsumableId, EquipmentSlot, Item, MonsterDefinition } from "../game/types";
import { CharacterSprite, type SpriteState } from "./sprites/CharacterSprite";
import { MonsterSprite } from "./sprites/MonsterSprite";

interface Props {
  character: Character;
  derived: DerivedStats;
  equipment: Partial<Record<EquipmentSlot, Item>>;
  monster: MonsterDefinition;
  startingLife: number;
  startingMana: number;
  startingCooldown: number;
  consumables: Record<ConsumableId, number>;
  escapeTokens: number;
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
  consumables,
  escapeTokens,
  onUsePotion,
  onFinished,
  onEscape,
}: Props) {
  const def = CLASSES[character.classId];
  const logRef = useRef<HTMLDivElement | null>(null);

  const [battle, setBattle] = useState<BattleState>(() =>
    createBattleState(monster, startingLife, startingMana, startingCooldown)
  );
  const [log, setLog] = useState<CombatLogEntry[]>([]);
  const [status, setStatus] = useState<BattleStatus>("ongoing");
  const [reward, setReward] = useState<{ xp: number; gold: number } | null>(null);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [playerAnim, setPlayerAnim] = useState<SpriteState>("idle");
  const [monsterAnim, setMonsterAnim] = useState<SpriteState>("idle");

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  function handleAction(action: PlayerActionKind) {
    if (status !== "ongoing") return;
    if (action === "healthPotion" && (consumables.healthPotion <= 0 || battle.healthPotionCooldown > 0)) return;
    if (action === "manaPotion" && (consumables.manaPotion <= 0 || battle.manaPotionCooldown > 0)) return;

    const result = resolveRound(character, derived, monster, battle, action);
    setBattle(result.state);
    setLog((prev) => [...prev, ...result.log]);
    setStatus(result.status);
    setTotalDamageDealt((d) => d + result.damageDealt);

    if (result.status === "victory") {
      setReward({ xp: monster.xpReward, gold: rollGoldReward(monster) });
      setMonsterAnim("dead");
    } else if (result.status === "defeat") {
      setPlayerAnim("dead");
    } else {
      setPlayerAnim("attack");
      setTimeout(() => setPlayerAnim("idle"), 550);
      const monsterAttacked = result.log.some((e) => e.actor === "monster");
      if (monsterAttacked) {
        setTimeout(() => {
          setMonsterAnim("attack");
          setTimeout(() => setMonsterAnim("idle"), 550);
        }, 280);
      }
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
      damageDealt: totalDamageDealt,
    });
  }

  const abilityUsable = status === "ongoing" && canUseAbility(character, battle);

  return (
    <div className="screen combat-screen">
      <h2>{monster.name}</h2>

      <div className="battle-arena">
        <div className="battle-side player-side">
          <CharacterSprite
              classId={character.classId}
              size={80}
              state={playerAnim}
              isUnique={equipment.weapon?.rarity === "unique"}
            />
        </div>
        <div className="battle-side monster-side">
          <MonsterSprite name={monster.name} size={80} state={monsterAnim} />
        </div>
      </div>

      <div className="combat-bars">
        <div className="combat-bar-block">
          <div className="combat-bar-label">{character.name}</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill player"
              style={{ width: `${Math.max(0, (battle.playerLife / derived.maxLife) * 100)}%` }}
            />
          </div>
          <div className="hp-value">{battle.playerLife} / {derived.maxLife}</div>
          <div className={def.resourceType === "fury" ? "fury-value" : "mana-value"}>{battle.playerMana} / {derived.maxMana} {def.resourceName.toLowerCase()}</div>
        </div>

        <div className="combat-bar-block">
          <div className="combat-bar-label">{monster.name}</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill monster"
              style={{ width: `${Math.max(0, (battle.monsterLife / monster.life) * 100)}%` }}
            />
          </div>
          <div className="hp-value">{battle.monsterLife} / {monster.life}</div>
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
          <button className="action-button" onClick={() => handleAction("attack")}>
            Attack
          </button>
          <button
            className="action-button ability"
            disabled={!abilityUsable}
            onClick={() => handleAction("ability")}
            title={def.ability.description}
          >
            {def.ability.name}
            <span className="action-cost">
              {battle.abilityCooldown > 0
                ? `Cooldown: ${battle.abilityCooldown}`
                : `${def.ability.manaCost} ${def.resourceName.toLowerCase()}`}
            </span>
          </button>
          <button
            className="action-button potion health"
            disabled={consumables.healthPotion <= 0 || battle.healthPotionCooldown > 0}
            onClick={() => handleAction("healthPotion")}
            title={CONSUMABLES.healthPotion.description}
          >
            {CONSUMABLES.healthPotion.name}
            <span className="action-cost">
              {battle.healthPotionCooldown > 0
                ? `Cooldown: ${battle.healthPotionCooldown}`
                : `Owned: ${consumables.healthPotion}`}
            </span>
          </button>
          {def.resourceType === "mana" && (
            <button
              className="action-button potion mana"
              disabled={consumables.manaPotion <= 0 || battle.manaPotionCooldown > 0}
              onClick={() => handleAction("manaPotion")}
              title={CONSUMABLES.manaPotion.description}
            >
              {CONSUMABLES.manaPotion.name}
              <span className="action-cost">
                {battle.manaPotionCooldown > 0
                  ? `Cooldown: ${battle.manaPotionCooldown}`
                  : `Owned: ${consumables.manaPotion}`}
              </span>
            </button>
          )}
          <button
            className="action-button run"
            disabled={escapeTokens <= 0}
            onClick={onEscape}
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
              +{reward.xp} XP &middot; +{reward.gold} gold
            </p>
          )}
          {status === "defeat" && <p>Your journey ends here. All progress will be lost.</p>}
          <button className="primary-button" onClick={handleContinue}>
            {status === "victory" ? "Continue" : "Accept Your Fate"}
          </button>
        </div>
      )}
    </div>
  );
}
