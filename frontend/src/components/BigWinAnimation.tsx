import React, { useEffect, useState, useRef } from 'react';
import './BigWinAnimation.css';

interface BigWinAnimationProps {
  amount: number;
  onComplete: () => void;
}

interface Chip {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
  duration: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const CHIP_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

export function BigWinAnimation({ amount, onComplete }: BigWinAnimationProps) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [showAmount, setShowAmount] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Generate chips falling from top
    const newChips: Chip[] = [];
    for (let i = 0; i < 50; i++) {
      newChips.push({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 50,
        rotation: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 1,
        color: CHIP_COLORS[Math.floor(Math.random() * CHIP_COLORS.length)],
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 1.5,
      });
    }
    setChips(newChips);

    // Generate sparkles
    const newSparkles: Sparkle[] = [];
    for (let i = 0; i < 30; i++) {
      newSparkles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 10 + Math.random() * 30,
        delay: Math.random() * 2,
      });
    }
    setSparkles(newSparkles);

    // Show amount after a delay
    setTimeout(() => setShowAmount(true), 500);

    // Animate the amount counting up
    const targetAmount = amount;
    const duration = 2000;
    const startTime = Date.now();
    
    const animateAmount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayAmount(Math.floor(targetAmount * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animateAmount);
      }
    };
    
    setTimeout(animateAmount, 800);

    // Complete after animation
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 10000);
    return () => clearTimeout(timer);
  }, [amount]);

  return (
    <div className="big-win-overlay" ref={containerRef}>
      <div className="big-win-background" />
      
      {/* Golden rays */}
      <div className="golden-rays">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="ray" style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`,
          }}
        />
      ))}

      {/* Falling chips */}
      {chips.map(chip => (
        <div
          key={chip.id}
          className="falling-chip"
          style={{
            left: `${chip.x}%`,
            '--start-y': `${chip.y}vh`,
            '--rotation': `${chip.rotation}deg`,
            '--scale': chip.scale,
            '--chip-color': chip.color,
            animationDelay: `${chip.delay}s`,
            animationDuration: `${chip.duration}s`,
          } as React.CSSProperties}
        >
          <div className="chip-face">
            <span>$</span>
          </div>
        </div>
      ))}

      {/* Main content */}
      <div className={`big-win-content ${showAmount ? 'visible' : ''}`}>
        <div className="big-win-title">
          <span className="letter">B</span>
          <span className="letter">I</span>
          <span className="letter">G</span>
          <span className="letter space"> </span>
          <span className="letter">W</span>
          <span className="letter">I</span>
          <span className="letter">N</span>
          <span className="letter">!</span>
        </div>
        <div className="big-win-amount">
          <span className="currency">$</span>
          <span className="value">{displayAmount.toLocaleString()}</span>
        </div>
        <div className="big-win-subtitle">🎰 CONGRATULATIONS! 🎰</div>
      </div>

      {/* Confetti burst */}
      <div className="confetti-container">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${50 + (Math.random() - 0.5) * 20}%`,
              backgroundColor: CHIP_COLORS[i % CHIP_COLORS.length],
              animationDelay: `${Math.random() * 0.5}s`,
              '--drift': `${(Math.random() - 0.5) * 200}px`,
              '--fall-duration': `${2 + Math.random() * 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

export default BigWinAnimation;
