import { supabase } from "../lib/supabase";
import type { GameMode } from "../game/types";

const TABLE = "spire_scores";

export interface SpireScore {
  mode: GameMode;
  floor: number;
  hero_name: string;
  class_id: string;
}

// Upsert the signed-in user's best floor for their mode. Called only on a new
// personal best, so the value is monotonic per device. RLS enforces ownership.
export async function submitSpireScore(score: SpireScore): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return; // not signed in — nothing to submit

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      mode: score.mode,
      floor: score.floor,
      hero_name: score.hero_name,
      class_id: score.class_id,
    },
    { onConflict: "user_id,mode" },
  );
  if (error) throw error;
}

// The single record holder per mode (top 1 for now). Public read — works even
// when signed out. Returns null per mode if there's no record yet.
export async function fetchTopSpireScores(): Promise<
  Record<GameMode, SpireScore | null>
> {
  const result: Record<GameMode, SpireScore | null> = {
    hardcore: null,
    softcore: null,
  };
  for (const mode of ["hardcore", "softcore"] as GameMode[]) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("mode, floor, hero_name, class_id")
      .eq("mode", mode)
      .order("floor", { ascending: false })
      .limit(1);
    if (error) throw error;
    result[mode] = (data?.[0] as SpireScore | undefined) ?? null;
  }
  return result;
}
