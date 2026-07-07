import { DUNGEONS, REGULAR_DUNGEON_COUNT } from "../game/data/dungeons";

interface Props {
  clearedDungeons: string[];
  onStart: (dungeonId: string) => void;
}

export function DungeonsTab({ clearedDungeons, onStart }: Props) {
  const regularDungeons = DUNGEONS.filter((d) => !d.endgame);
  const endgameDungeons = DUNGEONS.filter((d) => d.endgame);
  const allRegularCleared = regularDungeons.every((d) => clearedDungeons.includes(d.id));

  return (
    <div className="tab-panel">
      <h3>Dungeons</h3>
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
                Enter — All dungeons cleared. You face the Prime Evil.
              </button>
            </div>
          );
        })}

        {!allRegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">??? — Chaos Sanctuary</div>
            <p className="dungeon-desc">Clear all dungeons to reveal what lies beyond.</p>
            <div className="dungeon-meta">
              {REGULAR_DUNGEON_COUNT - clearedDungeons.filter((id) => regularDungeons.some((d) => d.id === id)).length} dungeon{(REGULAR_DUNGEON_COUNT - clearedDungeons.filter((id) => regularDungeons.some((d) => d.id === id)).length) !== 1 ? "s" : ""} remaining
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
