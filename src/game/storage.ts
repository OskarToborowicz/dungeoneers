import type { Item, SaveGame } from "./types";
import { rollPotionSlots } from "./data/items";

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

// Belts predating the potion-slot rework carry `baseDefense` and no
// `potionSlots`. Convert them so old belts aren't dead weight.
function migrateBelt(item: Item): Item {
  if (item.slot !== "belt" || item.potionSlots != null) return item;
  const { baseDefense: _dropped, ...rest } = item;
  return { ...rest, potionSlots: rollPotionSlots(item.rarity) };
}

// Characters created before game modes existed were permadeath — default them
// to hardcore so `character.mode` is always defined.
function migrateSlot(slot: SaveSlot): SaveSlot {
  if (!slot.save) return slot;
  const save: SaveGame = {
    ...slot.save,
    equipment: slot.save.equipment?.belt
      ? { ...slot.save.equipment, belt: migrateBelt(slot.save.equipment.belt) }
      : slot.save.equipment,
    inventory: slot.save.inventory?.map(migrateBelt) ?? slot.save.inventory,
  };
  if (save.character && save.character.mode == null) {
    save.character = { ...save.character, mode: "hardcore" };
  }
  return { ...slot, save };
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
// A save is gzip-compressed then base64url-encoded to `DIABOLO2:<code>` so a
// player can move ONE hero between devices by copy-pasting. Compression matters:
// a full inventory is ~15k chars raw base64, which mobile long-press "select
// all" often copies only partially — the truncated paste then fails to decode.
// gzip shrinks it ~5-10×, small enough to copy reliably. base64url (no `+ / =`)
// survives mail/messenger mangling; whitespace is stripped on decode.
//
// Prefixes: `DIABOLO2:` = gzip, `DIABOLO1:` = legacy uncompressed (still read).

const SAVE_CODE_PREFIX = "DIABOLO1:";
const SAVE_CODE_PREFIX_GZ = "DIABOLO2:";

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  // Drop anything outside the base64/base64url alphabet — copy-paste on mobile
  // can smuggle in whitespace, NBSP, zero-width or formatting characters that
  // make atob throw "invalid characters". Then normalise base64url → base64.
  const cleaned = s.replace(/[^A-Za-z0-9+/=_-]/g, "");
  let t = cleaned.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function encodeSaveCode(save: SaveGame): Promise<string> {
  const json = JSON.stringify({ v: 1, save });
  const bytes = new TextEncoder().encode(json);
  try {
    return SAVE_CODE_PREFIX_GZ + bytesToB64url(gzip(bytes));
  } catch {
    // fall back
  }
  return SAVE_CODE_PREFIX + bytesToB64url(bytes);
}

// Throws with a descriptive error if the code is malformed / not a hero.
async function decodeToSave(code: string): Promise<SaveGame> {
  const trimmed = code.trim();
  if (!trimmed) throw new Error("empty code");

  let jsonBytes: Uint8Array;

  const upper = trimmed.toUpperCase();

  if (upper.startsWith(SAVE_CODE_PREFIX_GZ)) {
    const body = trimmed.slice(trimmed.indexOf(":") + 1);
    jsonBytes = ungzip(b64urlToBytes(body));
  } else if (upper.startsWith(SAVE_CODE_PREFIX)) {
    const body = trimmed.slice(trimmed.indexOf(":") + 1);
    jsonBytes = b64urlToBytes(body);
  } else {
    jsonBytes = b64urlToBytes(trimmed);
  }
  const parsed = JSON.parse(new TextDecoder().decode(jsonBytes));
  const save = (parsed?.save ?? parsed) as SaveGame;
  if (!save?.character?.classId || !save?.character?.name) {
    throw new Error("not a hero save");
  }
  return save;
}

// Decodes a code back to a SaveGame, or null if it's malformed / not a hero.
export async function decodeSaveCode(code: string): Promise<SaveGame | null> {
  try {
    return await decodeToSave(code);
  } catch {
    return null;
  }
}

// Imports a code as a NEW hero (fresh id, so it never overwrites an existing
// save). Returns the new slot id, or a descriptive error message.
export async function importSaveCode(
  code: string,
): Promise<{ id: string } | { error: string }> {
  try {
    return { id: createSave(await decodeToSave(code)) };
  } catch (e) {
    return {
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}
