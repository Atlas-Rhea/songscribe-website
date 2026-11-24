// Shows .status-tint only while at least its own height of the strip is
// on screen, so it never lies over the light page (see site.css).
export function initStatusTint() {
  const tint = document.querySelector('.status-tint');
  const strip = document.querySelector('.strip');
  if (!tint || !strip || typeof IntersectionObserver === 'undefined') return;

  new IntersectionObserver(([entry]) => {
    tint.hidden = !entry.isIntersecting;
  }, { rootMargin: '-12px 0px 0px 0px' }).observe(strip);
}
