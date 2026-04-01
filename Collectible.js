class Collectible extends GameObject {
  constructor(game, x, y) {
    super(game, x, y, 20, 20);
    this.life = 10.0;
    this.baseY = y;
    this.offset = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.spinAngle = 0;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.markedForDeletion = true;
    this.offset = Math.sin(Date.now() / 200) * 8;
    this.pulsePhase += dt * 5;
    this.spinAngle += dt * 3;

    // Sparkle trail
    if (Math.random() < 0.15) {
      this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2 + this.offset, '#00ff88', {
        type: 'circle',
        size: Math.random() * 3 + 1,
        speed: 20,
        life: 0.5,
        gravity: -20
      }));
    }
  }

  draw(ctx) {
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2 + this.offset;

    ctx.save();
    ctx.translate(cx, cy);

    // Pickup aura
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width * 1.5);
    aura.addColorStop(0, `rgba(0, 255, 136, ${0.15 * pulse})`);
    aura.addColorStop(1, 'rgba(0, 255, 136, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, this.width * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Rotating diamond
    ctx.rotate(this.spinAngle);
    ctx.shadowBlur = 15 + pulse * 10;
    ctx.shadowColor = '#00ff88';
    ctx.strokeStyle = `rgba(0, 255, 136, ${0.6 + pulse * 0.4})`;
    ctx.lineWidth = 2;

    // Outer diamond
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(0, this.height / 2);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = `rgba(0, 255, 136, ${0.15 + pulse * 0.1})`;
    ctx.fill();

    // Inner cross
    ctx.strokeStyle = `rgba(100, 255, 200, ${0.5 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 4);
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();

    // Blinking urgency when about to expire
    if (this.life < 3 && Math.floor(this.life * 4) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}