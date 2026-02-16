/**
 * Tournament = Friday 12:00 MSK (09:00 UTC) → next Friday 12:00 MSK (09:00 UTC)
 * tournament_id = the Friday date string, e.g. '2026-02-13'
 */

/** Offset in ms: tournament boundary is 09:00 UTC (12:00 MSK) */
const BOUNDARY_OFFSET_MS = 9 * 3600_000;

export function getCurrentTournamentId(): string {
  const now = new Date();
  // Shift time back by 9 hours so the "day boundary" aligns with 09:00 UTC
  const shifted = new Date(now.getTime() - BOUNDARY_OFFSET_MS);
  const day = shifted.getUTCDay(); // 0=Sun 1=Mon ... 5=Fri 6=Sat
  const diff = (day + 2) % 7; // days since last Friday
  const friday = new Date(shifted);
  friday.setUTCDate(shifted.getUTCDate() - diff);
  return friday.toISOString().slice(0, 10);
}

export function getTournamentDateRange(tournamentId: string) {
  const start = new Date(tournamentId + 'T09:00:00Z'); // Friday 09:00 UTC = 12:00 MSK
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

/** Format tournament dates for display: "13 Feb 12:00 – 20 Feb 12:00" */
export function formatTournamentRange(tournamentId: string): string {
  const { start, end } = getTournamentDateRange(tournamentId);
  const fmt = (d: Date) =>
    d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Moscow' });
  return `${fmt(start)} – ${fmt(end)}`;
}
