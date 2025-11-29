export class LiquidLogoCSS {
  constructor(container) {
    this.container = container;
    this.layers = [];
    this.ticking = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.tiltX = 0;
    this.tiltY = 0;
  }

  init() {
    this.render();
    this.addEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="glass-scene">
        <div class="glass-logo">
          <div class="glass-layer layer-1" style="--depth: 3;">
            <img src="/assets/images/Layer1.svg" alt="Layer 1">
          </div>
          <div class="glass-layer layer-2" style="--depth: 2;">
            <img src="/assets/images/Layer2.svg" alt="Layer 2">
          </div>
          <div class="glass-layer layer-3" style="--depth: 1;">
            <img src="/assets/images/Layer3.svg" alt="Layer 3">
          </div>
          <div class="glass-glow"></div>
        </div>
      </div>
    `;
  }

  addEvents() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this));
  }

  onMouseMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;

    this.mouseX = x;
    this.mouseY = y;

    this.requestUpdate();
  }

  onDeviceOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
      // Gamma: -90 to 90 (left/right)
      // Beta: -180 to 180 (front/back)
      this.tiltX = Math.max(-1, Math.min(1, e.gamma / 45));
      this.tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
      this.requestUpdate();
    }
  }

  requestUpdate() {
    if (!this.ticking) {
      requestAnimationFrame(this.update.bind(this));
      this.ticking = true;
    }
  }

  update() {
    const root = document.documentElement;

    // Combine mouse and tilt
    const x = this.mouseX + this.tiltX;
    const y = this.mouseY + this.tiltY;

    // Smooth damping could be added here, but CSS transitions handle some of it

    root.style.setProperty('--mouse-x', x);
    root.style.setProperty('--mouse-y', y);

    this.ticking = false;
  }
}
