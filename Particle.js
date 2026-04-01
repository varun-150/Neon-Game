class Particle extends GameObject {
  constructor(game, x, y, color, options = {}) {
    const size = options.size || Math.random() * 6 + 2;
    super(game, x, y, size, size);

    this.color = color;
    this.type = options.type || 'square'; // square, circle, spark

    // Physics
    const angle = Math.random() * Math.PI * 2;
    const speed = options.speed || Math.random() * 250 + 50;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.gravity = options.gravity ?? 200;
    this.friction = options.friction ?? 0.98;

    // Life
    this.life = options.life || 1.2;
    this.maxLife = this.life;

    // Visuals
    this.alpha = 1;
    this.shrink = options.shrink ?? 0.96;

    // Optional rotation
    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() - 0.5) * 10;
  }

  update(dt) {
    // Apply physics
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Rotation
    this.angle += this.angularVelocity * dt;

    // Life decay
    this.life -= dt;
    const lifeRatio = Math.max(0, this.life / this.maxLife);

    // Smooth fade (ease-out)
    this.alpha = Math.pow(lifeRatio, 1.5);

    // Shrink over time
    this.width *= this.shrink;
    this.height *= this.shrink;

    // Kill particle
    if (this.life <= 0 || this.width < 0.1) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();

    ctx.globalAlpha = this.alpha;

    // Glow effect
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    // Rotate around center
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;

    if (this.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.1, this.width / 2), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'spark') {
      ctx.fillRect(-this.width / 2, -this.height / 8, this.width, Math.max(0.1, this.height / 4));
    } else {
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    ctx.restore();
  }
}