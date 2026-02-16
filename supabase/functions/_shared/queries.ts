import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface TopEntry {
  nickname: string;
  company: string | null;
  score: number;
}

/** Fetch top N players for a tournament (best score per player) */
export async function fetchTop(
  supabase: SupabaseClient,
  tournamentId: string,
  limit = 10,
): Promise<TopEntry[]> {
  const { data } = await supabase.rpc("get_tournament_top", {
    p_tournament_id: tournamentId,
    p_limit: limit,
  });
  return (data ?? []) as TopEntry[];
}

/** Count unique players in a tournament */
export async function countPlayers(
  supabase: SupabaseClient,
  tournamentId: string,
): Promise<number> {
  const { data } = await supabase.rpc("count_tournament_players", {
    p_tournament_id: tournamentId,
  });
  return (data as number) ?? 0;
}
