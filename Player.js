class Player extends GameObject {
  constructor(game, x, y, input) {
    super(game, x, y, 32, 32);
    this.input = input;
    this.speed = 350;
    this.maxHealth = 100;
    this.health = 100;
    this.fireRate = 0.12;
    this.fireTimer = 0;
    this.angle = 0;

    // Invulnerability system
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.blinkTimer = 0;

    // Weapon effects
    this.muzzleFlash = 0;

    // Engine glow
    this.enginePulse = 0;
    this.thrustTrail = [];
  }

  update(dt) {
    let dx = 0;
    let dy = 0;
    if (this.input.isKeyDown('w') || this.input.isKeyDown('arrowup')) dy -= 1;
    if (this.input.isKeyDown('s') || this.input.isKeyDown('arrowdown')) dy += 1;
    if (this.input.isKeyDown('a') || this.input.isKeyDown('arrowleft')) dx -= 1;
    if (this.input.isKeyDown('d') || this.input.isKeyDown('arrowright')) dx += 1;

    const isMoving = dx !== 0 || dy !== 0;

    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    // Smoothly update angle toward mouse
    const worldMouse = this.game.screenToWorld(this.input.mouse.x, this.input.mouse.y);
    const targetAngle = Math.atan2(worldMouse.y - (this.y + this.height / 2), worldMouse.x - (this.x + this.width / 2));
    this.angle = targetAngle;

    // Constrain to canvas
    this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
    this.y = Math.max(0, Math.min(this.y, this.game.canvas.height - this.height));

    this.fireTimer -= dt;
    if (this.input.mouse.clicked && this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = this.fireRate;
    }

    // Handle invulnerability
    if (this.invulnerable) {
      this.invulnTimer -= dt;
      this.blinkTimer += dt;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
      }
    }

    if (this.muzzleFlash > 0) {
      this.muzzleFlash -= dt;
    }

    // Engine pulse animation
    this.enginePulse += dt * 8;

    // Engine exhaust particles (enhanced trail)
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const exhaustX = cx - Math.cos(this.angle) * 14;
    const exhaustY = cy - Math.sin(this.angle) * 14;

    const isAircraft = this.game.settings.theme === 'aircraft';
    if (isMoving && Math.random() < 0.6) {
      this.game.particles.push(new Particle(this.game, exhaustX, exhaustY, isAircraft ? 'rgba(200,200,200,0.5)' : '#0ff', {
        type: 'circle',
        size: Math.random() * (isAircraft ? 6 : 4) + 2,
        speed: isAircraft ? 50 : 80,
        life: 0.4,
        gravity: 0
      }));
    }
    if (Math.random() < 0.15) {
      this.game.particles.push(new Particle(this.game, exhaustX, exhaustY, isAircraft ? 'rgba(150,150,150,0.5)' : '#0088ff', {
        type: 'circle',
        size: Math.random() * 3 + 1,
        speed: 30,
        life: 0.6,
        gravity: 0
      }));
    }
  }

  takeDamage(amount) {
    if (this.invulnerable) return;

    this.health -= amount;
    this.invulnerable = true;
    this.invulnTimer = 1.5;
    this.blinkTimer = 0;
    this.game.screenShake = 12;

    // Damage burst particles
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    for (let i = 0; i < 8; i++) {
      this.game.particles.push(new Particle(this.game, cx, cy, '#ff0000', {
        type: 'spark',
        size: Math.random() * 8 + 4,
        speed: 200,
        life: 0.5,
        gravity: 0
      }));
    }
  }

  shoot() {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Position muzzle flash at the tip of the ship
    this.muzzleFlash = 0.06;

    // Muzzle spark particles
    const tipX = centerX + Math.cos(this.angle) * 18;
    const tipY = centerY + Math.sin(this.angle) * 18;
    for (let i = 0; i < 3; i++) {
      this.game.particles.push(new Particle(this.game, tipX, tipY, '#fff', {
        type: 'spark',
        size: Math.random() * 6 + 2,
        speed: 150,
        life: 0.15,
        gravity: 0
      }));
    }

    this.game.entities.push(new Bullet(this.game, centerX, centerY, this.angle));
    this.game.sound.shoot();
    this.game.screenShake = 1.5;
  }

  draw(ctx) {
    // Blinking effect when invulnerable
    if (this.invulnerable && Math.floor(this.blinkTimer * 15) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.angle);

    const isAircraft = this.game.settings.theme === 'aircraft';

    if (isAircraft) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.fillStyle = '#b0c4de';
      ctx.strokeStyle = '#2f4f4f';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#778899';
      ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(-4, -18); ctx.lineTo(-10, -18); ctx.lineTo(-6, -5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 5); ctx.lineTo(-4, 18); ctx.lineTo(-10, 18); ctx.lineTo(-6, 5); ctx.fill(); ctx.stroke();
      
      ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-16, -8); ctx.lineTo(-18, -8); ctx.lineTo(-16, -2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-16, 8); ctx.lineTo(-18, 8); ctx.lineTo(-16, 2); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#87ceeb';
      ctx.beginPath(); ctx.ellipse(4, 0, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
      
      ctx.strokeStyle = `rgba(50,50,50, ${0.4 + Math.sin(this.enginePulse*5)*0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(16, -8); ctx.lineTo(16, 8); ctx.stroke();

      if (this.muzzleFlash > 0) {
        ctx.save(); ctx.translate(18, 0); const flashSize = 6 + Math.random() * 8;
        const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, flashSize);
        flashGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)'); flashGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.6)'); flashGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = flashGrad; ctx.beginPath(); ctx.arc(0, 0, flashSize, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    } else {
      // Engine exhaust glow (behind ship)
      const engineGlow = Math.sin(this.enginePulse) * 0.3 + 0.7;
      ctx.save();
      ctx.translate(-14, 0);
      const exhaust = ctx.createRadialGradient(0, 0, 0, 0, 0, 12 * engineGlow);
      exhaust.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
      exhaust.addColorStop(0.5, 'rgba(0, 136, 255, 0.2)');
      exhaust.addColorStop(1, 'rgba(0, 136, 255, 0)');
      ctx.fillStyle = exhaust;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * engineGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer glow ring
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#0ff';

      // Core ship shape - sleeker design
      ctx.fillStyle = '#0a0a1a';
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -14);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-10, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner accent lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-2, -6);
      ctx.moveTo(12, 0);
      ctx.lineTo(-2, 6);
      ctx.stroke();

      // Core energy diamond
      ctx.fillStyle = '#0ff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0ff';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(0, -3);
      ctx.lineTo(-4, 0);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.fill();

      // Muzzle flash
      if (this.muzzleFlash > 0) {
        ctx.save();
        ctx.translate(22, 0);
        const flashSize = 8 + Math.random() * 12;
        const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, flashSize);
        flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        flashGrad.addColorStop(0.3, 'rgba(0, 255, 255, 0.6)');
        flashGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(0, 0, flashSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }
}