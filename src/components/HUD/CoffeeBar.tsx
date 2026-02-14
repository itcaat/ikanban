import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export function CoffeeBar() {
  const coffee = useGameStore((s) => s.coffee);
  const maxCoffee = useGameStore((s) => s.maxCoffee);
  const useCoffee = useGameStore((s) => s.useCoffee);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const percent = (coffee / maxCoffee) * 100;

  const isBroken = activeEvent?.type === 'coffeeBroken';
  const canUse = coffee >= 20 && !isBroken;

  return (
    <div className="flex items-center gap-1.5 md:gap-2" data-tutorial="hud-coffee">
      <button
        onClick={useCoffee}
        disabled={!canUse}
        className={`
          text-sm px-2 md:px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 md:gap-1.5
          ${canUse
            ? 'bg-neon-orange/20 text-neon-orange hover:bg-neon-orange/30 cursor-pointer active:scale-95'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
        `}
        title="Ускорить задачи в In Progress (−20 кофе)"
      >
        <span>☕</span>
      </button>
      <div className="w-16 md:w-24 h-3.5 md:h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: isBroken ? '#555' : '#ff9500' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums">
        {Math.ceil(coffee)}
      </span>
    </div>
  );
}
