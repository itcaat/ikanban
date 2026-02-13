import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue mb-2">
          DOPAMINE PIT
        </h1>
        <p className="text-lg text-gray-400 font-mono">
          // kanban survivor
        </p>
      </motion.div>

      {/* Rules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-md w-full bg-bg-column/70 rounded-xl p-6 mb-8 border border-gray-800"
      >
        <h2 className="text-sm font-bold text-neon-blue mb-4 tracking-wider">
          КАК ИГРАТЬ
        </h2>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex gap-3">
            <span className="text-neon-yellow shrink-0">01</span>
            <span>
              Задачи прилетают в <b className="text-white">Backlog</b>. Перетаскивай их вправо по колонкам.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-neon-yellow shrink-0">02</span>
            <span>
              В <b className="text-neon-blue">In Progress</b> задача выполняется автоматически. Дождись заполнения прогресса.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-neon-yellow shrink-0">03</span>
            <span>
              Если таймер задачи истечёт -- она <b className="text-neon-red">взорвётся</b> и снимет HP.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-neon-yellow shrink-0">04</span>
            <span>
              Используй <b className="text-neon-orange">кофе</b> для ускорения. Выживи как можно дольше!
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
          <div>
            WIP-лимит: максимум 3 задачи в In Progress
          </div>
          <div className="mt-1">
            Combo: закрывай задачи подряд для множителя очков
          </div>
        </div>
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startGame}
        className="
          px-12 py-4 rounded-xl text-lg font-black tracking-wider
          bg-gradient-to-r from-neon-pink to-neon-purple
          text-white shadow-lg cursor-pointer
          hover:shadow-neon-pink/30 hover:shadow-xl
          transition-shadow duration-300
        "
      >
        НАЧАТЬ РАБОТУ
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-4 text-xs text-gray-600"
      >
        (Отказаться уже нельзя)
      </motion.p>
    </div>
  );
}
