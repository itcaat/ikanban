import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import {
  IDLE_MESSAGES,
  TASK_SPAWN_REACTIONS,
  EXPLOSION_REACTIONS,
  COMPLETE_REACTIONS,
  EVENT_REACTIONS,
  COMBO_REACTIONS,
  LOW_HP_REACTIONS,
} from '../../data/chat';

interface ChatMessage {
  id: number;
  text: string;
  timestamp: number; // gameTime
}

let msgIdCounter = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTaskCountRef = useRef(0);
  const prevComboRef = useRef(0);
  const prevHpRef = useRef(100);
  const prevEventRef = useRef<string | null>(null);
  const idleTimerRef = useRef(0);
  const recentTexts = useRef<Set<string>>(new Set());

  const role = useGameStore((s) => s.role);
  const gameTime = useGameStore((s) => s.gameTime);
  const tasks = useGameStore((s) => s.tasks);
  const combo = useGameStore((s) => s.combo);
  const hp = useGameStore((s) => s.hp);
  const activeEvent = useGameStore((s) => s.activeEvent);
  const phase = useGameStore((s) => s.phase);
  const stats = useGameStore((s) => s.stats);

  const addMessage = useCallback(
    (text: string) => {
      // Avoid duplicate messages
      if (recentTexts.current.has(text)) return;
      recentTexts.current.add(text);
      // Keep recent set small
      if (recentTexts.current.size > 20) {
        const first = recentTexts.current.values().next().value;
        if (first) recentTexts.current.delete(first);
      }

      const msg: ChatMessage = {
        id: ++msgIdCounter,
        text,
        timestamp: gameTime,
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        // Keep max 50 messages
        return next.length > 50 ? next.slice(-50) : next;
      });
    },
    [gameTime]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset on game start
  useEffect(() => {
    if (phase === 'playing') {
      msgIdCounter = 0;
      setMessages([]);
      recentTexts.current.clear();
      prevTaskCountRef.current = 0;
      prevComboRef.current = 0;
      prevHpRef.current = 100;
      prevEventRef.current = null;
      idleTimerRef.current = 0;
    }
  }, [phase]);

  // React to game state changes
  useEffect(() => {
    if (phase !== 'playing') return;

    const taskCount = tasks.filter((t) => t.column === 'backlog').length;
    const explodingCount = tasks.filter((t) => t.exploding).length;

    // New task spawned in backlog
    if (taskCount > prevTaskCountRef.current && Math.random() < 0.5) {
      addMessage(pickRandom(TASK_SPAWN_REACTIONS));
    }
    prevTaskCountRef.current = taskCount;

    // Task exploded
    if (explodingCount > 0 && Math.random() < 0.7) {
      addMessage(pickRandom(EXPLOSION_REACTIONS));
    }

    // Task completed (combo increased)
    if (combo > prevComboRef.current) {
      if (combo >= 5 && Math.random() < 0.6) {
        addMessage(pickRandom(COMBO_REACTIONS));
      } else if (Math.random() < 0.4) {
        addMessage(pickRandom(COMPLETE_REACTIONS));
      }
    }
    prevComboRef.current = combo;

    // Low HP
    if (hp < 30 && prevHpRef.current >= 30) {
      addMessage(pickRandom(LOW_HP_REACTIONS));
    } else if (hp < 15 && prevHpRef.current >= 15) {
      addMessage(pickRandom(LOW_HP_REACTIONS));
    }
    prevHpRef.current = hp;

    // Event triggered
    const eventType = activeEvent?.type ?? null;
    if (eventType && eventType !== prevEventRef.current) {
      const reactions = EVENT_REACTIONS[eventType];
      if (reactions) {
        addMessage(pickRandom(reactions));
        // Often send a second panicked reaction with delay
        if (Math.random() < 0.6) {
          setTimeout(() => {
            addMessage(pickRandom(reactions));
          }, 1500 + Math.random() * 2000);
        }
      }
    }
    prevEventRef.current = eventType;
  }, [phase, tasks, combo, hp, activeEvent, addMessage]);

  // Periodic idle chatter
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      idleTimerRef.current += 1;
      // Idle message every 6-12 seconds
      if (idleTimerRef.current >= 6 + Math.floor(Math.random() * 7)) {
        idleTimerRef.current = 0;
        const pool = IDLE_MESSAGES[role] || IDLE_MESSAGES.frontend;
        addMessage(pickRandom(pool));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, role, addMessage]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Parse "Author: message" to color the author
  const renderMessage = (text: string) => {
    const colonIdx = text.indexOf(':');
    if (colonIdx === -1 || colonIdx > 25) return <span>{text}</span>;
    const author = text.slice(0, colonIdx);
    const body = text.slice(colonIdx + 1);
    // Determine author color
    const colors: Record<string, string> = {
      'Тимлид': '#ff6ec7',
      'Вася': '#00d4ff',
      'Лена': '#ffe600',
      'Дима (стажёр)': '#39ff14',
      'PM': '#ff9500',
      'QA Маша': '#bf5af2',
    };
    const color = colors[author] || '#888';
    return (
      <>
        <span style={{ color }} className="font-bold">{author}:</span>
        <span>{body}</span>
      </>
    );
  };

  return (
    <div className="shrink-0 border-t border-gray-800/60 bg-bg-column/60">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 border-b border-gray-800/40">
        <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">
          💬 Чат
        </span>
        <span className="text-[10px] text-gray-600">
          {stats.tasksCompleted > 0 ? `${messages.length}` : 'онлайн: 6'}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-14 md:h-28 overflow-y-auto px-3 md:px-4 py-1 md:py-2 space-y-0.5 md:space-y-1 chat-scroll"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-1.5 md:gap-2 text-[11px] md:text-[12px] leading-relaxed"
            >
              <span className="text-gray-600 tabular-nums shrink-0 text-[10px] mt-0.5">
                {formatTime(msg.timestamp)}
              </span>
              <div className="text-gray-300 min-w-0">
                {renderMessage(msg.text)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="text-[11px] text-gray-600 italic pt-2">
            Коллеги подключаются к чату...
          </div>
        )}
      </div>
    </div>
  );
}
