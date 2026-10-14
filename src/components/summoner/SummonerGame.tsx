import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, BattlefieldUnit, Projectile, FloatingDamage, SummonerUpgrades } from '../../types/summoner';
import { INITIAL_CARDS, INITIAL_DECK_IDS, CARD_ASSETS, getCardImage } from '../../data/summonerCards';
import { BattleArena } from './BattleArena';
import { CardHand } from './CardHand';
import { DeckBuilder } from './DeckBuilder';
import { SafeImage } from '../common/SafeImage';
import { sound } from '../../utils/audio';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, BookOpen, Layers, Zap, Heart, Trophy, ArrowRight } from 'lucide-react';

interface SummonerGameProps {
  onBackToHub?: () => void;
}

export const SummonerGame: React.FC<SummonerGameProps> = ({ onBackToHub }) => {
  // Collection & Deck State (stored in localStorage)
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_nature_cards');
      if (saved) {
        const parsed: Card[] = JSON.parse(saved);
        // Ensure image URLs are always updated with bundled assets even if localStorage had old raw paths
        return parsed.map((card) => ({
          ...card,
          image: getCardImage(card.id),
        }));
      }
    } catch {}
    return INITIAL_CARDS;
  });

  const [deckCardIds, setDeckCardIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_nature_deck');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DECK_IDS;
  });

  const [crystals, setCrystals] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexus_nature_crystals');
      if (saved) return Number(saved);
    } catch {}
    return 150; // Starting gift
  });

  const [upgrades, setUpgrades] = useState<SummonerUpgrades>(() => {
    try {
      const saved = localStorage.getItem('nexus_nature_upgrades');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      maxEnergy: 10,
      energyRegenRate: 1.0,
      summonerMaxHp: 1000,
      crystalMultiplier: 1.0,
    };
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem('nexus_nature_cards', JSON.stringify(cards));
  }, [cards]);
  useEffect(() => {
    localStorage.setItem('nexus_nature_deck', JSON.stringify(deckCardIds));
  }, [deckCardIds]);
  useEffect(() => {
    localStorage.setItem('nexus_nature_crystals', crystals.toString());
  }, [crystals]);
  useEffect(() => {
    localStorage.setItem('nexus_nature_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  // Battle State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [wave, setWave] = useState(1);
  const [summonerHp, setSummonerHp] = useState(upgrades.summonerMaxHp);
  const [energy, setEnergy] = useState(4);
  const [hand, setHand] = useState<Card[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [units, setUnits] = useState<BattlefieldUnit[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [waveDefeatedCount, setWaveDefeatedCount] = useState(0);
  const [totalWaveEnemies, setTotalWaveEnemies] = useState(8);
  const [isWaveComplete, setIsWaveComplete] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!sound.getIsMuted());

  // Refs for combat loop
  const loopRef = useRef({
    energy: 4,
    summonerHp: upgrades.summonerMaxHp,
    units: [] as BattlefieldUnit[],
    projectiles: [] as Projectile[],
    spawnTimer: 0,
    spawnCount: 0,
    totalWaveEnemies: 8,
    isBossSpawned: false,
    waveNumber: 1,
    deck: [] as Card[],
    hand: [] as Card[],
  });

  // Initialize Hand from Active Deck
  const drawCardFromDeck = useCallback((currentHand: Card[], deckCards: Card[]): Card => {
    const available = deckCards.filter((c) => c.isUnlocked);
    const randomCard = available[Math.floor(Math.random() * available.length)];
    return randomCard || INITIAL_CARDS[0];
  }, []);

  const initBattle = useCallback((targetWave: number = 1) => {
    const deckCards = deckCardIds
      .map((id) => cards.find((c) => c.id === id))
      .filter((c): c is Card => !!c && c.isUnlocked);

    // Initial 4 cards drawn
    const initialHand: Card[] = [];
    for (let i = 0; i < 4; i++) {
      initialHand.push(drawCardFromDeck(initialHand, deckCards));
    }

    const enemyCount = targetWave === 5 ? 24 : 6 + targetWave * 4;

    loopRef.current = {
      energy: 4,
      summonerHp: upgrades.summonerMaxHp,
      units: [],
      projectiles: [],
      spawnTimer: 0,
      spawnCount: 0,
      totalWaveEnemies: enemyCount,
      isBossSpawned: false,
      waveNumber: targetWave,
      deck: deckCards,
      hand: initialHand,
    };

    setWave(targetWave);
    setSummonerHp(upgrades.summonerMaxHp);
    setEnergy(4);
    setHand(initialHand);
    setSelectedCardIndex(null);
    setUnits([]);
    setProjectiles([]);
    setWaveDefeatedCount(0);
    setTotalWaveEnemies(enemyCount);
    setIsWaveComplete(false);
    setIsDefeated(false);
    setIsPlaying(true);
    setIsPaused(false);
  }, [cards, deckCardIds, drawCardFromDeck, upgrades.summonerMaxHp]);

  // Play a card
  const handlePlayCard = (card: Card, cardIndex: number) => {
    if (energy < card.cost) return;

    if (card.type === 'spell') {
      // Execute Spell immediately
      sound.playPowerup();
      setEnergy((prev) => {
        const next = Math.max(0, prev - card.cost);
        loopRef.current.energy = next;
        return next;
      });

      if (card.id === 'entangling_roots') {
        // Roots freeze all enemies for 4s
        loopRef.current.units.forEach((u) => {
          if (!u.isAlly) {
            u.statusEffects.frozen = 240; // 4 seconds at 60fps
            u.hp -= 60;
          }
        });
        sound.playHit(200);
      } else if (card.id === 'spore_nova') {
        // Spore nova damage all enemies + heals sanctuary
        loopRef.current.units.forEach((u) => {
          if (!u.isAlly) {
            u.hp -= 120;
          }
        });
        setSummonerHp((hp) => {
          const next = Math.min(upgrades.summonerMaxHp, hp + 180);
          loopRef.current.summonerHp = next;
          return next;
        });
        sound.playVictory();
      }

      // Draw replacement card
      const newHand = [...hand];
      newHand[cardIndex] = drawCardFromDeck(newHand, loopRef.current.deck);
      setHand(newHand);
      loopRef.current.hand = newHand;
      setSelectedCardIndex(null);
    } else {
      setSelectedCardIndex(selectedCardIndex === cardIndex ? null : cardIndex);
    }
  };

  // Summon creature on selected lane
  const handleLaneClick = (laneIndex: number) => {
    if (selectedCardIndex === null) return;
    const card = hand[selectedCardIndex];
    if (!card || card.type !== 'creature') return;
    if (energy < card.cost) return;

    // Deduct energy
    const nextEnergy = Math.max(0, energy - card.cost);
    setEnergy(nextEnergy);
    loopRef.current.energy = nextEnergy;

    sound.playScore();

    // Calculate Y coordinate for lane center
    const laneY = laneIndex * (440 / 3) + 440 / 6;

    // Spawn unit
    const newUnit: BattlefieldUnit = {
      id: `${card.id}-${Date.now()}-${Math.random()}`,
      cardId: card.id,
      name: card.namePt,
      isAlly: true,
      x: 125,
      y: laneY,
      lane: laneIndex,
      width: card.role === 'tank' ? 44 : card.role === 'flying' ? 36 : 38,
      height: card.role === 'tank' ? 48 : card.role === 'flying' ? 36 : 40,
      hp: card.hp,
      maxHp: card.hp,
      attack: card.attack,
      attackSpeed: card.attackSpeed,
      attackCooldown: 0,
      range: card.range,
      moveSpeed: card.moveSpeed,
      role: card.role,
      color: card.color,
      isFlying: card.role === 'flying',
      statusEffects: {},
      animationOffset: Math.random() * 10,
    };

    loopRef.current.units.push(newUnit);
    setUnits([...loopRef.current.units]);

    // Draw replacement card
    const newHand = [...hand];
    newHand[selectedCardIndex] = drawCardFromDeck(newHand, loopRef.current.deck);
    setHand(newHand);
    loopRef.current.hand = newHand;
    setSelectedCardIndex(null);
  };

  // Main 60 FPS Combat Game Loop
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    let animId: number;

    const gameLoop = () => {
      const s = loopRef.current;

      // 1. Regenerate Energy over time
      if (s.energy < upgrades.maxEnergy) {
        s.energy = Math.min(upgrades.maxEnergy, s.energy + (upgrades.energyRegenRate / 60));
        setEnergy(s.energy);
      }

      // 2. Mob Spawning
      s.spawnTimer++;
      const spawnInterval = Math.max(70, 160 - s.waveNumber * 15);

      if (s.spawnTimer >= spawnInterval && s.spawnCount < s.totalWaveEnemies) {
        s.spawnTimer = 0;
        s.spawnCount++;

        const isBoss = s.waveNumber === 5 && !s.isBossSpawned && s.spawnCount === s.totalWaveEnemies;
        if (isBoss) s.isBossSpawned = true;

        const lane = Math.floor(Math.random() * 3);
        const laneY = lane * (440 / 3) + 440 / 6;

        let mobName = 'Rastejante da Sombra';
        let mobHp = 110 + s.waveNumber * 35;
        let mobAtk = 18 + s.waveNumber * 6;
        let mobSpeed = 44;
        let mobRange = 40;
        let mobRole: BattlefieldUnit['role'] = 'dps';
        let mobColor = '#7e22ce';
        let mobWidth = 36;
        let mobHeight = 36;

        const rand = Math.random();
        if (isBoss) {
          mobName = 'Titã da Corrupção';
          mobHp = 1800;
          mobAtk = 80;
          mobSpeed = 22;
          mobRange = 60;
          mobRole = 'tank';
          mobColor = '#4c0519';
          mobWidth = 65;
          mobHeight = 65;
        } else if (rand < 0.35) {
          mobName = 'Cão de Obsidiana';
          mobSpeed = 64;
          mobHp = 90 + s.waveNumber * 25;
          mobColor = '#9333ea';
        } else if (rand < 0.65) {
          mobName = 'Aranha Tóxica';
          mobRange = 170;
          mobRole = 'ranged';
          mobHp = 120 + s.waveNumber * 30;
          mobColor = '#1e1b4b';
        } else {
          mobName = 'Demônio da Podridão';
          mobHp = 260 + s.waveNumber * 50;
          mobAtk = 32 + s.waveNumber * 8;
          mobSpeed = 30;
          mobRole = 'tank';
          mobColor = '#581c87';
          mobWidth = 42;
          mobHeight = 44;
        }

        s.units.push({
          id: `mob-${Date.now()}-${Math.random()}`,
          cardId: 'mob',
          name: mobName,
          isAlly: false,
          x: 770,
          y: laneY,
          lane,
          width: mobWidth,
          height: mobHeight,
          hp: mobHp,
          maxHp: mobHp,
          attack: mobAtk,
          attackSpeed: isBoss ? 1.8 : 1.1,
          attackCooldown: 0,
          range: mobRange,
          moveSpeed: mobSpeed,
          role: mobRole,
          color: mobColor,
          statusEffects: {},
          animationOffset: Math.random() * 10,
        });
      }

      // 3. Update Units Movement & Attack Cycles
      s.units.forEach((unit) => {
        // Cooldown decay
        if (unit.attackCooldown > 0) {
          unit.attackCooldown -= 1 / 60;
        }

        // Frozen / Roots decay
        if (unit.statusEffects.frozen && unit.statusEffects.frozen > 0) {
          unit.statusEffects.frozen--;
          return; // Cannot move or attack while rooted
        }

        // Check for targets in the same lane
        const targets = s.units.filter((other) => other.isAlly !== unit.isAlly && other.lane === unit.lane);
        
        let nearestTarget: BattlefieldUnit | null = null;
        let nearestDist = 9999;

        for (const target of targets) {
          const dist = Math.abs(target.x - unit.x);
          // Facing check: ally attacks to the right, mob attacks to the left
          const isFacing = unit.isAlly ? target.x > unit.x : target.x < unit.x;
          if (isFacing && dist < nearestDist) {
            nearestDist = dist;
            nearestTarget = target;
          }
        }

        // Sanctuary target for enemies if near sanctuary
        const attackingSanctuary = !unit.isAlly && unit.x <= 125;

        if (nearestTarget !== null && nearestDist <= unit.range) {
          const targetUnit: BattlefieldUnit = nearestTarget;
          // In combat range: Attack!
          if (unit.attackCooldown <= 0) {
            unit.attackCooldown = unit.attackSpeed;

            if (unit.role === 'ranged') {
              // Launch projectile
              s.projectiles.push({
                id: `proj-${Date.now()}-${Math.random()}`,
                startX: unit.x,
                startY: unit.y,
                x: unit.x,
                y: unit.y,
                targetX: targetUnit.x,
                targetY: targetUnit.y,
                speed: 8,
                damage: unit.attack,
                isAlly: unit.isAlly,
                color: unit.isAlly ? '#34d399' : '#c084fc',
                type: unit.isAlly ? 'thorn' : 'shadow',
              });
              sound.playLaser(unit.isAlly ? 800 : 400);
            } else {
              // Direct Melee Hit
              targetUnit.hp -= unit.attack;
              sound.playHit(unit.isAlly ? 350 : 220);
            }
          }
        } else if (attackingSanctuary) {
          // Mob attacking the sanctuary
          if (unit.attackCooldown <= 0) {
            unit.attackCooldown = unit.attackSpeed;
            s.summonerHp -= unit.attack;
            setSummonerHp(s.summonerHp);
            sound.playHit(180);

            if (s.summonerHp <= 0) {
              s.summonerHp = 0;
              setIsDefeated(true);
              sound.playGameOver();
            }
          }
        } else {
          // No enemies in range: March forward!
          const step = (unit.moveSpeed / 60);
          if (unit.isAlly) {
            unit.x += step;
          } else {
            unit.x -= step;
          }
        }

        // Pixie passive heal pulse
        if (unit.role === 'support' && unit.attackCooldown <= 0) {
          unit.attackCooldown = 2.5;
          const sameLaneAllies = s.units.filter((a) => a.isAlly && a.lane === unit.lane && a.id !== unit.id);
          sameLaneAllies.forEach((ally) => {
            ally.hp = Math.min(ally.maxHp, ally.hp + 45);
          });
        }
      });

      // 4. Update Projectiles
      s.projectiles.forEach((proj) => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= proj.speed) {
          // Projectile impact
          proj.x = 9999;
          const target = s.units.find(
            (u) => u.isAlly !== proj.isAlly && Math.hypot(u.x - proj.targetX, u.y - proj.targetY) < 40
          );
          if (target) {
            target.hp -= proj.damage;
            sound.playHit(420);
          }
        } else {
          proj.x += (dx / dist) * proj.speed;
          proj.y += (dy / dist) * proj.speed;
        }
      });
      s.projectiles = s.projectiles.filter((p) => p.x < 1200);

      // 5. Cleanup dead units & grant crystals
      const initialUnitsCount = s.units.length;
      s.units = s.units.filter((unit) => {
        if (unit.hp <= 0) {
          if (!unit.isAlly) {
            // Mob defeated
            const reward = unit.role === 'tank' ? 30 : 15;
            setCrystals((prev) => prev + reward);
            setWaveDefeatedCount((prev) => prev + 1);
          }
          return false;
        }
        return true;
      });

      // Check wave victory
      const allMobsSpawned = s.spawnCount >= s.totalWaveEnemies;
      const activeMobs = s.units.filter((u) => !u.isAlly);

      if (allMobsSpawned && activeMobs.length === 0 && !isWaveComplete && !isDefeated) {
        setIsWaveComplete(true);
        sound.playVictory();
        const waveBonus = 100 + s.waveNumber * 40;
        setCrystals((prev) => prev + waveBonus);
      }

      setUnits([...s.units]);
      setProjectiles([...s.projectiles]);

      if (!isDefeated && !isWaveComplete) {
        animId = requestAnimationFrame(gameLoop);
      }
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, isDefeated, isWaveComplete, upgrades]);

  // Card Upgrade Handler
  const handleUpgradeCard = (cardId: string) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;
    const cost = target.level * 60;
    if (crystals < cost) return;

    setCrystals((c) => c - cost);
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          return {
            ...card,
            level: card.level + 1,
            hp: Math.round(card.hp * 1.15),
            maxHp: Math.round(card.maxHp * 1.15),
            attack: Math.round(card.attack * 1.15),
          };
        }
        return card;
      })
    );
    sound.playPowerup();
  };

  // Card Unlock Handler
  const handleUnlockCard = (cardId: string) => {
    const cost = 120;
    if (crystals < cost) return;
    setCrystals((c) => c - cost);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isUnlocked: true } : c))
    );
    sound.playVictory();
  };

  // Buy Sanctuary Upgrade
  const handleBuyUpgrade = (type: 'maxEnergy' | 'energyRegen' | 'sanctuaryHp') => {
    if (type === 'maxEnergy') {
      if (crystals < 80) return;
      setCrystals((c) => c - 80);
      setUpgrades((u) => ({ ...u, maxEnergy: u.maxEnergy + 2 }));
    } else if (type === 'energyRegen') {
      if (crystals < 100) return;
      setCrystals((c) => c - 100);
      setUpgrades((u) => ({ ...u, energyRegenRate: u.energyRegenRate + 0.2 }));
    } else if (type === 'sanctuaryHp') {
      if (crystals < 70) return;
      setCrystals((c) => c - 70);
      setUpgrades((u) => ({ ...u, summonerMaxHp: u.summonerMaxHp + 250 }));
    }
    sound.playPowerup();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setMuted(!next);
    setSoundEnabled(next);
  };

  const selectedCard = selectedCardIndex !== null ? hand[selectedCardIndex] : null;
  const bossUnit = units.find((u) => !u.isAlly && u.role === 'tank' && u.maxHp >= 1500) || null;

  return (
    <div className="relative w-full flex flex-col items-center bg-[#070d14] text-slate-100 min-h-screen select-none pb-12">
      {/* Top Bar for Summoner Game */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              Guardião da Floresta
            </h1>
            <p className="text-[11px] text-emerald-400 font-semibold hidden sm:block">
              Invocador Ancestral · Batalha Tática de Cartas
            </p>
          </div>
        </div>

        {/* Crystals & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-xs sm:text-sm font-bold shadow-inner">
            <span>💎</span> {crystals} Cristais
          </div>

          <button
            onClick={() => setShowDeckBuilder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-white rounded-xl border border-slate-700 transition-colors shadow"
          >
            <Layers size={15} />
            <span className="hidden sm:inline">Customizar</span> Baralho ({deckCardIds.length})
          </button>

          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Silenciar som' : 'Ativar som'}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Main Game Screen */}
      {!isPlaying ? (
        /* Title & Start Screen */
        <div className="w-full max-w-4xl px-4 py-8 flex flex-col items-center">
          <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl mb-8 group">
            <SafeImage
              src={CARD_ASSETS.hero}
              alt="Invocador da Natureza"
              fallbackIcon="🧙‍♂️"
              className="w-full h-80 sm:h-96 object-cover object-top filter brightness-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-xl">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  Jogo de Defesa Tática com Cartas
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
                  Proteja o Santuário Sagrado
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Você é o Invocador da Natureza. As criaturas da podridão estão invadindo o bosque sagrado.
                  Sua energia de seiva regenera com o tempo: tome decisões rápidas, monte seu baralho e invoque
                  brotos, lobos espirituais e treants para defender seu santuário!
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => initBattle(1)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-base shadow-xl transition-transform active:scale-95"
                >
                  <Play size={18} fill="currentColor" />
                  Iniciar Batalha (Onda 1)
                </button>
                <button
                  onClick={() => setShowDeckBuilder(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700"
                >
                  <Layers size={14} /> Customizar Baralho & Upgrades
                </button>
              </div>
            </div>
          </div>

          {/* Quick Guide Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-bold">
                ⚡
              </div>
              <h3 className="font-bold text-sm text-white">Energia Contínua</h3>
              <p className="text-xs text-slate-400 mt-1">
                Sua energia carrega automaticamente a cada segundo. Gerencie o momento certo para gastar em criaturas baratas ou guardar para titãs.
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2 font-bold">
                🃏
              </div>
              <h3 className="font-bold text-sm text-white">Baralho Customizável</h3>
              <p className="text-xs text-slate-400 mt-1">
                Troque cartas entre partidas! Adicione tanques para bloquear ataques, arqueiros para disparar à distância e feitiços de cura.
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 font-bold">
                💎
              </div>
              <h3 className="font-bold text-sm text-white">Evolução & Recompensas</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ganhe cristais derrotando monstros. Suba o nível de suas cartas e aumente a regeneração de energia do Invocador na oficina.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Active Battlefield View */
        <div className="w-full max-w-4xl px-2 sm:px-4 pt-4 flex flex-col items-center">
          {/* Battle Arena */}
          <BattleArena
            selectedCard={selectedCard}
            onLaneClick={handleLaneClick}
            units={units}
            projectiles={projectiles}
            summonerHp={summonerHp}
            summonerMaxHp={upgrades.summonerMaxHp}
            waveNumber={wave}
            enemiesRemaining={totalWaveEnemies - waveDefeatedCount}
            totalWaveEnemies={totalWaveEnemies}
            isBossWave={wave === 5}
            bossUnit={bossUnit}
          />

          {/* Energy Bar Display */}
          <div className="w-full max-w-[840px] mt-3 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg flex flex-col gap-1.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <Zap size={14} className="animate-pulse" />
                <span>ENERGIA DA SEIVA</span>
              </div>
              <div className="font-mono text-emerald-300">
                {energy.toFixed(1)} / {upgrades.maxEnergy} ⚡{' '}
                <span className="text-[10px] text-slate-400 font-sans">
                  (+{upgrades.energyRegenRate.toFixed(1)}/s)
                </span>
              </div>
            </div>

            {/* Glowing Fluid Progress Bar */}
            <div className="w-full h-3.5 bg-slate-950 rounded-full border border-emerald-900/40 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 transition-all duration-75 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                style={{ width: `${(energy / upgrades.maxEnergy) * 100}%` }}
              />
              {/* Energy segmented ticks */}
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                {Array.from({ length: upgrades.maxEnergy }).map((_, i) => (
                  <div key={i} className="w-[1px] h-full bg-slate-900/60" />
                ))}
              </div>
            </div>
          </div>

          {/* Cards Hand */}
          <div className="w-full max-w-[840px] mt-2">
            <CardHand
              hand={hand}
              energy={energy}
              onPlayCard={handlePlayCard}
              selectedCardIndex={selectedCardIndex}
              onSelectCard={(idx) => setSelectedCardIndex(idx)}
            />
          </div>

          {/* Tactical Tip & Help */}
          <div className="w-full max-w-[840px] flex items-center justify-between text-xs text-slate-400 px-3 mt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(false)}
                className="hover:text-white transition-colors underline"
              >
                Voltar ao Menu
              </button>
              <span>·</span>
              <button
                onClick={() => setShowDeckBuilder(true)}
                className="hover:text-white transition-colors underline"
              >
                Ajustar Baralho
              </button>
            </div>
            <span className="text-slate-500 hidden sm:inline">
              {selectedCard
                ? selectedCard.type === 'creature'
                  ? '👉 Clique em uma das 3 pistas para invocar!'
                  : '👉 Clique na carta para lançar o feitiço!'
                : 'Selecione uma carta com custo disponível para posicionar no campo.'}
            </span>
          </div>
        </div>
      )}

      {/* Wave Victory Modal */}
      {isWaveComplete && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/70 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
              🏆
            </div>
            <div className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
              Bosque Purificado
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">
              Vitória na Onda {wave}!
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Você protegeu com bravura o Santuário contra as criaturas da podridão.
              Seus cristais foram depositados na sua reserva mágica!
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 flex justify-around font-mono text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-sans">Bônus da Onda</span>
                <strong className="text-emerald-400">+{100 + wave * 40} 💎</strong>
              </div>
              <div className="w-[1px] bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 block font-sans">Total de Cristais</span>
                <strong className="text-amber-400">{crystals} 💎</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (wave < 5) {
                    initBattle(wave + 1);
                  } else {
                    // Loop or replay boss
                    initBattle(1);
                  }
                }}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                {wave < 5 ? (
                  <>
                    Próxima Onda ({wave + 1}) <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Reiniciar Campanha <RotateCcw size={16} />
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsWaveComplete(false);
                  setShowDeckBuilder(true);
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Oficina / Baralho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defeat Modal */}
      {isDefeated && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/70 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
              💀
            </div>
            <div className="text-xs uppercase font-extrabold text-rose-400 tracking-wider">
              Santuário Rompido
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">
              A Floresta Caiu...
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Os monstros alcançaram a árvore sagrada. Ajuste a composição do seu baralho na oficina,
              fortaleça suas criaturas com cristais e tente novamente!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => initBattle(wave)}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Tentar Onda {wave} Novamente
              </button>

              <button
                onClick={() => {
                  setIsDefeated(false);
                  setShowDeckBuilder(true);
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Melhorar Baralho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck Builder Modal */}
      {showDeckBuilder && (
        <DeckBuilder
          cards={cards}
          deckCardIds={deckCardIds}
          onUpdateDeck={(newDeck) => setDeckCardIds(newDeck)}
          onUpgradeCard={handleUpgradeCard}
          onUnlockCard={handleUnlockCard}
          crystals={crystals}
          upgrades={upgrades}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setShowDeckBuilder(false)}
        />
      )}
    </div>
  );
};
