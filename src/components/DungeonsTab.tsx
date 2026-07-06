import { DUNGEONS } from "../game/data/dungeons";

interface Props {
  clearedDungeons: string[];
  onStart: (dungeonId: string) => void;
}

export function DungeonsTab({ clearedDungeons, onStart }: Props) {
  return (
    <div className="tab-panel">
      <h3>Dungeons</h3>
      <div className="dungeon-list">
        {DUNGEONS.map((d, index) => {
          const cleared = clearedDungeons.includes(d.id);
          const locked = index > 0 && !clearedDungeons.includes(DUNGEONS[index - 1].id);

          return (
            <div key={d.id} className={`dungeon-card ${locked ? "locked" : ""}`}>
              <div className="dungeon-name">
                {d.name} {cleared && <span className="cleared-badge">Cleared</span>}
              </div>
              <p className="dungeon-desc">{d.description}</p>
              <div className="dungeon-meta">
                {d.waves.length + 1} encounters &middot; Boss: {d.boss.name}
              </div>
              <button className="primary-button small" disabled={locked} onClick={() => onStart(d.id)}>
                {locked ? `Locked — clear ${DUNGEONS[index - 1].name} first` : "Enter"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
