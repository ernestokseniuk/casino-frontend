import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useGameSocket from '../hooks/useGameSocket';
import api from '../services/api';
import type { Bet } from '../types/index';
import soundManager from '../utils/sounds';
import RouletteWheel from './RouletteWheel';
import BettingTable from './BettingTable';
import GameHistory from './GameHistory';
import Wallet from './Wallet';
import AuthModal from './AuthModal';
import BigWinAnimation from './BigWinAnimation';
import BigLoseAnimation from './BigLoseAnimation';
import Chat from './Chat';
import './GamePage.css';

export function GamePage() {
  const { isAuthenticated, username, logout, loading: authLoading } = useAuth();
  const { gameState, chatMessages, betResults, connected, error: wsError, reconnect } = useGameSocket();
  
  const [balance, setBalance] = useState(0);
  const [currentBets, setCurrentBets] = useState<Bet[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bigWinAnimation, setBigWinAnimation] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const [bigLoseAnimation, setBigLoseAnimation] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const previousGameIdRef = useRef<number | null>(null);
  const winCheckDoneRef = useRef<boolean>(false);
  const pendingBetsRef = useRef<Bet[]>([]);

  const loadBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getBalance();
      setBalance(data.balance);
    } catch (e) {
      console.error('Failed to load balance:', e);
    }
  }, [isAuthenticated]);

  const loadCurrentBets = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const bets = await api.getCurrentGameBets();
      setCurrentBets(bets);
      // Store bets for win/lose checking when game settles
      if (bets.length > 0) {
        pendingBetsRef.current = bets;
        console.log('Stored pending bets:', bets);
      }
    } catch (e) {
      console.error('Failed to load bets:', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBalance();
      loadCurrentBets();
    } else {
      setBalance(0);
      setCurrentBets([]);
    }
  }, [isAuthenticated, loadBalance, loadCurrentBets]);

  // Reload bets and balance when new game starts or game settles
  useEffect(() => {
    console.log('Game status changed:', gameState?.status, 'gameId:', gameState?.gameId, 'winningNumber:', gameState?.winningNumber);
    
    if (gameState?.status === 'BETTING_OPEN') {
      // New game started
      if (previousGameIdRef.current !== gameState.gameId) {
        previousGameIdRef.current = gameState.gameId;
        winCheckDoneRef.current = false;
        // Refresh balance when new game starts (in case we missed bet results)
        loadBalance();
      }
      loadCurrentBets();
    }
    
    // When betting closes, make sure we have the latest bets stored
    if (gameState?.status === 'BETTING_CLOSED') {
      // Store current bets before spinning starts
      if (currentBets.length > 0) {
        pendingBetsRef.current = currentBets;
        console.log('BETTING_CLOSED - stored bets:', currentBets);
      }
    }
    
    // Check for SETTLED or FINISHED status
    if ((gameState?.status === 'SETTLED' || gameState?.status === 'FINISHED') && !winCheckDoneRef.current && isAuthenticated) {
      winCheckDoneRef.current = true;
      
      // Use stored bets from before settling
      const betsToCheck = pendingBetsRef.current;
      const totalBetAmount = betsToCheck.reduce((sum, b) => sum + b.amount, 0);
      
      console.log('Game SETTLED - checking wins', { 
        betsToCheck, 
        totalBetAmount, 
        winningNumber: gameState.winningNumber 
      });
      
      if (totalBetAmount > 0 && gameState.winningNumber !== undefined && gameState.winningNumber !== null) {
        // Check which bets won based on winning number
        const winningNumber = gameState.winningNumber;
        
        // Helper function to check if a bet wins
        const checkBetWin = (bet: Bet): number => {
          const num = winningNumber;
          const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
          const isBlack = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(num);
          const betValue = bet.betValue;
          
          switch (bet.betType) {
            case 'STRAIGHT':
              return parseInt(betValue) === num ? bet.amount * 36 : 0;
            case 'COLOR':
              if (betValue === 'RED') return isRed ? bet.amount * 2 : 0;
              if (betValue === 'BLACK') return isBlack ? bet.amount * 2 : 0;
              return 0;
            case 'PARITY':
              if (betValue === 'EVEN') return num > 0 && num % 2 === 0 ? bet.amount * 2 : 0;
              if (betValue === 'ODD') return num > 0 && num % 2 === 1 ? bet.amount * 2 : 0;
              return 0;
            case 'HALF':
              if (betValue === 'LOW') return num >= 1 && num <= 18 ? bet.amount * 2 : 0;
              if (betValue === 'HIGH') return num >= 19 && num <= 36 ? bet.amount * 2 : 0;
              return 0;
            case 'DOZEN':
              if (betValue === '1ST') return num >= 1 && num <= 12 ? bet.amount * 3 : 0;
              if (betValue === '2ND') return num >= 13 && num <= 24 ? bet.amount * 3 : 0;
              if (betValue === '3RD') return num >= 25 && num <= 36 ? bet.amount * 3 : 0;
              return 0;
            case 'COLUMN':
              if (betValue === '1') return num > 0 && num % 3 === 1 ? bet.amount * 3 : 0;
              if (betValue === '2') return num > 0 && num % 3 === 2 ? bet.amount * 3 : 0;
              if (betValue === '3') return num > 0 && num % 3 === 0 ? bet.amount * 3 : 0;
              return 0;
            default:
              return 0;
          }
        };
        
        const totalWin = betsToCheck.reduce((sum, bet) => sum + checkBetWin(bet), 0);
        const netResult = totalWin - totalBetAmount;
        
        console.log('Win check result', { totalWin, netResult, totalBetAmount });
        
        // Delay animation significantly to wait for wheel to fully stop and result to show
        setTimeout(() => {
          console.log('Showing animation', { netResult, totalWin, totalBetAmount });
          if (netResult > 0) {
            soundManager.play('win');
            setBigWinAnimation({ show: true, amount: totalWin });
            console.log('BIG WIN ANIMATION TRIGGERED');
          } else {
            soundManager.play('lose');
            setBigLoseAnimation({ show: true, amount: totalBetAmount });
            console.log('BIG LOSE ANIMATION TRIGGERED');
          }
          loadBalance();
          // Clear pending bets after showing animation
          pendingBetsRef.current = [];
        }, 8000);
      }
    }
  }, [gameState?.status, gameState?.gameId, gameState?.winningNumber, loadCurrentBets, loadBalance, isAuthenticated, currentBets]);

  // Handle bet results from WebSocket (backup - if backend sends them)
  useEffect(() => {
    if (betResults && betResults.bets && betResults.bets.length > 0) {
      // Update balance from the notification
      setBalance(betResults.newBalance);
    }
  }, [betResults]);

  const handleBetPlaced = () => {
    loadBalance();
    loadCurrentBets();
  };

  const handleBigWinComplete = () => {
    setBigWinAnimation({ show: false, amount: 0 });
  };

  const handleBigLoseComplete = () => {
    setBigLoseAnimation({ show: false, amount: 0 });
  };

  if (authLoading) {
    return (
      <div className="game-page loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* Decorative elements */}
      <div className="casino-lights top"></div>
      <div className="casino-lights bottom"></div>

      {/* Header */}
      <header className="game-header">
        <div className="logo">
          <span className="logo-icon">🎰</span>
          <span className="logo-text">Royal Roulette</span>
        </div>

        <div className="header-status">
          {connected ? (
            <span className="connection-status connected">
              <span className="status-dot"></span>
              Live
            </span>
          ) : (
            <button className="connection-status disconnected" onClick={reconnect}>
              <span className="status-dot"></span>
              Reconnect
            </button>
          )}
        </div>

        <div className="header-user">
          {isAuthenticated ? (
            <>
              <span className="username">👤 {username}</span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowAuthModal(true)}>
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* WebSocket Error */}
      {wsError && (
        <div className="ws-error">
          Connection error: {wsError}
          <button onClick={reconnect}>Retry</button>
        </div>
      )}

      {/* Main Content */}
      <main className="game-content">
        {/* Left Sidebar */}
        <aside className="sidebar left">
          {isAuthenticated ? (
            <Wallet balance={balance} onBalanceChange={loadBalance} />
          ) : (
            <div className="login-prompt">
              <h3>🎲 Ready to Play?</h3>
              <p>Sign in to place bets and win big!</p>
              <button onClick={() => setShowAuthModal(true)}>
                Get Started
              </button>
            </div>
          )}
          <GameHistory />
          {isAuthenticated && (
            <Chat 
              messages={chatMessages} 
              isAuthenticated={isAuthenticated}
              onLoginClick={() => setShowAuthModal(true)}
            />
          )}
        </aside>

        {/* Center - Roulette */}
        <section className="roulette-section">
          <RouletteWheel gameState={gameState} />
          
          {gameState && (
            <div className="game-info">
              <span className="game-id">Game #{gameState.gameId}</span>
              <span className="provably-fair" title={`Hash: ${gameState.resultHash}`}>
                🔒 Provably Fair
              </span>
            </div>
          )}
        </section>

        {/* Right - Betting Table */}
        <aside className="sidebar right">
          {isAuthenticated ? (
            <BettingTable
              gameState={gameState}
              currentBets={currentBets}
              onBetPlaced={handleBetPlaced}
              onBetCancelled={loadBalance}
              balance={balance}
            />
          ) : (
            <div className="betting-locked">
              <div className="lock-icon">🔒</div>
              <h3>Sign In to Play</h3>
              <p>Create an account to start betting on the roulette!</p>
              <button onClick={() => setShowAuthModal(true)}>
                Join Now
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* Footer */}
      <footer className="game-footer">
        <p>🎲 Play responsibly. Must be 18+ to play.</p>
        <p>© 2025 Royal Roulette - For Entertainment Purposes Only</p>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Big Win Animation */}
      {bigWinAnimation.show && (
        <BigWinAnimation 
          amount={bigWinAnimation.amount} 
          onComplete={handleBigWinComplete} 
        />
      )}

      {/* Big Lose Animation */}
      {bigLoseAnimation.show && (
        <BigLoseAnimation 
          amount={bigLoseAnimation.amount} 
          onComplete={handleBigLoseComplete} 
        />
      )}
    </div>
  );
}

export default GamePage;
