import { useEffect, useState } from 'react';
import type { GameHistory as GameHistoryType } from '../types/index';
import api from '../services/api';
import './GameHistory.css';

export function GameHistory() {
  const [history, setHistory] = useState<GameHistoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getGameHistory(20);
      setHistory(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="game-history">
        <h3>📊 Last Results</h3>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const getStats = () => {
    if (history.length === 0) return { red: 0, black: 0, green: 0 };
    const red = history.filter(g => g.winningColor === 'RED').length;
    const black = history.filter(g => g.winningColor === 'BLACK').length;
    const green = history.filter(g => g.winningColor === 'GREEN').length;
    return { red, black, green };
  };

  const stats = getStats();
  const lastSixResults = history.slice(0, 6);

  return (
    <div className="game-history compact">
      <h3>📊 Last Results</h3>
      
      <div className="history-stats">
        <div className="stat red">
          <span className="stat-color"></span>
          <span className="stat-count">{stats.red}</span>
          <span className="stat-percent">
            {history.length > 0 ? ((stats.red / history.length) * 100).toFixed(0) : 0}%
          </span>
        </div>
        <div className="stat black">
          <span className="stat-color"></span>
          <span className="stat-count">{stats.black}</span>
          <span className="stat-percent">
            {history.length > 0 ? ((stats.black / history.length) * 100).toFixed(0) : 0}%
          </span>
        </div>
        <div className="stat green">
          <span className="stat-color"></span>
          <span className="stat-count">{stats.green}</span>
        </div>
      </div>

      <div className="history-numbers">
        {lastSixResults.map((game) => (
          <div
            key={game.id}
            className={`history-number ${game.winningColor.toLowerCase()}`}
            title={`Game #${game.id}`}
          >
            {game.winningNumber}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameHistory;
