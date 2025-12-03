import { useState, useEffect, useMemo, useRef } from 'react';
import type { GameState } from '../types/index';
import { getNumberColor } from '../types/index';
import soundManager from '../utils/sounds';
import './RouletteWheel.css';

interface RouletteWheelProps {
  gameState: GameState | null;
}

// European roulette wheel number order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const SEGMENT_ANGLE = 360 / WHEEL_NUMBERS.length;

// Animation constants
const WHEEL_SPEED = 180;  // degrees per second (wheel goes counter-clockwise)
const BALL_SPEED = 320;   // degrees per second (ball goes clockwise)
const SETTLE_DURATION = 5000; // 5 seconds to settle

export function RouletteWheel({ gameState }: RouletteWheelProps) {
  // Visual state (for rendering)
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(115);
  const [showResult, setShowResult] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  
  // Animation refs
  const animationRef = useRef<number | null>(null);
  const wheelRotationRef = useRef(0);
  const ballAngleRef = useRef(0);
  const ballRadiusRef = useRef(115);
  const lastCykSegmentRef = useRef(-1);
  
  // Phase tracking
  const phaseRef = useRef<'idle' | 'spinning' | 'settling'>('idle');
  const settleStartRef = useRef<number | null>(null);
  
  // Target positions for settling
  const targetWheelRotationRef = useRef(0);
  const targetBallAngleRef = useRef(0);
  
  const winningNumberRef = useRef<number | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  
  // Start positions for settling interpolation
  const settleStartWheelRef = useRef(0);
  const settleStartBallRef = useRef(0);

  // Main animation loop
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      const phase = phaseRef.current;
      
      if (phase === 'spinning') {
        // Wheel spins counter-clockwise, ball spins clockwise at constant speed
        wheelRotationRef.current -= WHEEL_SPEED * deltaTime;
        ballAngleRef.current += BALL_SPEED * deltaTime;
        
        // Play cyk sound when ball passes a segment
        const relativeAngle = ((ballAngleRef.current - wheelRotationRef.current) % 360 + 360) % 360;
        const currentSegment = Math.floor(relativeAngle / SEGMENT_ANGLE);
        if (currentSegment !== lastCykSegmentRef.current) {
          lastCykSegmentRef.current = currentSegment;
          soundManager.playCyk(0.7);
        }
        
      } else if (phase === 'settling') {
        if (settleStartRef.current === null) {
          // Initialize settling - save starting positions
          settleStartRef.current = currentTime;
          settleStartWheelRef.current = wheelRotationRef.current;
          settleStartBallRef.current = ballAngleRef.current;
          
          const winNum = winningNumberRef.current!;
          const numberIndex = WHEEL_NUMBERS.indexOf(winNum);
          const segmentAngle = numberIndex * SEGMENT_ANGLE;
          
          // COORDINATE SYSTEMS:
          // CSS wheel: rotate(0) means segment is at TOP of wheel (12 o'clock position)
          // Math/ball: angle 0 = RIGHT (3 o'clock), 90 = DOWN, 180 = LEFT, 270 = UP/TOP
          // Pointer: physically at TOP of screen
          //
          // When wheelRotation = 0, segment at segmentAngle appears at screen position segmentAngle
          // (measured from TOP = 0 in CSS rotation terms)
          //
          // For segment at segmentAngle to appear at TOP (pointer):
          // We need: segmentAngle + wheelRotation = 0 (mod 360)
          // So: wheelRotation = -segmentAngle
          
          const targetWheelMod = ((-segmentAngle % 360) + 360) % 360;
          const currentWheelMod = ((wheelRotationRef.current % 360) + 360) % 360;
          
          let wheelDelta = targetWheelMod - currentWheelMod;
          if (wheelDelta > 0) wheelDelta -= 360; // Counter-clockwise
          wheelDelta -= 3 * 360; // Extra spins
          
          targetWheelRotationRef.current = wheelRotationRef.current + wheelDelta;
          
          // Ball position in MATH coordinates (0=right, 90=down, 180=left, 270=up)
          // The ball needs to be at TOP = 270° in math coords to align with pointer
          // AND it should visually be on the winning segment
          //
          // Since the segment will be at TOP (CSS 0°), and pointer is at TOP,
          // ball should be at TOP = 270° in math coordinates
          
          const targetBallAngle = 270; // TOP in math coordinates
          const currentBallMod = ((ballAngleRef.current % 360) + 360) % 360;
          
          let ballDelta = targetBallAngle - currentBallMod;
          if (ballDelta < 0) ballDelta += 360; // Clockwise
          ballDelta += 4 * 360; // Extra spins
          
          targetBallAngleRef.current = ballAngleRef.current + ballDelta;
        }
        
        const elapsed = currentTime - settleStartRef.current;
        const t = Math.min(elapsed / SETTLE_DURATION, 1);
        
        // Ease out - starts fast (like current speed), ends slow
        const easeOut = t * (2 - t);
        
        // Interpolate from start to target
        wheelRotationRef.current = settleStartWheelRef.current + 
          (targetWheelRotationRef.current - settleStartWheelRef.current) * easeOut;
        ballAngleRef.current = settleStartBallRef.current + 
          (targetBallAngleRef.current - settleStartBallRef.current) * easeOut;
        
        // Ball spirals inward
        const initialRadius = 140;
        const finalRadius = 115;
        ballRadiusRef.current = initialRadius - (initialRadius - finalRadius) * easeOut;
        setBallRadius(ballRadiusRef.current);
        
        // Play cyk sound (quieter as it slows down)
        const relativeAngle = ((ballAngleRef.current - wheelRotationRef.current) % 360 + 360) % 360;
        const currentSegment = Math.floor(relativeAngle / SEGMENT_ANGLE);
        if (currentSegment !== lastCykSegmentRef.current) {
          lastCykSegmentRef.current = currentSegment;
          const volume = 0.3 + (1 - t) * 0.5;
          soundManager.playCyk(volume);
        }
        
        // End settling
        if (t >= 1) {
          phaseRef.current = 'idle';
          // Snap to exact targets
          wheelRotationRef.current = targetWheelRotationRef.current;
          ballAngleRef.current = targetBallAngleRef.current;
          
          // Show result 3s after wheel fully stops
          setTimeout(() => {
            setDisplayNumber(winningNumberRef.current);
            setShowResult(true);
          }, 3000);
        }
      }
      // In 'idle' phase, nothing moves
      
      // Update visual state
      setWheelRotation(wheelRotationRef.current);
      setBallAngle(ballAngleRef.current);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle game state changes
  useEffect(() => {
    const currentStatus = gameState?.status;
    const prevStatus = previousStatusRef.current;
    
    if (currentStatus === prevStatus) return;
    previousStatusRef.current = currentStatus || null;
    
    if (currentStatus === 'SPINNING') {
      // Start spinning phase
      phaseRef.current = 'spinning';
      settleStartRef.current = null;
      setShowResult(false);
      setDisplayNumber(null);
      lastCykSegmentRef.current = -1;
      
      // Reset ball to outer track
      ballRadiusRef.current = 140;
      setBallRadius(140);
      
    } else if (currentStatus === 'FINISHED' && gameState?.winningNumber !== undefined) {
      // Start settling phase
      winningNumberRef.current = gameState.winningNumber;
      phaseRef.current = 'settling';
      
    } else if (currentStatus === 'BETTING_OPEN') {
      // Stay idle, keep showing last result
      phaseRef.current = 'idle';
      
    } else if (currentStatus === 'BETTING_CLOSED') {
      soundManager.play('tick');
    }
  }, [gameState?.status, gameState?.winningNumber]);

  // Play tick sound on countdown
  useEffect(() => {
    if (gameState?.status === 'BETTING_OPEN' && gameState.remainingSeconds <= 5 && gameState.remainingSeconds > 0) {
      soundManager.play('tick');
    }
  }, [gameState?.remainingSeconds, gameState?.status]);

  const resultColor = useMemo(() => {
    if (displayNumber === null) return '';
    return getNumberColor(displayNumber).toLowerCase();
  }, [displayNumber]);

  // Calculate ball position
  const ballStyle = useMemo(() => {
    const radians = (ballAngle * Math.PI) / 180;
    const x = Math.cos(radians) * ballRadius;
    const y = Math.sin(radians) * ballRadius;
    return {
      transform: `translate(${x}px, ${y}px)`,
    };
  }, [ballAngle, ballRadius]);

  return (
    <div className="roulette-container">
      <div className="roulette-outer-ring">
        <div 
          className="roulette-wheel"
          style={{ transform: `rotate(${wheelRotation}deg)` }}
        >
          {WHEEL_NUMBERS.map((num, index) => {
            const angle = (360 / WHEEL_NUMBERS.length) * index;
            const color = getNumberColor(num);
            return (
              <div
                key={num}
                className={`wheel-segment ${color.toLowerCase()}`}
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <span className="segment-number">{num}</span>
              </div>
            );
          })}
          <div className="wheel-center">
            <div className="wheel-center-inner" />
          </div>
        </div>
        
        <div className="ball-container">
          <div 
            className="ball visible"
            style={ballStyle}
          />
        </div>
        
        <div className="wheel-pointer" />
        
        {showResult && displayNumber !== null && (
          <div className={`result-display ${resultColor}`}>
            <div className="result-number">{displayNumber}</div>
            <div className="result-color">{gameState?.winningColor}</div>
          </div>
        )}
      </div>
      
      <div className="game-status">
        {gameState ? (
          <>
            <div className={`status-badge ${gameState.status.toLowerCase().replace('_', '-')}`}>
              {formatStatus(gameState.status)}
            </div>
            <div className="timer">
              <span className="timer-value">{gameState.remainingSeconds}</span>
              <span className="timer-label">seconds</span>
            </div>
          </>
        ) : (
          <div className="status-badge connecting">Connecting...</div>
        )}
      </div>
    </div>
  );
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'BETTING_OPEN': '🎰 Place Your Bets!',
    'BETTING_CLOSED': '⏳ No More Bets',
    'SPINNING': '🎡 Spinning...',
    'FINISHED': '🎯 Result!',
    'SETTLED': '✅ Settled'
  };
  return statusMap[status] || status;
}

export default RouletteWheel;
