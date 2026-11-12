let overlay, image, closeButton, opener;

// Built on first open: main.css loads async, so an overlay created at page
// load would flash visible until its styles arrive.
function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Enlarged screenshot');
  closeButton = document.createElement('button');
  closeButton.className = 'lightbox-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close');
  image = document.createElement('img');
  image.className = 'lightbox-image';
  image.alt = '';
  overlay.append(closeButton, image);
  document.body.append(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === closeButton) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) close();
  });
}

function visibleScreen(frame) {
  return [...frame.querySelectorAll('img.phone-frame__screen')].find(
    (img) => getComputedStyle(img).display !== 'none'
  );
}

function largestSource(img) {
  const srcset = img.getAttribute('srcset');
  if (!srcset) return img.src;
  return srcset.split(',').map((s) => s.trim()).pop().split(/\s+/)[0];
}

function open(frame) {
  const screen = visibleScreen(frame);
  if (!screen) return;
  ensureOverlay();
  opener = frame;
  image.src = largestSource(screen);
  image.alt = screen.alt;
  // Next frame so the opacity/scale transition runs from the hidden state.
  requestAnimationFrame(() => overlay.classList.add('active'));
  document.body.style.overflow = 'hidden';
  closeButton.focus();
}

function close() {
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  opener?.focus();
  opener = null;
}

export function initLightbox() {
  const frames = [...document.querySelectorAll('.phone-frame')].filter((f) =>
    f.querySelector('img.phone-frame__screen')
  );
  for (const frame of frames) {
    frame.addEventListener('click', () => open(frame));
    if (frame.tagName === 'BUTTON') continue;
    frame.tabIndex = 0;
    frame.setAttribute('role', 'button');
    frame.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      open(frame);
    });
  }
}
