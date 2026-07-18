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
