// Sound effects for the casino - ADHD MEGA STIMULATION MODE!
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.6;
  private backgroundMusicInterval: ReturnType<typeof setInterval> | null = null;
  private ambientInterval: ReturnType<typeof setInterval> | null = null;
  private isBackgroundPlaying: boolean = false;
  private backgroundAudio: HTMLAudioElement | null = null;

  constructor() {
    // AudioContext will be created on first user interaction
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Start background hip-hop music from URL
  startBackgroundMusic() {
    if (this.isBackgroundPlaying || !this.enabled) return;
    this.isBackgroundPlaying = true;
    
    // Use a chill lo-fi hip hop beat (royalty free)
    // Using a public domain / creative commons beat
    const musicUrl = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3';
    
    this.backgroundAudio = new Audio(musicUrl);
    this.backgroundAudio.loop = true;
    this.backgroundAudio.volume = this.volume * 0.15; // Quiet background
    this.backgroundAudio.crossOrigin = 'anonymous';
    
    // Try to play (may fail due to autoplay policy)
    this.backgroundAudio.play().catch(e => {
      console.log('Background music autoplay blocked, will start on user interaction:', e);
      // Add click listener to start music on first interaction
      const startOnClick = () => {
        if (this.backgroundAudio && this.isBackgroundPlaying) {
          this.backgroundAudio.play().catch(() => {});
        }
        document.removeEventListener('click', startOnClick);
      };
      document.addEventListener('click', startOnClick);
    });
  }

  stopBackgroundMusic() {
    this.isBackgroundPlaying = false;
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.src = '';
      this.backgroundAudio = null;
    }
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
      this.backgroundMusicInterval = null;
    }
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  // Play random ambient casino sounds
  playAmbient() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const vol = this.volume * 0.05;
    
    const soundType = Math.random();
    
    if (soundType < 0.3) {
      // Slot machine spin sound
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100 + Math.random() * 100, now + i * 0.05);
        
        gain.gain.setValueAtTime(vol * 0.5, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.03);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.05);
      }
    } else if (soundType < 0.5) {
      // Coin drop sounds
      const notes = [4000, 3800, 3500, 3200];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        
        gain.gain.setValueAtTime(vol, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.15);
      });
    } else if (soundType < 0.7) {
      // Distant cheer
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2000, now);
      noiseFilter.Q.setValueAtTime(1, now);
      
      noiseGain.gain.setValueAtTime(vol * 0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noiseSource.start(now);
    } else {
      // Random chip stacking
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 600, now + i * 0.08);
        
        gain.gain.setValueAtTime(vol, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.08);
      }
    }
  }

  // Play dramatic countdown sounds - more intense as time runs out!
  playCountdown(secondsLeft: number) {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Intensity increases as time decreases
    const intensity = 1 - (secondsLeft / 10);
    const vol = this.volume * (0.2 + intensity * 0.3);
    
    // Base tick - gets more intense
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = intensity > 0.7 ? 'square' : 'sine';
    osc.frequency.setValueAtTime(800 + intensity * 800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
    
    // Add tension drone on last 5 seconds
    if (secondsLeft <= 5) {
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      const droneFilter = ctx.createBiquadFilter();
      
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.setValueAtTime(100 + (5 - secondsLeft) * 30, now);
      
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(300 + (5 - secondsLeft) * 100, now);
      
      droneGain.gain.setValueAtTime(vol * 0.3, now);
      droneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(ctx.destination);
      
      droneOsc.start(now);
      droneOsc.stop(now + 0.9);
    }
    
    // Heartbeat on last 3 seconds
    if (secondsLeft <= 3) {
      const heart1 = ctx.createOscillator();
      const heart2 = ctx.createOscillator();
      const heartGain = ctx.createGain();
      
      heart1.type = 'sine';
      heart2.type = 'sine';
      heart1.frequency.setValueAtTime(60, now);
      heart2.frequency.setValueAtTime(60, now + 0.15);
      
      heartGain.gain.setValueAtTime(vol * 0.5, now);
      heartGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      heartGain.gain.setValueAtTime(vol * 0.3, now + 0.15);
      heartGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      heart1.connect(heartGain);
      heart2.connect(heartGain);
      heartGain.connect(ctx.destination);
      
      heart1.start(now);
      heart2.start(now + 0.15);
      heart1.stop(now + 0.12);
      heart2.stop(now + 0.27);
    }
    
    // ALARM on last second!
    if (secondsLeft === 1) {
      const alarm = ctx.createOscillator();
      const alarmGain = ctx.createGain();
      
      alarm.type = 'square';
      alarm.frequency.setValueAtTime(880, now);
      alarm.frequency.setValueAtTime(660, now + 0.1);
      alarm.frequency.setValueAtTime(880, now + 0.2);
      alarm.frequency.setValueAtTime(660, now + 0.3);
      
      alarmGain.gain.setValueAtTime(vol * 0.6, now);
      alarmGain.gain.setValueAtTime(vol * 0.6, now + 0.4);
      alarmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      alarm.connect(alarmGain);
      alarmGain.connect(ctx.destination);
      
      alarm.start(now);
      alarm.stop(now + 0.55);
    }
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

  // Play win sound - ULTIMATE DISCO PARTY EXPLOSION!
  playWin() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    const vol = this.volume;
    
    // === EPIC AIRHORN x5 ===
    for (let i = 0; i < 5; i++) {
      const hornOsc = ctx.createOscillator();
      const hornOsc2 = ctx.createOscillator();
      const hornOsc3 = ctx.createOscillator();
      const hornGain = ctx.createGain();
      const hornFilter = ctx.createBiquadFilter();
      
      hornOsc.type = 'sawtooth';
      hornOsc2.type = 'square';
      hornOsc3.type = 'sawtooth';
      hornOsc.frequency.setValueAtTime(440, now + i * 0.18);
      hornOsc2.frequency.setValueAtTime(442, now + i * 0.18);
      hornOsc3.frequency.setValueAtTime(880, now + i * 0.18);
      
      hornFilter.type = 'lowpass';
      hornFilter.frequency.setValueAtTime(4000, now + i * 0.18);
      
      hornGain.gain.setValueAtTime(0, now + i * 0.18);
      hornGain.gain.linearRampToValueAtTime(vol * 0.35, now + i * 0.18 + 0.01);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.15);
      
      hornOsc.connect(hornFilter);
      hornOsc2.connect(hornFilter);
      hornOsc3.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(ctx.destination);
      
      hornOsc.start(now + i * 0.18);
      hornOsc2.start(now + i * 0.18);
      hornOsc3.start(now + i * 0.18);
      hornOsc.stop(now + i * 0.18 + 0.2);
      hornOsc2.stop(now + i * 0.18 + 0.2);
      hornOsc3.stop(now + i * 0.18 + 0.2);
    }
    
    // === MEGA FANFARE (full orchestra feel) ===
    const fanfareChords = [
      { notes: [523, 659, 784], time: 1, duration: 0.2 },     // C major
      { notes: [523, 659, 784], time: 1.22, duration: 0.2 },  // C major
      { notes: [587, 740, 880], time: 1.44, duration: 0.3 },  // D major
      { notes: [659, 784, 988], time: 1.8, duration: 0.5 },   // E chord
      { notes: [784, 988, 1175], time: 2.4, duration: 0.8 },  // G major HIGH
    ];
    
    fanfareChords.forEach(chord => {
      chord.notes.forEach((freq, noteIdx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + chord.time);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, now + chord.time);
        
        const noteVol = noteIdx === 0 ? 0.2 : 0.15;
        gain.gain.setValueAtTime(0, now + chord.time);
        gain.gain.linearRampToValueAtTime(vol * noteVol, now + chord.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chord.time + chord.duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + chord.time);
        osc.stop(now + chord.time + chord.duration + 0.1);
      });
    });
    
    // === DISCO BASS LINE (funky groove) ===
    const bassNotes = [
      { freq: 98, time: 3, dur: 0.2 },   // G2
      { freq: 98, time: 3.25, dur: 0.1 },
      { freq: 117, time: 3.5, dur: 0.2 }, // Bb2
      { freq: 131, time: 3.75, dur: 0.15 }, // C3
      { freq: 98, time: 4, dur: 0.2 },
      { freq: 98, time: 4.25, dur: 0.1 },
      { freq: 147, time: 4.5, dur: 0.2 }, // D3
      { freq: 131, time: 4.75, dur: 0.15 },
      { freq: 98, time: 5, dur: 0.2 },
      { freq: 98, time: 5.25, dur: 0.1 },
      { freq: 117, time: 5.5, dur: 0.2 },
      { freq: 131, time: 5.75, dur: 0.15 },
      { freq: 98, time: 6, dur: 0.4 },
    ];
    
    bassNotes.forEach(note => {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();
      
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(note.freq, now + note.time);
      
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(400, now + note.time);
      
      bassGain.gain.setValueAtTime(vol * 0.4, now + note.time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);
      
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(ctx.destination);
      
      bassOsc.start(now + note.time);
      bassOsc.stop(now + note.time + note.dur + 0.05);
    });
    
    // === 4-ON-THE-FLOOR DISCO KICK ===
    for (let b = 0; b < 16; b++) {
      const kickTime = 3 + b * 0.25;
      
      // KICK
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(160, now + kickTime);
      kickOsc.frequency.exponentialRampToValueAtTime(40, now + kickTime + 0.08);
      
      kickGain.gain.setValueAtTime(vol * 0.5, now + kickTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + kickTime + 0.12);
      
      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);
      
      kickOsc.start(now + kickTime);
      kickOsc.stop(now + kickTime + 0.15);
      
      // SNARE on 2 and 4
      if (b % 4 === 2) {
        const snareOsc = ctx.createOscillator();
        const snareNoise = ctx.createOscillator();
        const snareGain = ctx.createGain();
        const snareFilter = ctx.createBiquadFilter();
        
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(200, now + kickTime);
        snareNoise.type = 'square';
        snareNoise.frequency.setValueAtTime(1000 + Math.random() * 500, now + kickTime);
        
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(1000, now + kickTime);
        
        snareGain.gain.setValueAtTime(vol * 0.25, now + kickTime);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + kickTime + 0.1);
        
        snareOsc.connect(snareGain);
        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(ctx.destination);
        
        snareOsc.start(now + kickTime);
        snareNoise.start(now + kickTime);
        snareOsc.stop(now + kickTime + 0.12);
        snareNoise.stop(now + kickTime + 0.12);
      }
      
      // HI-HAT 8ths
      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();
      const hatFilter = ctx.createBiquadFilter();
      
      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(8000 + Math.random() * 2000, now + kickTime + 0.125);
      
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(8000, now + kickTime + 0.125);
      
      hatGain.gain.setValueAtTime(vol * 0.08, now + kickTime + 0.125);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + kickTime + 0.125 + 0.04);
      
      hatOsc.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(ctx.destination);
      
      hatOsc.start(now + kickTime + 0.125);
      hatOsc.stop(now + kickTime + 0.125 + 0.08);
    }
    
    // === PARTY WHISTLES (many!) ===
    for (let w = 0; w < 8; w++) {
      const whistleOsc = ctx.createOscillator();
      const whistleGain = ctx.createGain();
      const whistleTime = 2 + w * 0.8 + Math.random() * 0.2;
      
      whistleOsc.type = 'sine';
      whistleOsc.frequency.setValueAtTime(2200 + Math.random() * 600, now + whistleTime);
      whistleOsc.frequency.linearRampToValueAtTime(3800 + Math.random() * 400, now + whistleTime + 0.15);
      whistleOsc.frequency.linearRampToValueAtTime(2800, now + whistleTime + 0.25);
      whistleOsc.frequency.setValueAtTime(3500, now + whistleTime + 0.35);
      whistleOsc.frequency.linearRampToValueAtTime(2500, now + whistleTime + 0.45);
      
      whistleGain.gain.setValueAtTime(0, now + whistleTime);
      whistleGain.gain.linearRampToValueAtTime(vol * 0.12, now + whistleTime + 0.02);
      whistleGain.gain.exponentialRampToValueAtTime(0.001, now + whistleTime + 0.5);
      
      whistleOsc.connect(whistleGain);
      whistleGain.connect(ctx.destination);
      
      whistleOsc.start(now + whistleTime);
      whistleOsc.stop(now + whistleTime + 0.55);
    }
    
    // === DISCO STRING MELODY ===
    const melodyNotes = [
      { freq: 784, time: 3.5, dur: 0.2 },  // G5
      { freq: 880, time: 3.75, dur: 0.2 }, // A5
      { freq: 988, time: 4, dur: 0.4 },    // B5
      { freq: 784, time: 4.5, dur: 0.2 },  // G5
      { freq: 659, time: 4.75, dur: 0.2 }, // E5
      { freq: 784, time: 5, dur: 0.6 },    // G5
      { freq: 988, time: 5.75, dur: 0.2 }, // B5
      { freq: 1047, time: 6, dur: 0.4 },   // C6
      { freq: 988, time: 6.5, dur: 0.2 },  // B5
      { freq: 880, time: 6.75, dur: 0.2 }, // A5
      { freq: 784, time: 7, dur: 0.8 },    // G5
    ];
    
    melodyNotes.forEach(note => {
      const strOsc = ctx.createOscillator();
      const strOsc2 = ctx.createOscillator();
      const strGain = ctx.createGain();
      const strFilter = ctx.createBiquadFilter();
      
      strOsc.type = 'sawtooth';
      strOsc2.type = 'sawtooth';
      strOsc.frequency.setValueAtTime(note.freq, now + note.time);
      strOsc2.frequency.setValueAtTime(note.freq * 1.003, now + note.time); // slight detune for width
      
      strFilter.type = 'lowpass';
      strFilter.frequency.setValueAtTime(3000, now + note.time);
      
      strGain.gain.setValueAtTime(0, now + note.time);
      strGain.gain.linearRampToValueAtTime(vol * 0.15, now + note.time + 0.03);
      strGain.gain.setValueAtTime(vol * 0.12, now + note.time + note.dur * 0.7);
      strGain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);
      
      strOsc.connect(strFilter);
      strOsc2.connect(strFilter);
      strFilter.connect(strGain);
      strGain.connect(ctx.destination);
      
      strOsc.start(now + note.time);
      strOsc2.start(now + note.time);
      strOsc.stop(now + note.time + note.dur + 0.1);
      strOsc2.stop(now + note.time + note.dur + 0.1);
    });
    
    // === DISCO BALL SPARKLES (continuous) ===
    for (let s = 0; s < 60; s++) {
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      const shimmerTime = 2 + Math.random() * 7;
      const shimmerFreq = 4000 + Math.random() * 5000;
      
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(shimmerFreq, now + shimmerTime);
      
      shimmerGain.gain.setValueAtTime(0, now + shimmerTime);
      shimmerGain.gain.linearRampToValueAtTime(vol * 0.05, now + shimmerTime + 0.005);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + shimmerTime + 0.08);
      
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmerOsc.start(now + shimmerTime);
      shimmerOsc.stop(now + shimmerTime + 0.1);
    }
    
    // === COIN RAIN (more coins!) ===
    for (let i = 0; i < 50; i++) {
      const coinOsc = ctx.createOscillator();
      const coinGain = ctx.createGain();
      
      const coinTime = 1 + Math.random() * 8;
      const coinFreq = 2500 + Math.random() * 4000;
      
      coinOsc.type = 'sine';
      coinOsc.frequency.setValueAtTime(coinFreq, now + coinTime);
      coinOsc.frequency.exponentialRampToValueAtTime(coinFreq * 0.6, now + coinTime + 0.12);
      
      coinGain.gain.setValueAtTime(0, now + coinTime);
      coinGain.gain.linearRampToValueAtTime(vol * 0.06, now + coinTime + 0.003);
      coinGain.gain.exponentialRampToValueAtTime(0.001, now + coinTime + 0.15);
      
      coinOsc.connect(coinGain);
      coinGain.connect(ctx.destination);
      
      coinOsc.start(now + coinTime);
      coinOsc.stop(now + coinTime + 0.2);
    }
    
    // === SYNTH CHORD STABS ===
    const stabTimes = [3, 3.5, 4.5, 5, 6, 6.5, 7.5];
    stabTimes.forEach(stabTime => {
      [523, 659, 784, 1047].forEach(freq => {
        const stabOsc = ctx.createOscillator();
        const stabGain = ctx.createGain();
        const stabFilter = ctx.createBiquadFilter();
        
        stabOsc.type = 'sawtooth';
        stabOsc.frequency.setValueAtTime(freq, now + stabTime);
        
        stabFilter.type = 'lowpass';
        stabFilter.frequency.setValueAtTime(4000, now + stabTime);
        stabFilter.frequency.exponentialRampToValueAtTime(800, now + stabTime + 0.15);
        
        stabGain.gain.setValueAtTime(vol * 0.12, now + stabTime);
        stabGain.gain.exponentialRampToValueAtTime(0.001, now + stabTime + 0.18);
        
        stabOsc.connect(stabFilter);
        stabFilter.connect(stabGain);
        stabGain.connect(ctx.destination);
        
        stabOsc.start(now + stabTime);
        stabOsc.stop(now + stabTime + 0.25);
      });
    });
    
    // === WOO WOO CROWD CHEERS (synth approximation) ===
    for (let c = 0; c < 6; c++) {
      const cheerOsc = ctx.createOscillator();
      const cheerOsc2 = ctx.createOscillator();
      const cheerGain = ctx.createGain();
      const cheerFilter = ctx.createBiquadFilter();
      const cheerTime = 2 + c * 1.2;
      
      cheerOsc.type = 'sawtooth';
      cheerOsc2.type = 'sawtooth';
      cheerOsc.frequency.setValueAtTime(400, now + cheerTime);
      cheerOsc.frequency.linearRampToValueAtTime(600, now + cheerTime + 0.2);
      cheerOsc.frequency.linearRampToValueAtTime(400, now + cheerTime + 0.4);
      cheerOsc2.frequency.setValueAtTime(405, now + cheerTime);
      cheerOsc2.frequency.linearRampToValueAtTime(605, now + cheerTime + 0.2);
      cheerOsc2.frequency.linearRampToValueAtTime(405, now + cheerTime + 0.4);
      
      cheerFilter.type = 'bandpass';
      cheerFilter.frequency.setValueAtTime(600, now + cheerTime);
      cheerFilter.Q.setValueAtTime(2, now + cheerTime);
      
      cheerGain.gain.setValueAtTime(0, now + cheerTime);
      cheerGain.gain.linearRampToValueAtTime(vol * 0.08, now + cheerTime + 0.1);
      cheerGain.gain.exponentialRampToValueAtTime(0.001, now + cheerTime + 0.5);
      
      cheerOsc.connect(cheerFilter);
      cheerOsc2.connect(cheerFilter);
      cheerFilter.connect(cheerGain);
      cheerGain.connect(ctx.destination);
      
      cheerOsc.start(now + cheerTime);
      cheerOsc2.start(now + cheerTime);
      cheerOsc.stop(now + cheerTime + 0.55);
      cheerOsc2.stop(now + cheerTime + 0.55);
    }
    
    // === EPIC BUILDUP ===
    const riseOsc = ctx.createOscillator();
    const riseOsc2 = ctx.createOscillator();
    const riseGain = ctx.createGain();
    const riseFilter = ctx.createBiquadFilter();
    
    riseOsc.type = 'sawtooth';
    riseOsc2.type = 'sawtooth';
    riseOsc.frequency.setValueAtTime(80, now + 8);
    riseOsc.frequency.exponentialRampToValueAtTime(2500, now + 9.8);
    riseOsc2.frequency.setValueAtTime(82, now + 8);
    riseOsc2.frequency.exponentialRampToValueAtTime(2510, now + 9.8);
    
    riseFilter.type = 'lowpass';
    riseFilter.frequency.setValueAtTime(150, now + 8);
    riseFilter.frequency.exponentialRampToValueAtTime(8000, now + 9.8);
    
    riseGain.gain.setValueAtTime(0, now + 8);
    riseGain.gain.linearRampToValueAtTime(vol * 0.25, now + 9.5);
    riseGain.gain.exponentialRampToValueAtTime(0.001, now + 10);
    
    riseOsc.connect(riseFilter);
    riseOsc2.connect(riseFilter);
    riseFilter.connect(riseGain);
    riseGain.connect(ctx.destination);
    
    riseOsc.start(now + 8);
    riseOsc2.start(now + 8);
    riseOsc.stop(now + 10.2);
    riseOsc2.stop(now + 10.2);
    
    // === FINAL DROP + EXPLOSION ===
    const dropOsc = ctx.createOscillator();
    const dropGain = ctx.createGain();
    
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(80, now + 9.8);
    dropOsc.frequency.exponentialRampToValueAtTime(25, now + 10.3);
    
    dropGain.gain.setValueAtTime(vol * 0.6, now + 9.8);
    dropGain.gain.exponentialRampToValueAtTime(0.001, now + 10.5);
    
    dropOsc.connect(dropGain);
    dropGain.connect(ctx.destination);
    
    dropOsc.start(now + 9.8);
    dropOsc.stop(now + 10.6);
    
    // White noise explosion
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(8000, now + 9.8);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 10.2);
    
    noiseGain.gain.setValueAtTime(vol * 0.35, now + 9.8);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 10.2);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseSource.start(now + 9.8);
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

  // Play countdown tick - more exciting
  playTick() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc2.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.12);
    osc2.stop(now + 0.12);
  }

  // Play spinning sound - ball rolling
  playSpinning() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Whoosh sound
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 2);
    noiseFilter.Q.setValueAtTime(5, now);
    
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseSource.start(now);
  }

  // Play betting closed sound - dramatic
  playBettingClosed() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Dramatic "no more bets" sound
    const notes = [440, 415, 392, 370];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(this.volume * 0.2, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.25);
    });
  }

  // Play success sound for bet placed
  playBetPlaced() {
    if (!this.enabled) return;
    
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;
    
    // Positive "ching" sound
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(1500, now);
    osc2.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
    
    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.25);
    osc2.stop(now + 0.25);
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
      case 'spinning':
        this.playSpinning();
        break;
      case 'bettingClosed':
        this.playBettingClosed();
        break;
      case 'betPlaced':
        this.playBetPlaced();
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