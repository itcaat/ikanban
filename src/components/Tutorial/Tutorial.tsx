import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'ikanban-tutorial-seen';

type TooltipPosition = 'bottom' | 'top' | 'right' | 'left' | 'inside-top';

interface TutorialStep {
  target: string;        // data-tutorial attribute value
  title: string;
  text: string;
  position: TooltipPosition;
}

const STEPS: TutorialStep[] = [
  {
    target: 'col-backlog',
    title: '01 — Бэклог',
    text: 'Сюда прилетают задачи. Перетаскивай их вправо, чтобы взять в работу.',
    position: 'inside-top',
  },
  {
    target: 'col-inprogress',
    title: '02 — In Progress',
    text: 'Здесь задача решается сама — прогресс-бар заполняется автоматически.',
    position: 'inside-top',
  },
  {
    target: 'hud-hp',
    title: '03 — HP',
    text: 'Если таймер задачи истечёт — она взорвётся и отнимет здоровье. HP = 0 — Game Over.',
    position: 'bottom',
  },
  {
    target: 'hud-coffee',
    title: '04 — Кофе',
    text: 'Жми ☕ чтобы ускорить задачи в In Progress. Тратит 20 кофе за раз.',
    position: 'bottom',
  },
];

interface Props {
  onComplete: () => void;
}

export function Tutorial({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = STEPS[step];

  const measureTarget = useCallback(() => {
    const el = document.querySelector(`[data-tutorial="${current.target}"]`);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [current.target]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, '1');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onComplete();
  };

  if (!rect) return null;

  // Highlight cutout dimensions with padding
  const pad = 8;
  const hx = rect.left - pad;
  const hy = rect.top - pad;
  const hw = rect.width + pad * 2;
  const hh = rect.height + pad * 2;

  // Tooltip position
  const tooltip = getTooltipStyle(current.position, rect);

  return (
    <div className="fixed inset-0 z-50" onClick={handleNext}>
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tutorial-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={hx}
              y={hy}
              width={hw}
              height={hh}
              rx={12}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tutorial-mask)"
        />
        {/* Highlight border */}
        <rect
          x={hx}
          y={hy}
          width={hw}
          height={hh}
          rx={12}
          fill="none"
          stroke="#bf5af2"
          strokeWidth={2}
          className="animate-pulse"
        />
      </svg>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="absolute max-w-xs w-72 bg-bg-column border border-neon-purple/50 rounded-xl p-4 shadow-2xl"
          style={tooltip}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div
            className="absolute w-3 h-3 bg-bg-column border-neon-purple/50 rotate-45"
            style={getArrowStyle(current.position)}
          />

          <div className="text-xs font-bold text-neon-purple tracking-wider mb-1.5">
            {current.title}
          </div>
          <div className="text-sm text-gray-300 leading-relaxed mb-4">
            {current.text}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => { e.stopPropagation(); handleSkip(); }}
              className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Пропустить
            </button>
            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === step ? 'bg-neon-purple' : i < step ? 'bg-neon-purple/40' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="px-3 py-1.5 rounded-lg bg-neon-purple/20 text-neon-purple text-xs font-bold hover:bg-neon-purple/30 transition-colors cursor-pointer"
              >
                {step < STEPS.length - 1 ? 'Далее →' : 'Играть!'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function getTooltipStyle(position: string, rect: DOMRect): React.CSSProperties {
  const gap = 16;
  switch (position) {
    case 'inside-top':
      return {
        top: rect.top + gap,
        left: Math.max(12, rect.left + rect.width / 2 - 144),
      };
    case 'bottom':
      return {
        top: rect.bottom + gap,
        left: Math.max(12, rect.left + rect.width / 2 - 144), // 144 = w-72/2
      };
    case 'top':
      return {
        bottom: window.innerHeight - rect.top + gap,
        left: Math.max(12, rect.left + rect.width / 2 - 144),
      };
    case 'right':
      return {
        top: rect.top + rect.height / 2 - 60,
        left: rect.right + gap,
      };
    case 'left':
      return {
        top: rect.top + rect.height / 2 - 60,
        right: window.innerWidth - rect.left + gap,
      };
    default:
      return { top: rect.bottom + gap, left: rect.left };
  }
}

function getArrowStyle(position: string): React.CSSProperties {
  switch (position) {
    case 'inside-top':
      return { display: 'none' };
    case 'bottom':
      return { top: -6, left: '50%', marginLeft: -6, borderTop: '1px solid', borderLeft: '1px solid', borderColor: 'rgba(191,90,242,0.5)' };
    case 'top':
      return { bottom: -6, left: '50%', marginLeft: -6, borderBottom: '1px solid', borderRight: '1px solid', borderColor: 'rgba(191,90,242,0.5)' };
    case 'right':
      return { left: -6, top: '50%', marginTop: -6, borderBottom: '1px solid', borderLeft: '1px solid', borderColor: 'rgba(191,90,242,0.5)' };
    case 'left':
      return { right: -6, top: '50%', marginTop: -6, borderTop: '1px solid', borderRight: '1px solid', borderColor: 'rgba(191,90,242,0.5)' };
    default:
      return {};
  }
}

export function shouldShowTutorial(): boolean {
  return !localStorage.getItem(STORAGE_KEY);
}
