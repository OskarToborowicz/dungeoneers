import { useState } from "react";
import { ClassIcon } from "./ClassIcon";
import { CharacterSprite } from "./sprites/CharacterSprite";
import { CLASS_LIST } from "../game/data/classes";
import type { ClassId } from "../game/types";

interface Props {
  onCreate: (name: string, classId: ClassId) => void;
}

export function CharacterCreation({ onCreate }: Props) {
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
          <div className="class-sprite-preview">
            <CharacterSprite classId={selected.id} size={56} state="idle" />
          </div>
          <h2 className="class-detail-title">
            <ClassIcon classId={selected.id} size={30} />
            {selected.name}
          </h2>
          <p className="class-desc">{selected.description}</p>
          <div className="ability-box ability-box--compact">
            <strong>{selected.ability.name}</strong>
            <p>{selected.ability.short ?? selected.ability.description}</p>
          </div>

          {selected.ability2 && (
            <div className="ability-box ability-box--compact">
              <strong>{selected.ability2.name}</strong>
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

      <input
        className="name-input"
        placeholder="Enter your name"
        value={name}
        maxLength={16}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        className="primary-button"
        disabled={name.trim().length === 0}
        onClick={() => onCreate(name.trim(), classId)}
      >
        Begin Your Journey
      </button>
    </div>
  );
}
