import { create } from 'zustand';
import type {
  Task,
  ColumnId,
  GamePhase,
  GameEvent,
  GameStats,
  TaskType,
  PlayerRole,
} from '../types';
import { TASK_CONFIG, getTasksForRole } from '../data/tasks';
import { EVENT_TEMPLATES, INTERN_HOTFIX_TITLES } from '../data/events';
import { calculateScore } from '../utils/scoring';

let taskIdCounter = 0;
function nextTaskId(): string {
  return `task-${++taskIdCounter}`;
}

let eventIdCounter = 0;
function nextEventId(): string {
  return `event-${++eventIdCounter}`;
}

const WIP_LIMIT = 3;

const COLUMN_ORDER: ColumnId[] = ['backlog', 'todo', 'inProgress', 'done'];

interface GameState {
  // Core
  phase: GamePhase;
  role: PlayerRole;
  gameTime: number; // seconds since game start
  lastTickTime: number;

  // Player resources
  hp: number;
  maxHp: number;
  coffee: number;
  maxCoffee: number;
  score: number;
  combo: number;

  // Tasks
  tasks: Task[];

  // Events
  activeEvent: GameEvent | null;
  screenShake: boolean;

  // Stats
  stats: GameStats;

  // Difficulty
  difficultyLevel: number;
  spawnTimer: number;
  eventTimer: number;

  // Actions
  startGame: (role: PlayerRole) => void;
  resetGame: () => void;

  // Task actions
  spawnTask: () => void;
  moveTask: (taskId: string, targetColumn: ColumnId) => boolean;
  tickUpdate: (deltaSeconds: number) => void;
  removeTask: (taskId: string) => void;
  useCoffee: () => void;

  // Event actions
  triggerRandomEvent: () => void;
  clearEvent: () => void;
  setScreenShake: (v: boolean) => void;

  // Helpers
  getTasksInColumn: (column: ColumnId) => Task[];
  canMoveToColumn: (taskId: string, targetColumn: ColumnId) => boolean;
}

const initialStats: GameStats = {
  tasksCompleted: 0,
  tasksByType: { bug: 0, feature: 0, hotfix: 0, meeting: 0, absurd: 0 },
  maxCombo: 0,
  totalScore: 0,
  survivalTime: 0,
  eventsTriggered: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  role: 'frontend' as PlayerRole,
  gameTime: 0,
  lastTickTime: 0,

  hp: 100,
  maxHp: 100,
  coffee: 100,
  maxCoffee: 100,
  score: 0,
  combo: 0,

  tasks: [],

  activeEvent: null,
  screenShake: false,

  stats: { ...initialStats },

  difficultyLevel: 1,
  spawnTimer: 0,
  eventTimer: 30,

  startGame: (role: PlayerRole) => {
    taskIdCounter = 0;
    eventIdCounter = 0;
    set({
      phase: 'playing',
      role,
      gameTime: 0,
      lastTickTime: performance.now() / 1000,
      hp: 100,
      coffee: 100,
      score: 0,
      combo: 0,
      tasks: [],
      activeEvent: null,
      screenShake: false,
      stats: { ...initialStats, tasksByType: { bug: 0, feature: 0, hotfix: 0, meeting: 0, absurd: 0 } },
      difficultyLevel: 1,
      spawnTimer: 1.5,
      eventTimer: 30,
    });
  },

  resetGame: () => {
    taskIdCounter = 0;
    eventIdCounter = 0;
    set({
      phase: 'menu',
      gameTime: 0,
      hp: 100,
      coffee: 100,
      score: 0,
      combo: 0,
      tasks: [],
      activeEvent: null,
      screenShake: false,
      stats: { ...initialStats, tasksByType: { bug: 0, feature: 0, hotfix: 0, meeting: 0, absurd: 0 } },
      difficultyLevel: 1,
      spawnTimer: 0,
      eventTimer: 15,
    });
  },

  spawnTask: () => {
    const state = get();
    const level = state.difficultyLevel;

    // Determine available task types based on level
    let availableTypes: TaskType[];
    if (level <= 1) {
      availableTypes = ['bug', 'feature', 'meeting'];
    } else if (level <= 2) {
      availableTypes = ['bug', 'feature', 'meeting', 'hotfix'];
    } else {
      availableTypes = ['bug', 'feature', 'meeting', 'hotfix', 'absurd'];
    }

    // Get role-specific tasks, then filter by available types
    const roleTasks = getTasksForRole(state.role);
    const existingTitles = new Set(state.tasks.map((t) => t.title));
    const templates = roleTasks.filter((t) =>
      availableTypes.includes(t.type)
    );
    const freshTemplates = templates.filter((t) => !existingTitles.has(t.title));
    const pool = freshTemplates.length > 0 ? freshTemplates : templates;
    const template = pool[Math.floor(Math.random() * pool.length)];
    const config = TASK_CONFIG[template.type];

    // Scale difficulty: reduce timers at higher levels
    const timeMultiplier = Math.max(0.5, 1 - (level - 1) * 0.1);

    const task: Task = {
      id: nextTaskId(),
      title: template.title,
      type: template.type,
      column: 'backlog',
      maxTime: Math.round(config.maxTime * timeMultiplier),
      timeRemaining: Math.round(config.maxTime * timeMultiplier),
      workTime: config.workTime,
      workProgress: 0,
      points: config.points,
      damage: config.damage,
      createdAt: state.gameTime,
      exploding: false,
    };

    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  moveTask: (taskId: string, targetColumn: ColumnId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    // Validate move
    if (!state.canMoveToColumn(taskId, targetColumn)) return false;

    // Check WIP limit for inProgress
    if (targetColumn === 'inProgress') {
      const inProgressCount = state.tasks.filter(
        (t) => t.column === 'inProgress'
      ).length;
      if (inProgressCount >= WIP_LIMIT) return false;

      // Check if investor call is blocking
      if (
        state.activeEvent?.type === 'investorCall'
      ) return false;
    }

    // Moving to done = completing
    if (targetColumn === 'done') {
      // Task must have finished work progress
      if (task.column === 'inProgress' && task.workProgress < task.workTime) {
        return false;
      }
      const earned = calculateScore(task.points, state.combo);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, column: 'done' } : t
        ),
        score: s.score + earned,
        combo: s.combo + 1,
        stats: {
          ...s.stats,
          tasksCompleted: s.stats.tasksCompleted + 1,
          tasksByType: {
            ...s.stats.tasksByType,
            [task.type]: s.stats.tasksByType[task.type] + 1,
          },
          maxCombo: Math.max(s.stats.maxCombo, s.combo + 1),
          totalScore: s.stats.totalScore + earned,
        },
      }));
      // Remove from board after a short delay (handled by animation)
      setTimeout(() => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== taskId),
        }));
      }, 600);
      return true;
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, column: targetColumn } : t
      ),
    }));
    return true;
  },

  canMoveToColumn: (taskId: string, targetColumn: ColumnId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const currentIdx = COLUMN_ORDER.indexOf(task.column);
    const targetIdx = COLUMN_ORDER.indexOf(targetColumn);

    // Can only move one step forward
    if (targetIdx !== currentIdx + 1) return false;

    // WIP limit check
    if (targetColumn === 'inProgress') {
      const inProgressCount = state.tasks.filter(
        (t) => t.column === 'inProgress'
      ).length;
      if (inProgressCount >= WIP_LIMIT) return false;
      if (state.activeEvent?.type === 'investorCall') return false;
    }

    // Must be done working to move to done
    if (targetColumn === 'done') {
      if (task.workProgress < task.workTime) return false;
    }

    return true;
  },

  tickUpdate: (deltaSeconds: number) => {
    const state = get();
    if (state.phase !== 'playing') return;

    const newGameTime = state.gameTime + deltaSeconds;

    // Determine active event modifiers
    const isFridayDeploy = state.activeEvent?.type === 'fridayDeploy';
    const isRetro = state.activeEvent?.type === 'retro';
    const isCoffeeBroken = state.activeEvent?.type === 'coffeeBroken';
    const isInvestorCall = state.activeEvent?.type === 'investorCall';

    const timerMultiplier = isFridayDeploy ? 2 : isRetro ? 0.5 : 1;

    // Update tasks
    let hpDamage = 0;
    const explodingIds: string[] = [];

    const updatedTasks = state.tasks.map((task) => {
      if (task.column === 'done' || task.exploding) return task;

      // In Progress: advance work progress (if not blocked by investor)
      if (task.column === 'inProgress') {
        if (isInvestorCall) return task;
        const newProgress = task.workProgress + deltaSeconds;
        return { ...task, workProgress: Math.min(newProgress, task.workTime) };
      }

      // Backlog / Todo: countdown timer
      const timeDeduction = deltaSeconds * timerMultiplier;
      const newTimeRemaining = task.timeRemaining - timeDeduction;

      if (newTimeRemaining <= 0) {
        hpDamage += task.damage;
        explodingIds.push(task.id);
        return { ...task, timeRemaining: 0, exploding: true };
      }

      return { ...task, timeRemaining: newTimeRemaining };
    });

    // Remove exploding tasks after animation
    if (explodingIds.length > 0) {
      setTimeout(() => {
        set((s) => ({
          tasks: s.tasks.filter((t) => !explodingIds.includes(t.id)),
        }));
      }, 500);
    }

    // Coffee regeneration
    let newCoffee = state.coffee;
    if (!isCoffeeBroken) {
      newCoffee = Math.min(state.maxCoffee, state.coffee + deltaSeconds * 3);
    }

    // Calculate difficulty level
    let newLevel = 1;
    if (newGameTime >= 180) newLevel = 4;
    else if (newGameTime >= 120) newLevel = 3;
    else if (newGameTime >= 60) newLevel = 2;

    // Check for spawn
    let newSpawnTimer = state.spawnTimer - deltaSeconds;
    if (newSpawnTimer <= 0) {
      // Spawn a task
      setTimeout(() => get().spawnTask(), 0);
      // Reset spawn timer based on difficulty
      const spawnIntervals = [5, 3.5, 2.5, 1.2];
      newSpawnTimer = spawnIntervals[newLevel - 1] || 1.2;
    }

    // Check for events
    let newEventTimer = state.eventTimer - deltaSeconds;
    if (newEventTimer <= 0 && !state.activeEvent) {
      setTimeout(() => get().triggerRandomEvent(), 0);
      newEventTimer = 25 + Math.random() * 20; // 25-45s
    }

    // Clear expired event
    let activeEvent = state.activeEvent;
    if (
      activeEvent &&
      activeEvent.duration > 0 &&
      newGameTime - activeEvent.startedAt >= activeEvent.duration
    ) {
      activeEvent = null;
    }

    // Apply damage & check game over
    const newHp = Math.max(0, state.hp - hpDamage);
    const newCombo = hpDamage > 0 ? 0 : state.combo; // Reset combo on damage

    if (newHp <= 0) {
      set({
        phase: 'gameover',
        hp: 0,
        tasks: updatedTasks,
        combo: 0,
        stats: {
          ...state.stats,
          survivalTime: newGameTime,
          totalScore: state.score,
        },
      });
      return;
    }

    set({
      gameTime: newGameTime,
      tasks: updatedTasks,
      hp: newHp,
      coffee: newCoffee,
      combo: newCombo,
      difficultyLevel: newLevel,
      spawnTimer: newSpawnTimer,
      eventTimer: newEventTimer,
      activeEvent,
      screenShake: hpDamage > 0 ? true : state.screenShake,
      stats: {
        ...state.stats,
        survivalTime: newGameTime,
      },
    });

    // Clear screen shake
    if (hpDamage > 0) {
      setTimeout(() => set({ screenShake: false }), 500);
    }
  },

  removeTask: (taskId: string) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
  },

  useCoffee: () => {
    const state = get();
    if (state.coffee < 20) return;

    // Boost work progress of all in-progress tasks
    set((s) => ({
      coffee: s.coffee - 20,
      tasks: s.tasks.map((t) =>
        t.column === 'inProgress'
          ? { ...t, workProgress: Math.min(t.workProgress + 2, t.workTime) }
          : t
      ),
    }));
  },

  triggerRandomEvent: () => {
    const state = get();
    if (state.activeEvent) return;

    const template =
      EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];

    const event: GameEvent = {
      id: nextEventId(),
      type: template.type,
      title: template.title,
      description: template.description,
      duration: template.duration,
      startedAt: state.gameTime,
    };

    // Apply instant effects
    if (template.type === 'internPushed') {
      // Spawn 3 role-appropriate hotfixes
      const hotfixTitles = INTERN_HOTFIX_TITLES[state.role];
      for (let i = 0; i < 3; i++) {
        const config = TASK_CONFIG.hotfix;
        const task: Task = {
          id: nextTaskId(),
          title: hotfixTitles[i],
          type: 'hotfix',
          column: 'backlog',
          maxTime: config.maxTime,
          timeRemaining: config.maxTime,
          workTime: config.workTime,
          workProgress: 0,
          points: config.points,
          damage: config.damage,
          createdAt: state.gameTime,
          exploding: false,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
      }
      // Show event briefly then clear
      set({
        activeEvent: event,
        screenShake: true,
        stats: { ...state.stats, eventsTriggered: state.stats.eventsTriggered + 1 },
      });
      setTimeout(() => set({ activeEvent: null, screenShake: false }), 2000);
      return;
    }

    if (template.type === 'codeReview') {
      // Move a random task from done-ish area back to todo
      // (Since done tasks auto-remove, pick a random inProgress task and send to todo)
      const inProgressTasks = state.tasks.filter(
        (t) => t.column === 'inProgress'
      );
      if (inProgressTasks.length > 0) {
        const target =
          inProgressTasks[Math.floor(Math.random() * inProgressTasks.length)];
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === target.id
              ? { ...t, column: 'todo' as ColumnId, workProgress: 0 }
              : t
          ),
        }));
      }
      set({
        activeEvent: event,
        screenShake: true,
        stats: { ...state.stats, eventsTriggered: state.stats.eventsTriggered + 1 },
      });
      setTimeout(() => set({ activeEvent: null, screenShake: false }), 2000);
      return;
    }

    set({
      activeEvent: event,
      screenShake: true,
      stats: { ...state.stats, eventsTriggered: state.stats.eventsTriggered + 1 },
    });
    setTimeout(() => set({ screenShake: false }), 500);
  },

  clearEvent: () => set({ activeEvent: null }),

  setScreenShake: (v: boolean) => set({ screenShake: v }),

  getTasksInColumn: (column: ColumnId) => {
    return get().tasks.filter((t) => t.column === column);
  },
}));
