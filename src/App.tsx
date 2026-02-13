import { useGameStore } from './store/gameStore';
import { useGameLoop } from './engine/useGameLoop';
import { KanbanBoard } from './components/Board/KanbanBoard';
import { HealthBar } from './components/HUD/HealthBar';
import { CoffeeBar } from './components/HUD/CoffeeBar';
import { ScoreDisplay } from './components/HUD/ScoreDisplay';
import { EventBanner } from './components/HUD/EventBanner';
import { StartScreen } from './components/Screens/StartScreen';
import { GameOverScreen } from './components/Screens/GameOverScreen';

function GameScreen() {
  useGameLoop();

  const screenShake = useGameStore((s) => s.screenShake);

  return (
    <div
      className={`flex flex-col h-full relative ${screenShake ? 'screen-shake' : ''}`}
    >
      {/* Top HUD */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50 bg-bg-dark/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-5">
          <HealthBar />
          <CoffeeBar />
        </div>
        <ScoreDisplay />
      </div>

      {/* Event banner */}
      <EventBanner />

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden pt-4">
        <KanbanBoard />
      </div>
    </div>
  );
}

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="h-full w-full bg-bg-dark">
      {phase === 'menu' && <StartScreen />}
      {phase === 'playing' && <GameScreen />}
      {phase === 'gameover' && <GameOverScreen />}
    </div>
  );
}
