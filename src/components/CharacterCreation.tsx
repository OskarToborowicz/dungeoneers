import { useState } from "react";
import { ClassIcon } from "./ClassIcon";
import { CharacterSprite } from "./sprites/CharacterSprite";
import { CLASS_LIST } from "../game/data/classes";
import type { ClassId } from "../game/types";

interface Props {
  onCreate: (name: string, classId: ClassId) => void;
  onBack: () => void;
}

export function CharacterCreation({ onCreate, onBack }: Props) {
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<ClassId>(CLASS_LIST[0].id);

  const selected = CLASS_LIST.find((c) => c.id === classId)!;

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
              <CharacterSprite classId={selected.id} size={56} state="idle" />
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
              <strong>{selected.ability.name}{selected.ability.magic && <span className="spell-tag"><svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z" fill="#88aaff"/></svg><div className="game-tooltip">Scales with Magic Damage bonus</div></span>}</strong>
              <p>{selected.ability.short ?? selected.ability.description}</p>
            </div>

            {selected.ability2 && (
              <div className="ability-box ability-box--compact">
                <strong>{selected.ability2.name}{selected.ability2.magic && <span className="spell-tag"><svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 1 L6.7 4.5 L10 3 L7.5 5.8 L11 6 L7.5 6.2 L10 9 L6.7 7.5 L6 11 L5.3 7.5 L2 9 L4.5 6.2 L1 6 L4.5 5.8 L2 3 L5.3 4.5 Z" fill="#88aaff"/></svg><div className="game-tooltip">Scales with Magic Damage bonus</div></span>}</strong>
                <p>{selected.ability2.short ?? selected.ability2.description}</p>
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
                  <span className="passive-lock-level">(lv. {selected.passive2.levelRequirement})</span>
                </strong>
                <p>{selected.passive2.short ?? selected.passive2.description}</p>
              </div>
            )}

            {selected.passive3 && (
              <div className="ability-box ability-box--compact passive-box passive-locked">
                <strong>
                  {selected.passive3.name}{" "}
                  <span className="passive-lock-level">(lv. {selected.passive3.levelRequirement})</span>
                </strong>
                <p>{selected.passive3.short ?? selected.passive3.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="creation-footer">
        <input
          className="name-input"
          placeholder="Enter your name"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="creation-bottom-row">
          <button
            className="primary-button"
            disabled={name.trim().length === 0}
            onClick={() => onCreate(name.trim(), classId)}
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
