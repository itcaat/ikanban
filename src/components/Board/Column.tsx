import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import type { Task, ColumnId } from '../../types';
import { COLUMN_TITLES } from '../../data/events';
import { TaskCard } from './TaskCard';
import { useGameStore } from '../../store/gameStore';

interface ColumnProps {
  id: ColumnId;
  tasks: Task[];
}

const COLUMN_HEADER_COLORS: Record<ColumnId, string> = {
  backlog: '#8e8e93',
  todo: '#ffe600',
  inProgress: '#00d4ff',
  done: '#39ff14',
};

export function Column({ id, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const activeEvent = useGameStore((s) => s.activeEvent);

  const isBlocked = id === 'inProgress' && activeEvent?.type === 'investorCall';

  const headerColor = COLUMN_HEADER_COLORS[id];
  const taskIds = tasks.map((t) => t.id);

  const wipLimit = id === 'inProgress' ? 3 : undefined;

  return (
    <div
      ref={setNodeRef}
      data-tutorial={id === 'backlog' ? 'col-backlog' : id === 'inProgress' ? 'col-inprogress' : undefined}
      className={`
        flex flex-col rounded-xl
        w-[75vw] min-w-[75vw] md:w-full md:min-w-0 md:flex-1
        snap-center md:snap-align-none
        border border-gray-800/60
        transition-all duration-200
        ${isOver ? 'ring-2 ring-neon-blue/50 bg-bg-column' : 'bg-bg-column/80'}
        ${isBlocked ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-3 md:py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: headerColor }}
          />
          <span
            className="text-xs font-bold tracking-wider"
            style={{ color: headerColor }}
          >
            {COLUMN_TITLES[id]}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {tasks.length}
          {wipLimit ? `/${wipLimit}` : ''}
        </span>
      </div>

      {/* Blocked overlay */}
      {isBlocked && (
        <div className="flex items-center justify-center py-4 text-xs text-red-400 font-bold">
          ЗАБЛОКИРОВАНО
        </div>
      )}

      {/* Tasks list */}
      <div className="flex-1 p-2.5 md:p-3.5 overflow-y-auto column-scroll">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && !isBlocked && (
          <div className="text-center text-gray-600 text-xs py-8">
            {id === 'backlog' ? 'Задачи скоро прилетят...' : 'Перетащи сюда'}
          </div>
        )}
      </div>
    </div>
  );
}
