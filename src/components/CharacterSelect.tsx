import { useState } from "react";
import { ClassIcon } from "./ClassIcon";
import { CharacterSprite } from "./sprites/CharacterSprite";
import type { SaveSlot } from "../game/storage";
import { MAX_SAVE_SLOTS, encodeSaveCode } from "../game/storage";
import type { ClassId } from "../game/types";
import { isSoundMuted, toggleSoundMuted } from "../game/sound";

const CLASS_NAMES: Record<ClassId, string> = {
  barbarian: "Barbarian",
  necromancer: "Necromancer",
  sorceress: "Sorceress",
  amazon: "Huntress",
  paladin: "Paladin",
  druid: "Druid",
  assassin: "Assassin",
  monk: "Monk",
};

interface Props {
  slots: SaveSlot[];
  onSelect: (slotId: string) => void;
  onDelete: (slotId: string) => void;
  onNew: () => void;
  onImport: (code: string) => string | null;
}

export function CharacterSelect({
  slots,
  onSelect,
  onDelete,
  onNew,
  onImport,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [muted, setMuted] = useState(isSoundMuted());
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  async function handleCopy() {
    if (!exportCode) return;
    try {
      await navigator.clipboard.writeText(exportCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function handleImport() {
    const err = onImport(importText);
    if (err) {
      setImportError(err);
    } else {
      setImportOpen(false);
      setImportText("");
    }
  }

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
      <button
        className="sound-toggle-button"
        onClick={() => setMuted(toggleSoundMuted())}
        aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        title={muted ? "Unmute sounds" : "Mute sounds"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <div className="game-title">DIABOLO</div>
      <p className="subtitle">Select your hero</p>

      <div className="select-panel">
        {slots.length === 0 && (
          <p className="empty-note select-empty">
            No heroes yet. Create your first hero to begin.
          </p>
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
                  animated={false}
                  isUniqueWeapon={
                    equipment.weapon?.rarity === "very rare" ||
                    equipment.weapon?.rarity === "unique"
                  }
                  isUniqueOffHand={
                    equipment.shield?.rarity === "very rare" ||
                    equipment.shield?.rarity === "unique"
                  }
                />
              </div>
              <div className="hero-card-info">
                <div className="hero-card-name">
                  {character.name}
                  <span
                    className={`mode-badge ${character.mode === "softcore" ? "softcore" : "hardcore"}`}
                  >
                    {character.mode === "softcore" ? "SC" : "HC"}
                  </span>
                </div>
                <div className="hero-card-meta">
                  <ClassIcon classId={character.classId} size={13} />
                  {CLASS_NAMES[character.classId]} &middot; Level{" "}
                  {character.level}
                </div>
              </div>
              <div className="hero-card-actions">
                <button
                  className="export-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExportCode(encodeSaveCode(slot.save));
                    setCopied(false);
                  }}
                  title="Export hero (transfer code)"
                >
                  📤
                </button>
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

      <button
        className="transfer-open-button"
        onClick={() => {
          setImportOpen(true);
          setImportText("");
          setImportError(null);
        }}
        disabled={slots.length >= MAX_SAVE_SLOTS}
        style={{ marginTop: 10 }}
      >
        📥 Import Hero
      </button>

      {exportCode && (
        <div className="transfer-overlay" onClick={() => setExportCode(null)}>
          <div className="transfer-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="transfer-title">Export Hero</h3>
            <p className="transfer-hint">
              Copy this code and paste it on your other device via “Import Hero”.
            </p>
            <textarea
              className="transfer-textarea"
              readOnly
              value={exportCode}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="transfer-actions">
              <button className="primary-button" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                className="transfer-cancel-button"
                onClick={() => setExportCode(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="transfer-overlay" onClick={() => setImportOpen(false)}>
          <div className="transfer-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="transfer-title">Import Hero</h3>
            <p className="transfer-hint">
              Paste a hero code exported from another device. It's added as a new
              hero — your existing saves are untouched.
            </p>
            <textarea
              className="transfer-textarea"
              value={importText}
              placeholder="DIABOLO1:…"
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
            />
            {importError && <p className="transfer-error">{importError}</p>}
            <div className="transfer-actions">
              <button
                className="primary-button"
                disabled={!importText.trim()}
                onClick={handleImport}
              >
                Import
              </button>
              <button
                className="transfer-cancel-button"
                onClick={() => setImportOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
