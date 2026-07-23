import { DUNGEONS } from "../game/data/dungeons";
import { SPIRE_UNLOCK_LEVEL, WARDEN_INTERVAL } from "../game/data/spire";
import { CLASSES } from "../game/data/classes";
import type { GameMode, ClassId } from "../game/types";
import type { SpireScore } from "../services/spireLeaderboard";

// class_id in the leaderboard is a raw ClassId string ("amazon", "monk", …).
// Map it to the class's display name ("Huntress", "Monk", …); fall back to the
// raw id if it's somehow unknown (e.g. a class removed in a future version).
function classLabel(classId: string): string {
  return CLASSES[classId as ClassId]?.name ?? classId;
}

interface Props {
  clearedDungeons: string[];
  onStart: (dungeonId: string) => void;
  selectedAct: 1 | 2 | 3 | 4;
  onSelectAct: (act: 1 | 2 | 3 | 4) => void;
  characterLevel: number;
  spireHighestFloor: number;
  onStartSpire: (fromFloor: number) => void;
  spireTop: Record<GameMode, SpireScore | null> | null;
}

export function DungeonsTab({
  clearedDungeons,
  onStart,
  selectedAct,
  onSelectAct,
  characterLevel,
  spireHighestFloor,
  onStartSpire,
  spireTop,
}: Props) {
  // Resume continues from the floor after the highest one cleared — leaving the
  // Spire never forces a re-fight of a floor you already beat.
  const spireResumeFloor = spireHighestFloor + 1;
  const act1Regular = DUNGEONS.filter((d) => d.act === 1 && !d.endgame);
  const act1Endgame = DUNGEONS.filter((d) => d.act === 1 && d.endgame);
  const act2Regular = DUNGEONS.filter((d) => d.act === 2 && !d.endgame);
  const act2Endgame = DUNGEONS.filter((d) => d.act === 2 && d.endgame);
  const act3Regular = DUNGEONS.filter((d) => d.act === 3 && !d.endgame);
  const act3Endgame = DUNGEONS.filter((d) => d.act === 3 && d.endgame);
  const act4Regular = DUNGEONS.filter((d) => d.act === 4 && !d.endgame);
  const act4Endgame = DUNGEONS.filter((d) => d.act === 4 && d.endgame);

  const act2Unlocked = act1Endgame.every((d) => clearedDungeons.includes(d.id));
  const act3Unlocked = act2Endgame.every((d) => clearedDungeons.includes(d.id));
  const act4Unlocked = act3Endgame.every((d) => clearedDungeons.includes(d.id));

  const allAct1RegularCleared = act1Regular.every((d) => clearedDungeons.includes(d.id));
  const allAct2RegularCleared = act2Regular.every((d) => clearedDungeons.includes(d.id));
  const allAct3RegularCleared = act3Regular.every((d) => clearedDungeons.includes(d.id));
  const allAct4RegularCleared = act4Regular.every((d) => clearedDungeons.includes(d.id));

  const act = selectedAct;

  const regularDungeons =
    act === 1 ? act1Regular :
    act === 2 ? act2Regular :
    act === 3 ? act3Regular :
    act4Regular;

  const endgameDungeons =
    act === 1 ? act1Endgame :
    act === 2 ? act2Endgame :
    act === 3 ? act3Endgame :
    act4Endgame;

  const allRegularCleared =
    act === 1 ? allAct1RegularCleared :
    act === 2 ? allAct2RegularCleared :
    act === 3 ? allAct3RegularCleared :
    allAct4RegularCleared;

  const remainingRegular = regularDungeons.filter(
    (d) => !clearedDungeons.includes(d.id),
  ).length;

  const endgameLabel =
    act === 1 ? "STORM THE TOWN HALL" :
    act === 2 ? "FACE SIKKTHARKK" :
    act === 3 ? "FACE ZAM'KORO" :
    "FACE RELITH";

  const lockedHintName =
    act === 1 ? "??? — Bandit's Town Hall" :
    act === 2 ? "??? — The White Maw" :
    act === 3 ? "??? — Sacrificial Altar" :
    "??? — Throne of Endless Night";

  const lockedHintDesc =
    act === 1 ? "Clear all dungeons to reveal what lies beyond." :
    act === 2 ? "Clear all dungeons to face the Great Frozen Dragon." :
    act === 3 ? "Clear all dungeons to face Zam'Koro, the Loa of Endless Night." :
    "Clear all dungeons to face Relith, the Void Devourer.";

  return (
    <div className="tab-panel">
      {characterLevel >= SPIRE_UNLOCK_LEVEL && (
        <div className="spire-entry">
          <div className="spire-entry-head">
            <h3>The Eternal Spire</h3>
            <span className="spire-entry-record">
              Best: Floor {spireHighestFloor || 0}
            </span>
          </div>
          <p className="spire-entry-desc">
            Endless floors of ever-stronger foes. A Warden guards every{" "}
            {WARDEN_INTERVAL}th floor and offers a choice of spoils. Death here is
            as final as anywhere.
          </p>
          {spireTop && (spireTop.hardcore || spireTop.softcore) && (
            <div className="spire-leaderboard">
              <span className="spire-lb-title">🏆 World Record</span>
              {spireTop.hardcore && (
                <span className="spire-lb-row">
                  HC · Floor {spireTop.hardcore.floor} —{" "}
                  {spireTop.hardcore.hero_name} (
                  {classLabel(spireTop.hardcore.class_id)})
                </span>
              )}
              {spireTop.softcore && (
                <span className="spire-lb-row">
                  SC · Floor {spireTop.softcore.floor} —{" "}
                  {spireTop.softcore.hero_name} (
                  {classLabel(spireTop.softcore.class_id)})
                </span>
              )}
            </div>
          )}
          <div className="spire-entry-actions">
            <button className="spire-enter-btn" onClick={() => onStartSpire(1)}>
              Enter — Floor 1
            </button>
            {spireHighestFloor >= 1 && (
              <button
                className="spire-enter-btn"
                onClick={() => onStartSpire(spireResumeFloor)}
              >
                Resume — Floor {spireResumeFloor}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="dungeons-header">
        <h3>Dungeons</h3>
        {act2Unlocked && (
          <div className="act-selector">
            <button
              className={`act-tab${act === 1 ? " active" : ""}`}
              onClick={() => onSelectAct(1)}
            >
              Act I
            </button>
            <button
              className={`act-tab${act === 2 ? " active" : ""}`}
              onClick={() => onSelectAct(2)}
            >
              Act II
            </button>
            {act3Unlocked && (
              <button
                className={`act-tab${act === 3 ? " active" : ""}`}
                onClick={() => onSelectAct(3)}
              >
                Act III
              </button>
            )}
            {act4Unlocked && (
              <button
                className={`act-tab${act === 4 ? " active" : ""}`}
                onClick={() => onSelectAct(4)}
              >
                Act IV
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
            <div className="dungeon-name">??? — Act II</div>
            <p className="dungeon-desc">
              Defeat the Bandit Chieftain to escape into the mountains and unlock Act II.
            </p>
          </div>
        )}

        {act === 2 && !act3Unlocked && allAct2RegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">??? — Act III</div>
            <p className="dungeon-desc">
              Defeat Sikktharkk to descend into the jungle and unlock Act III.
            </p>
          </div>
        )}

        {act === 3 && !act4Unlocked && allAct3RegularCleared && (
          <div className="dungeon-card locked endgame-locked-hint">
            <div className="dungeon-name">??? — Act IV</div>
            <p className="dungeon-desc">
              Defeat Zam'Koro to tear the veil and unlock Act IV: Realm of the Endless Night.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
