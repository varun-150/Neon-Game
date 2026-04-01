class GameObject {
  constructor(game, x, y, width, height) {
    this.game = game;
    this.name = this.constructor.name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.markedForDeletion = false;
    this.opacity = 1;
  }

  update(dt) { }
  draw(ctx) { }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  checkCollision(other) {
    const b1 = this.getBounds();
    const b2 = other.getBounds();
    return (
      b1.x < b2.x + b2.width &&
      b1.x + b1.width > b2.x &&
      b1.y < b2.y + b2.height &&
      b1.y + b1.height > b2.y
    );
  }
}