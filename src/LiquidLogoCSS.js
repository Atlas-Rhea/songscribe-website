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
      layer1: 20,  // Front layer - subtle parallax (feather highlight)
      layer2: 8,   // Middle layer (music note)
      layer3: 0,   // Back layer - base (feather shadow)
      glow: 30     // Glow floats above
    };
  }

  init() {
    this.render();
    // Wait for DOM to be ready before caching
    requestAnimationFrame(() => {
      this.cacheElements();
      this.addEvents();
      this.update(); // Initial position
      // Force a reflow to ensure 3D context is established
      if (this.logoEl) {
        this.logoEl.offsetHeight; // Force reflow
      }
    });
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

    // Apply transforms with webkit prefixes for Safari compatibility
    const transformValue = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    if (this.logoEl) {
      // Ensure transform-style is preserved
      this.logoEl.style.webkitTransformStyle = 'preserve-3d';
      this.logoEl.style.transformStyle = 'preserve-3d';
      this.logoEl.style.webkitTransform = transformValue;
      this.logoEl.style.transform = transformValue;
    }

    // Apply Z translation to each layer for parallax depth
    // Chrome needs translate3d AND combined transform for both rotation + translation
    const layer1Z = this.layerDepths.layer1;
    const layer2Z = this.layerDepths.layer2;
    const layer3Z = this.layerDepths.layer3;
    const glowZ = this.layerDepths.glow;

    // For Chrome compatibility, apply rotation to each layer as well
    const rotationStr = `rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg)`;

    if (this.layer1) {
      this.layer1.style.webkitTransformStyle = 'preserve-3d';
      this.layer1.style.transformStyle = 'preserve-3d';
      const layer1Transform = `${rotationStr} translate3d(0, 0, ${layer1Z}px)`;
      this.layer1.style.webkitTransform = layer1Transform;
      this.layer1.style.transform = layer1Transform;
    }
    if (this.layer2) {
      this.layer2.style.webkitTransformStyle = 'preserve-3d';
      this.layer2.style.transformStyle = 'preserve-3d';
      const layer2Transform = `${rotationStr} translate3d(0, 0, ${layer2Z}px)`;
      this.layer2.style.webkitTransform = layer2Transform;
      this.layer2.style.transform = layer2Transform;
    }
    if (this.layer3) {
      this.layer3.style.webkitTransformStyle = 'preserve-3d';
      this.layer3.style.transformStyle = 'preserve-3d';
      const layer3Transform = `${rotationStr} translate3d(0, 0, ${layer3Z}px)`;
      this.layer3.style.webkitTransform = layer3Transform;
      this.layer3.style.transform = layer3Transform;
    }
    if (this.glowEl) {
      // Glow follows mouse position
      const glowX = 50 + x * 30;
      const glowY = 50 + y * 30;
      this.glowEl.style.webkitTransformStyle = 'preserve-3d';
      this.glowEl.style.transformStyle = 'preserve-3d';
      const glowTransform = `translate3d(0, 0, ${glowZ}px)`;
      this.glowEl.style.webkitTransform = glowTransform;
      this.glowEl.style.transform = glowTransform;
      this.glowEl.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.25) 0%, transparent 50%)`;
    }

    this.ticking = false;
  }
}
