class Wanderer extends GameObject {
  constructor(game, x, y) {
    super(game, x, y, 32, 32);
    this.speed = 120;
    this.health = 3;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.angle = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.innerAngle = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const cw = this.game.canvas.width;
    const ch = this.game.canvas.height;

    if (this.x <= 0 || this.x + this.width >= cw) this.vx *= -1;
    if (this.y <= 0 || this.y + this.height >= ch) this.vy *= -1;

    this.x = Math.max(0, Math.min(this.x, cw - this.width));
    this.y = Math.max(0, Math.min(this.y, ch - this.height));
    this.angle += dt * 2;
    this.innerAngle -= dt * 3;
    this.pulsePhase += dt * 3;

    // Ethereal trail
    if (Math.random() < 0.2) {
      this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#ff00ff', {
        type: 'circle',
        size: Math.random() * 4 + 1,
        speed: 10,
        life: 0.6,
        gravity: 0,
        shrink: 0.95
      }));
    }
  }

  draw(ctx) {
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Ethereal aura
    const aura = ctx.createRadialGradient(0, 0, this.width / 3, 0, 0, this.width);
    aura.addColorStop(0, `rgba(255, 0, 255, ${0.1 * pulse})`);
    aura.addColorStop(1, 'rgba(255, 0, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, this.width, 0, Math.PI * 2);
    ctx.fill();

    // Outer hexagon ring
    ctx.rotate(this.angle);
    ctx.shadowBlur = 25 * pulse;
    ctx.shadowColor = '#ff00ff';
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const hx = Math.cos(a) * (this.width / 2);
      const hy = Math.sin(a) * (this.height / 2);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 0, 255, ${0.08 + pulse * 0.05})`;
    ctx.fill();

    // Inner counter-rotating triangle
    ctx.rotate(this.innerAngle - this.angle);
    ctx.strokeStyle = `rgba(200, 100, 255, ${0.4 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const tx = Math.cos(a) * (this.width / 4);
      const ty = Math.sin(a) * (this.height / 4);
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.stroke();

    // Core dot
    ctx.fillStyle = `rgba(255, 180, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}