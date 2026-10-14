import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { GameState } from './types';
import { RotateCcw, Volume2, VolumeX, Pause, Play, ArrowLeft, ArrowUp, ArrowDown, ArrowLeft as LeftIcon, ArrowRight as RightIcon } from 'lucide-react';

interface CyberSnakeProps {
  onGameOver: (score: number, details: string) => void;
  onExit: () => void;
  highScore: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

interface SpecialFood {
  x: number;
  y: number;
  type: 'golden' | 'freeze' | 'ghost';
  timer: number;
  maxTimer: number;
}

export const CyberSnake: React.FC<CyberSnakeProps> = ({ onGameOver, onExit, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(4);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(!sound.getIsMuted());

  const GRID_SIZE = 20;
  const COLS = 28;
  const ROWS = 24;

  const stateRef = useRef({
    gameState: 'PLAYING' as GameState,
    score: 0,
    speed: 105, // ms per tick
    snake: [
      { x: 10, y: 12 },
      { x: 9, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 12 },
    ] as Position[],
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
    food: { x: 18, y: 12 } as Position,
    specialFood: null as SpecialFood | null,
    ghostMode: 0, // ticks remaining
    freezeMode: 0,
    combo: 0,
    comboTimer: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number }[],
  });

  const generateFoodPosition = useCallback((snake: Position[]): Position => {
    let valid = false;
    let newPos = { x: 0, y: 0 };
    while (!valid) {
      newPos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      valid = !snake.some((seg) => seg.x === newPos.x && seg.y === newPos.y);
    }
    return newPos;
  }, []);

  const spawnSpecialFood = useCallback((snake: Position[]) => {
    const types: ('golden' | 'freeze' | 'ghost')[] = ['golden', 'golden', 'freeze', 'ghost'];
    const type = types[Math.floor(Math.random() * types.length)];
    const pos = generateFoodPosition(snake);
    stateRef.current.specialFood = {
      x: pos.x,
      y: pos.y,
      type,
      timer: 80, // ~8-10 seconds
      maxTimer: 80,
    };
  }, [generateFoodPosition]);

  const restartGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = 'PLAYING';
    s.score = 0;
    s.speed = 105;
    s.snake = [
      { x: 10, y: 12 },
      { x: 9, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 12 },
    ];
    s.direction = 'RIGHT';
    s.nextDirection = 'RIGHT';
    s.food = generateFoodPosition(s.snake);
    s.specialFood = null;
    s.ghostMode = 0;
    s.freezeMode = 0;
    s.combo = 0;
    s.comboTimer = 0;
    s.particles = [];

    setScore(0);
    setLength(4);
    setSpeedLevel(1);
    setGameState('PLAYING');
  }, [generateFoodPosition]);

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setMuted(!next);
    setSoundEnabled(next);
  };

  const changeDirection = (newDir: Direction) => {
    const current = stateRef.current.direction;
    if (newDir === 'UP' && current !== 'DOWN') stateRef.current.nextDirection = 'UP';
    if (newDir === 'DOWN' && current !== 'UP') stateRef.current.nextDirection = 'DOWN';
    if (newDir === 'LEFT' && current !== 'RIGHT') stateRef.current.nextDirection = 'LEFT';
    if (newDir === 'RIGHT' && current !== 'LEFT') stateRef.current.nextDirection = 'RIGHT';
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        changeDirection('UP');
        e.preventDefault();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        changeDirection('DOWN');
        e.preventDefault();
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        changeDirection('LEFT');
        e.preventDefault();
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        changeDirection('RIGHT');
        e.preventDefault();
      } else if (['KeyP', 'Escape'].includes(e.code)) {
        const s = stateRef.current;
        s.gameState = s.gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING';
        setGameState(s.gameState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main game tick & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tickTimeoutId: number;
    let animationFrameId: number;

    const gameTick = () => {
      const s = stateRef.current;
      if (s.gameState === 'PLAYING') {
        s.direction = s.nextDirection;

        const head = { ...s.snake[0] };
        if (s.direction === 'UP') head.y -= 1;
        if (s.direction === 'DOWN') head.y += 1;
        if (s.direction === 'LEFT') head.x -= 1;
        if (s.direction === 'RIGHT') head.x += 1;

        // Ghost mode wall pass
        if (s.ghostMode > 0) {
          if (head.x < 0) head.x = COLS - 1;
          if (head.x >= COLS) head.x = 0;
          if (head.y < 0) head.y = ROWS - 1;
          if (head.y >= ROWS) head.y = 0;
          s.ghostMode--;
        } else {
          // Normal wall collision
          if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            handleCrash();
            return;
          }
        }

        // Self collision check
        if (s.ghostMode === 0) {
          const selfCollision = s.snake.slice(0, -1).some((seg) => seg.x === head.x && seg.y === head.y);
          if (selfCollision) {
            handleCrash();
            return;
          }
        }

        // Move snake
        s.snake.unshift(head);

        // Check regular food
        if (head.x === s.food.x && head.y === s.food.y) {
          sound.playScore();
          const earned = 100 + (s.combo * 25);
          s.score += earned;
          s.combo++;
          s.comboTimer = 25;
          setScore(s.score);
          setLength(s.snake.length);

          // Particles
          for (let i = 0; i < 14; i++) {
            s.particles.push({
              x: head.x * GRID_SIZE + GRID_SIZE / 2,
              y: head.y * GRID_SIZE + GRID_SIZE / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#38bdf8',
              life: 0,
              maxLife: 20,
            });
          }

          s.food = generateFoodPosition(s.snake);

          // Speed scaling
          if (s.speed > 55 && s.snake.length % 5 === 0) {
            s.speed = Math.max(55, s.speed - 5);
            setSpeedLevel((prev) => prev + 1);
          }

          // Special food spawn chance
          if (!s.specialFood && Math.random() < 0.28) {
            spawnSpecialFood(s.snake);
          }
        } else if (s.specialFood && head.x === s.specialFood.x && head.y === s.specialFood.y) {
          sound.playPowerup();
          const p = s.specialFood;
          if (p.type === 'golden') {
            s.score += 500;
          } else if (p.type === 'freeze') {
            s.freezeMode = 45;
            s.score += 250;
          } else if (p.type === 'ghost') {
            s.ghostMode = 50;
            s.score += 300;
          }
          setScore(s.score);
          s.specialFood = null;

          // Special burst
          for (let i = 0; i < 20; i++) {
            s.particles.push({
              x: head.x * GRID_SIZE + GRID_SIZE / 2,
              y: head.y * GRID_SIZE + GRID_SIZE / 2,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 7,
              color: '#f59e0b',
              life: 0,
              maxLife: 25,
            });
          }
        } else {
          // Regular step: remove tail
          s.snake.pop();
        }

        // Special food timer decay
        if (s.specialFood) {
          s.specialFood.timer--;
          if (s.specialFood.timer <= 0) {
            s.specialFood = null;
          }
        }

        // Combo decay
        if (s.comboTimer > 0) {
          s.comboTimer--;
          if (s.comboTimer === 0) {
            s.combo = 0;
          }
        }

        if (s.freezeMode > 0) {
          s.freezeMode--;
        }
      }

      function handleCrash() {
        sound.playGameOver();
        s.gameState = 'GAME_OVER';
        setGameState('GAME_OVER');
        onGameOver(s.score, `Comprimento ${s.snake.length}`);
      }

      const activeInterval = s.freezeMode > 0 ? s.speed * 1.6 : s.speed;
      tickTimeoutId = window.setTimeout(gameTick, activeInterval);
    };

    tickTimeoutId = window.setTimeout(gameTick, stateRef.current.speed);

    // Continuous 60fps render loop for smooth glowing effects & particles
    const render = () => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear dark cyber grid background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render regular food (Glowing cyan orb)
      const fx = s.food.x * GRID_SIZE + GRID_SIZE / 2;
      const fy = s.food.y * GRID_SIZE + GRID_SIZE / 2;
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(fx, fy, GRID_SIZE / 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render special food if active
      if (s.specialFood) {
        const sx = s.specialFood.x * GRID_SIZE + GRID_SIZE / 2;
        const sy = s.specialFood.y * GRID_SIZE + GRID_SIZE / 2;
        ctx.save();
        const color = s.specialFood.type === 'golden' ? '#eab308' : s.specialFood.type === 'freeze' ? '#06b6d4' : '#a855f7';
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, GRID_SIZE / 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Timer ring around special food
        const pct = s.specialFood.timer / s.specialFood.maxTimer;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, GRID_SIZE / 1.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
        ctx.restore();
      }

      // Render Snake
      s.snake.forEach((seg, idx) => {
        const px = seg.x * GRID_SIZE;
        const py = seg.y * GRID_SIZE;
        ctx.save();

        if (idx === 0) {
          // Snake Head
          ctx.shadowColor = s.ghostMode > 0 ? '#c084fc' : '#10b981';
          ctx.shadowBlur = 14;
          ctx.fillStyle = s.ghostMode > 0 ? '#a855f7' : '#10b981';
          ctx.beginPath();
          ctx.roundRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);
          ctx.fill();

          // Cyber Eyes
          ctx.fillStyle = '#ffffff';
          let e1x = px + 5, e1y = py + 5, e2x = px + 14, e2y = py + 5;
          if (s.direction === 'DOWN') { e1y = py + 14; e2y = py + 14; }
          if (s.direction === 'LEFT') { e1x = px + 5; e2x = px + 5; e1y = py + 5; e2y = py + 14; }
          if (s.direction === 'RIGHT') { e1x = px + 14; e2x = px + 14; e1y = py + 5; e2y = py + 14; }

          ctx.fillRect(e1x - 1, e1y - 1, 3, 3);
          ctx.fillRect(e2x - 1, e2y - 1, 3, 3);
        } else {
          // Snake Body Segments (smooth gradient effect)
          const gradPct = 1 - idx / s.snake.length;
          ctx.fillStyle = s.ghostMode > 0 ? `rgba(168, 85, 247, ${0.4 + gradPct * 0.6})` : `rgba(16, 185, 129, ${0.35 + gradPct * 0.65})`;
          ctx.beginPath();
          ctx.roundRect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4, 3);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.life++;
      });
      s.particles = s.particles.filter((p) => p.life < p.maxLife);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(tickTimeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [generateFoodPosition, onGameOver, spawnSpecialFood]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[640px] p-2 md:p-6 bg-slate-950 text-slate-100 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[560px] flex items-center justify-between mb-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Pontuação</div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Comprimento</div>
            <div className="text-lg font-bold font-mono text-cyan-400">{length}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Velocidade</div>
            <div className="text-xs font-mono text-amber-400 font-bold">NÍVEL {speedLevel}</div>
          </div>

          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Silenciar' : 'Ativar som'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* Main Canvas Box */}
      <div className="relative border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-[#060a12]">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * COLS}
          height={GRID_SIZE * ROWS}
          className="block max-w-full h-auto"
          style={{ width: 'min(560px, 92vw)', aspectRatio: `${COLS}/${ROWS}` }}
        />

        {/* Pause Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
            <h3 className="text-3xl font-extrabold text-white mb-2">Jogo Pausado</h3>
            <p className="text-slate-400 text-sm mb-6">Pressione P para continuar</p>
            <button
              onClick={() => {
                stateRef.current.gameState = 'PLAYING';
                setGameState('PLAYING');
              }}
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg shadow text-sm mb-2"
            >
              Continuar
            </button>
            <button
              onClick={restartGame}
              className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm"
            >
              Reiniciar
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <div className="text-rose-500 text-xs font-semibold uppercase tracking-wider mb-1">Colisão Detectada</div>
            <h3 className="text-3xl font-extrabold text-white mb-4">Fim de Jogo!</h3>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 w-full max-w-xs mb-5 text-center space-y-2">
              <div>
                <span className="text-xs text-slate-400">Pontuação Final</span>
                <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>Comprimento da Serpente:</span>
                <span className="font-bold text-white">{length}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Recorde Pessoal:</span>
                <span className="font-bold text-amber-400 font-mono tabular-nums">{Math.max(score, highScore).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={restartGame}
                className="flex items-center gap-2 py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm"
              >
                <RotateCcw size={16} />
                Jogar Novamente
              </button>
              <button
                onClick={onExit}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Virtual D-Pad for Mobile / Touch Users */}
      <div className="mt-4 flex flex-col items-center gap-1 sm:hidden">
        <button
          onClick={() => changeDirection('UP')}
          className="w-12 h-12 bg-slate-800 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow"
        >
          <ArrowUp size={22} />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeDirection('LEFT')}
            className="w-12 h-12 bg-slate-800 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow"
          >
            <LeftIcon size={22} />
          </button>
          <button
            onClick={() => changeDirection('DOWN')}
            className="w-12 h-12 bg-slate-800 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow"
          >
            <ArrowDown size={22} />
          </button>
          <button
            onClick={() => changeDirection('RIGHT')}
            className="w-12 h-12 bg-slate-800 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow"
          >
            <RightIcon size={22} />
          </button>
        </div>
      </div>

      {/* Footer Return & Help */}
      <div className="w-full max-w-[560px] flex items-center justify-between text-xs text-slate-400 mt-3 px-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao Hub
        </button>
        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <span>Controles: <strong className="text-slate-300">Setas ou W A S D</strong></span>
          <span>·</span>
          <span>Pausar: <strong className="text-slate-300">P / Esc</strong></span>
        </div>
      </div>
    </div>
  );
};
