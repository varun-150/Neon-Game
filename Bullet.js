class Bullet extends GameObject {
  constructor(game, x, y, angle) {
    super(game, x - 4, y - 4, 14, 3);
    this.speed = 1100;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.angle = angle;
    this.life = 1.5;
    this.age = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.age += dt;
    if (this.life <= 0) this.markedForDeletion = true;

    // Neon trail particles
    if (Math.random() < 0.5) {
      this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#0ff', {
        type: 'circle',
        size: Math.random() * 3 + 1,
        speed: 20,
        life: 0.25,
        gravity: 0,
        shrink: 0.92
      }));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.angle);

    // Outer glow trail
    const trailGrad = ctx.createLinearGradient(-20, 0, 8, 0);
    trailGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
    trailGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
    trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(-20, -3, 28, 6);

    // Core bolt
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0ff';
    ctx.fillStyle = '#fff';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Bright tip
    const tipGrad = ctx.createRadialGradient(this.width / 2, 0, 0, this.width / 2, 0, 6);
    tipGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    tipGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = tipGrad;
    ctx.beginPath();
    ctx.arc(this.width / 2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}