export type ColumnId = 'backlog' | 'todo' | 'inProgress' | 'done';

export type TaskType = 'bug' | 'feature' | 'hotfix' | 'meeting' | 'absurd';

export interface TaskTemplate {
  title: string;
  type: TaskType;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  column: ColumnId;
  /** Max time (seconds) before the task "explodes" in backlog/todo */
  maxTime: number;
  /** Time remaining (seconds) before explosion */
  timeRemaining: number;
  /** Time needed in "In Progress" to complete (seconds) */
  workTime: number;
  /** Work progress (0 to workTime) */
  workProgress: number;
  /** Points awarded on completion */
  points: number;
  /** HP damage if the task expires */
  damage: number;
  /** Timestamp when task was created */
  createdAt: number;
  /** Whether the task is currently exploding (for animation) */
  exploding: boolean;
}

export type GamePhase = 'menu' | 'playing' | 'gameover';

export type EventType =
  | 'fridayDeploy'
  | 'investorCall'
  | 'coffeeBroken'
  | 'internPushed'
  | 'codeReview'
  | 'retro';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  duration: number; // seconds
  startedAt: number;
}

export interface GameEventTemplate {
  type: EventType;
  title: string;
  description: string;
  duration: number;
}

export interface DifficultyLevel {
  level: number;
  startTime: number; // seconds from game start
  spawnInterval: number; // seconds between spawns
  taskTypes: TaskType[];
  eventChance: number; // 0-1, chance per event check
}

export interface GameStats {
  tasksCompleted: number;
  tasksByType: Record<TaskType, number>;
  maxCombo: number;
  totalScore: number;
  survivalTime: number;
  eventsTriggered: number;
}
