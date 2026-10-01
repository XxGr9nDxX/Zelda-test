/**
 * Procedural Web Audio API Sound Synthesizer for Sylva: Echoes of the Wild
 * Generates rich, low-latency, crisp game sound effects and ambient forest music.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public volume: number = 0.6;
  public musicEnabled: boolean = true;
  private musicTimer: number | null = null;
  private initialized: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.initialized = true;
        if (this.musicEnabled) {
          this.startAmbientMusic();
        }
      }
    } catch {
      // Audio not supported or blocked
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbientMusic();
    } else {
      this.init();
      if (this.musicEnabled) {
        this.startAmbientMusic();
      }
    }
    return this.isMuted;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  private getMasterGain(decayTime: number = 0.3): GainNode | null {
    if (!this.ctx || this.isMuted) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    gain.connect(this.ctx.destination);
    return gain;
  }

  // --- Sound Effects ---

  // Sword Slash
  public playSlash() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      // Filtered noise for air cut
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(2400, t + 0.05);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);
      filter.Q.value = 3.0;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start(t);
      noise.stop(t + 0.12);

      // Pitch swoosh
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);

      oscGain.gain.setValueAtTime(0.3, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(oscGain);
      oscGain.connect(master);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Audio fallback
    }
  }

  // Impact Hit / Strike Enemy
  public playHit() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);

      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.15);

      // Crackle click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(600, t);
      clickGain.gain.setValueAtTime(0.4, t);
      clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(master);
      clickOsc.start(t);
      clickOsc.stop(t + 0.04);
    } catch {}
  }

  // Dash Dodge
  public playDash() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noise.start(t);
      noise.stop(t + 0.18);
    } catch {}
  }

  // Cast Solar Magic Spell
  public playCastMagic() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + idx * 0.04 + 0.2);

        gain.gain.setValueAtTime(0.25, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.04 + 0.25);

        osc.connect(gain);
        gain.connect(master);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.25);
      });
    } catch {}
  }

  // Grass Cut
  public playGrassCut() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.05);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  // Emerald Gem Pickup
  public playGemPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, t); // C6
      osc.frequency.setValueAtTime(1318.5, t + 0.06); // E6

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  // Heart Recovery Pickup
  public playHeartPickup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        gain.gain.setValueAtTime(0.25, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.3);
      });
    } catch {}
  }

  // Chest Open Fanfare
  public playChestOpen() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);
        gain.gain.setValueAtTime(0.3, t + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.45);
      });
    } catch {}
  }

  // Enemy Defeated
  public playEnemyDeath() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch {}
  }

  // Boss Slam / Earthquake
  public playBossSlam() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);

      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.55);
    } catch {}
  }

  // Player Damaged Grunt
  public playPlayerHurt() {
    if (!this.ctx || this.isMuted) return;
    try {
      const master = this.getMasterGain();
      if (!master) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  // --- Procedural Ambient Forest Music (Soothing Zen & Chimes) ---
  private startAmbientMusic() {
    if (this.musicTimer) return;

    // Forest scale: Pentatonic Major in E (E, F#, G#, B, C#)
    const scale = [329.63, 369.99, 415.3, 493.88, 554.37, 659.25, 739.99];

    const playAmbientChime = () => {
      if (!this.ctx || this.isMuted || !this.musicEnabled) return;
      try {
        const t = this.ctx.currentTime;
        const note = scale[Math.floor(Math.random() * scale.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, t);

        const dur = 1.8 + Math.random() * 1.2;
        gain.gain.setValueAtTime(0.06 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
      } catch {}
    };

    // Schedule next chime with organic random rhythm
    const loop = () => {
      playAmbientChime();
      const nextTime = 1200 + Math.random() * 2200;
      this.musicTimer = window.setTimeout(loop, nextTime);
    };

    loop();
  }

  private stopAmbientMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled && !this.isMuted) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }
}

export const sound = new SoundManager();
