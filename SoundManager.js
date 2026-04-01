class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.4;
    this.muted = false;
    this.initialized = false;

    // Music state
    this.musicOsc = null;
    this.musicPlaying = false;
    this.musicPattern = 0;
    this.musicTimer = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setMasterVolume(this.masterVolume);
      this.setSfxVolume(this.sfxVolume);
      this.setMusicVolume(this.musicVolume);

      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(v) {
    this.masterVolume = v;
    if (this.masterGain) this.masterGain.gain.setValueAtTime(this.muted ? 0 : v, this.ctx.currentTime);
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.setValueAtTime(v, this.ctx.currentTime);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.muted;
  }

  // ─── SYNTH HELPERS ───
  _tone(freq, duration, type = 'square', gainVal = 0.3, target = null) {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(target || this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  _noise(duration, gainVal = 0.15) {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Bandpass for more character
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.Q.setValueAtTime(1, t);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(t);
    source.stop(t + duration);
  }

  // ─── GAME SOUND EFFECTS ───

  shoot() {
    if (!this.initialized) return;
    // Quick laser zap
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  hit() {
    // Enemy hit — short thud
    this._noise(0.06, 0.12);
    this._tone(200, 0.05, 'square', 0.08);
  }

  explosion() {
    // Enemy death — descending boom
    if (!this.initialized) return;
    this._noise(0.25, 0.2);
    this._tone(120, 0.2, 'sawtooth', 0.15);
    this._tone(80, 0.3, 'sine', 0.1);
  }

  playerHit() {
    // Player takes damage — harsh buzz
    if (!this.initialized) return;
    this._noise(0.15, 0.25);
    this._tone(100, 0.15, 'square', 0.2);
    this._tone(60, 0.25, 'sawtooth', 0.15);
  }

  collect() {
    // Collectible pickup — rising chime
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.15);
    });
  }

  levelUp() {
    // Threat level increase — dramatic ascending
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    [220, 330, 440, 660].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
    this._noise(0.4, 0.08);
  }

  countdown() {
    // Countdown beep
    this._tone(880, 0.1, 'square', 0.1);
  }

  countdownGo() {
    // "GO!" beep — higher
    this._tone(1760, 0.15, 'square', 0.15);
    this._tone(1320, 0.1, 'sine', 0.1);
  }
    gameOver() {
    // Death — descending doom
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    [440, 330, 220, 110].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.3);
    });
    this._noise(0.6, 0.15);
  }

  menuClick() {
    // UI click feedback
    this._tone(600, 0.04, 'sine', 0.08);
  }

  pause() {
    // Pause sound
    this._tone(400, 0.08, 'sine', 0.1);
    this._tone(300, 0.08, 'sine', 0.08);
  }

  unpause() {
    this._tone(300, 0.06, 'sine', 0.08);
    this._tone(400, 0.06, 'sine', 0.1);
  }

  // ─── AMBIENT MUSIC (simple generative) ───
  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    this.musicPlaying = true;
    this._playMusicLoop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
  }

  _playMusicLoop() {
    if (!this.musicPlaying || !this.initialized) return;
    const t = this.ctx.currentTime;
    const notes = [
      [65, 82, 98],   // C2, E2, G2
      [55, 69, 82],   // A1, C#2, E2
      [73, 87, 110],  // D2, F2, A2
      [49, 65, 82]    // G1, C2, E2
    ];
    const chord = notes[this.musicPattern % notes.length];
    this.musicPattern++;

    chord.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.5);
      gain.gain.linearRampToValueAtTime(0.04, t + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 2.0);
    });

    this.musicTimer = setTimeout(() => this._playMusicLoop(), 2000);
  }
}
