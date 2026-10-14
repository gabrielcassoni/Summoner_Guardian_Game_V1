import { Card } from '../types/summoner';

// Import images directly so Vite bundles and hashes them for production
import heroImg from '../assets/images/summoner_nature_hero_1791937434433.jpg';
import treantImg from '../assets/images/nature_card_treant_1791937434428.jpg';
import wolfImg from '../assets/images/nature_card_wolf_1791937434089.jpg';
import pixieImg from '../assets/images/nature_card_pixie_1791938943807.jpg';
import hawkImg from '../assets/images/nature_card_hawk_1791938944227.jpg';
import viperImg from '../assets/images/nature_card_viper_1791938944800.jpg';
import sproutImg from '../assets/images/nature_card_sprout_1791938944737.jpg';
import mobImg from '../assets/images/corrupted_mob_beast_1791937434551.jpg';

export const CARD_ASSETS = {
  hero: heroImg,
  treant: treantImg,
  wolf: wolfImg,
  pixie: pixieImg,
  hawk: hawkImg,
  viper: viperImg,
  sprout: sproutImg,
  mob: mobImg,
};

/**
 * Returns the bundled, production-safe URL for any card ID.
 * This guarantees images never break in production even if localStorage had old paths.
 */
export const getCardImage = (cardId: string): string => {
  switch (cardId) {
    case 'thorn_sprout':
      return sproutImg;
    case 'spirit_wolf':
      return wolfImg;
    case 'bloom_pixie':
      return pixieImg;
    case 'storm_hawk':
      return hawkImg;
    case 'entangling_roots':
      return treantImg;
    case 'ancient_treant':
    case 'moss_colossus':
      return treantImg;
    case 'spore_nova':
      return pixieImg;
    case 'emerald_viper':
      return viperImg;
    case 'verdant_wyrm':
      return hawkImg;
    default:
      return heroImg;
  }
};

export const INITIAL_CARDS: Card[] = [
  {
    id: 'thorn_sprout',
    name: 'Thorn Sprout',
    namePt: 'Broto Espinhoso',
    cost: 1,
    type: 'creature',
    role: 'ranged',
    hp: 120,
    maxHp: 120,
    attack: 24,
    attackSpeed: 1.1,
    range: 190,
    moveSpeed: 38,
    description: 'Criatura botânica ágil de baixo custo que dispara saraivadas de espinhos afiados à distância.',
    abilityDescription: 'Custo baixíssimo para ciclagem rápida de cartas e defesa inicial.',
    image: sproutImg,
    color: '#84cc16',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'spirit_wolf',
    name: 'Spirit Wolf',
    namePt: 'Lobo Espiritual',
    cost: 2,
    type: 'creature',
    role: 'dps',
    hp: 220,
    maxHp: 220,
    attack: 42,
    attackSpeed: 0.9,
    range: 42,
    moveSpeed: 68,
    description: 'Predador espiritual feito de energia verde e folhas vivas. Corre em disparada contra mobs.',
    abilityDescription: 'Avanço veloz que intercepta inimigos antes de alcançarem o Invocador.',
    image: wolfImg,
    color: '#10b981',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'bloom_pixie',
    name: 'Bloom Pixie',
    namePt: 'Fada da Florada',
    cost: 2,
    type: 'creature',
    role: 'support',
    hp: 140,
    maxHp: 140,
    attack: 16,
    attackSpeed: 1.5,
    range: 160,
    moveSpeed: 42,
    description: 'Espírito voador que regenera periodicamente a vida de aliados próximos e emite pólen sagrado.',
    abilityDescription: 'Cura em área de aliados na mesma pista a cada 3 segundos.',
    image: pixieImg,
    color: '#34d399',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'storm_hawk',
    name: 'Storm Hawk',
    namePt: 'Gavião das Brisas',
    cost: 3,
    type: 'creature',
    role: 'flying',
    hp: 260,
    maxHp: 260,
    attack: 48,
    attackSpeed: 1.0,
    range: 120,
    moveSpeed: 75,
    description: 'Rapina veloz com plumagem de folhas cortantes que mergulha sobre inimigos do alto.',
    abilityDescription: 'Unidade voadora: ignora obstáculos terrestres e causa dano penetrante.',
    image: hawkImg,
    color: '#38bdf8',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'entangling_roots',
    name: 'Entangling Roots',
    namePt: 'Raízes Aprisionadoras',
    cost: 2,
    type: 'spell',
    role: 'aoe',
    hp: 0,
    maxHp: 0,
    attack: 60,
    attackSpeed: 0,
    range: 0,
    moveSpeed: 0,
    description: 'Feitiço imediato que ergue vinhas da terra, paralisando todos os inimigos na área por 4 segundos.',
    abilityDescription: 'Congela a marcha dos mobs e causa dano contínuo de esmagamento.',
    image: treantImg,
    color: '#059669',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'ancient_treant',
    name: 'Ancient Moss Treant',
    namePt: 'Treant Ancião de Musgo',
    cost: 4,
    type: 'creature',
    role: 'tank',
    hp: 680,
    maxHp: 680,
    attack: 65,
    attackSpeed: 1.4,
    range: 48,
    moveSpeed: 30,
    description: 'Guardião colossal das florestas esquecidas. Possui casca impenetrável e esmaga o solo.',
    abilityDescription: 'Tanque supremo: absorve imenso dano e bloqueia o avanço de grupos inteiros.',
    image: treantImg,
    color: '#15803d',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'spore_nova',
    name: 'Spore Nova',
    namePt: 'Chuva de Esporos',
    cost: 3,
    type: 'spell',
    role: 'aoe',
    hp: 0,
    maxHp: 0,
    attack: 110,
    attackSpeed: 0,
    range: 0,
    moveSpeed: 0,
    description: 'Detonação botânica que banha a arena em pólen místico, curando o Invocador e purificando mobs.',
    abilityDescription: 'Dano mágico em todos os inimigos da tela e restaura 150 de vida ao Santuário.',
    image: pixieImg,
    color: '#a855f7',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'moss_colossus',
    name: 'Moss Colossus',
    namePt: 'Colosso de Musgo e Pedra',
    cost: 5,
    type: 'creature',
    role: 'tank',
    hp: 950,
    maxHp: 950,
    attack: 85,
    attackSpeed: 1.6,
    range: 52,
    moveSpeed: 25,
    description: 'Entidade primordial da montanha viva com cristais de jade incrustados no coração.',
    abilityDescription: 'Ao surgir na arena, atordoa inimigos próximos e regenera 20 de HP por segundo.',
    image: treantImg,
    color: '#047857',
    level: 1,
    isUnlocked: false,
  },
  {
    id: 'emerald_viper',
    name: 'Emerald Viper',
    namePt: 'Víbora Esmeralda',
    cost: 3,
    type: 'creature',
    role: 'dps',
    hp: 240,
    maxHp: 240,
    attack: 35,
    attackSpeed: 0.8,
    range: 45,
    moveSpeed: 55,
    description: 'Serpente mística peçonhenta que injeta toxina concentrada, derretendo a armadura de monstros pesados.',
    abilityDescription: 'Ataques aplicam veneno mortal cumulativo (drena HP ao longo do tempo).',
    image: viperImg,
    color: '#06b6d4',
    level: 1,
    isUnlocked: true,
  },
  {
    id: 'verdant_wyrm',
    name: 'Verdant Wyrm',
    namePt: 'Wyrm das Folhas Antigas',
    cost: 6,
    type: 'creature',
    role: 'aoe',
    hp: 800,
    maxHp: 800,
    attack: 110,
    attackSpeed: 1.3,
    range: 150,
    moveSpeed: 36,
    description: 'Dragão lendário guardião da seiva vital. Sopra uma torrente contínua de fogo esmeralda.',
    abilityDescription: 'Ataque em linha perfurante que incinera ondas inteiras de mobs.',
    image: hawkImg,
    color: '#10b981',
    level: 1,
    isUnlocked: false,
  },
];

export const INITIAL_DECK_IDS = [
  'thorn_sprout',
  'spirit_wolf',
  'bloom_pixie',
  'storm_hawk',
  'entangling_roots',
  'ancient_treant',
  'spore_nova',
  'emerald_viper',
];
