import { useState } from "react";
import { DUNGEONS } from "../game/data/dungeons";

interface Props {
  clearedDungeons: string[];
  onStart: (dungeonId: string) => void;
}

export function DungeonsTab({ clearedDungeons, onStart }: Props) {
  const act1Regular = DUNGEONS.filter((d) => d.act === 1 && !d.endgame);
  const act1Endgame = DUNGEONS.filter((d) => d.act === 1 && d.endgame);
  const act2Regular = DUNGEONS.filter((d) => d.act === 2 && !d.endgame);
  const act2Endgame = DUNGEONS.filter((d) => d.act === 2 && d.endgame);

  const act2Unlocked = act1Endgame.every((d) => clearedDungeons.includes(d.id));
  const allAct1RegularCleared = act1Regular.every((d) => clearedDungeons.includes(d.id));
  const allAct2RegularCleared = act2Regular.every((d) => clearedDungeons.includes(d.id));

  const [selectedAct, setSelectedAct] = useState<1 | 2>(1);
  const act = selectedAct;

  const regularDungeons = act === 1 ? act1Regular : act2Regular;
  const endgameDungeons = act === 1 ? act1Endgame : act2Endgame;
  const allRegularCleared = act === 1 ? allAct1RegularCleared : allAct2RegularCleared;

  const remainingRegular = regularDungeons.filter((d) => !clearedDungeons.includes(d.id)).length;

  return (
    <div className="tab-panel">
      <div className="dungeons-header">
        <h3>Dungeons</h3>
        {act2Unlocked && (
          <div className="act-selector">
            <button
              className={`act-tab${act === 1 ? " active" : ""}`}
              onClick={() => setSelectedAct(1)}
            >
              Act 1
            </button>
            <button
              className={`act-tab${act === 2 ? " active" : ""}`}
              onClick={() => setSelectedAct(2)}
            >
              Act 2
            </button>
          </div>
        )}
      </div>

      <div className="dungeon-list">
        {regularDungeons.map((d, index) => {
          const cleared = clearedDungeons.includes(d.id);
          const locked = index > 0 && !clearedDungeons.includes(regularDungeons[index - 1].id);
          const allMonsters = [...d.waves, d.boss];
          const minLvl = Math.min(...allMonsters.map((m) => m.level));
          const maxLvl = Math.max(...allMonsters.map((m) => m.level));
          return (
            <div key={d.id} className={`dungeon-card ${locked ? "locked" : ""}`}>
              <div className="dungeon-name">
                {d.name} {cleared && <span className="cleared-badge">Cleared</span>}
              </div>
              <p className="dungeon-desc">{d.description}</p>
              <div className="dungeon-meta">
                Lv.{minLvl}–{maxLvl} &middot; {d.waves.length + 1} encounters &middot; Boss: {d.boss.name}
              </div>
              <button className="primary-button small" disabled={locked} onClick={() => onStart(d.id)}>
                {locked ? `Locked — clear ${regularDungeons[index - 1].name} first` : "Enter"}
              </button>
            </div>
          );
        })}

        {allRegularCleared && endgameDungeons.map((d) => {
          const cleared = clearedDungeons.includes(d.id);
          const allMonsters = [...d.waves, d.boss];
          const minLvl = Math.min(...allMonsters.map((m) => m.level));
          const maxLvl = Math.max(...allMonsters.map((m) => m.level));
          return (
            <div key={d.id} className="dungeon-card dungeon-endgame">
              <div className="dungeon-name">
                {d.name} {cleared && <span className="cleared-badge">Cleared</span>}
              </div>
              <p className="dungeon-desc">{d.description}</p>
              <div className="dungeon-meta">
                Lv.{minLvl}–{maxLvl} &middot; {d.waves.length + 1} encounters &middot; Final Boss: {d.boss.name}
              </div>
              <button className="primary-button small endgame-button" onClick={() => onStart(d.id)}>
                {act === 1
                  ? "Enter — All dungeons cleared. You face the Maiden of Anguish."
                  : "Enter — All dungeons cleared. You face the Core of Hell."}
              </button>
            </div>
          );
        })}

        {!allRegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">
              {act === 1 ? "??? — Rogue Monastery" : "??? — Hellcore"}
            </div>
            <p className="dungeon-desc">
              {act === 1
                ? "Clear all dungeons to reveal what lies beyond."
                : "Clear all dungeons to unlock the Core of Hell."}
            </p>
            <div className="dungeon-meta">
              {remainingRegular} dungeon{remainingRegular !== 1 ? "s" : ""} remaining
            </div>
          </div>
        )}

        {act === 1 && !act2Unlocked && allAct1RegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">??? — Act 2</div>
            <p className="dungeon-desc">Defeat Andariel to open the red portal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
