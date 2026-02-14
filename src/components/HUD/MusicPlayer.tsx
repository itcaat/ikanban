import { useSyncExternalStore } from 'react';
import { audioEngine, TRACKS } from '../../engine/audioEngine';

export function MusicPlayer() {
  const { playing, trackIdx, ready } = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
  );

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {/* Equalizer bars */}
      <div className="flex items-end gap-[2px] h-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-neon-blue/80"
            style={{
              animation: playing ? `eq-bar 0.${4 + i * 2}s ease-in-out infinite alternate` : 'none',
              height: playing ? undefined : '3px',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Track name */}
      <span className="text-[10px] md:text-[11px] text-gray-400 font-mono whitespace-nowrap">
        {TRACKS[trackIdx].name}
      </span>

      {/* Play/Pause */}
      <button
        onClick={() => audioEngine.togglePlay()}
        disabled={!ready}
        className="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all cursor-pointer text-white text-xs"
        title={playing ? 'Пауза' : 'Играть'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Next */}
      <button
        onClick={() => audioEngine.next()}
        className="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all cursor-pointer text-white text-[10px]"
        title="Следующий трек"
      >
        ⏭
      </button>
    </div>
  );
}
