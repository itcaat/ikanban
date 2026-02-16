import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { formatTime } from '../../utils/scoring';
import { TASK_LABELS, ROLE_META } from '../../data/tasks';
import { submitScore, fetchCompanies, incrementGames, supabaseConfigured } from '../../lib/supabase';
import { getCurrentTournamentId } from '../../lib/tournament';
import { Leaderboard } from './Leaderboard';
import type { TaskType } from '../../types';

const LS_NICK = 'ikanban_nickname';
const LS_COMPANY = 'ikanban_company';

export function GameOverScreen() {
  const stats = useGameStore((s) => s.stats);
  const score = useGameStore((s) => s.score);
  const role = useGameStore((s) => s.role);
  const resetGame = useGameStore((s) => s.resetGame);
  const startGame = useGameStore((s) => s.startGame);

  const roleMeta = ROLE_META[role];

  // --- Leaderboard form state ---
  const [nickname, setNickname] = useState(
    () => localStorage.getItem(LS_NICK) ?? ''
  );
  const [company, setCompany] = useState(
    () => localStorage.getItem(LS_COMPANY) ?? ''
  );
  const [submitState, setSubmitState] = useState<
    'idle' | 'submitting' | 'done' | 'error'
  >('idle');
  const [showForm, setShowForm] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState<number | null>(null);

  // Company autocomplete
  const [companies, setCompanies] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const companyRef = useRef<HTMLInputElement>(null);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (supabaseConfigured) {
      fetchCompanies().then(setCompanies).catch(() => {});
    }
  }, []);

  const filteredCompanies = company.trim()
    ? companies.filter((c) =>
        c.toLowerCase().startsWith(company.toLowerCase())
      )
    : [];

  const doSubmit = useCallback(async (nick: string, comp: string) => {
    const trimmedNick = nick.trim();
    if (!trimmedNick) return;
    const trimmedCompany = comp.trim() || null;

    setSubmitState('submitting');
    try {
      localStorage.setItem(LS_NICK, trimmedNick);
      if (trimmedCompany) localStorage.setItem(LS_COMPANY, trimmedCompany);

      // Submit score and increment games counter in parallel
      const [, count] = await Promise.all([
        submitScore({
          nickname: trimmedNick,
          company: trimmedCompany,
          score,
          survival_time: stats.survivalTime,
          tasks_completed: stats.tasksCompleted,
          max_combo: stats.maxCombo,
          role,
          tournament_id: getCurrentTournamentId(),
        }),
        incrementGames(trimmedNick).catch(() => null),
      ]);

      if (count !== null) setGamesPlayed(count);
      setSubmitState('done');
    } catch {
      setSubmitState('error');
    }
  }, [score, stats, role]);

  // Auto-submit if nickname already saved
  useEffect(() => {
    if (!supabaseConfigured || autoSubmitted.current) return;
    const savedNick = localStorage.getItem(LS_NICK);
    if (savedNick?.trim()) {
      autoSubmitted.current = true;
      doSubmit(savedNick, localStorage.getItem(LS_COMPANY) ?? '');
    } else {
      // No saved nickname — show form for first-time entry
      setShowForm(true);
    }
  }, [doSubmit]);

  const handleManualSubmit = useCallback(() => {
    doSubmit(nickname, company);
    setShowForm(false);
  }, [doSubmit, nickname, company]);

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

  const hasNickname = nickname.trim().length > 0;

  return (
    <div className="flex flex-col items-center h-full px-4 py-6 overflow-y-auto">
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

      {/* Stats card — compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-sm w-full bg-bg-column/70 rounded-xl p-4 mb-4 border border-gray-800"
      >
        {/* Role + Score row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{roleMeta.icon}</span>
            <span
              className="text-xs font-bold"
              style={{ color: roleMeta.color }}
            >
              {roleMeta.label}
            </span>
            {gamesPlayed !== null && (
              <span className="text-[10px] text-gray-500 ml-1">
                Игра #{gamesPlayed}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white tabular-nums leading-none">
              {score.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">
              Финальный счёт
            </div>
          </div>
        </div>

        {/* Stats row — 4 items inline */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-800/50 rounded-lg py-2 px-1">
            <div className="text-sm font-bold text-white leading-none">
              {formatTime(stats.survivalTime)}
            </div>
            <div className="text-[8px] text-gray-500 uppercase mt-1">Время</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg py-2 px-1">
            <div className="text-sm font-bold text-white leading-none">
              {stats.tasksCompleted}
            </div>
            <div className="text-[8px] text-gray-500 uppercase mt-1">Задач</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg py-2 px-1">
            <div className="text-sm font-bold text-neon-pink leading-none">
              {stats.maxCombo}x
            </div>
            <div className="text-[8px] text-gray-500 uppercase mt-1">Combo</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg py-2 px-1">
            <div className="text-sm font-bold text-neon-orange leading-none">
              {stats.eventsTriggered}
            </div>
            <div className="text-[8px] text-gray-500 uppercase mt-1">События</div>
          </div>
        </div>

        {/* Tasks by type — inline chips */}
        <div className="flex gap-1.5 flex-wrap mt-2.5 pt-2.5 border-t border-gray-700/50">
          {taskTypes.map((type) => {
            const count = stats.tasksByType[type];
            if (count === 0) return null;
            return (
              <span
                key={type}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400"
              >
                {TASK_LABELS[type]}: {count}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* --- Nickname / Company: first-time form OR compact badge --- */}
      {supabaseConfigured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="max-w-sm w-full mb-4"
        >
          <AnimatePresence mode="wait">
            {showForm ? (
              /* First-time entry form */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-bg-column/70 rounded-xl p-4 border border-gray-800"
              >
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
                  Введи ник для рейтинга
                </div>

                {/* Nickname */}
                <input
                  type="text"
                  placeholder="Никнейм *"
                  maxLength={30}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  autoFocus
                  className="
                    w-full mb-2 px-3 py-2 rounded-lg text-sm
                    bg-gray-800/80 border border-gray-700 text-white
                    placeholder:text-gray-600
                    focus:outline-none focus:border-neon-purple/60
                  "
                />

                {/* Company with autocomplete */}
                <div className="relative">
                  <input
                    ref={companyRef}
                    type="text"
                    placeholder="Компания (необязательно)"
                    maxLength={50}
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    className="
                      w-full px-3 py-2 rounded-lg text-sm
                      bg-gray-800/80 border border-gray-700 text-white
                      placeholder:text-gray-600
                      focus:outline-none focus:border-neon-purple/60
                    "
                  />

                  {/* Autocomplete dropdown */}
                  <AnimatePresence>
                    {showSuggestions && filteredCompanies.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-700 max-h-32 overflow-y-auto shadow-xl"
                      >
                        {filteredCompanies.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setCompany(c);
                              setShowSuggestions(false);
                            }}
                            className="
                              w-full px-3 py-1.5 text-left text-sm text-gray-300
                              hover:bg-neon-purple/10 hover:text-white cursor-pointer
                              transition-colors
                            "
                          >
                            {c}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleManualSubmit}
                  disabled={!hasNickname || submitState === 'submitting'}
                  className="
                    w-full mt-3 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider
                    transition-all cursor-pointer
                    bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:scale-[1.02]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  "
                >
                  {submitState === 'submitting' ? 'Отправляю...' : 'Сохранить и показать рейтинг'}
                </button>
              </motion.div>
            ) : (
              /* Compact badge: auto-submitted or already done */
              <motion.div
                key="badge"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between bg-bg-column/70 rounded-xl px-4 py-2.5 border border-gray-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-neon-purple text-xs font-bold truncate">
                    {nickname.trim()}
                  </span>
                  {company.trim() && (
                    <span className="text-gray-500 text-[10px] truncate">
                      @ {company.trim()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {submitState === 'submitting' && (
                    <span className="text-[10px] text-gray-500 animate-pulse">
                      Сохраняю...
                    </span>
                  )}
                  {submitState === 'done' && (
                    <span className="text-[10px] text-neon-green">
                      Сохранено
                    </span>
                  )}
                  {submitState === 'error' && (
                    <span className="text-[10px] text-neon-red">
                      Ошибка
                    </span>
                  )}
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    Изменить
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* --- Leaderboard (always shown when not in first-time form) --- */}
      {supabaseConfigured && !showForm && (submitState === 'done' || submitState === 'submitting') && (
        <Leaderboard
          playerNickname={nickname.trim()}
          playerCompany={company.trim() || null}
        />
      )}

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4 mt-6"
      >
        <button
          onClick={() => startGame(role)}
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

      {/* Channel link */}
      <motion.a
        href="https://t.me/devopsbrain"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 mb-8 flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider border border-neon-blue/40 text-neon-blue hover:bg-neon-blue/10 transition-colors"
      >
        <img src={`${import.meta.env.BASE_URL}telegram.svg`} alt="" className="w-5 h-5" />
        DevOps Brain
      </motion.a>
    </div>
  );
}
