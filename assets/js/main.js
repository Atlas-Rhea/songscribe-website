/**
 * SongScribe Website - Main JavaScript
 * Handles navigation, interactions, and performance optimizations
 */

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('SongScribe website loaded');

  // Initialize all modules
  initNavigation();
  initSmoothScrolling();
  initLazyLoading();
  initVideoControls();
  initFormValidation();
  initScrollAnimations();
  initPerformanceMonitoring();
});

/**
 * Mobile Navigation
 */
function initNavigation() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!menuToggle || !navLinks) return;

  // Toggle mobile menu
  menuToggle.addEventListener('click', function() {
    const isOpen = navLinks.classList.contains('open');
    const newState = !isOpen;

    navLinks.classList.toggle('open', newState);
    menuToggle.setAttribute('aria-expanded', newState.toString());

    // Prevent body scroll when menu is open
    document.body.style.overflow = newState ? 'hidden' : '';
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!menuToggle.contains(event.target) && !navLinks.contains(event.target)) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close menu when clicking on links
  navLinks.addEventListener('click', function(event) {
    if (event.target.tagName === 'A') {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/**
 * Smooth Scrolling for Anchor Links
 */
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(event) {
      event.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;

      const headerOffset = 80; // Account for fixed header
      const elementPosition = targetElement.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update URL without triggering scroll
      history.pushState(null, null, targetId);
    });
  });
}

/**
 * Lazy Loading for Images
 */
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        videoObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  images.forEach(img => videoObserver.observe(img));
}

/**
 * Video Controls for Demo Videos
 */
function initVideoControls() {
  const demoVideos = document.querySelectorAll('.demo-video');

  demoVideos.forEach(video => {
    // Autoplay on hover (desktop only)
    if (window.innerWidth >= 768) {
      video.addEventListener('mouseenter', function() {
        this.play().catch(e => console.log('Video play failed:', e));
      });

      video.addEventListener('mouseleave', function() {
        this.pause();
        this.currentTime = 0;
      });
    }

    // Add loading state
    video.addEventListener('loadstart', function() {
      this.parentElement.classList.add('loading');
    });

    video.addEventListener('canplay', function() {
      this.parentElement.classList.remove('loading');
    });

    // Handle errors
    video.addEventListener('error', function() {
      console.error('Video failed to load:', this.src);
      this.parentElement.innerHTML = '<div class="video-error">Video unavailable</div>';
    });
  });
}

/**
 * Form Validation
 */
function initFormValidation() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && !isValidEmail(emailInput.value)) {
        event.preventDefault();
        showFormError(emailInput, 'Please enter a valid email address');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        if (this.type === 'email' && this.value && !isValidEmail(this.value)) {
          showFormError(this, 'Please enter a valid email address');
        } else {
          clearFormError(this);
        }
      });

      input.addEventListener('input', function() {
        if (this.classList.contains('error')) {
          clearFormError(this);
        }
      });
    });
  });
}

/**
 * Email validation helper
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Form error handling
 */
function showFormError(input, message) {
  clearFormError(input);

  input.classList.add('error');
  input.setAttribute('aria-invalid', 'true');

  const errorElement = document.createElement('div');
  errorElement.className = 'form-error';
  errorElement.textContent = message;
  errorElement.setAttribute('role', 'alert');

  input.parentElement.appendChild(errorElement);
  input.focus();
}

function clearFormError(input) {
  input.classList.remove('error');
  input.setAttribute('aria-invalid', 'false');

  const errorElement = input.parentElement.querySelector('.form-error');
  if (errorElement) {
    errorElement.remove();
  }
}

/**
 * Scroll-based Animations
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);

  // Observe elements that should animate in
  const animateElements = document.querySelectorAll('.feature-card, .step, .testimonial-card');
  animateElements.forEach(element => observer.observe(element));
}

/**
 * Performance Monitoring
 */
function initPerformanceMonitoring() {
  // Monitor Core Web Vitals if supported
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);

        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
          gtag('event', 'lcp', {
            event_category: 'performance',
            event_label: 'largest_contentful_paint',
            value: Math.round(lastEntry.startTime),
            non_interaction: true
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.log('LCP monitoring not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FID:', entry.processingStart - entry.startTime);

          if (typeof gtag !== 'undefined') {
            gtag('event', 'fid', {
              event_category: 'performance',
              event_label: 'first_input_delay',
              value: Math.round(entry.processingStart - entry.startTime),
              non_interaction: true
            });
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.log('FID monitoring not supported');
    }
  }

  // Monitor page load time
  window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log('Page load time:', loadTime);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load_time', {
        event_category: 'performance',
        event_label: 'dom_content_loaded',
        value: Math.round(loadTime),
        non_interaction: true
      });
    }
  });
}

/**
 * Keyboard Navigation Enhancements
 */
document.addEventListener('keydown', function(event) {
  // Skip to main content with Tab
  if (event.key === 'Tab') {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.style.display = 'block';
    }
  }

  // Close mobile menu with Escape
  if (event.key === 'Escape') {
    const navLinks = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.mobile-menu-toggle');

    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
      }
      document.body.style.overflow = '';
    }
  }
});

/**
 * Service Worker Registration
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

/**
 * Viewport Height Fix for Mobile Browsers
 */
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', function() {
  // Delay to account for mobile browser UI changes
  setTimeout(setVH, 100);
});

setVH(); // Initial call

/**
 * Prevent zoom on input focus on iOS
 */
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      // Prevent zoom by ensuring viewport meta tag is set correctly
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    });

    input.addEventListener('blur', function() {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    });
  });
}

/**
 * Error Handling
 */
window.addEventListener('error', function(event) {
  console.error('JavaScript error:', event.error);

  // Send to analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      description: event.error.toString(),
      fatal: false
    });
  }
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);

  if (typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      description: event.reason.toString(),
      fatal: false
    });
  }
});

/**
 * Utility Functions
 */

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Get scroll direction
let lastScrollTop = 0;
window.addEventListener('scroll', throttle(function() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop) {
    document.body.setAttribute('data-scroll-direction', 'down');
  } else {
    document.body.setAttribute('data-scroll-direction', 'up');
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, 100));

// Add loading states to async operations
function asyncOperation(promise, loadingElement) {
  if (loadingElement) {
    loadingElement.classList.add('loading');
  }

  return promise
    .finally(() => {
      if (loadingElement) {
        loadingElement.classList.remove('loading');
      }
    });
}

// Console greeting for developers
console.log(`
🎵 SongScribe Website Loaded
   Built with ❤️ for musicians worldwide
   Check out the source: https://github.com/songscribe-offline-muse
`);
