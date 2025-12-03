import { useState, useEffect } from 'react';
import api from '../services/api';
import type { BetStats, Transaction } from '../types/index';
import './Wallet.css';

interface WalletProps {
  balance: number;
  onBalanceChange: () => void;
}

export function Wallet({ balance, onBalanceChange }: WalletProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Refresh stats and transactions when balance changes or periodically
  useEffect(() => {
    loadStats();
    loadTransactions();
  }, [balance]);

  // Auto-refresh transactions every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTransactions();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getBetStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions(0, 10);
      // Sort by createdAt descending (newest first)
      const sorted = [...data].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(sorted);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.deposit(amount);
      onBalanceChange();
      loadTransactions();
      setShowDeposit(false);
      setDepositAmount('100');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="wallet">
      <div className="wallet-header">
        <div className="wallet-icon">💰</div>
        <div className="wallet-balance">
          <span className="balance-label">Balance</span>
          <span className="balance-value">${balance.toFixed(2)}</span>
        </div>
        <button 
          className="deposit-btn"
          onClick={() => setShowDeposit(!showDeposit)}
        >
          {showDeposit ? '✕' : '+ Add Funds'}
        </button>
      </div>

      {showDeposit && (
        <div className="deposit-section">
          <div className="quick-amounts">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                className={`quick-amount ${depositAmount === amount.toString() ? 'selected' : ''}`}
                onClick={() => setDepositAmount(amount.toString())}
              >
                ${amount}
              </button>
            ))}
          </div>
          <div className="deposit-input-group">
            <span className="currency">$</span>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
            />
            <button 
              className="confirm-deposit"
              onClick={handleDeposit}
              disabled={loading}
            >
              {loading ? '...' : 'Deposit'}
            </button>
          </div>
          {error && <div className="deposit-error">{error}</div>}
        </div>
      )}

      {stats && (
        <div className="wallet-stats">
          <div className="stat-item">
            <span className="stat-label">Total Bets</span>
            <span className="stat-value">{stats.totalBets}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{(stats.winRate * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Net Profit</span>
            <span className={`stat-value ${stats.netProfit >= 0 ? 'profit' : 'loss'}`}>
              {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <button 
        className="history-toggle"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? '▲ Hide History' : '▼ Show History'}
      </button>

      {showHistory && (
        <div className="transaction-history">
          <h4>Recent Transactions</h4>
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <div className="no-transactions">No transactions yet</div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className={`transaction ${tx.amount >= 0 ? 'credit' : 'debit'}`}>
                  <div className="tx-info">
                    <span className="tx-type">{formatTransactionType(tx.type)}</span>
                    <span className="tx-date">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="tx-amount">
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'DEPOSIT': '💵 Deposit',
    'WITHDRAWAL': '💸 Withdrawal',
    'BET_PLACED': '🎲 Bet Placed',
    'BET_WIN': '🎉 Win!',
    'REFUND': '↩️ Refund',
    'BONUS': '🎁 Bonus'
  };
  return typeMap[type] || type;
}

export default Wallet;
