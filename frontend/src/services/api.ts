import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  WalletBalance,
  Transaction,
  Bet,
  PlaceBetRequest,
  GameState,
  GameHistory,
  BetStats,
  BetHistoryResponse,
  ChatMessage
} from '../types/index';

const API_BASE = 'https://api.letmeclean.pl';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Auth
  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    const data: LoginRequest = { usernameOrEmail, password };
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(response.token);
    return response;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const data: RegisterRequest = { username, email, password };
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(response.token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Wallet
  async getBalance(): Promise<WalletBalance> {
    return this.request<WalletBalance>('/api/wallet/balance');
  }

  async deposit(amount: number): Promise<WalletBalance> {
    return this.request<WalletBalance>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async getTransactions(page = 0, size = 20): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/api/wallet/transactions?page=${page}&size=${size}`);
  }

  // Game
  async getCurrentGame(): Promise<GameState | null> {
    return this.request<GameState | null>('/api/game/current');
  }

  async placeBet(bet: PlaceBetRequest): Promise<Bet> {
    return this.request<Bet>('/api/game/bet', {
      method: 'POST',
      body: JSON.stringify(bet)
    });
  }

  async getCurrentGameBets(): Promise<Bet[]> {
    return this.request<Bet[]>('/api/game/bets');
  }

  async cancelBet(betId: number): Promise<Bet> {
    return this.request<Bet>(`/api/game/bet/${betId}`, {
      method: 'DELETE'
    });
  }

  async getGameHistory(limit = 20): Promise<GameHistory[]> {
    return this.request<GameHistory[]>(`/api/game/history?limit=${limit}`);
  }

  // Chat
  async sendChatMessage(message: string): Promise<ChatMessage> {
    return this.request<ChatMessage>('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(`/api/chat/history?limit=${limit}`);
  }

  // Bets
  async getBetHistory(page = 0, size = 20): Promise<BetHistoryResponse> {
    return this.request<BetHistoryResponse>(`/api/bets/history?page=${page}&size=${size}`);
  }

  async getBetStats(): Promise<BetStats> {
    return this.request<BetStats>('/api/bets/stats');
  }
}

export const api = new ApiService();
export default api;
