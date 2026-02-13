import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { getComboMultiplier, formatTime } from '../../utils/scoring';

export function ScoreDisplay() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const gameTime = useGameStore((s) => s.gameTime);
  const difficultyLevel = useGameStore((s) => s.difficultyLevel);

  const multiplier = getComboMultiplier(combo);
  const showCombo = combo >= 3;

  return (
    <div className="flex items-center gap-4">
      {/* Score */}
      <div className="text-right">
        <motion.div
          key={score}
          initial={{ scale: 1.3, color: '#39ff14' }}
          animate={{ scale: 1, color: '#e0e0e0' }}
          className="text-xl font-bold tabular-nums"
        >
          {score.toLocaleString()}
        </motion.div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
          Score
        </div>
      </div>

      {/* Combo */}
      <AnimatePresence>
        {showCombo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.div
              key={combo}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="text-lg font-black text-neon-pink"
            >
              {combo}
            </motion.div>
            <div className="text-[10px] text-neon-pink/70">
              COMBO {multiplier}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer & Level */}
      <div className="text-right">
        <div className="text-sm font-mono text-gray-300 tabular-nums">
          {formatTime(gameTime)}
        </div>
        <div className="text-[10px] text-gray-500">
          LVL {difficultyLevel}
        </div>
      </div>
    </div>
  );
}
