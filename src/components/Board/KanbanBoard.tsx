import { useCallback } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core';
import { useGameStore } from '../../store/gameStore';
import type { ColumnId } from '../../types';
import { Column } from './Column';

const COLUMNS: ColumnId[] = ['backlog', 'todo', 'inProgress', 'done'];

export function KanbanBoard() {
  const tasks = useGameStore((s) => s.tasks);
  const moveTask = useGameStore((s) => s.moveTask);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;

      // Determine target column from the droppable area
      let targetColumn: ColumnId | null = null;

      // Check if dropped over a column directly
      if (COLUMNS.includes(over.id as ColumnId)) {
        targetColumn = over.id as ColumnId;
      } else {
        // Dropped over another task - find which column that task is in
        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask) {
          targetColumn = overTask.column;
        }
      }

      if (targetColumn) {
        moveTask(taskId, targetColumn);
      }
    },
    [tasks, moveTask]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback during drag handled by Column isOver
  }, []);

  const columnTasks = COLUMNS.map((col) =>
    tasks.filter((t) => t.column === col)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-3 h-full px-4 pb-4 overflow-x-auto">
        {COLUMNS.map((col, i) => (
          <Column key={col} id={col} tasks={columnTasks[i]} />
        ))}
      </div>
    </DndContext>
  );
}
