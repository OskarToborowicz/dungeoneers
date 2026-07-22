import type { SaveGame } from "./types";

const SAVES_KEY = "diabolo-saves";
const LEGACY_KEY = "diabolo-save";

export interface SaveSlot {
  id: string;
  lastPlayedAt: number;
  save: SaveGame;
}

export const MAX_SAVE_SLOTS = 6;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function readSlots(): SaveSlot[] {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const legacySave = JSON.parse(legacy) as SaveGame;
      const slots: SaveSlot[] = [
        { id: generateId(), lastPlayedAt: Date.now(), save: legacySave },
      ];
      localStorage.setItem(SAVES_KEY, JSON.stringify(slots));
      localStorage.removeItem(LEGACY_KEY);
      return slots.map(migrateSlot);
    } catch {
      /* ignore corrupt legacy */
    }
  }

  const raw = localStorage.getItem(SAVES_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as SaveSlot[]).map(migrateSlot);
  } catch {
    return [];
  }
}

// Characters created before game modes existed were permadeath — default them
// to hardcore so `character.mode` is always defined.
function migrateSlot(slot: SaveSlot): SaveSlot {
  if (slot.save?.character && slot.save.character.mode == null) {
    return {
      ...slot,
      save: {
        ...slot.save,
        character: { ...slot.save.character, mode: "hardcore" },
      },
    };
  }
  return slot;
}

function writeSlots(slots: SaveSlot[]): void {
  localStorage.setItem(SAVES_KEY, JSON.stringify(slots));
}

export function getAllSaves(): SaveSlot[] {
  return readSlots().sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
}

export function getSave(id: string): SaveGame | null {
  return readSlots().find((s) => s.id === id)?.save ?? null;
}

export function writeSave(id: string, save: SaveGame): void {
  const slots = readSlots();
  const idx = slots.findIndex((s) => s.id === id);
  if (idx >= 0) {
    slots[idx] = { ...slots[idx], save, lastPlayedAt: Date.now() };
  } else {
    slots.push({ id, lastPlayedAt: Date.now(), save });
  }
  writeSlots(slots);
}

export function createSave(save: SaveGame): string {
  const id = generateId();
  const slots = readSlots();
  slots.push({ id, lastPlayedAt: Date.now(), save });
  writeSlots(slots);
  return id;
}

export function deleteSave(id: string): void {
  writeSlots(readSlots().filter((s) => s.id !== id));
}

// ── Single-character transfer (export/import a code string) ──────────────────
// A save is serialized to `DIABOLO1:<base64>` so a player can move ONE hero
// between devices (phone ↔ PC) by copy-pasting the code. UTF-8 safe (hero names
// may contain non-Latin1 characters), so btoa/atob go through TextEncoder.

const SAVE_CODE_PREFIX = "DIABOLO1:";

function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // base64url, no padding — survives copy through mail/messengers/URLs, which
  // otherwise wrap long lines or mangle standard base64's `+` `/` `=`.
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64(b64: string): string {
  // Tolerate whitespace/line-wraps added in transit and accept both base64url
  // (new codes) and standard base64 (older codes), then re-pad for atob.
  let s = b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSaveCode(save: SaveGame): string {
  return SAVE_CODE_PREFIX + toBase64(JSON.stringify({ v: 1, save }));
}

// Decodes a code back to a SaveGame, or null if it's malformed / not a hero.
export function decodeSaveCode(code: string): SaveGame | null {
  const trimmed = code.trim();
  const body = trimmed.startsWith(SAVE_CODE_PREFIX)
    ? trimmed.slice(SAVE_CODE_PREFIX.length)
    : trimmed;
  try {
    const parsed = JSON.parse(fromBase64(body));
    const save = (parsed?.save ?? parsed) as SaveGame;
    if (!save?.character?.classId || !save?.character?.name) return null;
    return save;
  } catch {
    return null;
  }
}

// Imports a code as a NEW hero (fresh id, so it never overwrites an existing
// save). Returns the new slot id, or null if the code is invalid.
export function importSaveCode(code: string): string | null {
  const save = decodeSaveCode(code);
  if (!save) return null;
  return createSave(save);
}
