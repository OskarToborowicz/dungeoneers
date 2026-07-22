import { supabase } from "../lib/supabase";
import type { SaveSlot } from "../game/storage";
import type { SaveGame } from "../game/types";

// One row per hero, per user. `user_id` defaults to auth.uid() in the DB and RLS
// restricts every row to its owner, so the client never sends the user id.
// See the SQL in the setup notes for the table + policy.
const TABLE = "game_saves";

interface Row {
  slot_id: string;
  save: SaveGame;
  last_played_at: number;
}

export async function fetchCloudSaves(): Promise<SaveSlot[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("slot_id, save, last_played_at");
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.slot_id,
    lastPlayedAt: r.last_played_at,
    save: r.save,
  }));
}

export async function upsertCloudSave(slot: SaveSlot): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      slot_id: slot.id,
      save: slot.save,
      last_played_at: slot.lastPlayedAt,
    },
    { onConflict: "user_id,slot_id" },
  );
  if (error) throw error;
}

export async function deleteCloudSave(slotId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("slot_id", slotId);
  if (error) throw error;
}
