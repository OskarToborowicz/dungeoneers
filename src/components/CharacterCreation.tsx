import { useEffect, useState } from "react";
import { ClassIcon } from "./ClassIcon";
import { CharacterSprite } from "./sprites/CharacterSprite";
import { preloadAllMonsterAssets } from "./sprites/MonsterSprite";
import { CLASS_LIST } from "../game/data/classes";
import type { ClassId, GameMode } from "../game/types";

interface Props {
  onCreate: (name: string, classId: ClassId, mode: GameMode) => void;
  onBack: () => void;
}

export function CharacterCreation({ onCreate, onBack }: Props) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<ClassId>(CLASS_LIST[0].id);
  const [mode, setMode] = useState<GameMode>("hardcore");

  const selected = CLASS_LIST.find((c) => c.id === classId)!;

  // iOS Safari zooms in when focusing an input smaller than 16px (the name field
  // is 12px in landscape). On blur, briefly clamp maximum-scale to snap the zoom
  // back to 1, then restore so pinch-zoom still works elsewhere.
  function resetZoom() {
    const vp = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!vp) return;
    const original = vp.getAttribute("content") ?? "width=device-width, initial-scale=1";
    vp.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1",
    );
    setTimeout(() => vp.setAttribute("content", original), 350);
  }

  // Warm the whole bestiary cache during idle time on this screen so the first
  // fight never flashes. Non-blocking; runs once.
  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => preloadAllMonsterAssets());
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(preloadAllMonsterAssets, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="screen creation-screen">
      <h1 className="game-title">DIABOLO</h1>
      <p className="subtitle">Forge your hero and descend into darkness</p>

      <div className="creation-panel">
        <div className="class-list">
          {CLASS_LIST.map((c) => (
            <button
              key={c.id}
              className={`class-button ${classId === c.id ? "selected" : ""}`}
              onClick={() => setClassId(c.id)}
            >
              <ClassIcon classId={c.id} size={22} />
              {c.name}
            </button>
          ))}
        </div>

        <div className="class-detail">
          <div className="class-header">
            <div className="class-sprite-preview">
              <CharacterSprite
                classId={selected.id}
                size={56}
                state="idle"
                animated={false}
              />
            </div>
            <div className="class-header-text">
              <h2 className="class-detail-title">
                <ClassIcon classId={selected.id} size={30} />
                {selected.name}
              </h2>
              <p className="class-desc">{selected.description}</p>
            </div>
          </div>
          <div className="class-skills-grid">
            <div className="ability-box ability-box--compact">
              <strong>
                {selected.ability.name}
                {selected.ability.magic && (
                  <span className="spell-tag">
                    <svg width="11" height="11" viewBox="0 0 12 12">
                      <path
                        d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z"
                        fill="#88aaff"
                      />
                    </svg>
                    <div className="game-tooltip">
                      Scales with Magic Damage bonus
                    </div>
                  </span>
                )}
              </strong>
              <p>{selected.ability.short ?? selected.ability.description}</p>
            </div>

            {selected.ability2 && (
              <div className="ability-box ability-box--compact">
                <strong>
                  {selected.ability2.name}
                  {selected.ability2.magic && (
                    <span className="spell-tag">
                      <svg width="11" height="11" viewBox="0 0 12 12">
                        <path
                          d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z"
                          fill="#88aaff"
                        />
                      </svg>
                      <div className="game-tooltip">
                        Scales with Magic Damage bonus
                      </div>
                    </span>
                  )}
                </strong>
                <p>
                  {selected.ability2.short ?? selected.ability2.description}
                </p>
              </div>
            )}

            <div className="ability-box ability-box--compact passive-box">
              <strong>{selected.passive.name}</strong>
              <p>{selected.passive.short ?? selected.passive.description}</p>
            </div>

            {selected.passive2 && (
              <div className="ability-box ability-box--compact passive-box passive-locked">
                <strong>
                  {selected.passive2.name}{" "}
                  <span className="passive-lock-level">
                    (lv. {selected.passive2.levelRequirement})
                  </span>
                </strong>
                <p>
                  {selected.passive2.short ?? selected.passive2.description}
                </p>
              </div>
            )}

            {selected.passive3 && (
              <div className="ability-box ability-box--compact passive-box passive-locked">
                <strong>
                  {selected.passive3.name}{" "}
                  <span className="passive-lock-level">
                    (lv. {selected.passive3.levelRequirement})
                  </span>
                </strong>
                <p>
                  {selected.passive3.short ?? selected.passive3.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="creation-footer">
        <div className="mode-select">
          <button
            className={`mode-button${mode === "hardcore" ? " selected" : ""}`}
            onClick={() => setMode("hardcore")}
            title="Death is permanent"
          >
            <span className="mode-name">☠ Hardcore</span>
            <div className="game-tooltip">Death is permanent</div>
          </button>
          <button
            className={`mode-button${mode === "softcore" ? " selected" : ""}`}
            onClick={() => setMode("softcore")}
            title="Death costs 10% gold & XP"
          >
            <span className="mode-name">♻ Softcore</span>
            <div className="game-tooltip">Death costs 10% gold &amp; XP</div>
          </button>
        </div>
        <input
          className="name-input"
          placeholder="Enter your name"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
          onBlur={resetZoom}
        />
        <div className="creation-bottom-row">
          <button
            className="primary-button"
            disabled={name.trim().length === 0}
            onClick={() => onCreate(name.trim(), classId, mode)}
          >
            Begin Your Journey
          </button>
        </div>
        <button className="secondary-button creation-back" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}
