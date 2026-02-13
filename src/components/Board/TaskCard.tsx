import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Task, ColumnId } from '../../types';
import { TASK_COLORS, TASK_LABELS } from '../../data/tasks';
import { useGameStore } from '../../store/gameStore';

interface TaskCardProps {
  task: Task;
}

const NEXT_COLUMN: Partial<Record<ColumnId, ColumnId>> = {
  backlog: 'todo',
  todo: 'inProgress',
  inProgress: 'done',
};

export function TaskCard({ task }: TaskCardProps) {
  const moveTask = useGameStore((s) => s.moveTask);
  const canMoveToColumn = useGameStore((s) => s.canMoveToColumn);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const color = TASK_COLORS[task.type];
  const label = TASK_LABELS[task.type];

  // Timer percentage (for backlog/todo)
  const timerPercent =
    task.column !== 'inProgress' && task.column !== 'done'
      ? (task.timeRemaining / task.maxTime) * 100
      : 100;

  // Work progress percentage (for in-progress)
  const workPercent =
    task.column === 'inProgress'
      ? (task.workProgress / task.workTime) * 100
      : 0;

  const isUrgent = timerPercent < 30 && task.column !== 'done';
  const isDone = task.column === 'done';

  // Timer bar color: green -> yellow -> red
  const timerColor =
    timerPercent > 60 ? '#39ff14' : timerPercent > 30 ? '#ffe600' : '#ff3b3b';

  const mergedStyle = {
    ...style,
    backgroundColor: task.exploding ? 'rgba(255,59,59,0.3)' : '#1c1c2e',
    borderLeftColor: color,
  };

  // Quick advance logic
  const nextCol = NEXT_COLUMN[task.column];
  const canAdvance = nextCol ? canMoveToColumn(task.id, nextCol) : false;

  const handleAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (nextCol) {
      moveTask(task.id, nextCol);
    }
  };

  // Advance button labels
  const advanceLabels: Partial<Record<ColumnId, string>> = {
    backlog: 'TODO',
    todo: 'START',
    inProgress: 'DONE',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={mergedStyle}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={
        task.exploding
          ? {
              opacity: 0,
              scale: 1.5,
              rotate: [0, 5, -5, 10, -10, 0],
            }
          : isDone
            ? { opacity: 0.6, scale: 0.95, y: 0 }
            : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      transition={{ duration: task.exploding ? 0.4 : 0.3 }}
      className={`
        relative rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing
        border-l-4 select-none
        ${isUrgent && !task.exploding ? 'urgent-pulse' : ''}
        ${task.exploding ? '' : 'hover:brightness-125'}
      `}
    >
      {/* Type badge + advance button row */}
      <div className="flex items-center justify-between mb-2">
        <div
          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: color + '22', color }}
        >
          {label}
        </div>

        {/* Quick advance button */}
        {canAdvance && !isDone && !task.exploding && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleAdvance}
            className="
              text-[10px] font-bold px-2.5 py-0.5 rounded
              bg-white/10 text-white/80 hover:bg-white/20
              cursor-pointer transition-colors
            "
          >
            {advanceLabels[task.column]} &rarr;
          </button>
        )}
      </div>

      {/* Title */}
      <div className="text-sm font-medium text-gray-100 leading-snug mb-3">
        {task.title}
      </div>

      {/* Timer bar (backlog/todo) */}
      {(task.column === 'backlog' || task.column === 'todo') && (
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: timerColor }}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

      {/* Work progress bar (in progress) */}
      {task.column === 'inProgress' && (
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-neon-green"
            animate={{ width: `${workPercent}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        </div>
      )}

      {/* Work status for in-progress */}
      {task.column === 'inProgress' && task.workProgress < task.workTime && (
        <div className="text-[10px] text-neon-blue mt-1">
          Работаю... {Math.round(workPercent)}%
        </div>
      )}
      {task.column === 'inProgress' && task.workProgress >= task.workTime && (
        <div className="text-[10px] text-neon-green mt-1 font-bold">
          Готово! Перемести в DONE
        </div>
      )}

      {/* Done checkmark */}
      {isDone && (
        <div className="absolute top-2 right-2 text-neon-green text-lg">
          ✓
        </div>
      )}

      {/* Points */}
      <div className="text-[10px] text-gray-500 mt-2">
        +{task.points} pts
      </div>
    </motion.div>
  );
}
