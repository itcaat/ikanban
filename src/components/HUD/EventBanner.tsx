import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { MusicPlayer } from './MusicPlayer';

const EVENT_COLORS: Record<string, string> = {
  fridayDeploy: '#ff3b3b',
  investorCall: '#ff9500',
  coffeeBroken: '#8e8e93',
  internPushed: '#ff3b3b',
  codeReview: '#bf5af2',
  retro: '#39ff14',
};

export function EventBanner() {
  const activeEvent = useGameStore((s) => s.activeEvent);

  return (
    <div className="flex-1 flex items-center justify-end md:justify-center min-w-0 mx-1 md:mx-4">
      <AnimatePresence initial={false} mode="wait">
        {activeEvent ? (
          <motion.div
            key={activeEvent.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5 md:gap-2.5 px-2.5 md:px-4 py-1 md:py-1.5 rounded-lg border text-center truncate"
            style={{
              borderColor: EVENT_COLORS[activeEvent.type] || '#fff',
              backgroundColor: `${EVENT_COLORS[activeEvent.type]}12`,
              boxShadow: `0 0 16px ${EVENT_COLORS[activeEvent.type]}20`,
            }}
          >
            <span
              className="text-[10px] md:text-xs font-black tracking-wider whitespace-nowrap"
              style={{ color: EVENT_COLORS[activeEvent.type] }}
            >
              ⚡ {activeEvent.title}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap hidden md:inline">
              {activeEvent.description}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MusicPlayer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
