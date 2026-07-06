import { CLASSES } from "../game/data/classes";
import type { DeathSummary } from "../game/types";

interface Props {
  summary: DeathSummary;
  onContinue: () => void;
}

export function GameOverScreen({ summary, onContinue }: Props) {
  const def = CLASSES[summary.classId];

  return (
    <div className="screen game-over-screen">
      <h1 className="death-title">You Have Died</h1>
      <p className="subtitle">
        {summary.characterName} the {def.name} has fallen. Their legend ends here.
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

      <p className="empty-note">Death is permanent. All gear, gold, and progress have been lost.</p>

      <button className="primary-button" onClick={onContinue}>
        Begin a New Legend
      </button>
    </div>
  );
}
