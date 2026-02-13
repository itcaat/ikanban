import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Custom hook that drives the game loop using requestAnimationFrame.
 * Updates the game state every frame with delta time.
 */
export function useGameLoop() {
  const phase = useGameStore((s) => s.phase);
  const tickUpdate = useGameStore((s) => s.tickUpdate);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000; // Convert ms to seconds
      lastTimeRef.current = now;

      // Cap delta to prevent huge jumps (e.g. if tab was hidden)
      const clampedDelta = Math.min(delta, 0.1);
      tickUpdate(clampedDelta);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, tickUpdate]);
}
