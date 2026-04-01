class Hunter extends GameObject {
  constructor(game, x, y) {
    super(game, x, y, 20, 20);
    this.speed = 200;
    this.health = 1;
    this.angle = 0;
    this.dashTimer = 0;
    this.dashCooldown = 2 + Math.random() * 2;
    this.isDashing = false;
    this.trailTimer = 0;
  }

  update(dt) {
    const player = this.game.player;
    if (!player) return;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.angle = Math.atan2(dy, dx);
      const currentSpeed = this.isDashing ? this.speed * 2.5 : this.speed;
      this.x += (dx / dist) * currentSpeed * dt;
      this.y += (dy / dist) * currentSpeed * dt;
    }

    // Dash mechanic
    this.dashTimer += dt;
    if (this.dashTimer >= this.dashCooldown && dist < 300) {
      this.isDashing = true;
      this.dashTimer = 0;
      this.dashCooldown = 1.5 + Math.random() * 2;
    }
    if (this.isDashing) {
      this.trailTimer += dt;
      if (this.trailTimer > 0.3) {
        this.isDashing = false;
        this.trailTimer = 0;
      }
      // Intense dash trail
      this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#ffff00', {
        type: 'spark',
        size: Math.random() * 6 + 3,
        speed: 100,
        life: 0.3,
        gravity: 0
      }));
    }

    // Normal trail
    if (Math.random() < 0.1) {
      this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, '#ffaa00', {
        type: 'circle',
        size: 2,
        speed: 10,
        life: 0.3,
        gravity: 0
      }));
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    // Dash afterimage glow
    if (this.isDashing) {
      const dashAura = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
      dashAura.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
      dashAura.addColorStop(1, 'rgba(255, 255, 0, 0)');
      ctx.fillStyle = dashAura;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hunter glow
    ctx.shadowBlur = this.isDashing ? 30 : 18;
    ctx.shadowColor = '#ffff00';
    ctx.strokeStyle = this.isDashing ? '#fff' : '#ffff00';
    ctx.lineWidth = 2;

    // Aggressive arrow shape
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-3, -3);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-3, 3);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = this.isDashing ? 'rgba(255, 255, 100, 0.4)' : 'rgba(255, 255, 0, 0.15)';
    ctx.fill();

    // Eye dot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}