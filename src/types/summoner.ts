export type CardType = 'creature' | 'spell';

export type UnitRole = 'tank' | 'dps' | 'ranged' | 'flying' | 'support' | 'aoe';

export interface Card {
  id: string;
  name: string;
  namePt: string;
  cost: number;
  type: CardType;
  role: UnitRole;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number; // seconds between attacks
  range: number; // pixels (40 = melee, 180 = ranged)
  moveSpeed: number; // pixels per second
  description: string;
  abilityDescription: string;
  image: string;
  color: string;
  level: number;
  isUnlocked: boolean;
}

export interface BattlefieldUnit {
  id: string;
  cardId: string;
  name: string;
  isAlly: boolean;
  x: number;
  y: number;
  lane: number; // 0, 1, 2
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  attackCooldown: number;
  range: number;
  moveSpeed: number;
  role: UnitRole;
  color: string;
  image?: string;
  isFlying?: boolean;
  statusEffects: {
    frozen?: number;
    poison?: number;
    shield?: number;
  };
  animationOffset: number;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  isAlly: boolean;
  color: string;
  type: 'thorn' | 'fire' | 'leaf' | 'heal' | 'shadow';
}

export interface FloatingDamage {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface ParticleEffect {
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

export interface MobWaveConfig {
  waveNumber: number;
  name: string;
  totalEnemies: number;
  spawnInterval: number; // seconds
  enemyTypes: {
    type: 'crawler' | 'hound' | 'spider' | 'fiend' | 'boss';
    weight: number;
  }[];
  rewardCrystals: number;
}

export interface SummonerUpgrades {
  maxEnergy: number; // default 10
  energyRegenRate: number; // default 1.0 energy / sec
  summonerMaxHp: number; // default 1000
  crystalMultiplier: number;
}
