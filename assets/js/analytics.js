/**
 * SongScribe Website - Analytics & Tracking
 * Google Analytics 4 implementation with privacy-first approach
 */

// Google Analytics 4 Configuration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Initialize GA4
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
  'custom_map': {
    'dimension1': 'page_type',
    'metric1': 'download_clicks',
    'metric2': 'feature_views',
    'metric3': 'demo_interactions'
  },
  'anonymize_ip': true,
  'allow_google_signals': false,
  'allow_ad_personalization_signals': false,
  'send_page_view': true
});

// Track initial page load
gtag('event', 'page_load', {
  'page_title': document.title,
  'page_location': window.location.href,
  'page_type': getPageType(),
  'custom_parameter_1': 'website_visit'
});

/**
 * Determine page type for analytics
 */
function getPageType() {
  const path = window.location.pathname;

  if (path === '/' || path === '/index.html') return 'homepage';
  if (path.includes('/features')) return 'features';
  if (path.includes('/pricing')) return 'pricing';
  if (path.includes('/download')) return 'download';
  if (path.includes('/about')) return 'about';
  if (path.includes('/support')) return 'support';
  if (path.includes('/blog')) return 'blog';
  if (path.includes('/how-it-works')) return 'how_it_works';

  return 'unknown';
}

/**
 * Track user interactions and engagement
 */
document.addEventListener('DOMContentLoaded', function() {
  trackDownloadClicks();
  trackFeatureInteractions();
  trackDemoInteractions();
  trackFormSubmissions();
  trackSocialClicks();
  trackScrollDepth();
  trackTimeOnPage();
  trackOutboundLinks();
});

/**
 * Track download button clicks
 */
function trackDownloadClicks() {
  const downloadButtons = document.querySelectorAll('[data-track="download"]');

  downloadButtons.forEach(button => {
    button.addEventListener('click', function() {
      const platform = this.dataset.platform || 'unknown';
      const location = this.dataset.location || 'unknown';

      gtag('event', 'download_click', {
        'event_category': 'engagement',
        'event_label': `${platform}_${location}`,
        'custom_parameter_1': platform,
        'custom_parameter_2': location
      });

      // Track as conversion
      gtag('event', 'conversion', {
        'send_to': 'G-XXXXXXXXXX/ConversionLabel',
        'value': 1,
        'currency': 'USD'
      });
    });
  });
}

/**
 * Track feature card interactions
 */
function trackFeatureInteractions() {
  const featureCards = document.querySelectorAll('.feature-card');

  featureCards.forEach(card => {
    const featureName = card.querySelector('h3')?.textContent || 'unknown';

    // Track hover (engagement)
    card.addEventListener('mouseenter', function() {
      gtag('event', 'feature_hover', {
        'event_category': 'engagement',
        'event_label': featureName,
        'custom_parameter_1': 'hover'
      });
    });

    // Track clicks (conversion intent)
    const featureLink = card.querySelector('.feature-link');
    if (featureLink) {
      featureLink.addEventListener('click', function() {
        gtag('event', 'feature_click', {
          'event_category': 'engagement',
          'event_label': featureName,
          'custom_parameter_1': 'learn_more'
        });
      });
    }
  });
}

/**
 * Track demo video interactions
 */
function trackDemoInteractions() {
  const demoVideos = document.querySelectorAll('.demo-video');

  demoVideos.forEach(video => {
    let hasTrackedPlay = false;

    video.addEventListener('play', function() {
      if (!hasTrackedPlay) {
        gtag('event', 'demo_play', {
          'event_category': 'engagement',
          'event_label': 'hero_demo',
          'custom_parameter_1': 'first_play'
        });
        hasTrackedPlay = true;
      }
    });

    video.addEventListener('ended', function() {
      gtag('event', 'demo_complete', {
        'event_category': 'engagement',
        'event_label': 'hero_demo',
        'custom_parameter_1': 'full_watch'
      });
    });

    // Track hover interactions on desktop
    if (window.innerWidth >= 768) {
      video.addEventListener('mouseenter', function() {
        gtag('event', 'demo_hover', {
          'event_category': 'engagement',
          'event_label': 'hero_demo',
          'custom_parameter_1': 'desktop'
        });
      });
    }
  });
}

/**
 * Track form submissions
 */
function trackFormSubmissions() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      const formType = this.dataset.formType || 'newsletter';

      gtag('event', 'form_submit', {
        'event_category': 'conversion',
        'event_label': formType,
        'custom_parameter_1': formType
      });

      // For newsletter specifically
      if (formType === 'newsletter') {
        gtag('event', 'newsletter_signup', {
          'event_category': 'conversion',
          'event_label': 'footer_newsletter',
          'custom_parameter_1': 'email_capture'
        });
      }
    });
  });
}

/**
 * Track social media link clicks
 */
function trackSocialClicks() {
  const socialLinks = document.querySelectorAll('.social-links a, .footer a[href*="twitter"], .footer a[href*="github"]');

  socialLinks.forEach(link => {
    link.addEventListener('click', function() {
      const href = this.href;
      let platform = 'unknown';

      if (href.includes('twitter') || href.includes('x.com')) platform = 'twitter';
      else if (href.includes('github')) platform = 'github';
      else if (href.includes('instagram')) platform = 'instagram';
      else if (href.includes('youtube')) platform = 'youtube';

      gtag('event', 'social_click', {
        'event_category': 'engagement',
        'event_label': platform,
        'custom_parameter_1': platform
      });
    });
  });
}

/**
 * Track scroll depth
 */
function trackScrollDepth() {
  let maxScrollDepth = 0;
  const scrollDepths = [25, 50, 75, 90, 100];

  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

    scrollDepths.forEach(depth => {
      if (scrollPercent >= depth && maxScrollDepth < depth) {
        maxScrollDepth = depth;

        gtag('event', 'scroll_depth', {
          'event_category': 'engagement',
          'event_label': `${depth}%`,
          'value': depth,
          'custom_parameter_1': getPageType()
        });
      }
    });
  });
}

/**
 * Track time on page
 */
function trackTimeOnPage() {
  let startTime = Date.now();
  let timeTracked = new Set();

  const timeIntervals = [30, 60, 120, 300]; // seconds

  const timeTracker = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    timeIntervals.forEach(interval => {
      if (elapsedSeconds >= interval && !timeTracked.has(interval)) {
        timeTracked.add(interval);

        gtag('event', 'time_on_page', {
          'event_category': 'engagement',
          'event_label': `${interval}s`,
          'value': interval,
          'custom_parameter_1': getPageType()
        });
      }
    });
  }, 1000);

  // Clear interval when page unloads
  window.addEventListener('beforeunload', function() {
    clearInterval(timeTracker);
  });
}

/**
 * Track outbound link clicks
 */
function trackOutboundLinks() {
  const outboundLinks = document.querySelectorAll('a[href^="http"]:not([href*="songscribe.app"])');

  outboundLinks.forEach(link => {
    link.addEventListener('click', function() {
      const url = new URL(this.href);
      const domain = url.hostname;

      gtag('event', 'outbound_link', {
        'event_category': 'engagement',
        'event_label': domain,
        'custom_parameter_1': domain
      });
    });
  });
}

/**
 * Track navigation interactions
 */
function trackNavigation() {
  // Track mobile menu interactions
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      const isOpen = this.getAttribute('aria-expanded') === 'true';

      gtag('event', 'mobile_menu', {
        'event_category': 'navigation',
        'event_label': isOpen ? 'open' : 'close',
        'custom_parameter_1': 'hamburger_menu'
      });
    });
  }

  // Track navigation link clicks
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      const linkText = this.textContent.trim();
      const isMobile = window.innerWidth < 768;

      gtag('event', 'navigation_click', {
        'event_category': 'navigation',
        'event_label': linkText,
        'custom_parameter_1': isMobile ? 'mobile' : 'desktop'
      });
    });
  });
}

// Initialize navigation tracking
document.addEventListener('DOMContentLoaded', trackNavigation);

/**
 * Track performance metrics
 */
function trackPerformanceMetrics() {
  // Use Performance API to track Core Web Vitals
  if ('PerformanceObserver' in window) {
    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          gtag('event', 'fcp', {
            'event_category': 'performance',
            'event_label': 'first_contentful_paint',
            'value': Math.round(entry.startTime),
            'non_interaction': true
          });
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.log('FCP tracking not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        if (clsValue > 0) {
          gtag('event', 'cls', {
            'event_category': 'performance',
            'event_label': 'cumulative_layout_shift',
            'value': Math.round(clsValue * 1000),
            'non_interaction': true
          });
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.log('CLS tracking not supported');
    }
  }

  // Track page load time
  window.addEventListener('load', function() {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        gtag('event', 'page_load_complete', {
          'event_category': 'performance',
          'event_label': 'dom_content_loaded',
          'value': Math.round(perfData.loadEventEnd - perfData.fetchStart),
          'non_interaction': true
        });
      }
    }, 0);
  });
}

// Initialize performance tracking
trackPerformanceMetrics();

/**
 * Track user preferences and capabilities
 */
function trackUserCapabilities() {
  const capabilities = {
    javascript: true,
    cookies: navigator.cookieEnabled,
    online: navigator.onLine,
    touch: 'ontouchstart' in window,
    retina: window.devicePixelRatio > 1,
    mobile: window.innerWidth < 768,
    tablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    desktop: window.innerWidth >= 1024
  };

  // Send as custom event
  gtag('event', 'user_capabilities', {
    'event_category': 'technical',
    'custom_parameter_1': JSON.stringify(capabilities),
    'non_interaction': true
  });
}

// Track capabilities on load
document.addEventListener('DOMContentLoaded', trackUserCapabilities);

/**
 * Error tracking
 */
window.addEventListener('error', function(event) {
  gtag('event', 'javascript_error', {
    'event_category': 'technical',
    'event_label': event.filename + ':' + event.lineno,
    'description': event.message,
    'fatal': false
  });
});

window.addEventListener('unhandledrejection', function(event) {
  gtag('event', 'javascript_error', {
    'event_category': 'technical',
    'event_label': 'unhandled_promise_rejection',
    'description': event.reason.toString(),
    'fatal': false
  });
});

/**
 * Privacy-friendly tracking
 */

// Respect Do Not Track
if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
  console.log('Analytics disabled due to Do Not Track setting');
  return;
}

// Only track if user hasn't opted out
const trackingConsent = localStorage.getItem('songscribe_tracking_consent');
if (trackingConsent === 'denied') {
  console.log('Analytics disabled due to user preference');
  return;
}

// Cookie consent banner (if needed)
function showCookieConsent() {
  // Only show if no preference set
  if (localStorage.getItem('songscribe_tracking_consent')) return;

  const consentBanner = document.createElement('div');
  consentBanner.className = 'cookie-consent';
  consentBanner.innerHTML = `
    <div class="cookie-consent-content">
      <p>We use cookies to improve your experience. By continuing to use our site, you agree to our use of cookies.</p>
      <div class="cookie-consent-actions">
        <button class="btn btn-secondary" onclick="acceptCookies()">Accept</button>
        <button class="btn-tertiary" onclick="declineCookies()">Decline</button>
      </div>
    </div>
  `;

  document.body.appendChild(consentBanner);

  // Make functions global
  window.acceptCookies = function() {
    localStorage.setItem('songscribe_tracking_consent', 'accepted');
    consentBanner.remove();
  };

  window.declineCookies = function() {
    localStorage.setItem('songscribe_tracking_consent', 'denied');
    consentBanner.remove();
    // Disable GA4
    window['ga-disable-G-XXXXXXXXXX'] = true;
  };
}

// Show consent banner after 3 seconds
setTimeout(showCookieConsent, 3000);

/**
 * Custom event tracking helpers
 */
function trackCustomEvent(eventName, parameters = {}) {
  gtag('event', eventName, {
    'event_category': parameters.category || 'custom',
    'event_label': parameters.label || 'unknown',
    'value': parameters.value || null,
    'custom_parameter_1': parameters.param1 || null,
    'non_interaction': parameters.nonInteraction || false
  });
}

// Make tracking function globally available
window.trackCustomEvent = trackCustomEvent;

/**
 * A/B testing framework
 */
function initializeABTesting() {
  // Simple A/B test for CTA button text
  const ctaButton = document.querySelector('.btn-primary');
  if (ctaButton && ctaButton.textContent.includes('Download')) {
    const variants = ['Download Free', 'Get SongScribe', 'Start Creating'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];

    ctaButton.textContent = randomVariant;

    // Track which variant was shown
    gtag('event', 'ab_test_variant', {
      'event_category': 'experiment',
      'event_label': 'cta_text',
      'custom_parameter_1': randomVariant,
      'non_interaction': true
    });
  }
}

// Initialize A/B testing
document.addEventListener('DOMContentLoaded', initializeABTesting);

/**
 * Heatmap and click tracking (privacy-compliant)
 */
function initializeHeatmapTracking() {
  // Track general click patterns without personal data
  document.addEventListener('click', function(event) {
    const target = event.target;
    const elementType = target.tagName.toLowerCase();
    const elementClass = target.className || 'no-class';
    const elementId = target.id || 'no-id';

    // Only track if it's an interactive element
    if (['a', 'button', 'input', 'select', 'textarea'].includes(elementType)) {
      gtag('event', 'element_click', {
        'event_category': 'interaction',
        'event_label': `${elementType}.${elementClass}`,
        'custom_parameter_1': getPageType(),
        'non_interaction': false
      });
    }
  });
}

// Initialize heatmap tracking
document.addEventListener('DOMContentLoaded', initializeHeatmapTracking);

// Export tracking functions for use in other scripts
window.SongScribeAnalytics = {
  trackCustomEvent,
  trackDownload: function(platform) {
    gtag('event', 'download_click', {
      'event_category': 'conversion',
      'event_label': platform,
      'custom_parameter_1': platform
    });
  },
  trackFeatureView: function(featureName) {
    gtag('event', 'feature_view', {
      'event_category': 'engagement',
      'event_label': featureName,
      'custom_parameter_1': 'scroll_into_view'
    });
  }
};
