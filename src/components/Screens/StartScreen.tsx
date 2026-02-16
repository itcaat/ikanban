import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { ROLE_META } from '../../data/tasks';
import { supabaseConfigured } from '../../lib/supabase';
import { Leaderboard } from './Leaderboard';
import type { PlayerRole } from '../../types';

const ROLES: PlayerRole[] = ['frontend', 'backend', 'devops', 'sre'];

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  const [playerNick, setPlayerNick] = useState(localStorage.getItem('ikanban_nickname') ?? '');
  const [playerComp, setPlayerComp] = useState(localStorage.getItem('ikanban_company') || null);

  const handleStart = () => {
    if (selectedRole) startGame(selectedRole);
  };

  const handleProfileChange = (nick: string, company: string | null) => {
    setPlayerNick(nick);
    setPlayerComp(company);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 overflow-y-auto py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-4"
      >
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue mb-2">
          I KANBAN
        </h1>
        <p className="text-lg text-gray-400 font-mono">
          // игра для тех кто любит закрывать задачки ;)
        </p>
      </motion.div>

      {/* Leaderboard */}
      {supabaseConfigured && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="max-w-lg w-full mb-4"
        >
          <Leaderboard
            playerNickname={playerNick}
            playerCompany={playerComp}
            onProfileChange={handleProfileChange}
          />
        </motion.div>
      )}

      {/* Role selection (compact) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="max-w-lg w-full mb-4"
      >
        <h2 className="text-[10px] font-bold text-neon-purple mb-2 tracking-wider text-center">
          ВЫБЕРИ СПЕЦИАЛИЗАЦИЮ
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((role) => {
            const meta = ROLE_META[role];
            const isSelected = selectedRole === role;
            return (
              <motion.button
                key={role}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRole(role)}
                className="relative text-left p-3 rounded-xl border-2 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: isSelected ? meta.color : '#2a2a3e',
                  backgroundColor: isSelected ? meta.color + '12' : '#12121a',
                  boxShadow: isSelected ? `0 0 20px ${meta.color}25` : 'none',
                }}
              >
                <div className="text-lg mb-0.5">{meta.icon}</div>
                <div
                  className="text-xs font-bold"
                  style={{ color: isSelected ? meta.color : '#e0e0e0' }}
                >
                  {meta.label}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                  {meta.description}
                </div>
                {isSelected && (
                  <motion.div
                    layoutId="role-check"
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                    style={{ backgroundColor: meta.color }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: selectedRole ? 1 : 0.4,
          scale: 1,
        }}
        transition={{ delay: 0.5, duration: 0.4 }}
        whileHover={selectedRole ? { scale: 1.05 } : {}}
        whileTap={selectedRole ? { scale: 0.95 } : {}}
        onClick={handleStart}
        disabled={!selectedRole}
        className={`
          px-12 py-4 rounded-xl text-lg font-black tracking-wider
          text-white shadow-lg transition-shadow duration-300
          ${selectedRole
            ? 'bg-gradient-to-r from-neon-pink to-neon-purple cursor-pointer hover:shadow-neon-pink/30 hover:shadow-xl'
            : 'bg-gray-700 cursor-not-allowed'}
        `}
      >
        {selectedRole ? 'НАЧАТЬ РАБОТУ' : 'ВЫБЕРИ РОЛЬ'}
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-3 text-xs text-gray-600"
      >
        (Отказаться уже нельзя)
      </motion.p>
    </div>
  );
}
