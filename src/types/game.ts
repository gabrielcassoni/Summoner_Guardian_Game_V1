export type GameId = 'space' | 'snake' | 'brick';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export interface HighScoreRecord {
  id: string;
  gameId: GameId;
  playerName: string;
  score: number;
  date: string;
  details?: string;
}

export interface GameInfo {
  id: GameId;
  title: string;
  subtitle: string;
  genre: string;
  description: string;
  image: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  controls: string[];
}

export interface PlayerStats {
  totalGamesPlayed: number;
  totalScoreAllGames: number;
  highestScores: Record<GameId, number>;
  unlockedAchievements: string[];
}
