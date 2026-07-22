import { useRef, useState } from "react";
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
  onImport: (code: string) => Promise<string | null>;
  onOpenAuth: () => void;
  authAvailable: boolean;
  userEmail: string | null;
  onSignOut: () => void;
}

export function CharacterSelect({
  slots,
  onSelect,
  onDelete,
  onNew,
  onImport,
  onOpenAuth,
  authAvailable,
  userEmail,
  onSignOut,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [muted, setMuted] = useState(isSoundMuted());
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [exportName, setExportName] = useState("");
  const exportTextareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleCopy() {
    if (!exportCode) return;
    // Modern clipboard API only works in a secure context (https/localhost).
    // Over a LAN dev address or in an in-app webview it's blocked, so fall back
    // to selecting the textarea + execCommand, which works on plain http/mobile.
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportCode);
        setCopied(true);
        return;
      }
    } catch {
      /* fall through to legacy copy */
    }
    const ta = exportTextareaRef.current;
    if (ta) {
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      try {
        setCopied(document.execCommand("copy"));
        return;
      } catch {
        /* nothing more we can do */
      }
    }
    setCopied(false);
  }

  async function handleImport(codeArg?: string) {
    const code = codeArg ?? importText;
    const err = await onImport(code);
    if (err) {
      setImportError(err);
      if (codeArg) setImportText(codeArg);
    } else {
      setImportOpen(false);
      setImportText("");
    }
  }

  // File transfer — the reliable path on mobile, where programmatic clipboard is
  // blocked or silently no-ops. Export downloads the code as a .txt; import
  // reads a chosen file and imports its contents directly.
  function handleDownload() {
    if (!exportCode) return;
    const blob = new Blob([exportCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(exportName || "hero").replace(/[^\w-]+/g, "_")}-diabolo.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after an error
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    await handleImport(text);
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
                  onClick={async (e) => {
                    e.stopPropagation();
                    setCopied(false);
                    setExportName(character.name);
                    setExportCode(await encodeSaveCode(slot.save));
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

      {userEmail ? (
        <div className="account-row">
          <span className="account-email" title={userEmail}>
            ☁ {userEmail}
          </span>
          <button className="account-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      ) : authAvailable ? (
        <button
          className="transfer-open-button"
          onClick={onOpenAuth}
          style={{ marginTop: 10 }}
        >
          🔐 Sign In / Sign Up
        </button>
      ) : null}

      {exportCode && (
        <div className="transfer-overlay" onClick={() => setExportCode(null)}>
          <div className="transfer-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="transfer-title">Export Hero</h3>
            <p className="transfer-hint">
              Save the file (most reliable on phones) or copy the code, then use
              “Import Hero” on the other device.
            </p>
            <textarea
              ref={exportTextareaRef}
              className="transfer-textarea"
              readOnly
              value={exportCode}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="transfer-actions">
              <button className="primary-button" onClick={handleDownload}>
                Download file
              </button>
              <button className="transfer-cancel-button" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy code"}
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
              Load the exported file, or paste the code. It's added as a new
              hero — your existing saves are untouched.
            </p>
            <label className="transfer-file-button">
              Load from file…
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleImportFile}
                style={{ display: "none" }}
              />
            </label>
            <textarea
              className="transfer-textarea"
              value={importText}
              placeholder="…or paste code (DIABOLO2:…)"
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
                onClick={() => handleImport()}
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
