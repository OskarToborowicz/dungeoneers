import { CLASSES } from "../game/data/classes";
import type { DeathSummary } from "../game/types";
import { CharacterSprite } from "./sprites/CharacterSprite";

interface Props {
  summary: DeathSummary;
  onContinue: () => void;
}

// Only Hardcore deaths reach this screen — Softcore returns straight to the hub.
export function GameOverScreen({ summary, onContinue }: Props) {
  const def = CLASSES[summary.classId];

  return (
    <div className="screen game-over-screen">
      <h1 className="death-title">You Have Died</h1>
      <div className="death-sprite">
        <CharacterSprite
          classId={summary.classId}
          size={90}
          state="dead"
          animated={false}
        />
      </div>
      <p className="subtitle">
        {summary.hardcore
          ? `${summary.characterName} the ${def.name} has fallen. Their legend ends here.`
          : `${summary.characterName} the ${def.name} has fallen. All XP and gold have been lost.`}
      </p>

      <div className="death-stats-panel">
        <div className="death-stat-row">
          <span className="death-stat-label">Level Reached</span>
          <span className="death-stat-value">{summary.level}</span>
        </div>
        <div className="death-stat-row">
          <span className="death-stat-label">Monsters Slain</span>
          <span className="death-stat-value">{summary.kills}</span>
        </div>
        <div className="death-stat-row">
          <span className="death-stat-label">Gold Farmed</span>
          <span className="death-stat-value">{summary.goldEarned}</span>
        </div>
        <div className="death-stat-row">
          <span className="death-stat-label">Damage Dealt</span>
          <span className="death-stat-value">{summary.damageDealt}</span>
        </div>
      </div>

      <p className="empty-note">
        {summary.hardcore
          ? "Death is permanent. All gear, gold, and progress have been lost."
          : "Return to the hub and try again."}
      </p>

      <button className="primary-button" onClick={onContinue}>
        {summary.hardcore ? "Begin a New Legend" : "Continue"}
      </button>
    </div>
  );
}
