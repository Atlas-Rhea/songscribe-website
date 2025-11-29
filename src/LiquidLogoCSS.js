export class LiquidLogoCSS {
  constructor(container) {
    this.container = container;
    this.ticking = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.tiltX = 0;
    this.tiltY = 0;
    
    // Layer depth configuration (higher = more parallax)
    this.layerDepths = {
      layer1: 35,  // Front layer - subtle parallax (feather highlight)
      layer2: 15,  // Middle layer (music note)
      layer3: 0,   // Back layer - base (feather shadow)
      glow: 50     // Glow floats above
    };
  }

  init() {
    this.render();
    this.cacheElements();
    this.addEvents();
    this.update(); // Initial position
  }

  render() {
    this.container.innerHTML = `
      <div class="glass-scene">
        <div class="glass-logo" id="glass-logo">
          <div class="glass-layer layer-1" id="layer-1">
            <img src="/assets/images/Layer1.svg" alt="">
          </div>
          <div class="glass-layer layer-2" id="layer-2">
            <img src="/assets/images/Layer2.svg" alt="">
          </div>
          <div class="glass-layer layer-3" id="layer-3">
            <img src="/assets/images/Layer3.svg" alt="">
          </div>
          <div class="glass-glow" id="glass-glow"></div>
        </div>
      </div>
    `;
  }

  cacheElements() {
    this.logoEl = document.getElementById('glass-logo');
    this.layer1 = document.getElementById('layer-1');
    this.layer2 = document.getElementById('layer-2');
    this.layer3 = document.getElementById('layer-3');
    this.glowEl = document.getElementById('glass-glow');
  }

  addEvents() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this), { passive: true });
  }

  onMouseMove(e) {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    this.requestUpdate();
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
      this.requestUpdate();
    }
  }

  onDeviceOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
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
    const x = this.mouseX + this.tiltX;
    const y = this.mouseY + this.tiltY;

    // Rotation for the whole logo container
    const rotateX = y * -15;
    const rotateY = x * 15;

    // Apply transforms directly (Safari-compatible)
    if (this.logoEl) {
      this.logoEl.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    // Apply Z translation to each layer for parallax depth
    if (this.layer1) {
      this.layer1.style.transform = `translateZ(${this.layerDepths.layer1}px)`;
    }
    if (this.layer2) {
      this.layer2.style.transform = `translateZ(${this.layerDepths.layer2}px)`;
    }
    if (this.layer3) {
      this.layer3.style.transform = `translateZ(${this.layerDepths.layer3}px)`;
    }
    if (this.glowEl) {
      // Glow follows mouse position
      const glowX = 50 + x * 30;
      const glowY = 50 + y * 30;
      this.glowEl.style.transform = `translateZ(${this.layerDepths.glow}px)`;
      this.glowEl.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.25) 0%, transparent 50%)`;
    }

    this.ticking = false;
  }
}
