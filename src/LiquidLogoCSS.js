export class LiquidLogoCSS {
  constructor(container) {
    this.container = container;
    this.ticking = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.tiltX = 0;
    this.tiltY = 0;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.hasPermission = false;
    this.idleTime = 0;
    this.idleAnimationId = null;
    
    // Layer depth configuration (higher = more parallax)
    this.layerDepths = {
      layer1: 20,  // Front layer - subtle parallax (feather highlight)
      layer2: 8,   // Middle layer (music note)
      layer3: 0    // Back layer - base (feather shadow)
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
      // Start idle animation for subtle movement
      this.startIdleAnimation();
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
        </div>
      </div>
    `;
  }

  cacheElements() {
    this.logoEl = document.getElementById('glass-logo');
    this.layer1 = document.getElementById('layer-1');
    this.layer2 = document.getElementById('layer-2');
    this.layer3 = document.getElementById('layer-3');
    this.sceneEl = this.container.querySelector('.glass-scene');
  }

  addEvents() {
    // Desktop mouse
    window.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
    
    // Mobile touch - attach to scene element for better response
    if (this.sceneEl) {
      this.sceneEl.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      this.sceneEl.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
      this.sceneEl.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
    }
    
    // Also listen globally for touch
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    
    // Device orientation (gyroscope) - requires permission on iOS 13+
    if (this.isMobile) {
      this.requestMotionPermission();
    }
  }

  // iOS 13+ requires explicit permission for device orientation
  async requestMotionPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ - need to request permission on user gesture
      // Add a one-time listener for any touch to request permission
      const requestOnTouch = async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            this.hasPermission = true;
            window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this), { passive: true });
          }
        } catch (err) {
          console.log('Motion permission denied or unavailable');
        }
        // Remove the listener after first attempt
        document.removeEventListener('touchstart', requestOnTouch);
      };
      document.addEventListener('touchstart', requestOnTouch, { once: true });
    } else {
      // Android or older iOS - just add the listener
      this.hasPermission = true;
      window.addEventListener('deviceorientation', this.onDeviceOrientation.bind(this), { passive: true });
    }
  }

  onMouseMove(e) {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    this.idleTime = 0; // Reset idle timer
    this.requestUpdate();
  }

  onTouchStart(e) {
    this.idleTime = 0; // Reset idle timer
  }

  onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
      this.idleTime = 0; // Reset idle timer
      this.requestUpdate();
    }
  }

  onTouchEnd(e) {
    // Gentle return to center over time (handled by idle animation)
  }

  onDeviceOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
      // gamma: left-right tilt (-90 to 90)
      // beta: front-back tilt (-180 to 180)
      this.tiltX = Math.max(-1, Math.min(1, e.gamma / 30)); // More sensitive
      this.tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); // More sensitive
      this.idleTime = 0; // Reset idle timer
      this.requestUpdate();
    }
  }

  // Subtle idle animation when no interaction
  startIdleAnimation() {
    const animate = () => {
      this.idleTime += 0.016; // ~60fps
      
      // Only apply idle animation if no recent interaction
      if (this.idleTime > 2) { // Start after 2 seconds of no interaction
        const idleFactor = Math.min((this.idleTime - 2) / 2, 1); // Fade in over 2 seconds
        const time = Date.now() * 0.0005;
        
        // Gentle floating motion
        const idleX = Math.sin(time) * 0.15 * idleFactor;
        const idleY = Math.cos(time * 0.7) * 0.1 * idleFactor;
        
        // Blend with current position
        this.mouseX = this.mouseX * (1 - idleFactor * 0.1) + idleX * idleFactor * 0.1;
        this.mouseY = this.mouseY * (1 - idleFactor * 0.1) + idleY * idleFactor * 0.1;
        
        this.requestUpdate();
      }
      
      this.idleAnimationId = requestAnimationFrame(animate);
    };
    animate();
  }

  requestUpdate() {
    if (!this.ticking) {
      requestAnimationFrame(this.update.bind(this));
      this.ticking = true;
    }
  }

  update() {
    // Combine mouse/touch with tilt
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
    const layer1Z = this.layerDepths.layer1;
    const layer2Z = this.layerDepths.layer2;
    const layer3Z = this.layerDepths.layer3;

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

    this.ticking = false;
  }
}
