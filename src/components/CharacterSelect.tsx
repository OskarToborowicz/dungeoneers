import { useState } from "react";
import { ClassIcon } from "./ClassIcon";
import { CharacterSprite } from "./sprites/CharacterSprite";
import type { SaveSlot } from "../game/storage";
import { MAX_SAVE_SLOTS } from "../game/storage";
import type { ClassId } from "../game/types";

const CLASS_NAMES: Record<ClassId, string> = {
  barbarian: "Barbarian",
  necromancer: "Necromancer",
  sorceress: "Sorceress",
  amazon: "Amazon",
  paladin: "Paladin",
  druid: "Druid",
  assassin: "Assasin",
  monk: "Monk"
};

interface Props {
  slots: SaveSlot[];
  onSelect: (slotId: string) => void;
  onDelete: (slotId: string) => void;
  onNew: () => void;
}

export function CharacterSelect({ slots, onSelect, onDelete, onNew }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  }

  return (
    <div className="screen select-screen">
      <div className="game-title">DIABOLO</div>
      <p className="subtitle">Select your hero</p>

      <div className="select-panel">
        {slots.length === 0 && (
          <p className="empty-note select-empty">No heroes yet. Create your first hero to begin.</p>
        )}
        {slots.map((slot) => {
          const { character, equipment } = slot.save;
          const isConfirm = confirmId === slot.id;
          return (
            <div
              key={slot.id}
              className={`hero-card${isConfirm ? " confirming" : ""}`}
              onClick={() => !isConfirm && onSelect(slot.id)}
              onMouseLeave={() => setConfirmId(null)}
            >
              <div className="hero-card-sprite">
                <CharacterSprite
                  classId={character.classId}
                  size={32}
                  state="idle"
                  isUnique={equipment.weapon?.rarity === "very rare" || equipment.weapon?.rarity === "unique"}
                />
              </div>
              <div className="hero-card-info">
                <div className="hero-card-name">{character.name}</div>
                <div className="hero-card-meta">
                  <ClassIcon classId={character.classId} size={13} />
                  {CLASS_NAMES[character.classId]} &middot; Level {character.level}
                </div>
              </div>
              <div className="hero-card-actions">
                {isConfirm ? (
                  <button
                    className="delete-confirm-button"
                    onClick={(e) => handleDeleteClick(e, slot.id)}
                  >
                    Delete?
                  </button>
                ) : (
                  <button
                    className="delete-button"
                    onClick={(e) => handleDeleteClick(e, slot.id)}
                    title="Delete hero"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="primary-button"
        onClick={onNew}
        disabled={slots.length >= MAX_SAVE_SLOTS}
        style={{ marginTop: 24 }}
      >
        {slots.length >= MAX_SAVE_SLOTS
          ? `Hero Limit Reached (${MAX_SAVE_SLOTS})`
          : "Create New Hero"}
      </button>
    </div>
  );
}
