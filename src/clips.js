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

  // Safari drops the poster the moment play() is called and shows the
  // element's background until the first frame decodes; painting the poster
  // there too hides that gap.
  if (video.poster) video.style.background = `url("${video.poster}") center / cover`;

  const toggle = () => {
    if (video.paused) {
      delete clip.dataset.userPaused;
      video.play().catch(() => {});
    } else {
      clip.dataset.userPaused = '1';
      video.pause();
    }
  };
  btn.addEventListener('click', toggle);
  video.addEventListener('click', toggle);

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
        if (entry.target.dataset.userPaused) continue;
        video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }
  }, { threshold: 0.6 });

  // Start downloading a screen ahead so the first frame is ready by the time
  // the clip is far enough in view to play.
  const prefetch = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      prefetch.unobserve(entry.target);
      const video = entry.target.querySelector('video');
      if (video && video.preload === 'none') {
        video.preload = 'auto';
        video.load();
      }
    }
  }, { rootMargin: '100% 0px' });

  clips.forEach((clip) => {
    io.observe(clip);
    prefetch.observe(clip);
  });
}

export function initClips() {
  const clips = document.querySelectorAll('.guide-clip');
  clips.forEach(wireClip);
  wireAutoplay(clips);
}
