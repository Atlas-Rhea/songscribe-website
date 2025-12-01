import './style-glass.css'
import { LiquidLogoCSS } from './LiquidLogoCSS.js'

const container = document.querySelector('#logo-container')
if (container) {
  const logo = new LiquidLogoCSS(container)
  logo.init()
}

initFeatureScroller()

function initFeatureScroller() {
  const featureList = document.querySelector('.feature-list')
  if (!featureList) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (prefersReducedMotion.matches) return

  const items = Array.from(featureList.querySelectorAll('.feature-item'))
  if (items.length === 0) return

  const totalItems = items.length
  let activeIndex = 0
  let intervalId = null

  const applyState = () => {
    const prevIndex = (activeIndex - 1 + totalItems) % totalItems
    const nextIndex = (activeIndex + 1) % totalItems

    items.forEach((item, index) => {
      item.classList.remove('feature-item--active', 'feature-item--prev', 'feature-item--next')
      if (index === activeIndex) {
        item.classList.add('feature-item--active')
      } else if (index === prevIndex) {
        item.classList.add('feature-item--prev')
      } else if (index === nextIndex) {
        item.classList.add('feature-item--next')
      }
    })
  }

  const advance = () => {
    activeIndex = (activeIndex + 1) % totalItems
    applyState()
  }

  const start = () => {
    if (intervalId !== null || totalItems < 2) return
    intervalId = window.setInterval(advance, 3000)
  }

  const stop = () => {
    if (intervalId === null) return
    window.clearInterval(intervalId)
    intervalId = null
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  })

  applyState()
  start()
}