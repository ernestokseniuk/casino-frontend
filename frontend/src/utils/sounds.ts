// Sound effects for the casino - classic "cyk cyk cyk" roulette sounds
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.6;

  constructor() {
    // AudioContext will be created on first user interaction
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a single "cyk" click sound - like ball hitting a metal divider
  playCyk(volume: number = 1.0) {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Create short metallic click
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // High frequency metallic click
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(2500, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.02);
    
    // Bandpass filter for metallic sound
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.Q.setValueAtTime(5, now);
    
    // Very short envelope - sharp click
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * volume * 0.4, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  // Play win sound - MEGA EPIC PARTY CELEBRATION!
  playWin() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // === AIRHORN INTRO ===
    for (let i = 0; i < 3; i++) {
      const hornOsc = ctx.createOscillator();
      const hornOsc2 = ctx.createOscillator();
      const hornGain = ctx.createGain();
      const hornFilter = ctx.createBiquadFilter();
      
      hornOsc.type = 'sawtooth';
      hornOsc2.type = 'square';
      hornOsc.frequency.setValueAtTime(440, now + i * 0.25);
      hornOsc2.frequency.setValueAtTime(442, now + i * 0.25); // slight detune
      
      hornFilter.type = 'lowpass';
      hornFilter.frequency.setValueAtTime(3000, now + i * 0.25);
      
      hornGain.gain.setValueAtTime(0, now + i * 0.25);
      hornGain.gain.linearRampToValueAtTime(this.volume * 0.3, now + i * 0.25 + 0.01);
      hornGain.gain.setValueAtTime(this.volume * 0.25, now + i * 0.25 + 0.15);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.2);
      
      hornOsc.connect(hornFilter);
      hornOsc2.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(ctx.destination);
      
      hornOsc.start(now + i * 0.25);
      hornOsc2.start(now + i * 0.25);
      hornOsc.stop(now + i * 0.25 + 0.25);
      hornOsc2.stop(now + i * 0.25 + 0.25);
    }
    
    // === FANFARE TRUMPETS ===
    const fanfareNotes = [
      { freq: 523, time: 0.8, duration: 0.15 },    // C5
      { freq: 523, time: 0.95, duration: 0.15 },   // C5
      { freq: 523, time: 1.1, duration: 0.15 },    // C5
      { freq: 659, time: 1.3, duration: 0.4 },     // E5
      { freq: 587, time: 1.75, duration: 0.15 },   // D5
      { freq: 659, time: 1.95, duration: 0.5 },    // E5
      { freq: 784, time: 2.5, duration: 0.8 },     // G5 - triumphant end
    ];
    
    fanfareNotes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now + note.time);
      filter.Q.setValueAtTime(2, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + note.time + 0.02);
      gain.gain.setValueAtTime(this.volume * 0.2, now + note.time + note.duration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.1);
    });
    
    // === PARTY WHISTLES ===
    for (let w = 0; w < 5; w++) {
      const whistleOsc = ctx.createOscillator();
      const whistleGain = ctx.createGain();
      const whistleTime = 3.5 + w * 0.6;
      
      whistleOsc.type = 'sine';
      whistleOsc.frequency.setValueAtTime(2000 + Math.random() * 500, now + whistleTime);
      whistleOsc.frequency.linearRampToValueAtTime(3500 + Math.random() * 500, now + whistleTime + 0.15);
      whistleOsc.frequency.linearRampToValueAtTime(2500, now + whistleTime + 0.3);
      whistleOsc.frequency.linearRampToValueAtTime(3200, now + whistleTime + 0.4);
      
      whistleGain.gain.setValueAtTime(0, now + whistleTime);
      whistleGain.gain.linearRampToValueAtTime(this.volume * 0.15, now + whistleTime + 0.02);
      whistleGain.gain.setValueAtTime(this.volume * 0.12, now + whistleTime + 0.35);
      whistleGain.gain.exponentialRampToValueAtTime(0.001, now + whistleTime + 0.5);
      
      whistleOsc.connect(whistleGain);
      whistleGain.connect(ctx.destination);
      
      whistleOsc.start(now + whistleTime);
      whistleOsc.stop(now + whistleTime + 0.55);
    }
    
    // === DISCO BALL SHIMMER (continuous sparkle) ===
    for (let s = 0; s < 40; s++) {
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      const shimmerTime = 2 + Math.random() * 6;
      const shimmerFreq = 3000 + Math.random() * 4000;
      
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(shimmerFreq, now + shimmerTime);
      
      shimmerGain.gain.setValueAtTime(0, now + shimmerTime);
      shimmerGain.gain.linearRampToValueAtTime(this.volume * 0.06, now + shimmerTime + 0.01);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + shimmerTime + 0.1);
      
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmerOsc.start(now + shimmerTime);
      shimmerOsc.stop(now + shimmerTime + 0.15);
    }
    
    // === DISCO BEAT (4 on the floor) ===
    for (let b = 0; b < 8; b++) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      const kickTime = 3 + b * 0.5;
      
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, now + kickTime);
      kickOsc.frequency.exponentialRampToValueAtTime(50, now + kickTime + 0.1);
      
      kickGain.gain.setValueAtTime(this.volume * 0.35, now + kickTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + kickTime + 0.15);
      
      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);
      
      kickOsc.start(now + kickTime);
      kickOsc.stop(now + kickTime + 0.2);
      
      // Hi-hat on offbeat
      if (b > 0) {
        const hatOsc = ctx.createOscillator();
        const hatGain = ctx.createGain();
        const hatFilter = ctx.createBiquadFilter();
        
        hatOsc.type = 'square';
        hatOsc.frequency.setValueAtTime(8000, now + kickTime - 0.25);
        
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, now + kickTime - 0.25);
        
        hatGain.gain.setValueAtTime(this.volume * 0.08, now + kickTime - 0.25);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + kickTime - 0.25 + 0.05);
        
        hatOsc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(ctx.destination);
        
        hatOsc.start(now + kickTime - 0.25);
        hatOsc.stop(now + kickTime - 0.25 + 0.1);
      }
    }
    
    // === COIN RAIN EFFECT ===
    for (let i = 0; i < 30; i++) {
      const coinOsc = ctx.createOscillator();
      const coinGain = ctx.createGain();
      
      const coinTime = 1.5 + Math.random() * 5;
      const coinFreq = 2000 + Math.random() * 3000;
      
      coinOsc.type = 'sine';
      coinOsc.frequency.setValueAtTime(coinFreq, now + coinTime);
      coinOsc.frequency.exponentialRampToValueAtTime(coinFreq * 0.7, now + coinTime + 0.1);
      
      coinGain.gain.setValueAtTime(0, now + coinTime);
      coinGain.gain.linearRampToValueAtTime(this.volume * 0.08, now + coinTime + 0.005);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + coinTime + 0.15);
      
      coinOsc.connect(coinGain);
      coinGain.connect(ctx.destination);
      
      coinOsc.start(now + coinTime);
      coinOsc.stop(now + coinTime + 0.2);
    }
    
    // === SYNTH STABS ===
    const stabTimes = [3.5, 4, 5, 5.5, 6.5];
    stabTimes.forEach(stabTime => {
      const stabOsc = ctx.createOscillator();
      const stabOsc2 = ctx.createOscillator();
      const stabGain = ctx.createGain();
      const stabFilter = ctx.createBiquadFilter();
      
      stabOsc.type = 'sawtooth';
      stabOsc2.type = 'sawtooth';
      stabOsc.frequency.setValueAtTime(523, now + stabTime); // C5
      stabOsc2.frequency.setValueAtTime(659, now + stabTime); // E5
      
      stabFilter.type = 'lowpass';
      stabFilter.frequency.setValueAtTime(3000, now + stabTime);
      stabFilter.frequency.exponentialRampToValueAtTime(500, now + stabTime + 0.2);
      
      stabGain.gain.setValueAtTime(this.volume * 0.2, now + stabTime);
      stabGain.gain.exponentialRampToValueAtTime(0.001, now + stabTime + 0.25);
      
      stabOsc.connect(stabFilter);
      stabOsc2.connect(stabFilter);
      stabFilter.connect(stabGain);
      stabGain.connect(ctx.destination);
      
      stabOsc.start(now + stabTime);
      stabOsc2.start(now + stabTime);
      stabOsc.stop(now + stabTime + 0.3);
      stabOsc2.stop(now + stabTime + 0.3);
    });
    
    // === RISING SYNTH BUILDUP ===
    const riseOsc = ctx.createOscillator();
    const riseGain = ctx.createGain();
    const riseFilter = ctx.createBiquadFilter();
    
    riseOsc.type = 'sawtooth';
    riseOsc.frequency.setValueAtTime(100, now + 7);
    riseOsc.frequency.exponentialRampToValueAtTime(2000, now + 9);
    
    riseFilter.type = 'lowpass';
    riseFilter.frequency.setValueAtTime(200, now + 7);
    riseFilter.frequency.exponentialRampToValueAtTime(5000, now + 9);
    
    riseGain.gain.setValueAtTime(0, now + 7);
    riseGain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 8.5);
    riseGain.gain.exponentialRampToValueAtTime(0.001, now + 9.5);
    
    riseOsc.connect(riseFilter);
    riseFilter.connect(riseGain);
    riseGain.connect(ctx.destination);
    
    riseOsc.start(now + 7);
    riseOsc.stop(now + 10);
    
    // === FINAL EXPLOSION ===
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(5000, now + 9);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 9.3);
    
    noiseGain.gain.setValueAtTime(this.volume * 0.3, now + 9);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 9.3);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseSource.start(now + 9);
  }

  // Play lose sound - SAD trombone + melancholy
  playLose() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // === SAD TROMBONE "wah wah wah wahhh" ===
    const sadNotes = [
      { freq: 311, time: 0, duration: 0.3 },       // Eb4
      { freq: 293, time: 0.35, duration: 0.3 },    // D4
      { freq: 277, time: 0.7, duration: 0.3 },     // C#4
      { freq: 233, time: 1.05, duration: 0.8 },    // Bb3 - long sad ending
    ];
    
    sadNotes.forEach((note, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      // Add vibrato on last note
      if (idx === sadNotes.length - 1) {
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibrato.frequency.setValueAtTime(5, now + note.time);
        vibratoGain.gain.setValueAtTime(8, now + note.time);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(now + note.time);
        vibrato.stop(now + note.time + note.duration);
        
        // Pitch slide down
        osc.frequency.exponentialRampToValueAtTime(note.freq * 0.85, now + note.time + note.duration);
      }
      
      // Muted brass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now + note.time);
      filter.Q.setValueAtTime(3, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + note.time + 0.03);
      gain.gain.setValueAtTime(this.volume * 0.2, now + note.time + note.duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.1);
    });
    
    // === LOW RUMBLE ===
    const rumbleOsc = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    
    rumbleOsc.type = 'sine';
    rumbleOsc.frequency.setValueAtTime(50, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(30, now + 2);
    
    rumbleGain.gain.setValueAtTime(this.volume * 0.15, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    
    rumbleOsc.start(now);
    rumbleOsc.stop(now + 2.5);
  }

  // Play chip placement sound
  playChip() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Chip clack sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    
    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Play countdown tick
  playTick() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Legacy play method for compatibility
  play(soundName: string, _loop: boolean = false) {
    switch (soundName) {
      case 'win':
        this.playWin();
        break;
      case 'lose':
        this.playLose();
        break;
      case 'chip':
        this.playChip();
        break;
      case 'tick':
        this.playTick();
        break;
      case 'cyk':
        this.playCyk();
        break;
    }
  }

  stop(_soundName: string) {
    // No longer needed for Web Audio API based sounds
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

const soundManager = new SoundManager();
export default soundManager;
