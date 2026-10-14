import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { GameState } from './types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Zap, Sparkles, ArrowLeft } from 'lucide-react';

interface SpaceDefenderProps {
  onGameOver: (score: number, details: string) => void;
  onExit: () => void;
  highScore: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface Laser {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isEnemy: boolean;
  color: string;
  damage: number;
}

interface Powerup {
  x: number;
  y: number;
  vy: number;
  type: 'weapon' | 'shield' | 'bomb' | 'heal' | 'multiplier';
  size: number;
  color: string;
  icon: string;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'scout' | 'cruiser' | 'asteroid' | 'boss';
  hp: number;
  maxHp: number;
  shootCooldown: number;
  scoreValue: number;
  rotation: number;
  rotSpeed: number;
}

export const SpaceDefender: React.FC<SpaceDefenderProps> = ({ onGameOver, onExit, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [shields, setShields] = useState(100);
  const [bombs, setBombs] = useState(2);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [multiplier, setMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(!sound.getIsMuted());

  // Game loop internal refs
  const stateRef = useRef({
    gameState: 'PLAYING' as GameState,
    score: 0,
    wave: 1,
    lives: 3,
    shields: 100,
    bombs: 2,
    weaponLevel: 1,
    multiplier: 1,
    multiplierTimer: 0,
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
    },
    player: {
      x: 350,
      y: 500,
      width: 44,
      height: 48,
      speed: 6.5,
      shootCooldown: 0,
      invulnerableTimer: 0,
    },
    stars: [] as Star[],
    lasers: [] as Laser[],
    enemies: [] as Enemy[],
    powerups: [] as Powerup[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    enemySpawnTimer: 0,
    waveEnemiesSpawned: 0,
    waveEnemiesTarget: 15,
    bossSpawned: false,
    shake: 0,
  });

  const triggerBomb = useCallback(() => {
    const s = stateRef.current;
    if (s.bombs <= 0 || s.gameState !== 'PLAYING') return;
    s.bombs -= 1;
    setBombs(s.bombs);

    sound.playExplosion('large');
    s.shake = 16;

    // Shockwave particles
    for (let i = 0; i < 90; i++) {
      const angle = (Math.PI * 2 * i) / 90;
      const speed = Math.random() * 8 + 4;
      s.particles.push({
        x: s.player.x,
        y: s.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: 40,
      });
    }

    // Destroy or heavily damage all active enemies
    s.enemies.forEach((enemy) => {
      enemy.hp -= 250;
      if (enemy.hp <= 0) {
        s.score += enemy.scoreValue * s.multiplier;
      }
    });
    setScore(s.score);
    s.lasers = s.lasers.filter((l) => !l.isEnemy);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setMuted(!next);
    setSoundEnabled(next);
  };

  const restartGame = () => {
    const s = stateRef.current;
    s.gameState = 'PLAYING';
    s.score = 0;
    s.wave = 1;
    s.lives = 3;
    s.shields = 100;
    s.bombs = 2;
    s.weaponLevel = 1;
    s.multiplier = 1;
    s.multiplierTimer = 0;
    s.player.x = 350;
    s.player.y = 520;
    s.player.invulnerableTimer = 60;
    s.lasers = [];
    s.enemies = [];
    s.powerups = [];
    s.particles = [];
    s.floatingTexts = [];
    s.waveEnemiesSpawned = 0;
    s.waveEnemiesTarget = 15;
    s.bossSpawned = false;
    s.shake = 0;

    setScore(0);
    setWave(1);
    setLives(3);
    setShields(100);
    setBombs(2);
    setWeaponLevel(1);
    setMultiplier(1);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Stars
    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * 700,
        y: Math.random() * 650,
        size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3,
        speed: Math.random() * 1.5 + 0.3,
        brightness: Math.random() * 0.8 + 0.2,
      });
    }
    stateRef.current.stars = stars;

    // Key listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = true;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = true;
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = true;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = true;
      if (e.code === 'Space' || e.key === 'j' || e.key === 'J') {
        s.keys.shoot = true;
        e.preventDefault();
      }
      if (e.code === 'KeyB' || e.key === 'k' || e.key === 'K') {
        triggerBomb();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (s.gameState === 'PLAYING') {
          s.gameState = 'PAUSED';
          setGameState('PAUSED');
        } else if (s.gameState === 'PAUSED') {
          s.gameState = 'PLAYING';
          setGameState('PLAYING');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') s.keys.left = false;
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') s.keys.right = false;
      if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') s.keys.up = false;
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') s.keys.down = false;
      if (e.code === 'Space' || e.key === 'j' || e.key === 'J') s.keys.shoot = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Update background stars regardless of pause
      s.stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });

      if (s.gameState === 'PLAYING') {
        // Player Movement
        if (s.keys.left && s.player.x > s.player.width / 2) {
          s.player.x -= s.player.speed;
        }
        if (s.keys.right && s.player.x < width - s.player.width / 2) {
          s.player.x += s.player.speed;
        }
        if (s.keys.up && s.player.y > s.player.height / 2) {
          s.player.y -= s.player.speed;
        }
        if (s.keys.down && s.player.y < height - s.player.height / 2) {
          s.player.y += s.player.speed;
        }

        // Engine thruster particles
        if (Math.random() < 0.8) {
          s.particles.push({
            x: s.player.x + (Math.random() * 8 - 4),
            y: s.player.y + s.player.height / 2,
            vx: Math.random() * 1.5 - 0.75,
            vy: Math.random() * 3 + 3,
            size: Math.random() * 3 + 2,
            color: Math.random() < 0.6 ? '#38bdf8' : '#f59e0b',
            alpha: 1,
            life: 0,
            maxLife: 20,
          });
        }

        // Player shooting
        if (s.player.shootCooldown > 0) {
          s.player.shootCooldown--;
        }

        if (s.keys.shoot && s.player.shootCooldown === 0) {
          sound.playLaser(750 + s.weaponLevel * 40);
          s.player.shootCooldown = Math.max(8, 14 - s.weaponLevel * 1.5);

          if (s.weaponLevel === 1) {
            s.lasers.push({
              x: s.player.x,
              y: s.player.y - 20,
              vx: 0,
              vy: -11,
              width: 4,
              height: 16,
              isEnemy: false,
              color: '#38bdf8',
              damage: 25,
            });
          } else if (s.weaponLevel === 2) {
            s.lasers.push(
              { x: s.player.x - 12, y: s.player.y - 16, vx: 0, vy: -11, width: 4, height: 16, isEnemy: false, color: '#38bdf8', damage: 25 },
              { x: s.player.x + 12, y: s.player.y - 16, vx: 0, vy: -11, width: 4, height: 16, isEnemy: false, color: '#38bdf8', damage: 25 }
            );
          } else if (s.weaponLevel === 3) {
            s.lasers.push(
              { x: s.player.x, y: s.player.y - 22, vx: 0, vy: -12, width: 5, height: 18, isEnemy: false, color: '#a855f7', damage: 32 },
              { x: s.player.x - 14, y: s.player.y - 16, vx: -1.6, vy: -11, width: 4, height: 15, isEnemy: false, color: '#38bdf8', damage: 25 },
              { x: s.player.x + 14, y: s.player.y - 16, vx: 1.6, vy: -11, width: 4, height: 15, isEnemy: false, color: '#38bdf8', damage: 25 }
            );
          } else {
            // Quad Plasma
            s.lasers.push(
              { x: s.player.x - 6, y: s.player.y - 22, vx: -0.6, vy: -12, width: 5, height: 18, isEnemy: false, color: '#f59e0b', damage: 35 },
              { x: s.player.x + 6, y: s.player.y - 22, vx: 0.6, vy: -12, width: 5, height: 18, isEnemy: false, color: '#f59e0b', damage: 35 },
              { x: s.player.x - 18, y: s.player.y - 16, vx: -2.4, vy: -10, width: 4, height: 16, isEnemy: false, color: '#38bdf8', damage: 30 },
              { x: s.player.x + 18, y: s.player.y - 16, vx: 2.4, vy: -10, width: 4, height: 16, isEnemy: false, color: '#38bdf8', damage: 30 }
            );
          }
        }

        if (s.player.invulnerableTimer > 0) {
          s.player.invulnerableTimer--;
        }

        // Multiplier decay timer
        if (s.multiplierTimer > 0) {
          s.multiplierTimer--;
          if (s.multiplierTimer === 0 && s.multiplier > 1) {
            s.multiplier = Math.max(1, s.multiplier - 1);
            setMultiplier(s.multiplier);
          }
        }

        // Enemy Spawning Logic
        s.enemySpawnTimer++;
        const spawnInterval = Math.max(25, 75 - s.wave * 4);

        if (s.enemySpawnTimer >= spawnInterval && s.waveEnemiesSpawned < s.waveEnemiesTarget) {
          s.enemySpawnTimer = 0;
          s.waveEnemiesSpawned++;

          const rand = Math.random();
          if (rand < 0.4) {
            // Asteroid
            const size = Math.random() * 20 + 26;
            s.enemies.push({
              id: Date.now() + Math.random(),
              x: Math.random() * (width - 60) + 30,
              y: -40,
              vx: Math.random() * 2 - 1,
              vy: Math.random() * 1.5 + 1.2,
              width: size,
              height: size,
              type: 'asteroid',
              hp: 40 + s.wave * 10,
              maxHp: 40 + s.wave * 10,
              shootCooldown: 9999,
              scoreValue: 60,
              rotation: 0,
              rotSpeed: (Math.random() - 0.5) * 0.05,
            });
          } else if (rand < 0.8) {
            // Scout Drone
            s.enemies.push({
              id: Date.now() + Math.random(),
              x: Math.random() * (width - 70) + 35,
              y: -30,
              vx: (Math.random() - 0.5) * 2.5,
              vy: Math.random() * 1.8 + 1.8,
              width: 32,
              height: 32,
              type: 'scout',
              hp: 30 + s.wave * 8,
              maxHp: 30 + s.wave * 8,
              shootCooldown: Math.floor(Math.random() * 40) + 35,
              scoreValue: 100,
              rotation: 0,
              rotSpeed: 0,
            });
          } else {
            // Cruiser
            s.enemies.push({
              id: Date.now() + Math.random(),
              x: Math.random() * (width - 80) + 40,
              y: -50,
              vx: (Math.random() - 0.5) * 1.2,
              vy: Math.random() * 0.9 + 0.9,
              width: 50,
              height: 44,
              type: 'cruiser',
              hp: 90 + s.wave * 15,
              maxHp: 90 + s.wave * 15,
              shootCooldown: 45,
              scoreValue: 220,
              rotation: 0,
              rotSpeed: 0,
            });
          }
        }

        // Boss Spawn on Wave 5 & 10
        if (s.wave % 5 === 0 && !s.bossSpawned && s.waveEnemiesSpawned >= s.waveEnemiesTarget && s.enemies.length === 0) {
          s.bossSpawned = true;
          s.enemies.push({
            id: Date.now(),
            x: width / 2,
            y: -80,
            vx: 1.5,
            vy: 1.0,
            width: 120,
            height: 90,
            type: 'boss',
            hp: 650 + s.wave * 200,
            maxHp: 650 + s.wave * 200,
            shootCooldown: 40,
            scoreValue: 3000,
            rotation: 0,
            rotSpeed: 0,
          });
          s.floatingTexts.push({
            x: width / 2,
            y: 200,
            text: `ALERTA DE CHEFE: NAVE-MÃE DO SETOR ${s.wave}!`,
            color: '#ef4444',
            alpha: 1,
            vy: -0.4,
          });
        }

        // Check Wave Completion
        if (s.waveEnemiesSpawned >= s.waveEnemiesTarget && s.enemies.length === 0 && (!s.bossSpawned || s.wave % 5 !== 0)) {
          s.wave += 1;
          s.waveEnemiesSpawned = 0;
          s.waveEnemiesTarget = 15 + s.wave * 4;
          s.bossSpawned = false;
          s.shields = Math.min(100, s.shields + 35);
          setWave(s.wave);
          setShields(s.shields);
          sound.playVictory();

          s.floatingTexts.push({
            x: width / 2,
            y: 260,
            text: `SETOR ${s.wave} ALCANÇADO!`,
            color: '#10b981',
            alpha: 1,
            vy: -0.5,
          });
        }

        // Update Lasers
        s.lasers.forEach((laser) => {
          laser.x += laser.vx;
          laser.y += laser.vy;
        });
        s.lasers = s.lasers.filter((l) => l.x >= -20 && l.x <= width + 20 && l.y >= -30 && l.y <= height + 30);

        // Update Enemies
        s.enemies.forEach((enemy) => {
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;
          enemy.rotation += enemy.rotSpeed;

          // Horizontal bounds bounce
          if (enemy.x < enemy.width / 2 || enemy.x > width - enemy.width / 2) {
            enemy.vx = -enemy.vx;
          }

          // Boss horizontal patrolling
          if (enemy.type === 'boss') {
            if (enemy.y < 120) {
              enemy.vy = 0.8;
            } else {
              enemy.vy = 0;
            }
          }

          // Enemy shooting
          if (enemy.type === 'scout') {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0 && enemy.y > 20) {
              enemy.shootCooldown = 60 + Math.random() * 40;
              s.lasers.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: 0,
                vy: 5.5,
                width: 4,
                height: 12,
                isEnemy: true,
                color: '#ef4444',
                damage: 15,
              });
            }
          } else if (enemy.type === 'cruiser') {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0 && enemy.y > 20) {
              enemy.shootCooldown = 55;
              const angle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x);
              s.lasers.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 4.5,
                vy: Math.sin(angle) * 4.5,
                width: 5,
                height: 12,
                isEnemy: true,
                color: '#f97316',
                damage: 22,
              });
            }
          } else if (enemy.type === 'boss') {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
              enemy.shootCooldown = 28;
              // Triple barrage
              [-0.8, 0, 0.8].forEach((angOffset) => {
                s.lasers.push({
                  x: enemy.x + (angOffset * 30),
                  y: enemy.y + enemy.height / 2,
                  vx: angOffset * 2.5,
                  vy: 5.5,
                  width: 6,
                  height: 16,
                  isEnemy: true,
                  color: '#dc2626',
                  damage: 25,
                });
              });
            }
          }
        });

        // Filter out enemies that went past the screen bottom
        s.enemies = s.enemies.filter((enemy) => {
          if (enemy.y > height + 60) {
            // Penalty for missed ships
            return false;
          }
          return true;
        });

        // Laser vs Enemy Collisions
        s.lasers.forEach((laser) => {
          if (laser.isEnemy) return;

          s.enemies.forEach((enemy) => {
            if (
              laser.x > enemy.x - enemy.width / 2 &&
              laser.x < enemy.x + enemy.width / 2 &&
              laser.y > enemy.y - enemy.height / 2 &&
              laser.y < enemy.y + enemy.height / 2
            ) {
              // Hit!
              laser.y = -999; // destroy laser
              enemy.hp -= laser.damage;
              sound.playHit(420);

              // Small spark particles
              for (let i = 0; i < 4; i++) {
                s.particles.push({
                  x: laser.x,
                  y: laser.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  size: 2,
                  color: '#fef08a',
                  alpha: 1,
                  life: 0,
                  maxLife: 15,
                });
              }

              // Enemy destroyed
              if (enemy.hp <= 0) {
                sound.playExplosion(enemy.type === 'boss' ? 'large' : 'small');
                s.shake = enemy.type === 'boss' ? 12 : 5;

                const earnedPoints = enemy.scoreValue * s.multiplier;
                s.score += earnedPoints;
                setScore(s.score);

                // Combo Multiplier Boost
                s.multiplier = Math.min(8, s.multiplier + 1);
                s.multiplierTimer = 180; // 3 seconds
                setMultiplier(s.multiplier);

                s.floatingTexts.push({
                  x: enemy.x,
                  y: enemy.y,
                  text: `+${earnedPoints}${s.multiplier > 1 ? ` (x${s.multiplier})` : ''}`,
                  color: s.multiplier >= 4 ? '#f59e0b' : '#38bdf8',
                  alpha: 1,
                  vy: -0.8,
                });

                // Explosion particles
                const count = enemy.type === 'boss' ? 70 : 18;
                for (let i = 0; i < count; i++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = Math.random() * 5 + 1;
                  s.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 4 + 2,
                    color: Math.random() < 0.5 ? '#f97316' : '#e11d48',
                    alpha: 1,
                    life: 0,
                    maxLife: 30,
                  });
                }

                // Chance to drop powerup
                const dropChance = enemy.type === 'boss' ? 1.0 : 0.22;
                if (Math.random() < dropChance) {
                  const types: Powerup['type'][] = ['weapon', 'shield', 'bomb', 'heal', 'multiplier'];
                  const picked = types[Math.floor(Math.random() * types.length)];
                  let color = '#38bdf8';
                  let icon = '⚡';
                  if (picked === 'weapon') { color = '#a855f7'; icon = 'UP'; }
                  if (picked === 'shield') { color = '#06b6d4'; icon = '🛡'; }
                  if (picked === 'bomb') { color = '#f59e0b'; icon = '💣'; }
                  if (picked === 'heal') { color = '#ec4899'; icon = '❤️'; }
                  if (picked === 'multiplier') { color = '#eab308'; icon = '2X'; }

                  s.powerups.push({
                    x: enemy.x,
                    y: enemy.y,
                    vy: 1.6,
                    type: picked,
                    size: 24,
                    color,
                    icon,
                  });
                }
              }
            }
          });
        });

        // Filter out defeated enemies
        s.enemies = s.enemies.filter((e) => e.hp > 0);

        // Update Powerups
        s.powerups.forEach((p) => {
          p.y += p.vy;

          // Pickup collision with player
          const dist = Math.hypot(p.x - s.player.x, p.y - s.player.y);
          if (dist < p.size / 2 + s.player.width / 2) {
            p.y = 9999; // picked up
            sound.playPowerup();

            if (p.type === 'weapon') {
              s.weaponLevel = Math.min(4, s.weaponLevel + 1);
              setWeaponLevel(s.weaponLevel);
              s.floatingTexts.push({ x: s.player.x, y: s.player.y - 30, text: 'ARMA MELHORADA!', color: '#a855f7', alpha: 1, vy: -0.8 });
            } else if (p.type === 'shield') {
              s.shields = Math.min(100, s.shields + 50);
              setShields(s.shields);
              s.floatingTexts.push({ x: s.player.x, y: s.player.y - 30, text: '+50 ESCUDO', color: '#06b6d4', alpha: 1, vy: -0.8 });
            } else if (p.type === 'bomb') {
              s.bombs = Math.min(5, s.bombs + 1);
              setBombs(s.bombs);
              s.floatingTexts.push({ x: s.player.x, y: s.player.y - 30, text: '+1 BOMBA DE PLASMA', color: '#f59e0b', alpha: 1, vy: -0.8 });
            } else if (p.type === 'heal') {
              s.lives = Math.min(5, s.lives + 1);
              setLives(s.lives);
              s.floatingTexts.push({ x: s.player.x, y: s.player.y - 30, text: '+1 VIDA', color: '#ec4899', alpha: 1, vy: -0.8 });
            } else if (p.type === 'multiplier') {
              s.multiplier = Math.min(8, s.multiplier + 2);
              s.multiplierTimer = 240;
              setMultiplier(s.multiplier);
              s.floatingTexts.push({ x: s.player.x, y: s.player.y - 30, text: 'MULTIPLICADOR x2!', color: '#eab308', alpha: 1, vy: -0.8 });
            }
          }
        });
        s.powerups = s.powerups.filter((p) => p.y < height + 40);

        // Player Collision with Enemy Lasers and Enemy Ships
        if (s.player.invulnerableTimer === 0) {
          // Check enemy lasers
          s.lasers.forEach((laser) => {
            if (!laser.isEnemy) return;

            if (
              laser.x > s.player.x - s.player.width / 2 &&
              laser.x < s.player.x + s.player.width / 2 &&
              laser.y > s.player.y - s.player.height / 2 &&
              laser.y < s.player.y + s.player.height / 2
            ) {
              laser.y = 9999;
              applyPlayerDamage(laser.damage);
            }
          });

          // Check direct enemy ship ramming
          s.enemies.forEach((enemy) => {
            const dist = Math.hypot(enemy.x - s.player.x, enemy.y - s.player.y);
            if (dist < (enemy.width + s.player.width) / 2.6) {
              applyPlayerDamage(40);
              enemy.hp -= 80;
            }
          });
        }

        function applyPlayerDamage(damage: number) {
          s.shake = 10;
          sound.playHit(150);

          if (s.shields > 0) {
            s.shields -= damage;
            if (s.shields < 0) {
              s.shields = 0;
            }
            setShields(s.shields);
            s.player.invulnerableTimer = 20;
          } else {
            s.lives -= 1;
            setLives(s.lives);
            s.player.invulnerableTimer = 75; // 1.25s of invulnerability
            s.weaponLevel = Math.max(1, s.weaponLevel - 1);
            setWeaponLevel(s.weaponLevel);
            s.shields = 40; // replenish slight emergency buffer
            setShields(s.shields);

            sound.playExplosion('large');

            // Debris from player
            for (let i = 0; i < 20; i++) {
              s.particles.push({
                x: s.player.x,
                y: s.player.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 3 + 2,
                color: '#38bdf8',
                alpha: 1,
                life: 0,
                maxLife: 25,
              });
            }

            if (s.lives <= 0) {
              s.gameState = 'GAME_OVER';
              setGameState('GAME_OVER');
              sound.playGameOver();
              onGameOver(s.score, `Setor ${s.wave} alcançado`);
            }
          }
        }

        // Update Particles
        s.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          p.alpha = 1 - p.life / p.maxLife;
        });
        s.particles = s.particles.filter((p) => p.life < p.maxLife);

        // Update Floating Texts
        s.floatingTexts.forEach((t) => {
          t.y += t.vy;
          t.alpha -= 0.02;
        });
        s.floatingTexts = s.floatingTexts.filter((t) => t.alpha > 0);

        // Decay screen shake
        if (s.shake > 0) {
          s.shake *= 0.88;
          if (s.shake < 0.2) s.shake = 0;
        }
      }

      // ---------------- RENDER PASS ----------------
      ctx.save();

      // Screen shake translation
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }

      // Background clear
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, width, height);

      // Stars
      s.stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Subtle Cosmic Nebula Dust
      const gradient = ctx.createRadialGradient(width / 2, height * 0.4, 40, width / 2, height * 0.4, 340);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
      gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render Powerups
      s.powerups.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, 0, 0);
        ctx.restore();
      });

      // Render Lasers
      s.lasers.forEach((l) => {
        ctx.save();
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = l.color;
        ctx.fillRect(l.x - l.width / 2, l.y - l.height / 2, l.width, l.height);
        ctx.restore();
      });

      // Render Enemies
      s.enemies.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);

        if (enemy.type === 'asteroid') {
          // Drawing jagged rock
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const points = 7;
          for (let i = 0; i < points; i++) {
            const angle = (i * Math.PI * 2) / points;
            const r = (enemy.width / 2) * (0.8 + ((i % 2) * 0.3));
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (enemy.type === 'scout') {
          // Sleek scout drone
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, -enemy.height / 2);
          ctx.lineTo(0, -enemy.height / 4);
          ctx.lineTo(enemy.width / 2, -enemy.height / 2);
          ctx.closePath();
          ctx.fill();

          // Cockpit eye
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'cruiser') {
          // Heavy Cruiser
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, 0);
          ctx.lineTo(-enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2, 0);
          ctx.closePath();
          ctx.fill();

          // Plating line
          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (enemy.type === 'boss') {
          // Giant Boss Mothership
          ctx.shadowColor = '#b91c1c';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;

          // Main hull
          ctx.beginPath();
          ctx.moveTo(0, enemy.height / 2);
          ctx.lineTo(-enemy.width / 2, -enemy.height / 4);
          ctx.lineTo(-enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 3, -enemy.height / 2);
          ctx.lineTo(enemy.width / 2, -enemy.height / 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Core Reactor
          const pulse = Math.sin(Date.now() * 0.008) * 4;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 14 + pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Enemy HP Bar if damaged
        if (enemy.hp < enemy.maxHp && enemy.type !== 'asteroid') {
          const barW = enemy.width;
          const pct = Math.max(0, enemy.hp / enemy.maxHp);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(-barW / 2, -enemy.height / 2 - 8, barW, 4);
          ctx.fillStyle = enemy.type === 'boss' ? '#ef4444' : '#10b981';
          ctx.fillRect(-barW / 2, -enemy.height / 2 - 8, barW * pct, 4);
        }

        ctx.restore();
      });

      // Render Player Ship
      if (s.player.invulnerableTimer % 6 < 3) {
        ctx.save();
        ctx.translate(s.player.x, s.player.y);

        // Ship glowing engine trail
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;

        // Ship Body
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(0, -s.player.height / 2);
        ctx.lineTo(-s.player.width / 2, s.player.height / 2);
        ctx.lineTo(-s.player.width / 4, s.player.height / 3);
        ctx.lineTo(0, s.player.height / 2.5);
        ctx.lineTo(s.player.width / 4, s.player.height / 3);
        ctx.lineTo(s.player.width / 2, s.player.height / 2);
        ctx.closePath();
        ctx.fill();

        // Hull Highlight
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cockpit canopy
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.ellipse(0, -4, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shield Bubble
        if (s.shields > 0) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${Math.min(0.8, 0.2 + s.shields / 140)})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, s.player.width * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Render Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Floating Text
      s.floatingTexts.forEach((t) => {
        ctx.save();
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.max(0, t.alpha);
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onGameOver, triggerBomb]);

  // Touch & Pointer move handler for canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    stateRef.current.player.x = Math.max(30, Math.min(canvas.width - 30, clientX));
    stateRef.current.player.y = Math.max(40, Math.min(canvas.height - 40, clientY));
    stateRef.current.keys.shoot = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    stateRef.current.player.x = Math.max(30, Math.min(canvas.width - 30, clientX));
    stateRef.current.player.y = Math.max(40, Math.min(canvas.height - 40, clientY));
  };

  const handlePointerUp = () => {
    stateRef.current.keys.shoot = false;
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[680px] p-2 md:p-6 bg-slate-950 text-slate-100 select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[700px] flex items-center justify-between mb-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm">
        {/* Left: Score & Wave */}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Pontuação</div>
            <div className="text-xl font-bold font-mono tabular-nums text-sky-400">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Setor / Onda</div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {wave}
            </div>
          </div>
        </div>

        {/* Center: Multiplier */}
        {multiplier > 1 && (
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-mono font-bold animate-pulse">
            COMBO x{multiplier}
          </div>
        )}

        {/* Right: Status (Lives & Shield) */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Escudo {shields}%</div>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${shields}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-sm ${i < lives ? 'text-rose-500' : 'text-slate-700'}`}
              >
                ❤️
              </span>
            ))}
          </div>

          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={700}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="touch-none cursor-crosshair max-w-full h-auto block"
          style={{ width: 'min(700px, 92vw)', aspectRatio: '700/600' }}
        />

        {/* Floating Quick Action Overlays for Bomb & Pause */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            onClick={triggerBomb}
            disabled={bombs <= 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/90 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600/90 text-white text-xs font-bold rounded-lg shadow-lg active:scale-95 transition-all"
          >
            <Zap size={14} />
            BOMBA ({bombs})
          </button>

          <button
            onClick={() => {
              const s = stateRef.current;
              s.gameState = s.gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING';
              setGameState(s.gameState);
            }}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg shadow-lg"
          >
            {gameState === 'PLAYING' ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Game Paused Overlay */}
        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
            <h3 className="text-3xl font-extrabold text-white mb-2">Jogo Pausado</h3>
            <p className="text-slate-400 text-sm mb-6">Pressione P ou Continuar para retornar à batalha</p>

            <div className="flex flex-col gap-3 w-48">
              <button
                onClick={() => {
                  stateRef.current.gameState = 'PLAYING';
                  setGameState('PLAYING');
                }}
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                Continuar
              </button>
              <button
                onClick={restartGame}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors text-sm"
              >
                Reiniciar
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 font-medium rounded-lg transition-colors text-sm"
              >
                Sair do Jogo
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <div className="text-rose-500 text-sm font-semibold uppercase tracking-wider mb-1">Missão Abortada</div>
            <h3 className="text-4xl font-extrabold text-white mb-4">Fim de Jogo!</h3>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 w-full max-w-sm mb-6 text-center space-y-3">
              <div>
                <span className="text-xs text-slate-400">Pontuação Final</span>
                <div className="text-3xl font-black font-mono text-sky-400 tabular-nums">
                  {score.toLocaleString()}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>Setores Defendidos:</span>
                <span className="font-bold text-white">{wave}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Recorde Pessoal:</span>
                <span className="font-bold text-amber-400 font-mono tabular-nums">{Math.max(score, highScore).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={restartGame}
                className="flex items-center gap-2 py-3 px-6 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm"
              >
                <RotateCcw size={16} />
                Jogar Novamente
              </button>
              <button
                onClick={onExit}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm"
              >
                Menu Principal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Indicator */}
      <div className="w-full max-w-[700px] flex items-center justify-between text-xs text-slate-400 mt-3 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar ao Hub
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-500">
          <span>Movimento: <strong className="text-slate-300">Setas / WASD / Toque</strong></span>
          <span>·</span>
          <span>Disparo: <strong className="text-slate-300">Espaço / Mouse</strong></span>
          <span>·</span>
          <span>Bomba: <strong className="text-slate-300">B</strong></span>
        </div>
      </div>
    </div>
  );
};
