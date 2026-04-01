class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = { x: canvas.width / 2, y: canvas.height / 2, clicked: false, rawX: canvas.width / 2, rawY: canvas.height / 2 };
    this.sensitivity = 1.0; // 0.2 to 3.0
    this.smoothing = 0.5;   // 0 = raw, 1 = max smoothing
    this.deadzone = 2;      // pixels of dead zone around center

    // Target position for smoothing
    this._targetX = this.mouse.x;
    this._targetY = this.mouse.y;

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      // Prevent arrow keys from scrolling
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      // Raw mouse position on canvas
      this.mouse.rawX = (e.clientX - rect.left) * scaleX;
      this.mouse.rawY = (e.clientY - rect.top) * scaleY;

      // Apply sensitivity (relative to canvas center)
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      const dx = this.mouse.rawX - centerX;
      const dy = this.mouse.rawY - centerY;

      this._targetX = centerX + dx * this.sensitivity;
      this._targetY = centerY + dy * this.sensitivity;
    });

    window.addEventListener('mousedown', () => this.mouse.clicked = true);
    window.addEventListener('mouseup', () => this.mouse.clicked = false);
  }

  updateSmoothing() {
    // Lerp toward target based on smoothing factor
    const lerpFactor = 1.0 - (this.smoothing * 0.85);
    this.mouse.x += (this._targetX - this.mouse.x) * lerpFactor;
    this.mouse.y += (this._targetY - this.mouse.y) * lerpFactor;
  }

  isKeyDown(key) {
    return !!this.keys[key];
  }
}