import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

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
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          key={activeEvent.id}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className="px-6 py-3 rounded-lg border shadow-lg backdrop-blur-sm text-center"
            style={{
              borderColor: EVENT_COLORS[activeEvent.type] || '#fff',
              backgroundColor: `${EVENT_COLORS[activeEvent.type]}15`,
              boxShadow: `0 0 30px ${EVENT_COLORS[activeEvent.type]}30`,
            }}
          >
            <div
              className="text-sm font-black tracking-wider"
              style={{ color: EVENT_COLORS[activeEvent.type] }}
            >
              ⚡ {activeEvent.title}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {activeEvent.description}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
