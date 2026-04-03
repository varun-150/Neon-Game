class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.particles = [];
    this.scrollX = 0;
    this.scrollY = 0;
    this.lastTime = 0;
    this.state = 'MENU'; // MENU, LEVELS, SETTINGS, COUNTDOWN, PLAYING, PAUSED, GAMEOVER

    // Sound
    this.sound = new SoundManager();
    this.lastCountdownNum = 4;

    // Settings
    this.settings = {
      theme: 'neon',
      sensitivity: 1.0,
      smoothing: 0.3,
      screenShakeEnabled: true,
      particleDensity: 1.0,
      crtFilter: true,
      showFPS: false,
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.4
    };
    this.loadSettings();
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;

    this.score = 0;
    this.level = 1;       // In-game threat level
    this.spawnTimer = 0;
    this.countdownTimer = 0;
    this.screenShake = 0;
    this.gameTime = 0;
    this.highScores = this.loadHighScores();

    // Difficulty presets
    this.difficulties = {
      1: {
        name: 'RECON',
        subtitle: 'Training Protocol',
        desc: 'Slower enemies · More health · Gentle spawns',
        color: '#00ff88',
        playerHealth: 150,
        playerSpeed: 400,
        fireRate: 0.12,
        spawnBase: 2.0,
        spawnMin: 0.6,
        enemySpeedMult: 0.7,
        enemyHealthMult: 1,
        damagePerHit: 10,
        collectChance: 0.25,
        unlockScore: 0
      },
      2: {
        name: 'ASSAULT',
        subtitle: 'Standard Engagement',
        desc: 'Balanced combat · Default parameters',
        color: '#00f2ff',
        playerHealth: 100,
        playerSpeed: 350,
        fireRate: 0.12,
        spawnBase: 1.5,
        spawnMin: 0.3,
        enemySpeedMult: 1.0,
        enemyHealthMult: 1,
        damagePerHit: 15,
        collectChance: 0.18,
        unlockScore: 0
      },
      3: {
        name: 'BLITZ',
        subtitle: 'Accelerated Threat',
        desc: 'Fast enemies · Dense spawns · Adrenaline rush',
        color: '#ff00ff',
        playerHealth: 80,
        playerSpeed: 380,
        fireRate: 0.10,
        spawnBase: 1.0,
        spawnMin: 0.2,
        enemySpeedMult: 1.3,
        enemyHealthMult: 1,
        damagePerHit: 18,
        collectChance: 0.15,
        unlockScore: 500
      },
      4: {
        name: 'NIGHTMARE',
        subtitle: 'Extinction Protocol',
        desc: 'Tank enemies · Maximum aggression · No mercy',
        color: '#ff0000',
        playerHealth: 60,
        playerSpeed: 360,
        fireRate: 0.08,
        spawnBase: 0.8,
        spawnMin: 0.15,
        enemySpeedMult: 1.5,
        enemyHealthMult: 2,
        damagePerHit: 25,
        collectChance: 0.10,
        unlockScore: 2000
      }
    };
    this.selectedDifficulty = 2; // Default: ASSAULT

    // Parallax background layers
    this.stars = [];
    this.nebulaClouds = [];
    this.initBackground();

    this.chromaticAberration = 0;
    this.globalGlow = 0;

    this.input = new InputManager(this.canvas);
    this.setupUI();
    this._setupPause();
  }

  // ──────────────────────────────────────────────
  // BACKGROUND
  // ──────────────────────────────────────────────
  initBackground() {
    for (let layer = 0; layer < 3; layer++) {
      const count = [60, 40, 20][layer];
      const speed = [8, 18, 35][layer];
      const sizeRange = [1, 1.5, 2.5][layer];
      const opRange = [0.15, 0.3, 0.5][layer];
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * sizeRange + 0.5,
          speed: speed + Math.random() * 5,
          opacity: Math.random() * opRange + 0.05,
          layer, twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 3 + 1
        });
      }
    }
    for (let i = 0; i < 5; i++) {
      this.nebulaClouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 150 + 80,
        color: ['rgba(0,100,255,', 'rgba(100,0,200,', 'rgba(0,200,200,'][Math.floor(Math.random() * 3)],
        opacity: Math.random() * 0.03 + 0.01,
        speed: Math.random() * 3 + 1
      });
    }
  }

  updateBackground(dt) {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      star.twinklePhase += star.twinkleSpeed * dt;
      if (star.y > this.canvas.height) { star.y = -2; star.x = Math.random() * this.canvas.width; }
    }
    for (const cloud of this.nebulaClouds) {
      cloud.y += cloud.speed * dt;
      if (cloud.y - cloud.radius > this.canvas.height) { cloud.y = -cloud.radius; cloud.x = Math.random() * this.canvas.width; }
    }
  }

  // ──────────────────────────────────────────────
  // UI WIRING
  // ──────────────────────────────────────────────
  setupUI() {
    // Init sound on first interaction
    const initSound = () => { this.sound.init(); document.removeEventListener('click', initSound); document.removeEventListener('keydown', initSound); };
    document.addEventListener('click', initSound);
    document.addEventListener('keydown', initSound);

    // Main menu
    document.getElementById('playBtn').onclick = () => { this.sound.init(); this.sound.menuClick(); this.showLevels(); };
    document.getElementById('settingsBtn').onclick = () => { this.sound.menuClick(); this.openSettings(); };
    document.getElementById('restartBtn').onclick = () => { this.sound.menuClick(); this.showLevels(); };
    document.getElementById('restartBtn2').onclick = () => { this.sound.menuClick(); this.backToMenu(); };

    // Level select
    document.getElementById('levelsBackBtn').onclick = () => { this.sound.menuClick(); this.backToMenu(); };
    document.querySelectorAll('.level-card').forEach(card => {
      card.addEventListener('click', () => {
        const diff = parseInt(card.dataset.difficulty);
        const preset = this.difficulties[diff];
        const maxScore = Math.max(...Object.values(this.highScores), 0);
        if (preset.unlockScore > maxScore && preset.unlockScore > 0) return;
        this.sound.menuClick();
        this.selectedDifficulty = diff;
        this.startGame();
      });
    });

    // Pause
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.onclick = () => this.unpause();
    const pauseMenuBtn = document.getElementById('pauseMenuBtn');
    if (pauseMenuBtn) pauseMenuBtn.onclick = () => { this.sound.stopMusic(); this.backToMenu(); };

    // Settings
    document.getElementById('settingsBackBtn').onclick = () => { this.sound.menuClick(); this.closeSettings(); };
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.onclick = () => {
        this.sound.menuClick();
        this.settings.theme = this.settings.theme === 'neon' ? 'aircraft' : 'neon';
        this.saveSettings();
        this.applySettingsToUI();
      };
    }
    this.wireSlider('sensitivitySlider', 'sensitivityValue', v => { this.settings.sensitivity = v; this.input.sensitivity = v; });
    this.wireSlider('smoothingSlider', 'smoothingValue', v => { this.settings.smoothing = v; this.input.smoothing = v; });
    this.wireSlider('particleSlider', 'particleValue', v => { this.settings.particleDensity = v; });

    // Volume sliders
    this.wireSlider('masterSlider', 'masterValue', v => { this.settings.masterVolume = v; this.sound.setMasterVolume(v); });
    this.wireSlider('sfxSlider', 'sfxValue', v => { this.settings.sfxVolume = v; this.sound.setSfxVolume(v); });
    this.wireSlider('musicSlider', 'musicValue', v => { this.settings.musicVolume = v; this.sound.setMusicVolume(v); });

    this.wireToggle('shakeToggle', c => { this.settings.screenShakeEnabled = c; });
    this.wireToggle('crtToggle', c => { this.settings.crtFilter = c; document.getElementById('gameContainer').classList.toggle('no-crt', !c); });
    this.wireToggle('fpsToggle', c => { this.settings.showFPS = c; });

    this.applySettingsToUI();
  }

  wireSlider(id, vid, cb) {
    const el = document.getElementById(id), vel = document.getElementById(vid);
    if (!el) return;
    el.addEventListener('input', () => { const v = parseFloat(el.value); if (vel) vel.textContent = v.toFixed(1); cb(v); this.saveSettings(); });
  }

  wireToggle(id, cb) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => { cb(el.checked); this.saveSettings(); });
  }

  applySettingsToUI() {
    const s = this.settings;
    const sliders = [
      ['sensitivitySlider','sensitivityValue',s.sensitivity],
      ['smoothingSlider','smoothingValue',s.smoothing],
      ['particleSlider','particleValue',s.particleDensity],
      ['masterSlider','masterValue',s.masterVolume],
      ['sfxSlider','sfxValue',s.sfxVolume],
      ['musicSlider','musicValue',s.musicVolume]
    ];
    sliders.forEach(([sid,vid,val]) => {
      const el = document.getElementById(sid), vel = document.getElementById(vid);
      if (el) el.value = val; if (vel) vel.textContent = val.toFixed(1);
    });
    ['shakeToggle','crtToggle','fpsToggle'].forEach((id, i) => {
      const vals = [s.screenShakeEnabled, s.crtFilter, s.showFPS];
      const el = document.getElementById(id);
      if (el) el.checked = vals[i];
    });
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.innerText = s.theme === 'aircraft' ? 'AIRCRAFT' : 'NEON';
    
    this.input.sensitivity = s.sensitivity;
    this.input.smoothing = s.smoothing;
    this.sound.setMasterVolume(s.masterVolume);
    this.sound.setSfxVolume(s.sfxVolume);
    this.sound.setMusicVolume(s.musicVolume);
    if (!s.crtFilter) document.getElementById('gameContainer').classList.add('no-crt');
  }

  // ──────────────────────────────────────────────
  // NAVIGATION
  // ──────────────────────────────────────────────
  hideAll() {
    ['startMenu','levelsMenu','settingsMenu','gameOverMenu','pauseMenu','hud','countdown'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  }

  showLevels() {
    this.hideAll();
    this.state = 'LEVELS';
    this.updateLevelCards();
    document.getElementById('levelsMenu').classList.remove('hidden');
  }

  backToMenu() {
    this.hideAll();
    this.state = 'MENU';
    document.getElementById('startMenu').classList.remove('hidden');
  }

  openSettings() {
    this.previousState = this.state;
    this.state = 'SETTINGS';
    this.hideAll();
    document.getElementById('settingsMenu').classList.remove('hidden');
  }

  closeSettings() {
    this.saveSettings();
    this.hideAll();
    if (this.previousState === 'LEVELS') {
      this.state = 'LEVELS';
      document.getElementById('levelsMenu').classList.remove('hidden');
    } else {
      this.state = 'MENU';
      document.getElementById('startMenu').classList.remove('hidden');
    }
  }

  updateLevelCards() {
    const maxScore = Math.max(...Object.values(this.highScores), 0);
    document.querySelectorAll('.level-card').forEach(card => {
      const diff = parseInt(card.dataset.difficulty);
      const preset = this.difficulties[diff];
      const locked = preset.unlockScore > 0 && maxScore < preset.unlockScore;
      card.classList.toggle('locked', locked);
      // Update high score display
      const hs = card.querySelector('.level-highscore');
      if (hs) {
        const score = this.highScores[diff] || 0;
        hs.textContent = locked ? `UNLOCK AT ${preset.unlockScore} PTS` : (score > 0 ? `BEST: ${score}` : 'NO DATA');
      }
    });
  }

  // ──────────────────────────────────────────────
  // GAME START / RESET
  // ──────────────────────────────────────────────
  startGame() {
    const d = this.difficulties[this.selectedDifficulty];
    this.entities = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.gameTime = 0;
    this.chromaticAberration = 0;
    this.currentDifficulty = d;

    this.player = new Player(this, this.canvas.width / 2, this.canvas.height / 2, this.input);
    this.player.maxHealth = d.playerHealth;
    this.player.health = d.playerHealth;
    this.player.speed = d.playerSpeed;
    this.player.fireRate = d.fireRate;
    this.entities.push(this.player);

    this.state = 'COUNTDOWN';
    this.countdownTimer = 3.0;
    this.lastCountdownNum = 4;

    this.hideAll();
    document.getElementById('countdown').classList.remove('hidden');

    // Show difficulty indicator
    const di = document.getElementById('difficultyIndicator');
    if (di) { di.textContent = d.name; di.style.color = d.color; }

    // Start music
    this.sound.resume();
    this.sound.startMusic();

    this.updateHUD();
  }

  reset() { this.startGame(); } // Alias for restart

  // ──────────────────────────────────────────────
  // PERSISTENCE
  // ──────────────────────────────────────────────
  loadSettings() {
    try { const s = localStorage.getItem('neonpulse_settings'); if (s) Object.assign(this.settings, JSON.parse(s)); } catch(e) {}
  }
  saveSettings() {
    try { localStorage.setItem('neonpulse_settings', JSON.stringify(this.settings)); } catch(e) {}
  }
  loadHighScores() {
    try { const s = localStorage.getItem('neonpulse_highscores'); return s ? JSON.parse(s) : {}; } catch(e) { return {}; }
  }
  saveHighScore() {
    const key = this.selectedDifficulty;
    if (!this.highScores[key] || this.score > this.highScores[key]) {
      this.highScores[key] = this.score;
      try { localStorage.setItem('neonpulse_highscores', JSON.stringify(this.highScores)); } catch(e) {}
    }
  }

  // ──────────────────────────────────────────────
  // COORDINATE HELPERS
  // ──────────────────────────────────────────────
  screenToWorld(cx, cy) { return { x: cx + this.scrollX, y: cy + this.scrollY }; }
  worldToScreen(wx, wy) { return { x: wx - this.scrollX, y: wy - this.scrollY }; }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  update(dt) {
    // Cap dt to prevent huge skips (e.g. background tab)
    if (dt > 0.1) dt = 0.1;
    this.gameTime += dt;

    // Common updates (always run)
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) { this.fps = this.frameCount; this.frameCount = 0; this.fpsTimer = 0; }

    this.input.updateSmoothing();
    this.updateBackground(dt);

    if (this.state === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      const el = document.getElementById('countdown');
      const n = Math.ceil(this.countdownTimer);
      if (el) el.innerText = n > 0 ? n : 'GO!';
      if (n !== this.lastCountdownNum && n >= 0) {
        this.lastCountdownNum = n;
        if (n > 0) this.sound.countdown(); else this.sound.countdownGo();
      }
      if (this.countdownTimer <= -0.3) {
        this.state = 'PLAYING';
        if (el) el.classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
      }
      return;
    }

    if (this.state === 'PAUSED') return;
    if (this.state !== 'PLAYING') return;

    // Decay effects
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 15);
    if (this.chromaticAberration > 0) this.chromaticAberration = Math.max(0, this.chromaticAberration - dt * 8);

    // In-game threat escalation
    if (this.score > 3000) this.setThreatLevel(3);
    else if (this.score > 1000) this.setThreatLevel(2);

    // Spawning (difficulty-aware)
    const d = this.currentDifficulty;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(d.spawnMin, d.spawnBase - (this.level * 0.3));
    }

    for (const e of this.entities) e.update(dt);
    for (const p of this.particles) p.update(dt);

    this.checkCollisions();
    this.entities = this.entities.filter(e => !e.markedForDeletion);
    this.particles = this.particles.filter(p => !p.markedForDeletion);

    if (this.player.health <= 0) this.gameOver();
    this.updateHUD();
  }

  // ──────────────────────────────────────────────
  // GAMEPLAY HELPERS
  // ──────────────────────────────────────────────
  setThreatLevel(lvl) {
    if (this.level !== lvl) {
      this.level = lvl;
      this.screenShake = 8;
      this.chromaticAberration = 6;
      this.sound.levelUp();
      const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
      for (let i = 0; i < 30; i++) {
        this.particles.push(new Particle(this, cx, cy, lvl >= 3 ? '#ff0000' : '#ff00ff', { type: 'spark', size: Math.random() * 10 + 5, speed: 400, life: 0.8, gravity: 0 }));
      }
      const el = document.getElementById('levelDisplay');
      if (el) { el.classList.add('threat-flash'); setTimeout(() => el.classList.remove('threat-flash'), 1000); }
    }
  }

  createExplosion(x, y, color, count = 10) {
    const n = Math.ceil(count * this.settings.particleDensity);
    for (let i = 0; i < n; i++) {
      const type = Math.random() > 0.5 ? 'circle' : 'spark';
      this.particles.push(new Particle(this, x, y, color, { type, gravity: type === 'spark' ? 0 : 100, speed: Math.random() * 300 + 80 }));
    }
    this.screenShake = Math.max(this.screenShake, 4);
    this.chromaticAberration = Math.max(this.chromaticAberration, 3);
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const m = 50;
    if (side === 0) { x = Math.random() * this.canvas.width; y = -m; }
    else if (side === 1) { x = this.canvas.width + m; y = Math.random() * this.canvas.height; }
    else if (side === 2) { x = Math.random() * this.canvas.width; y = this.canvas.height + m; }
    else { x = -m; y = Math.random() * this.canvas.height; }

    const d = this.currentDifficulty;
    let enemy;
    if (this.level >= 3 && Math.random() > 0.7) {
      enemy = new Hunter(this, x, y);
    } else if (this.level >= 2 && Math.random() > 0.6) {
      enemy = new Wanderer(this, x, y);
    } else {
      enemy = new Chaser(this, x, y);
    }
    // Apply difficulty multipliers
    enemy.speed *= d.enemySpeedMult;
    enemy.health = Math.ceil(enemy.health * d.enemyHealthMult);
    this.entities.push(enemy);
  }

  checkCollisions() {
    const bullets = this.entities.filter(e => e instanceof Bullet);
    const enemies = this.entities.filter(e => e instanceof Chaser || e instanceof Wanderer || e instanceof Hunter);
    const collectibles = this.entities.filter(e => e instanceof Collectible);
    const d = this.currentDifficulty;

    for (const b of bullets) {
      for (const en of enemies) {
        if (!b.markedForDeletion && !en.markedForDeletion && b.checkCollision(en)) {
          b.markedForDeletion = true;
          en.health--;
          this.sound.hit();
          this.createExplosion(b.x, b.y, '#fff', 5);
          if (en.health <= 0) { en.markedForDeletion = true; this.handleEnemyDeath(en); }
        }
      }
    }

    for (const en of enemies) {
      if (!en.markedForDeletion && this.player.checkCollision(en)) {
        this.player.takeDamage(d.damagePerHit);
        this.sound.playerHit();
        en.markedForDeletion = true;
        this.createExplosion(en.x, en.y, '#ff0055', 20);
        this.chromaticAberration = 8;
      }
    }

    for (const item of collectibles) {
      if (!item.markedForDeletion && this.player.checkCollision(item)) {
        item.markedForDeletion = true;
        this.score += 100;
        this.sound.collect();
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        this.createExplosion(item.x, item.y, '#00ff88', 12);
      }
    }
  }

  handleEnemyDeath(enemy) {
    const color = (enemy instanceof Wanderer) ? '#ff00ff' : (enemy instanceof Hunter ? '#ffff00' : '#ff0055');
    this.createExplosion(enemy.x, enemy.y, color, 25);
    this.sound.explosion();
    this.score += (enemy instanceof Wanderer) ? 50 : (enemy instanceof Hunter ? 100 : 25);
    const d = this.currentDifficulty;
    if (Math.random() < d.collectChance) {
      this.entities.push(new Collectible(this, enemy.x, enemy.y));
    }
  }

  // ──────────────────────────────────────────────
  // HUD
  // ──────────────────────────────────────────────
  updateHUD() {
    if (this.player) {
      const pct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
      const hb = document.getElementById('healthBar');
      hb.style.width = pct + '%';
      hb.classList.toggle('critical', pct < 25);
      document.getElementById('hud').classList.toggle('hud-danger', pct < 25);
    }
    document.getElementById('scoreDisplay').innerText = String(this.score).padStart(6, '0');
    document.getElementById('levelDisplay').innerText = `THREAT LV ${String(this.level).padStart(2, '0')}`;
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.saveHighScore();
    this.sound.gameOver();
    this.sound.stopMusic();
    this.hideAll();
    document.getElementById('gameOverMenu').classList.remove('hidden');
    document.getElementById('finalScore').innerText = this.score;

    const d = this.difficulties[this.selectedDifficulty];
    const dl = document.getElementById('finalDifficulty');
    if (dl) { dl.textContent = d.name; dl.style.color = d.color; }

    const hs = this.highScores[this.selectedDifficulty] || 0;
    const hse = document.getElementById('finalHighScore');
    if (hse) hse.textContent = hs;

    const ne = document.getElementById('newRecord');
    if (ne) ne.classList.toggle('hidden', this.score < hs);

    if (this.player) {
      const cx = this.player.x + this.player.width / 2, cy = this.player.y + this.player.height / 2;
      for (let i = 0; i < 50; i++) {
        this.particles.push(new Particle(this, cx, cy,
          ['#0ff', '#ff0055', '#fff', '#ff00ff'][Math.floor(Math.random() * 4)],
          { type: Math.random() > 0.5 ? 'circle' : 'spark', size: Math.random() * 10 + 3, speed: Math.random() * 500 + 100, life: 1.5, gravity: 50 }));
      }
    }
  }

  // ──────────────────────────────────────────────
  // PAUSE
  // ──────────────────────────────────────────────
  _setupPause() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state === 'PLAYING') this.pause();
        else if (this.state === 'PAUSED') this.unpause();
      }
    });
  }

  pause() {
    this.state = 'PAUSED';
    this.sound.pause();
    document.getElementById('pauseMenu').classList.remove('hidden');
  }

  unpause() {
    this.state = 'PLAYING';
    this.sound.unpause();
    document.getElementById('pauseMenu').classList.add('hidden');
  }

  // ──────────────────────────────────────────────
  // DRAW
  // ──────────────────────────────────────────────
  draw() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;

    if (this.settings.theme === 'aircraft') {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#55aaff'); bg.addColorStop(1, '#aabbdd');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.save();
      if (this.screenShake > 0 && this.settings.screenShakeEnabled) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
      }
      // Draw clouds using stars
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const s of this.stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x + s.size*3, s.y + s.size*2, s.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#020210'); bg.addColorStop(0.5, '#050515'); bg.addColorStop(1, '#080820');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      ctx.save();
      if (this.screenShake > 0 && this.settings.screenShakeEnabled) {
        ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
      }

      // Nebula
      for (const c of this.nebulaClouds) {
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius);
        g.addColorStop(0, c.color + c.opacity + ')'); g.addColorStop(1, c.color + '0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); ctx.fill();
      }

      // Stars
      for (const s of this.stars) {
        const tw = Math.sin(s.twinklePhase) * 0.5 + 0.5, a = s.opacity * tw;
        if (s.layer === 2) { ctx.fillStyle = `rgba(120,200,255,${a * 0.3})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = `rgba(180,220,255,${a})`; ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      // Grid
      const gp = Math.sin(this.gameTime * 0.8) * 0.04 + 0.08;
      const gc = this.level >= 3 ? `rgba(255,0,85,${gp})` : this.level >= 2 ? `rgba(200,0,255,${gp})` : `rgba(0,242,255,${gp})`;
      ctx.strokeStyle = gc; ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 80) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let i = 0; i < h; i += 80) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
      ctx.fillStyle = gc;
      for (let x = 0; x < w; x += 80) for (let y = 0; y < h; y += 80) ctx.fillRect(x - 1, y - 1, 2, 2);
    }

    if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAMEOVER') {
      for (const p of this.particles) p.draw(ctx);
      ctx.shadowBlur = 15;
      for (const e of this.entities) e.draw(ctx);
      ctx.shadowBlur = 0;

      if (this.chromaticAberration > 0.5) {
        const off = this.chromaticAberration;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06;
        ctx.drawImage(this.canvas, off, 0); ctx.drawImage(this.canvas, -off, 0);
        ctx.restore();
      }
    }

    // Vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

    ctx.restore();

    // FPS
    if (this.settings.showFPS) {
      ctx.save(); ctx.font = '12px "Share Tech Mono",monospace'; ctx.fillStyle = 'rgba(0,242,255,0.5)';
      ctx.fillText(`FPS: ${this.fps}`, 10, h - 10); ctx.restore();
    }
  }

  start() {
    const loop = (ts) => {
      const dt = (ts - this.lastTime) / 1000; this.lastTime = ts;
      if (dt < 0.1) this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}