import { useState, useCallback } from 'react';
import type { BetType, GameState, Bet } from '../types/index';
import { getNumberColor } from '../types/index';
import api from '../services/api';
import soundManager from '../utils/sounds';
import { useADHD } from '../context/ADHDContext';
import './BettingTable.css';

interface BettingTableProps {
  gameState: GameState | null;
  currentBets: Bet[];
  onBetPlaced: () => void;
  onBetCancelled?: () => void;
  balance: number;
}

// Roulette table layout
const NUMBERS_LAYOUT = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
];

export function BettingTable({ gameState, currentBets, onBetPlaced, onBetCancelled, balance }: BettingTableProps) {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [cancellingBetId, setCancellingBetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { adhdMode } = useADHD();

  const canBet = gameState?.status === 'BETTING_OPEN';
  const showSubwaySurfers = adhdMode && (gameState?.status === 'BETTING_CLOSED' || gameState?.status === 'SPINNING');

  const placeBet = useCallback(async (betType: BetType, betValue: string) => {
    if (!canBet || loading) return;
    
    if (selectedAmount > balance) {
      setError('Insufficient balance');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.placeBet({
        betType,
        betValue,
        amount: selectedAmount
      });
      soundManager.play('chip');
      onBetPlaced();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place bet');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [canBet, loading, selectedAmount, balance, onBetPlaced]);

  const cancelBet = useCallback(async (betId: number) => {
    if (!canBet || cancellingBetId !== null) return;

    setCancellingBetId(betId);
    setError(null);

    try {
      await api.cancelBet(betId);
      onBetCancelled?.();
      onBetPlaced(); // Refresh bets list
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel bet');
      setTimeout(() => setError(null), 3000);
    } finally {
      setCancellingBetId(null);
    }
  }, [canBet, cancellingBetId, onBetCancelled, onBetPlaced]);

  const getTotalBetOnValue = (betType: BetType, betValue: string): number => {
    return currentBets
      .filter(b => b.betType === betType && b.betValue === betValue)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const totalBets = currentBets.reduce((sum, b) => sum + b.amount, 0);
  const potentialWin = currentBets.reduce((sum, b) => sum + b.potentialPayout, 0);

  const chipAmounts = [1, 5, 10, 25, 50, 100, 500];

  // Subway Surfers gameplay video for ADHD mode
  if (showSubwaySurfers) {
    return (
      <div className="betting-table subway-surfers-mode">
        <div className="betting-header">
          <h2>🚇 ADHD ZONE 🏃‍♂️</h2>
          <span className="adhd-badge">Wheel is spinning!</span>
        </div>
        <div className="subway-container">
          <iframe
            src="https://www.youtube.com/embed/9n7LiMKbELU?autoplay=1&mute=0&start=60&controls=0&loop=1&playlist=9n7LiMKbELU"
            title="Subway Surfers Gameplay"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="subway-video"
          />
          <div className="subway-overlay">
            <span className="spinning-text">🎰 Waiting for result... 🎰</span>
          </div>
        </div>
        {totalBets > 0 && (
          <div className="current-bet-summary">
            <span>💰 Your bets: ${totalBets}</span>
            <span>🎯 Potential: ${potentialWin}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="betting-table">
      <div className="betting-header">
        <h2>🎲 Betting Table</h2>
        {error && <div className="bet-error">{error}</div>}
      </div>

      {/* Chip Selector */}
      <div className="chip-selector">
        <span className="chip-label">Select Chip:</span>
        <div className="chips">
          {chipAmounts.map(amount => (
            <button
              key={amount}
              className={`chip chip-${amount} ${selectedAmount === amount ? 'selected' : ''}`}
              onClick={() => setSelectedAmount(amount)}
              disabled={!canBet}
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* Main Betting Grid */}
      <div className="betting-grid">
        {/* Zero */}
        <div className="zero-section">
          <button
            className={`bet-number green ${getTotalBetOnValue('STRAIGHT', '0') > 0 ? 'has-bet' : ''}`}
            onClick={() => placeBet('STRAIGHT', '0')}
            disabled={!canBet || loading}
          >
            <span className="number">0</span>
            {getTotalBetOnValue('STRAIGHT', '0') > 0 && (
              <span className="bet-chip">${getTotalBetOnValue('STRAIGHT', '0')}</span>
            )}
          </button>
        </div>

        {/* Numbers Grid */}
        <div className="numbers-grid">
          {NUMBERS_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="number-row">
              {row.map(num => {
                const color = getNumberColor(num);
                const betAmount = getTotalBetOnValue('STRAIGHT', num.toString());
                return (
                  <button
                    key={num}
                    className={`bet-number ${color.toLowerCase()} ${betAmount > 0 ? 'has-bet' : ''}`}
                    onClick={() => placeBet('STRAIGHT', num.toString())}
                    disabled={!canBet || loading}
                  >
                    <span className="number">{num}</span>
                    {betAmount > 0 && (
                      <span className="bet-chip">${betAmount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Column bets */}
        <div className="column-bets">
          {[1, 2, 3].map(col => {
            const betAmount = getTotalBetOnValue('COLUMN', col.toString());
            return (
              <button
                key={col}
                className={`bet-outside column ${betAmount > 0 ? 'has-bet' : ''}`}
                onClick={() => placeBet('COLUMN', col.toString())}
                disabled={!canBet || loading}
              >
                2:1
                {betAmount > 0 && <span className="bet-chip">${betAmount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outside Bets */}
      <div className="outside-bets">
        {/* Dozens */}
        <div className="bet-row dozens">
          {[
            { value: '1', label: '1st 12' },
            { value: '2', label: '2nd 12' },
            { value: '3', label: '3rd 12' }
          ].map(({ value, label }) => {
            const betAmount = getTotalBetOnValue('DOZEN', value);
            return (
              <button
                key={value}
                className={`bet-outside dozen ${betAmount > 0 ? 'has-bet' : ''}`}
                onClick={() => placeBet('DOZEN', value)}
                disabled={!canBet || loading}
              >
                {label}
                {betAmount > 0 && <span className="bet-chip">${betAmount}</span>}
              </button>
            );
          })}
        </div>

        {/* Even Money Bets */}
        <div className="bet-row even-money">
          {[
            { type: 'HALF' as BetType, value: 'LOW', label: '1-18' },
            { type: 'PARITY' as BetType, value: 'EVEN', label: 'EVEN' },
            { type: 'COLOR' as BetType, value: 'RED', label: 'RED', colorClass: 'red' },
            { type: 'COLOR' as BetType, value: 'BLACK', label: 'BLACK', colorClass: 'black' },
            { type: 'PARITY' as BetType, value: 'ODD', label: 'ODD' },
            { type: 'HALF' as BetType, value: 'HIGH', label: '19-36' }
          ].map(({ type, value, label, colorClass }) => {
            const betAmount = getTotalBetOnValue(type, value);
            return (
              <button
                key={`${type}-${value}`}
                className={`bet-outside even ${colorClass || ''} ${betAmount > 0 ? 'has-bet' : ''}`}
                onClick={() => placeBet(type, value)}
                disabled={!canBet || loading}
              >
                {label}
                {betAmount > 0 && <span className="bet-chip">${betAmount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bet Summary */}
      <div className="bet-summary">
        <div className="summary-item">
          <span className="summary-label">Total Bet:</span>
          <span className="summary-value">${totalBets.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Potential Win:</span>
          <span className="summary-value highlight">${potentialWin.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Balance:</span>
          <span className="summary-value">${balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Current Bets List */}
      {currentBets.length > 0 && (
        <div className="current-bets-list">
          <h3>Your Bets This Round</h3>
          <div className="bets-scroll">
            {currentBets.map(bet => (
              <div key={bet.id} className={`bet-item ${bet.settled && bet.winAmount && bet.winAmount > 0 ? 'won' : ''}`}>
                <span className="bet-type">{bet.betType}</span>
                <span className="bet-value">{bet.betValue}</span>
                <span className="bet-amount">${bet.amount}</span>
                <span className="bet-payout">→ ${bet.potentialPayout}</span>
                {canBet && !bet.settled && (
                  <button 
                    className="cancel-bet-btn" 
                    onClick={() => cancelBet(bet.id)}
                    disabled={cancellingBetId === bet.id}
                    title="Cancel bet"
                  >
                    {cancellingBetId === bet.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BettingTable;
