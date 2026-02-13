import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export function HealthBar() {
  const hp = useGameStore((s) => s.hp);
  const maxHp = useGameStore((s) => s.maxHp);
  const percent = (hp / maxHp) * 100;

  const color =
    percent > 60 ? '#39ff14' : percent > 30 ? '#ffe600' : '#ff3b3b';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-gray-400 w-6">HP</span>
      <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums w-8"
        style={{ color }}
      >
        {Math.ceil(hp)}
      </span>
    </div>
  );
}
