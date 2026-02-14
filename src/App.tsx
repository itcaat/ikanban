import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useGameLoop } from './engine/useGameLoop';
import { KanbanBoard } from './components/Board/KanbanBoard';
import { HealthBar } from './components/HUD/HealthBar';
import { CoffeeBar } from './components/HUD/CoffeeBar';
import { ScoreDisplay } from './components/HUD/ScoreDisplay';
import { EventBanner } from './components/HUD/EventBanner';
import { ChatPanel } from './components/Chat/ChatPanel';
import { StartScreen } from './components/Screens/StartScreen';
import { GameOverScreen } from './components/Screens/GameOverScreen';
import { Tutorial, shouldShowTutorial } from './components/Tutorial/Tutorial';

function GameScreen() {
  useGameLoop();

  const screenShake = useGameStore((s) => s.screenShake);
  const tutorialActive = useGameStore((s) => s.tutorialActive);
  const setTutorialActive = useGameStore((s) => s.setTutorialActive);

  // Show tutorial on first visit
  useEffect(() => {
    if (shouldShowTutorial()) {
      // Small delay so the board renders and elements can be measured
      const t = setTimeout(() => setTutorialActive(true), 600);
      return () => clearTimeout(t);
    }
  }, [setTutorialActive]);

  return (
    <div
      className={`flex flex-col h-full ${screenShake ? 'screen-shake' : ''}`}
    >
      {/* Top HUD — desktop: single row, mobile: two rows */}
      <div className="shrink-0 border-b border-gray-800/50 bg-bg-dark/80 backdrop-blur-sm z-10" data-tutorial="hud-area">
        {/* Desktop layout (md+) */}
        <div className="hidden md:flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-5 shrink-0">
            <HealthBar />
            <CoffeeBar />
          </div>
          <EventBanner />
          <div className="shrink-0">
            <ScoreDisplay />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-0.5">
            <HealthBar />
            <ScoreDisplay />
          </div>
          <div className="flex items-center justify-between px-2.5 pb-1.5">
            <CoffeeBar />
            <EventBanner />
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden pt-1 md:pt-4">
        <KanbanBoard />
      </div>

      {/* Chat */}
      <ChatPanel />

      {/* Tutorial overlay */}
      {tutorialActive && (
        <Tutorial onComplete={() => setTutorialActive(false)} />
      )}
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
