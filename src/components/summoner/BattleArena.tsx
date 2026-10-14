import React, { useEffect, useRef, useState } from 'react';
import { Card, BattlefieldUnit, Projectile } from '../../types/summoner';
import { drawPixelSprite, getSpriteId } from '../../utils/pixelSprites';
import { drawPixelEnvironment } from '../../utils/pixelEnvironments';

interface BattleArenaProps {
  selectedCard: Card | null;
  onLaneClick: (laneIndex: number) => void;
  units: BattlefieldUnit[];
  projectiles: Projectile[];
  summonerHp: number;
  summonerMaxHp: number;
  waveNumber: number;
  enemiesRemaining: number;
  totalWaveEnemies: number;
  isBossWave: boolean;
  bossUnit: BattlefieldUnit | null;
  isPaused?: boolean;
  onResume?: () => void;
  onOpenDeck?: () => void;
  onRestartWave?: () => void;
  onBackToMenu?: () => void;
}

interface BiomeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  selectedCard,
  onLaneClick,
  units,
  projectiles,
  summonerHp,
  summonerMaxHp,
  waveNumber,
  enemiesRemaining,
  totalWaveEnemies,
  isBossWave,
  bossUnit,
  isPaused = false,
  onResume,
  onOpenDeck,
  onRestartWave,
  onBackToMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);

  const LANES_COUNT = 3;
  const ARENA_WIDTH = 840;
  const ARENA_HEIGHT = 450;
  const LANE_HEIGHT = 150;

  // Environment particle state
  const particlesRef = useRef<BiomeParticle[]>([]);
  const currentWaveRef = useRef<number>(waveNumber);

  // Biome Configurations by Level
  const getBiomeInfo = (wave: number) => {
    switch (wave) {
      case 1:
        return {
          level: 1,
          name: 'Bosque dos Anciãos',
          biome: 'Floresta Serena',
          icon: '🌲',
          bgLeft: '#052217',
          bgMid: '#0a3525',
          bgRight: '#161e2e',
          laneEven: 'rgba(6, 40, 28, 0.4)',
          laneOdd: 'rgba(4, 25, 18, 0.5)',
          laneBorder: 'rgba(52, 211, 153, 0.18)',
          particleColors: ['#6ee7b7', '#a7f3d0', '#fef08a'],
          type: 'spore',
        };
      case 2:
        return {
          level: 2,
          name: 'Caverna dos Cristais Sombrios',
          biome: 'Caverna Subterrânea',
          icon: '🪨',
          bgLeft: '#0a0d17',
          bgMid: '#121829',
          bgRight: '#201335',
          laneEven: 'rgba(15, 23, 42, 0.5)',
          laneOdd: 'rgba(8, 12, 24, 0.6)',
          laneBorder: 'rgba(129, 140, 248, 0.22)',
          particleColors: ['#38bdf8', '#c084fc', '#818cf8'],
          type: 'crystal',
        };
      case 3:
        return {
          level: 3,
          name: 'Lago das Águas Sagradas',
          biome: 'Rio & Lago Místico',
          icon: '💧',
          bgLeft: '#021a24',
          bgMid: '#053142',
          bgRight: '#141d3b',
          laneEven: 'rgba(8, 47, 73, 0.45)',
          laneOdd: 'rgba(4, 30, 48, 0.55)',
          laneBorder: 'rgba(56, 189, 248, 0.25)',
          particleColors: ['#38bdf8', '#7dd3fc', '#bae6fd'],
          type: 'bubble',
        };
      case 4:
        return {
          level: 4,
          name: 'Pico das Tempestades',
          biome: 'Pico da Montanha',
          icon: '🏔️',
          bgLeft: '#18181b',
          bgMid: '#27272a',
          bgRight: '#1e293b',
          laneEven: 'rgba(39, 39, 42, 0.5)',
          laneOdd: 'rgba(24, 24, 27, 0.65)',
          laneBorder: 'rgba(226, 232, 240, 0.2)',
          particleColors: ['#e2e8f0', '#94a3b8', '#cbd5e1'],
          type: 'snow',
        };
      case 5:
      default:
        return {
          level: 5,
          name: 'Caldeira do Titã Corrompido',
          biome: 'Vulcão & Magma (Chefe Final)',
          icon: '🌋',
          bgLeft: '#1c0505',
          bgMid: '#2d0808',
          bgRight: '#3d0a18',
          laneEven: 'rgba(40, 8, 8, 0.6)',
          laneOdd: 'rgba(25, 4, 4, 0.7)',
          laneBorder: 'rgba(249, 115, 22, 0.35)',
          particleColors: ['#f97316', '#ea580c', '#fef08a', '#ef4444'],
          type: 'ember',
        };
    }
  };

  const currentBiome = getBiomeInfo(waveNumber);

  // Initialize or re-initialize ambient particles on biome change
  useEffect(() => {
    currentWaveRef.current = waveNumber;
    const biome = getBiomeInfo(waveNumber);

    particlesRef.current = Array.from({ length: 50 }).map(() => {
      const color = biome.particleColors[Math.floor(Math.random() * biome.particleColors.length)];
      let vx = (Math.random() - 0.5) * 0.4;
      let vy = -Math.random() * 0.6 - 0.2;
      let size = Math.random() * 2.5 + 1;

      if (biome.type === 'snow') {
        // Fast horizontal alpine wind
        vx = Math.random() * 2.5 + 1.2;
        vy = (Math.random() - 0.5) * 0.8;
        size = Math.random() * 2 + 1;
      } else if (biome.type === 'ember') {
        // High energy lava embers
        vx = (Math.random() - 0.5) * 0.8;
        vy = -Math.random() * 1.6 - 0.6;
        size = Math.random() * 3 + 1.5;
      } else if (biome.type === 'bubble') {
        // Floating water bubbles
        vx = Math.random() * 0.5 + 0.2;
        vy = -Math.random() * 0.5 - 0.3;
        size = Math.random() * 3 + 2;
      }

      return {
        x: Math.random() * ARENA_WIDTH,
        y: Math.random() * ARENA_HEIGHT,
        vx,
        vy,
        size,
        alpha: Math.random() * 0.7 + 0.3,
        color,
      };
    });
  }, [waveNumber]);

  // Main continuous canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const time = Date.now() * 0.003;
      const biomeLevel = currentWaveRef.current;

      // 1. Draw 16-bit Retro Pixel Art Environment (Terrain, Lanes, Shrines, and Portals)
      drawPixelEnvironment(ctx, biomeLevel, ARENA_WIDTH, ARENA_HEIGHT, time);

      // 2. Highlight Lane on Card Summon Hover
      for (let i = 0; i < LANES_COUNT; i++) {
        const laneY = i * LANE_HEIGHT;
        if (selectedCard && hoveredLane === i && selectedCard.type === 'creature') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(110, laneY + 4, ARENA_WIDTH - 200, LANE_HEIGHT - 8);

          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          ctx.strokeRect(110, laneY + 4, ARENA_WIDTH - 200, LANE_HEIGHT - 8);

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`+ INVOCAR ${selectedCard.namePt.toUpperCase()} AQUI`, 280, laneY + LANE_HEIGHT / 2 + 4);
        }
      }

      // 3. Draw Biome Ambient Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.y < 0) {
          p.y = ARENA_HEIGHT;
          p.x = Math.random() * ARENA_WIDTH;
        }
        if (p.x > ARENA_WIDTH) {
          p.x = 0;
          p.y = Math.random() * ARENA_HEIGHT;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 4. Render Battlefield Units using Custom Pixel Art Sprites
      units.forEach((unit) => {
        ctx.save();
        ctx.translate(unit.x, unit.y);

        const isAlly = unit.isAlly;
        const isFacingRight = unit.facing ? unit.facing === 'right' : isAlly;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, unit.height / 2 - 2, unit.width / 2.2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pixel Art Sprite
        const spriteId = getSpriteId(unit.cardId, unit.isAlly, unit.role, unit.maxHp);
        const bob = unit.isFlying
          ? Math.sin(time * 3 + unit.animationOffset) * 5
          : Math.sin(time * 5 + unit.animationOffset) * 2;

        drawPixelSprite(
          ctx,
          spriteId,
          unit.width,
          unit.height,
          isFacingRight, // Automatically faces left when defending the sanctuary!
          bob
        );

        // Entangling roots visual effect
        if (unit.statusEffects?.frozen && unit.statusEffects.frozen > 0) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, unit.width * 0.68, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Unit Name Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name, 0, -unit.height / 2 - 12);

        // HP Bar
        const barW = Math.max(34, unit.width);
        const hpPct = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(-barW / 2, -unit.height / 2 - 8, barW, 5);

        ctx.fillStyle = isAlly ? (hpPct > 0.4 ? '#10b981' : '#f59e0b') : '#ef4444';
        ctx.fillRect(-barW / 2, -unit.height / 2 - 8, barW * hpPct, 5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-barW / 2, -unit.height / 2 - 8, barW, 5);

        ctx.restore();
      });

      // 8. Draw Projectiles
      projectiles.forEach((proj) => {
        ctx.save();
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = proj.color;

        if (proj.type === 'thorn') {
          // Sharp thorn needle
          ctx.beginPath();
          ctx.ellipse(
            proj.x,
            proj.y,
            6,
            2.5,
            Math.atan2(proj.targetY - proj.startY, proj.targetX - proj.startX),
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (proj.type === 'fire') {
          // Emerald fire burst
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Default energy orb
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [units, projectiles, selectedCard, hoveredLane]);

  // Pointer position detection for lane hover and click
  const getLaneFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleY = ARENA_HEIGHT / rect.height;
    const clientY = (e.clientY - rect.top) * scaleY;
    const lane = Math.floor(clientY / LANE_HEIGHT);
    return Math.max(0, Math.min(LANES_COUNT - 1, lane));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const lane = getLaneFromPointer(e);
    setHoveredLane(lane);
  };

  const handlePointerLeave = () => {
    setHoveredLane(null);
  };

  const handleClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const lane = getLaneFromPointer(e);
    if (lane !== null) {
      onLaneClick(lane);
    }
  };

  return (
    <div className="relative w-full max-w-[840px] flex flex-col items-center select-none">
      {/* Top Sanctuary Health & Biome Info Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-t-xl text-xs backdrop-blur-sm">
        {/* Sanctuary HP */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="text-base">🌳</span> Santuário da Floresta
          </div>
          <div className="w-28 sm:w-44 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                summonerHp / summonerMaxHp > 0.4
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(0, (summonerHp / summonerMaxHp) * 100)}%` }}
            />
          </div>
          <span className="font-mono tabular-nums text-slate-300 font-semibold hidden sm:inline">
            {Math.max(0, Math.round(summonerHp))} / {summonerMaxHp} HP
          </span>
        </div>

        {/* Biome Name & Wave / Hostiles Count */}
        <div className="flex items-center gap-3 sm:gap-4 text-slate-300 font-mono">
          <div className="flex items-center gap-1 text-emerald-300 font-sans font-bold">
            <span>{currentBiome.icon}</span>
            <span className="hidden md:inline">{currentBiome.name}</span>
            <span className="md:hidden">Nv.{currentBiome.level}</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div>
            <span className="text-slate-400">Onda:</span>{' '}
            <strong className="text-white text-sm">{waveNumber}</strong>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div>
            <span className="text-slate-400">Mobs:</span>{' '}
            <strong className={enemiesRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}>
              {enemiesRemaining} / {totalWaveEnemies}
            </strong>
          </div>
        </div>
      </div>

      {/* Boss Health Bar Banner (Positioned above canvas so it NEVER covers top lane 0) */}
      {isBossWave && bossUnit && (
        <div className="w-full bg-slate-950/95 border-x-2 border-b-2 border-purple-500/70 px-4 py-2 shadow-2xl flex items-center justify-between gap-4 animate-fade-in z-20">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm animate-pulse">⚠️</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-purple-300">
                {bossUnit.name} (Chefe Final)
              </div>
              <div className="text-[10px] text-rose-400 font-mono">
                {Math.max(0, bossUnit.hp)} / {bossUnit.maxHp} HP
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-md h-3 bg-slate-900 rounded-full border border-purple-900/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 transition-all duration-150 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
              style={{ width: `${Math.max(0, (bossUnit.hp / bossUnit.maxHp) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-amber-400 font-mono tabular-nums shrink-0">
            {Math.round((bossUnit.hp / bossUnit.maxHp) * 100)}%
          </span>
        </div>
      )}

      {/* Main Canvas Battlefield */}
      <div className="relative w-full border-x-2 border-b-2 border-slate-800 rounded-b-xl overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handleClick}
          className={`pixelated block w-full h-auto cursor-${selectedCard ? 'crosshair' : 'default'} touch-none`}
          style={{
            aspectRatio: `${ARENA_WIDTH}/${ARENA_HEIGHT}`,
            imageRendering: 'pixelated',
          }}
        />

        {/* Lane summon helper chips (visible when card is selected) */}
        {selectedCard && selectedCard.type === 'creature' && !isPaused && (
          <div className="absolute inset-y-0 left-28 w-44 pointer-events-none flex flex-col justify-around py-4">
            {[0, 1, 2].map((laneIdx) => (
              <div
                key={laneIdx}
                className={`text-center py-1 px-2 rounded-lg text-xs font-bold transition-all ${
                  hoveredLane === laneIdx
                    ? 'bg-emerald-500 text-slate-950 shadow-lg scale-105'
                    : 'bg-slate-950/80 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                Pista {laneIdx === 0 ? 'Superior' : laneIdx === 1 ? 'Central' : 'Inferior'}
              </div>
            ))}
          </div>
        )}

        {/* In-Game Pause Overlay Modal */}
        {isPaused && (
          <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-2xl mb-3 shadow-lg shadow-amber-500/10">
              ⏸️
            </div>
            <h3 className="text-2xl font-black text-white tracking-wide">
              JOGO PAUSADO
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5 max-w-xs">
              A batalha foi congelada. Você pode reorganizar suas estratégias, verificar suas cartas ou retomar a qualquer momento.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-md">
              <button
                onClick={onResume}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>▶️</span> Continuar (Espaço)
              </button>
              {onOpenDeck && (
                <button
                  onClick={onOpenDeck}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl text-sm border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🃏</span> Ajustar Baralho
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs">
              {onRestartWave && (
                <button
                  onClick={onRestartWave}
                  className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <span>🔄</span> Reiniciar Onda {waveNumber}
                </button>
              )}
              {onRestartWave && onBackToMenu && (
                <span className="text-slate-600">·</span>
              )}
              {onBackToMenu && (
                <button
                  onClick={onBackToMenu}
                  className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <span>🏠</span> Sair para o Menu
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
