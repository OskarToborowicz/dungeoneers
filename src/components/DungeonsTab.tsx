import { DUNGEONS } from "../game/data/dungeons";

interface Props {
  clearedDungeons: string[];
  onStart: (dungeonId: string) => void;
  selectedAct: 1 | 2 | 3;
  onSelectAct: (act: 1 | 2 | 3) => void;
}

export function DungeonsTab({
  clearedDungeons,
  onStart,
  selectedAct,
  onSelectAct,
}: Props) {
  const act1Regular = DUNGEONS.filter((d) => d.act === 1 && !d.endgame);
  const act1Endgame = DUNGEONS.filter((d) => d.act === 1 && d.endgame);
  const act2Regular = DUNGEONS.filter((d) => d.act === 2 && !d.endgame);
  const act2Endgame = DUNGEONS.filter((d) => d.act === 2 && d.endgame);
  const act3Regular = DUNGEONS.filter((d) => d.act === 3 && !d.endgame);
  const act3Endgame = DUNGEONS.filter((d) => d.act === 3 && d.endgame);

  const act2Unlocked = act1Endgame.every((d) => clearedDungeons.includes(d.id));
  const act3Unlocked = act2Endgame.every((d) => clearedDungeons.includes(d.id));

  const allAct1RegularCleared = act1Regular.every((d) => clearedDungeons.includes(d.id));
  const allAct2RegularCleared = act2Regular.every((d) => clearedDungeons.includes(d.id));
  const allAct3RegularCleared = act3Regular.every((d) => clearedDungeons.includes(d.id));

  const act = selectedAct;

  const regularDungeons = act === 1 ? act1Regular : act === 2 ? act2Regular : act3Regular;
  const endgameDungeons = act === 1 ? act1Endgame : act === 2 ? act2Endgame : act3Endgame;
  const allRegularCleared = act === 1 ? allAct1RegularCleared : act === 2 ? allAct2RegularCleared : allAct3RegularCleared;

  const remainingRegular = regularDungeons.filter(
    (d) => !clearedDungeons.includes(d.id),
  ).length;

  const endgameLabel =
    act === 1 ? "STORM THE TOWN HALL" :
    act === 2 ? "FACE SIKKTHARKK" :
    "FACE ZAM'KORO";

  const lockedHintName =
    act === 1 ? "??? — Bandit's Town Hall" :
    act === 2 ? "??? — The White Maw" :
    "??? — Sacrificial Altar";

  const lockedHintDesc =
    act === 1 ? "Clear all dungeons to reveal what lies beyond." :
    act === 2 ? "Clear all dungeons to face the Great Frozen Dragon." :
    "Clear all dungeons to face Zam'Koro, the Loa of Endless Night.";

  return (
    <div className="tab-panel">
      <div className="dungeons-header">
        <h3>Dungeons</h3>
        {act2Unlocked && (
          <div className="act-selector">
            <button
              className={`act-tab${act === 1 ? " active" : ""}`}
              onClick={() => onSelectAct(1)}
            >
              Act 1
            </button>
            <button
              className={`act-tab${act === 2 ? " active" : ""}`}
              onClick={() => onSelectAct(2)}
            >
              Act 2
            </button>
            {act3Unlocked && (
              <button
                className={`act-tab${act === 3 ? " active" : ""}`}
                onClick={() => onSelectAct(3)}
              >
                Act 3
              </button>
            )}
          </div>
        )}
      </div>

      <div className="dungeon-list">
        {regularDungeons.map((d, index) => {
          const cleared = clearedDungeons.includes(d.id);
          const locked =
            index > 0 &&
            !clearedDungeons.includes(regularDungeons[index - 1].id);
          const allMonsters = [...d.waves, d.boss];
          const minLvl = Math.min(...allMonsters.map((m) => m.level));
          const maxLvl = Math.max(...allMonsters.map((m) => m.level));
          return (
            <div
              key={d.id}
              className={`dungeon-card ${locked ? "locked" : ""}`}
            >
              <div className="dungeon-name">
                {d.name}{" "}
                {cleared && <span className="cleared-badge">Cleared</span>}
              </div>
              <p className="dungeon-desc">{d.description}</p>
              <div className="dungeon-meta">
                Lv.{minLvl}–{maxLvl} &middot; {d.waves.length + 1} encounters
                &middot; Boss: {d.boss.name}
              </div>
              <button
                className="primary-button small"
                disabled={locked}
                onClick={() => onStart(d.id)}
              >
                {locked
                  ? `Locked — clear ${regularDungeons[index - 1].name} first`
                  : "Enter"}
              </button>
            </div>
          );
        })}

        {allRegularCleared &&
          endgameDungeons.map((d) => {
            const cleared = clearedDungeons.includes(d.id);
            const allMonsters = [...d.waves, d.boss];
            const minLvl = Math.min(...allMonsters.map((m) => m.level));
            const maxLvl = Math.max(...allMonsters.map((m) => m.level));
            return (
              <div key={d.id} className="dungeon-card dungeon-endgame">
                <div className="dungeon-name">
                  {d.name}{" "}
                  {cleared && <span className="cleared-badge">Cleared</span>}
                </div>
                <p className="dungeon-desc">{d.description}</p>
                <div className="dungeon-meta">
                  Lv.{minLvl}–{maxLvl} &middot; {d.waves.length + 1} encounters
                  &middot; Final Boss: {d.boss.name}
                </div>
                <button
                  className="primary-button small endgame-button"
                  onClick={() => onStart(d.id)}
                >
                  {endgameLabel}
                </button>
              </div>
            );
          })}

        {!allRegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">{lockedHintName}</div>
            <p className="dungeon-desc">{lockedHintDesc}</p>
            <div className="dungeon-meta">
              {remainingRegular} dungeon{remainingRegular !== 1 ? "s" : ""}{" "}
              remaining
            </div>
          </div>
        )}

        {act === 1 && !act2Unlocked && allAct1RegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">??? — Act 2</div>
            <p className="dungeon-desc">
              Defeat the Bandit Chieftain to escape into the mountains and unlock Act 2.
            </p>
          </div>
        )}

        {act === 2 && !act3Unlocked && allAct2RegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">??? — Act 3</div>
            <p className="dungeon-desc">
              Defeat Sikktharkk to descend into the jungle and unlock Act 3.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
