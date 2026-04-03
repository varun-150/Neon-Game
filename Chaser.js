class Chaser extends GameObject {
  constructor(game, x, y) {
    super(game, x, y, 24, 24);
    this.speed = 150;
    this.health = 2;
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 5;
  }

  update(dt) {
    const player = this.game.player;
    if (!player) return;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
    this.angle += this.rotSpeed * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    if (this.game.settings.theme === 'aircraft') {
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      
      const hx = (this.game.player ? this.game.player.x : this.x) - this.x;
      const hy = (this.game.player ? this.game.player.y : this.y) - this.y;
      const heading = Math.atan2(hy, hx);
      
      ctx.save();
      ctx.rotate(heading);
      ctx.fillStyle = '#696969';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, -2); ctx.lineTo(-16, -1); ctx.lineTo(-16, 1); ctx.lineTo(-8, 2);
      ctx.fill();
      ctx.restore();
      
      ctx.rotate(this.angle * 3);
      ctx.strokeStyle = '#aaaaaa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.lineTo(14, 0);
      ctx.moveTo(0, -14); ctx.lineTo(0, 14);
      ctx.stroke();
    } else {
      ctx.rotate(this.angle);
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff0055';
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const hx = Math.cos(a) * (this.width / 1.5);
        const hy = Math.sin(a) * (this.height / 1.5);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
      ctx.fill();
    }
    ctx.restore();
  }
}
