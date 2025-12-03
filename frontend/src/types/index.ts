// Game State Types
export type GameStatus = 'BETTING_OPEN' | 'BETTING_CLOSED' | 'SPINNING' | 'FINISHED' | 'SETTLED';

export interface GameState {
  gameId: number;
  status: GameStatus;
  remainingSeconds: number;
  resultHash: string;
  winningNumber: number | null;
  winningColor: 'RED' | 'BLACK' | 'GREEN' | null;
  resultKey: string | null;
}

// Bet Types
export type BetType = 'STRAIGHT' | 'SPLIT' | 'STREET' | 'CORNER' | 'LINE' | 'COLUMN' | 'DOZEN' | 'COLOR' | 'PARITY' | 'HALF';

export interface Bet {
  id: number;
  gameId: number;
  betType: BetType;
  betValue: string;
  amount: number;
  potentialPayout: number;
  multiplier: number;
  settled: boolean;
  winAmount: number | null;
  createdAt: string;
}

export interface PlaceBetRequest {
  betType: BetType;
  betValue: string;
  amount: number;
}

// Auth Types
export interface AuthResponse {
  token: string;
  username: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Wallet Types
export interface WalletBalance {
  balance: number;
}

export interface Transaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET_PLACED' | 'BET_WIN' | 'REFUND' | 'BONUS';
  referenceId: string | null;
  createdAt: string;
}

// Game History
export interface GameHistory {
  id: number;
  status: GameStatus;
  winningNumber: number;
  winningColor: 'RED' | 'BLACK' | 'GREEN';
  resultHash: string;
  resultKey: string;
  createdAt: string;
}

// Bet Stats
export interface BetStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  winRate: number;
}

// Bet History Response
export interface BetHistoryResponse {
  bets: Bet[];
  page: number;
  totalPages: number;
  totalElements: number;
}

// Roulette Number Colors
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export const getNumberColor = (num: number): 'RED' | 'BLACK' | 'GREEN' => {
  if (num === 0) return 'GREEN';
  return RED_NUMBERS.includes(num) ? 'RED' : 'BLACK';
};

// Bet multipliers
export const BET_MULTIPLIERS: Record<BetType, number> = {
  STRAIGHT: 36,
  SPLIT: 18,
  STREET: 12,
  CORNER: 9,
  LINE: 6,
  COLUMN: 3,
  DOZEN: 3,
  COLOR: 2,
  PARITY: 2,
  HALF: 2
};

// Chat Types
export interface ChatMessage {
  id: number;
  username: string;
  message: string;
  createdAt: string;
}

// Bet Results Notification (WebSocket)
export interface BetResultNotification {
  gameId: number;
  winningNumber: number;
  winningColor: string;
  bets: {
    betId: number;
    betType: string;
    betValue: string;
    amount: number;
    won: boolean;
    winAmount: number;
  }[];
  totalWon: number;
  newBalance: number;
}
