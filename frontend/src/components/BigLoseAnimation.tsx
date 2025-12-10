import React, { useEffect, useState, useRef } from 'react';
import { useLipko } from '../context/LipkoContext';
import './BigLoseAnimation.css';

interface BigLoseAnimationProps {
  amount: number;
  onComplete: () => void;
}

interface FallingChip {
  id: number;
  x: number;
  delay: number;
  rotation: number;
  color: string;
}

const CHIP_COLORS = ['#555', '#666', '#777', '#888'];

export function BigLoseAnimation({ amount, onComplete }: BigLoseAnimationProps) {
  const { lipkoMode } = useLipko();
  const [chips, setChips] = useState<FallingChip[]>([]);
  const [showContent, setShowContent] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Generate falling/breaking chips
    const newChips: FallingChip[] = [];
    for (let i = 0; i < 20; i++) {
      newChips.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
        rotation: Math.random() * 360,
        color: lipkoMode ? '#8b0000' : CHIP_COLORS[Math.floor(Math.random() * CHIP_COLORS.length)],
      });
    }
    setChips(newChips);

    setTimeout(() => setShowContent(true), 100);

    // Complete after 2 seconds
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="big-lose-overlay">
      <div className="big-lose-background" />
      
      {/* Falling gray chips */}
      {chips.map(chip => (
        <div
          key={chip.id}
          className="lose-chip"
          style={{
            left: `${chip.x}%`,
            animationDelay: `${chip.delay}s`,
            '--rotation': `${chip.rotation}deg`,
            '--chip-color': chip.color,
          } as React.CSSProperties}
        >
          <div className="chip-face">{lipkoMode ? '🎸' : '💀'}</div>
        </div>
      ))}

      {/* Main content */}
      <div className={`big-lose-content ${showContent ? 'visible' : ''}`}>
        <div className="big-lose-title">NO LUCK!</div>
        <div className="big-lose-amount">-${amount.toLocaleString()}</div>
        <div className="big-lose-subtitle">Better luck next time...</div>
      </div>

      {/* Red vignette effect */}
      <div className="red-vignette" />
    </div>
  );
}

export default BigLoseAnimation;
