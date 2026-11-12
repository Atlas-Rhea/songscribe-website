const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function setToggleState(clip, playing) {
  clip.classList.toggle('is-playing', playing);
  const btn = clip.querySelector('.guide-clip__toggle');
  if (btn) btn.setAttribute('aria-label', playing ? 'Pause clip' : 'Play clip');
}

function wireClip(clip) {
  const video = clip.querySelector('video');
  const btn = clip.querySelector('.guide-clip__toggle');
  if (!video || !btn) return;

  btn.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });

  video.addEventListener('play', () => setToggleState(clip, true));
  video.addEventListener('pause', () => setToggleState(clip, false));
  video.addEventListener('ended', () => setToggleState(clip, false));
}

function wireAutoplay(clips) {
  if (reduceMotion || typeof IntersectionObserver === 'undefined') return;

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target.querySelector('video');
      if (!video) continue;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }
  }, { threshold: 0.6 });

  clips.forEach((clip) => io.observe(clip));
}

if (matchMedia('(max-width: 960px)').matches) {
  document.querySelector('.guide-sidenav details')?.removeAttribute('open');
}

const clips = document.querySelectorAll('.guide-clip');
clips.forEach(wireClip);
wireAutoplay(clips);
