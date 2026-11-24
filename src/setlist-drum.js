// Same live gate as the Tools pinned chapters (public/assets/moments/pinned-chapters/moment.js),
// so both scroll moments pin on the same screens and rest on the same ones.
const wideQuery = matchMedia('(min-width: 1024px)')
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
const fits = () => wideQuery.matches && !reducedQuery.matches && innerHeight >= 640

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Live (big screens): the section pins and the set turns on a drum.
// Otherwise (phones, short screens, reduced motion): a flat list whose
// highlight follows the song crossing the middle of the screen.
export function initSetlistDrum() {
  const root = document.querySelector('[data-scroll-moment="setlist-drum"]')
  if (!root) return
  const drum = root.querySelector('.setlist__drum')
  const songs = [...root.querySelectorAll('.setlist__song')]
  const count = root.querySelector('.setlist__count')
  if (!drum || songs.length < 2 || !count) return
  const last = songs.length - 1
  // The drum's view stays one row in from each end so its window is
  // always full; the highlight still reaches the first and last song.
  const viewMin = Math.min(1, last / 2)
  const viewMax = Math.max(last - 1, last / 2)

  let live = false, raf = 0, pos = -1, on = 0

  const select = i => {
    if (i === on) return
    songs[on].classList.remove('is-on')
    songs[i].classList.add('is-on')
    count.textContent = `${i + 1} of ${songs.length}`
    on = i
  }

  const tick = () => {
    raf = 0
    const rect = root.getBoundingClientRect()
    const p = clamp(-rect.top / Math.max(1, rect.height - innerHeight), 0, 1)
    // The first and last tenth of the run hold song 1 and the last song, so each end reads as finished.
    const next = clamp((p - 0.1) / 0.8, 0, 1) * last
    if (next === pos) return
    pos = next
    drum.style.setProperty('--pos', clamp(pos, viewMin, viewMax).toFixed(4))
    select(Math.round(pos))
  }
  let near = true
  const request = () => { if (live && near && !raf) raf = requestAnimationFrame(tick) }
  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting
    if (near) request()
  }, { rootMargin: '100px' }).observe(root)

  const middleLine = new IntersectionObserver(entries => {
    if (live) return
    for (const entry of entries) {
      if (entry.isIntersecting) select(songs.indexOf(entry.target))
    }
  }, { rootMargin: '-49% 0px -50% 0px' })
  songs.forEach(song => middleLine.observe(song))

  const go = () => {
    if (live) { request(); return }
    live = true
    root.classList.remove('is-follow')
    root.classList.add('is-live')
    addEventListener('scroll', request, { passive: true })
    request()
  }
  const rest = () => {
    root.classList.add('is-follow')
    if (!live) return
    live = false
    removeEventListener('scroll', request)
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    pos = -1
    root.classList.remove('is-live')
    drum.style.removeProperty('--pos')
  }
  const sync = () => (fits() ? go() : rest())

  sync()
  let timer = 0
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(sync, 120) })
  reducedQuery.addEventListener('change', sync)
}
