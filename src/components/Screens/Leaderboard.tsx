import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLE_META } from '../../data/tasks';
import {
  fetchTournamentLeaderboard,
  fetchAllTimeLeaderboard,
  fetchCompanyLeaderboard,
  fetchCompanies,
  fetchPlayerRank,
  fetchPlayerEntry,
  type LeaderboardEntry,
} from '../../lib/supabase';
import { getCurrentTournamentId, formatTournamentRange } from '../../lib/tournament';
import type { PlayerRole } from '../../types';

type Tab = 'week' | 'alltime' | 'company';

const LS_NICK = 'ikanban_nickname';
const LS_COMPANY = 'ikanban_company';

interface LeaderboardProps {
  playerNickname: string;
  playerCompany: string | null;
  /** Called when user sets nickname/company via the popup */
  onProfileChange?: (nickname: string, company: string | null) => void;
}

const TAB_CONFIG: { id: Tab; label: string }[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'alltime', label: 'Все время' },
  { id: 'company', label: 'Компания' },
];

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export function Leaderboard({ playerNickname, playerCompany, onProfileChange }: LeaderboardProps) {
  const [tab, setTab] = useState<Tab>('week');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerRank, setPlayerRank] = useState<{ rank: number | null; total: number } | null>(null);
  const [playerEntry, setPlayerEntry] = useState<LeaderboardEntry | null>(null);

  // Profile popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupNick, setPopupNick] = useState(playerNickname);
  const [popupCompany, setPopupCompany] = useState(playerCompany ?? '');

  // Company autocomplete for popup
  const [companies, setCompanies] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const companiesLoaded = useRef(false);

  // Effective values (may update from popup)
  const [effectiveNick, setEffectiveNick] = useState(playerNickname);
  const [effectiveCompany, setEffectiveCompany] = useState(playerCompany);

  // Sync props
  useEffect(() => {
    setEffectiveNick(playerNickname);
    setEffectiveCompany(playerCompany);
  }, [playerNickname, playerCompany]);

  const tournamentId = getCurrentTournamentId();
  const tournamentRange = formatTournamentRange(tournamentId);

  const loadCompanies = useCallback(() => {
    if (companiesLoaded.current) return;
    companiesLoaded.current = true;
    fetchCompanies().then(setCompanies).catch(() => {});
  }, []);

  const filteredCompanies = popupCompany.trim()
    ? companies.filter((c) =>
        c.toLowerCase().startsWith(popupCompany.toLowerCase())
      )
    : [];

  const handleTabClick = (id: Tab) => {
    if (id === 'company' && !effectiveCompany) {
      // No company set — show popup
      loadCompanies();
      setPopupNick(effectiveNick || localStorage.getItem(LS_NICK) || '');
      setPopupCompany(effectiveCompany || localStorage.getItem(LS_COMPANY) || '');
      setShowPopup(true);
      return;
    }
    setTab(id);
  };

  const handlePopupSave = () => {
    const nick = popupNick.trim();
    const comp = popupCompany.trim() || null;
    if (!nick || !comp) return;

    localStorage.setItem(LS_NICK, nick);
    if (comp) localStorage.setItem(LS_COMPANY, comp);

    setEffectiveNick(nick);
    setEffectiveCompany(comp);
    onProfileChange?.(nick, comp);

    setShowPopup(false);
    setTab('company');
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPlayerRank(null);
    setPlayerEntry(null);

    const load = async () => {
      try {
        let result: LeaderboardEntry[];
        switch (tab) {
          case 'week':
            result = await fetchTournamentLeaderboard(tournamentId);
            break;
          case 'alltime':
            result = await fetchAllTimeLeaderboard(tournamentId);
            break;
          case 'company':
            if (!effectiveCompany) { result = []; break; }
            result = await fetchCompanyLeaderboard(effectiveCompany, tournamentId);
            break;
        }
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Fetch player rank + entry in parallel (only for week & company tabs)
    const loadPlayerInfo = async () => {
      if (!effectiveNick) return;
      const companyFilter = tab === 'company' ? effectiveCompany ?? undefined : undefined;
      try {
        const [rank, entry] = await Promise.all([
          fetchPlayerRank(effectiveNick, tournamentId, companyFilter),
          fetchPlayerEntry(effectiveNick, tournamentId, companyFilter),
        ]);
        if (!cancelled) {
          setPlayerRank(rank);
          setPlayerEntry(entry);
        }
      } catch {
        // ignore
      }
    };

    load();
    loadPlayerInfo();
    return () => { cancelled = true; };
  }, [tab, tournamentId, effectiveCompany, effectiveNick]);

  const renderRow = (entry: LeaderboardEntry, rank: number) => {
    const isPlayer =
      effectiveNick && entry.nickname.toLowerCase() === effectiveNick.toLowerCase();
    const rankColor = RANK_COLORS[rank];
    const roleMeta =
      ROLE_META[entry.role as PlayerRole] ?? { icon: '?', color: '#888' };

    return (
      <div
        key={`${entry.id}-${rank}`}
        className={`
          grid grid-cols-[2rem_1fr_auto_3.5rem] gap-1 items-center
          px-3 py-2 text-xs border-b border-gray-800/30
          ${isPlayer ? 'bg-neon-purple/10' : ''}
        `}
      >
        <span
          className="font-black tabular-nums"
          style={{ color: rankColor ?? (isPlayer ? '#bf5af2' : '#6b7280') }}
        >
          {rank}
        </span>
        <div className="min-w-0">
          <div
            className={`font-bold truncate ${
              isPlayer ? 'text-neon-purple' : 'text-white'
            }`}
          >
            {entry.nickname}
          </div>
          {entry.company && (
            <div className="text-[9px] text-gray-500 truncate">
              {entry.company}
            </div>
          )}
        </div>
        <span title={entry.role} className="text-sm">
          {roleMeta.icon}
        </span>
        <span className="text-right font-black tabular-nums text-white">
          {entry.score.toLocaleString()}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full"
    >
      {/* Title */}
      <div className="text-center mb-3">
        <h2 className="text-sm font-bold text-neon-purple uppercase tracking-wider">
          Рейтинг
        </h2>
        {tab === 'week' && (
          <p className="text-[10px] text-gray-500 mt-0.5">{tournamentRange}</p>
        )}
        {tab === 'company' && effectiveCompany && (
          <p className="text-[10px] text-gray-500 mt-0.5">{effectiveCompany}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-800/50 rounded-lg p-1">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabClick(t.id)}
            className={`
              flex-1 py-1.5 px-2 rounded-md text-xs font-bold uppercase tracking-wider
              transition-all cursor-pointer
              ${tab === t.id
                ? 'bg-neon-purple/20 text-neon-purple'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-bg-column rounded-xl p-4 border border-gray-700 shadow-2xl"
            >
              <div className="text-xs font-bold text-neon-purple uppercase tracking-wider mb-3">
                Укажи ник и компанию
              </div>

              <input
                type="text"
                placeholder="Никнейм *"
                maxLength={30}
                value={popupNick}
                onChange={(e) => setPopupNick(e.target.value)}
                autoFocus
                className="
                  w-full mb-2 px-3 py-2 rounded-lg text-sm
                  bg-gray-800/80 border border-gray-700 text-white
                  placeholder:text-gray-600
                  focus:outline-none focus:border-neon-purple/60
                "
              />

              <div className="relative">
                <input
                  type="text"
                  placeholder="Компания *"
                  maxLength={50}
                  value={popupCompany}
                  onChange={(e) => {
                    setPopupCompany(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-gray-800/80 border border-gray-700 text-white
                    placeholder:text-gray-600
                    focus:outline-none focus:border-neon-purple/60
                  "
                />
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
                            setPopupCompany(c);
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

              <button
                onClick={handlePopupSave}
                disabled={!popupNick.trim() || !popupCompany.trim()}
                className="
                  w-full mt-3 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider
                  transition-all cursor-pointer
                  bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:scale-[1.02]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                "
              >
                Показать рейтинг
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-bg-column/70 rounded-xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_auto_3.5rem] gap-1 px-3 py-2 text-[9px] text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
          <span>#</span>
          <span>Игрок</span>
          <span>Роль</span>
          <span className="text-right">Счёт</span>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-gray-500 text-xs"
            >
              Загрузка...
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-gray-500 text-xs"
            >
              {tab === 'alltime' ? 'Пока нет завершённых турниров' : 'Пока пусто — будь первым!'}
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {data.map((entry, idx) => {
                const rank = idx + 1;
                return renderRow(entry, rank);
              })}

              {/* "..." + player row if they're outside top */}
              {playerRank?.rank != null &&
                playerRank.rank > data.length &&
                playerEntry && (
                  <>
                    <div className="px-3 py-1 text-center text-gray-600 text-xs tracking-widest border-b border-gray-800/30">
                      ···
                    </div>
                    {renderRow(playerEntry, playerRank.rank)}
                  </>
                )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player rank footer */}
        {playerRank && playerRank.total > 0 && (
          <div className="px-3 py-2 border-t border-gray-800/50 flex items-center justify-between text-[10px] text-gray-500">
            <span>
              Всего игроков: <span className="text-gray-400 font-bold">{playerRank.total}</span>
            </span>
            {playerRank.rank !== null && effectiveNick && (
              <span>
                Ты: <span className="text-neon-purple font-bold">#{playerRank.rank}</span>
                <span className="text-gray-600"> из {playerRank.total}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
