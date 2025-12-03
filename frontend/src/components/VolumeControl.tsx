import { useState, useEffect } from 'react';
import soundManager from '../utils/sounds';
import { useADHD } from '../context/ADHDContext';
import './VolumeControl.css';

export function VolumeControl() {
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume() * 100);
  const [effectsVolume, setEffectsVolume] = useState(soundManager.getEffectsVolume() * 100);
  const [isOpen, setIsOpen] = useState(false);
  const { adhdMode, setAdhdMode } = useADHD();

  useEffect(() => {
    soundManager.setMusicVolume(musicVolume / 100);
  }, [musicVolume]);

  useEffect(() => {
    soundManager.setEffectsVolume(effectsVolume / 100);
  }, [effectsVolume]);

  return (
    <div className="volume-control">
      <button 
        className="volume-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Volume Controls"
      >
        🔊
      </button>
      
      {isOpen && (
        <div className="volume-panel">
          <div className="volume-header">
            <span>🎛️ Sound Settings</span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div className="adhd-toggle">
            <label className="adhd-label">
              <span className="adhd-icon">🧠⚡</span>
              <span className="adhd-text">ADHD Mode</span>
              <div 
                className={`toggle-switch ${adhdMode ? 'active' : ''}`}
                onClick={() => setAdhdMode(!adhdMode)}
              >
                <div className="toggle-slider"></div>
              </div>
            </label>
            {adhdMode && <span className="adhd-hint">Subway Surfers during spin!</span>}
          </div>
          
          <div className="volume-slider">
            <label>
              <span className="slider-icon">🎵</span>
              <span className="slider-label">Music</span>
              <span className="slider-value">{Math.round(musicVolume)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="slider music-slider"
            />
          </div>
          
          <div className="volume-slider">
            <label>
              <span className="slider-icon">🔔</span>
              <span className="slider-label">Effects</span>
              <span className="slider-value">{Math.round(effectsVolume)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={effectsVolume}
              onChange={(e) => setEffectsVolume(Number(e.target.value))}
              className="slider effects-slider"
            />
          </div>
          
          <div className="volume-presets">
            <button onClick={() => { setMusicVolume(0); setEffectsVolume(0); }}>🔇 Mute</button>
            <button onClick={() => { setMusicVolume(30); setEffectsVolume(50); }}>🔉 Low</button>
            <button onClick={() => { setMusicVolume(60); setEffectsVolume(80); }}>🔊 High</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VolumeControl;
