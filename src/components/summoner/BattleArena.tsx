import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, BattlefieldUnit, Projectile, FloatingDamage, ParticleEffect } from '../../types/summoner';
import { sound } from '../../utils/audio';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredLane, setHoveredLane] = useState<number | null>(null);

  const LANES_COUNT = 3;
  const ARENA_WIDTH = 840;
  const ARENA_HEIGHT = 440;
  const LANE_HEIGHT = ARENA_HEIGHT / LANES_COUNT;

  // Background stars/spores
  const sporesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }>>([]);
  const particlesRef = useRef<ParticleEffect[]>([]);
  const floatingTextsRef = useRef<FloatingDamage[]>([]);

  useEffect(() => {
    // Generate gentle ambient floating spores
    sporesRef.current = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * ARENA_WIDTH,
      y: Math.random() * ARENA_HEIGHT,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.6 - 0.2,
      size: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.7 + 0.2,
    }));
  }, []);

  // Continuous render loop for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // 1. Draw Forest Battlefield Background
      const bgGrad = ctx.createLinearGradient(0, 0, ARENA_WIDTH, 0);
      bgGrad.addColorStop(0, '#062319'); // Lush nature green sanctuary
      bgGrad.addColorStop(0.35, '#0a3326');
      bgGrad.addColorStop(0.7, '#161d2d');
      bgGrad.addColorStop(1, '#200e2b'); // Dark corrupted rift
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Draw Lanes & Ground Texture
      for (let i = 0; i < LANES_COUNT; i++) {
        const laneY = i * LANE_HEIGHT;

        // Subtle lane turf stripe
        ctx.fillStyle = i % 2 === 0 ? 'rgba(6, 40, 28, 0.35)' : 'rgba(4, 25, 18, 0.45)';
        ctx.fillRect(0, laneY, ARENA_WIDTH, LANE_HEIGHT);

        // Lane divider dashed lines
        if (i > 0) {
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(100, laneY);
          ctx.lineTo(ARENA_WIDTH - 90, laneY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Highlight lane on card hover
        if (selectedCard && hoveredLane === i && selectedCard.type === 'creature') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
          ctx.fillRect(110, laneY + 4, ARENA_WIDTH - 200, LANE_HEIGHT - 8);

          ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(110, laneY + 4, ARENA_WIDTH - 200, LANE_HEIGHT - 8);

          // Lane summon indicator text
          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`+ Invocar ${selectedCard.namePt} Aqui`, 260, laneY + LANE_HEIGHT / 2 + 4);
        }
      }

      // Draw Sanctuary Line & Roots on Left
      ctx.fillStyle = 'rgba(5, 150, 105, 0.18)';
      ctx.fillRect(0, 0, 105, ARENA_HEIGHT);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(105, 0);
      ctx.lineTo(105, ARENA_HEIGHT);
      ctx.stroke();

      // Ancient Sanctuary Guardian Tree / Staff Icon
      ctx.save();
      ctx.translate(50, ARENA_HEIGHT / 2);
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();

      // Crystal center
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Sanctuary Rune Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SANTUÁRIO', 0, 30);
      ctx.restore();

      // Draw Corrupted Portal Rift on Right
      ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
      ctx.fillRect(ARENA_WIDTH - 85, 0, 85, ARENA_HEIGHT);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ARENA_WIDTH - 85, 0);
      ctx.lineTo(ARENA_WIDTH - 85, ARENA_HEIGHT);
      ctx.stroke();

      // Portal vortex
      ctx.save();
      ctx.translate(ARENA_WIDTH - 42, ARENA_HEIGHT / 2);
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PORTAL', 0, 26);
      ctx.restore();

      // Update & Draw Ambient Spores
      sporesRef.current.forEach((spore) => {
        spore.x += spore.vx;
        spore.y += spore.vy;
        if (spore.y < 0) {
          spore.y = ARENA_HEIGHT;
          spore.x = Math.random() * ARENA_WIDTH;
        }
        ctx.fillStyle = `rgba(110, 231, 183, ${spore.alpha})`;
        ctx.beginPath();
        ctx.arc(spore.x, spore.y, spore.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Battlefield Units
      units.forEach((unit) => {
        ctx.save();
        ctx.translate(unit.x, unit.y);

        const isAlly = unit.isAlly;
        const color = unit.color;

        // Shadow under unit
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, unit.height / 2 - 2, unit.width / 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Unit Body
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;

        if (unit.role === 'tank') {
          // Bulky Treant / Titan
          ctx.beginPath();
          ctx.roundRect(-unit.width / 2, -unit.height / 2, unit.width, unit.height, 8);
          ctx.fill();
          // Inner bark
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (unit.role === 'flying') {
          // Bird / Drake with floating bobbing
          const bob = Math.sin(Date.now() * 0.008 + unit.animationOffset) * 5;
          ctx.translate(0, bob);
          ctx.beginPath();
          ctx.moveTo(isAlly ? unit.width / 2 : -unit.width / 2, 0);
          ctx.lineTo(isAlly ? -unit.width / 2 : unit.width / 2, -unit.height / 2);
          ctx.lineTo(isAlly ? -unit.width / 3 : unit.width / 3, 0);
          ctx.lineTo(isAlly ? -unit.width / 2 : unit.width / 2, unit.height / 2);
          ctx.closePath();
          ctx.fill();
        } else if (unit.role === 'support') {
          // Pixie orb with glowing wings
          ctx.beginPath();
          ctx.arc(0, 0, unit.width / 2.2, 0, Math.PI * 2);
          ctx.fill();
          // Wings
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.ellipse(-8, -10, 6, 12, Math.PI / 4, 0, Math.PI * 2);
          ctx.ellipse(8, -10, 6, 12, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Agile wolf or mob
          ctx.beginPath();
          ctx.roundRect(-unit.width / 2, -unit.height / 2, unit.width, unit.height, 6);
          ctx.fill();
        }

        // Entangling roots visual effect
        if (unit.statusEffects?.frozen && unit.statusEffects.frozen > 0) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, unit.width * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Unit Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name, 0, -unit.height / 2 - 12);

        // HP Bar
        const barW = Math.max(34, unit.width);
        const hpPct = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, -unit.height / 2 - 8, barW, 5);

        ctx.fillStyle = isAlly ? (hpPct > 0.4 ? '#10b981' : '#f59e0b') : '#ef4444';
        ctx.fillRect(-barW / 2, -unit.height / 2 - 8, barW * hpPct, 5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-barW / 2, -unit.height / 2 - 8, barW, 5);

        ctx.restore();
      });

      // 3. Draw Projectiles
      projectiles.forEach((proj) => {
        ctx.save();
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = proj.color;

        if (proj.type === 'thorn') {
          // Sharp thorn needle
          ctx.beginPath();
          ctx.ellipse(proj.x, proj.y, 6, 2.5, Math.atan2(proj.targetY - proj.startY, proj.targetX - proj.startX), 0, Math.PI * 2);
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
      {/* Top Sanctuary Health & Wave Info Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-t-xl text-xs backdrop-blur-sm">
        {/* Sanctuary HP */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="text-base">🌳</span> Santuário da Floresta
          </div>
          <div className="w-32 sm:w-48 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                summonerHp / summonerMaxHp > 0.4 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(0, (summonerHp / summonerMaxHp) * 100)}%` }}
            />
          </div>
          <span className="font-mono tabular-nums text-slate-300 font-semibold">
            {Math.max(0, Math.round(summonerHp))} / {summonerMaxHp} HP
          </span>
        </div>

        {/* Wave & Hostiles Count */}
        <div className="flex items-center gap-4 text-slate-300 font-mono">
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

      {/* Main Canvas Battlefield */}
      <div className="relative w-full border-x-2 border-b-2 border-slate-800 rounded-b-xl overflow-hidden shadow-2xl bg-[#062319]">
        <canvas
          ref={canvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handleClick}
          className={`block w-full h-auto cursor-${selectedCard ? 'crosshair' : 'default'} touch-none`}
          style={{ aspectRatio: `${ARENA_WIDTH}/${ARENA_HEIGHT}` }}
        />

        {/* Boss Health Bar Banner (if Boss Wave active) */}
        {isBossWave && bossUnit && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-80 bg-slate-950/90 border border-purple-500/60 rounded-xl p-2 shadow-2xl backdrop-blur flex flex-col items-center animate-fade-in">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-1">
              <span>⚠️</span> {bossUnit.name} (Chefe)
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full border border-purple-900/60 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-rose-500 to-red-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (bossUnit.hp / bossUnit.maxHp) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-300 mt-1">
              {Math.max(0, bossUnit.hp)} / {bossUnit.maxHp} HP
            </div>
          </div>
        )}

        {/* Lane summon helper chips (visible when card is selected) */}
        {selectedCard && selectedCard.type === 'creature' && (
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
      </div>
    </div>
  );
};
