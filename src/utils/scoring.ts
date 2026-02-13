/** Calculate score with combo multiplier */
export function calculateScore(basePoints: number, combo: number): number {
  const multiplier = 1 + Math.floor(combo / 3) * 0.5;
  return Math.round(basePoints * multiplier);
}

/** Get combo multiplier display text */
export function getComboMultiplier(combo: number): string {
  const multiplier = 1 + Math.floor(combo / 3) * 0.5;
  return `x${multiplier.toFixed(1)}`;
}

/** Format time in seconds to mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
