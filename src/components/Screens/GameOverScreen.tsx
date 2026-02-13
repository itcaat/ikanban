import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { formatTime } from '../../utils/scoring';
import { TASK_LABELS } from '../../data/tasks';
import type { TaskType } from '../../types';

export function GameOverScreen() {
  const stats = useGameStore((s) => s.stats);
  const score = useGameStore((s) => s.score);
  const resetGame = useGameStore((s) => s.resetGame);
  const startGame = useGameStore((s) => s.startGame);

  // Fun title based on score
  const getTitle = () => {
    if (score >= 500) return 'ЛЕГЕНДА ПРОДАКШЕНА';
    if (score >= 300) return 'СЕНЬОР-ВЫЖИВАЛЬЩИК';
    if (score >= 150) return 'МИДЛ В ОГНЕ';
    if (score >= 50) return 'ДЖУН НА СТАЖИРОВКЕ';
    return 'ПЕРВЫЙ ДЕНЬ — ПОСЛЕДНИЙ ДЕНЬ';
  };

  const getSubtitle = () => {
    if (score >= 500) return 'Тебя уже не сломать. Даже пятничный деплой.';
    if (score >= 300) return 'Менеджеры плачут от счастья.';
    if (score >= 150) return 'Неплохо, но бэклог победил.';
    if (score >= 50) return 'Хотя бы попытался...';
    return 'HR уже готовит оффер. На выход.';
  };

  const taskTypes: TaskType[] = ['bug', 'feature', 'hotfix', 'meeting', 'absurd'];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl md:text-5xl font-black text-neon-red mb-2">
          GAME OVER
        </h1>
        <p className="text-lg font-bold text-neon-pink">{getTitle()}</p>
        <p className="text-sm text-gray-400 mt-1">{getSubtitle()}</p>
      </motion.div>

      {/* Stats card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-sm w-full bg-bg-column/70 rounded-xl p-6 mb-6 border border-gray-800"
      >
        {/* Big score */}
        <div className="text-center mb-6">
          <div className="text-5xl font-black text-white tabular-nums">
            {score.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Финальный счёт
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-white">
              {formatTime(stats.survivalTime)}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">
              Время выживания
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-white">
              {stats.tasksCompleted}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">
              Задач закрыто
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-neon-pink">
              {stats.maxCombo}x
            </div>
            <div className="text-[10px] text-gray-500 uppercase">
              Макс. combo
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-neon-orange">
              {stats.eventsTriggered}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">
              Событий пережито
            </div>
          </div>
        </div>

        {/* Tasks by type breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            По типам
          </div>
          <div className="flex gap-2 flex-wrap">
            {taskTypes.map((type) => {
              const count = stats.tasksByType[type];
              if (count === 0) return null;
              return (
                <span
                  key={type}
                  className="text-xs px-2 py-1 rounded bg-gray-800/50 text-gray-300"
                >
                  {TASK_LABELS[type]}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4"
      >
        <button
          onClick={startGame}
          className="
            px-8 py-3 rounded-xl font-bold tracking-wider
            bg-gradient-to-r from-neon-pink to-neon-purple
            text-white cursor-pointer
            hover:scale-105 transition-transform
          "
        >
          ЕЩЁ РАЗ
        </button>
        <button
          onClick={resetGame}
          className="
            px-8 py-3 rounded-xl font-bold tracking-wider
            bg-gray-800 text-gray-300 cursor-pointer
            hover:bg-gray-700 transition-colors
          "
        >
          В МЕНЮ
        </button>
      </motion.div>
    </div>
  );
}
