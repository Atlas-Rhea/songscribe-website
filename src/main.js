import { initTheme, bindToggleButton } from './theme-toggle.js';
initTheme();
function bindTheme() {
  bindToggleButton(document.getElementById('themeToggle'));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindTheme);
} else {
  bindTheme();
}

initMobileNav()
initSmoothScroll()
initFeaturesAccordion()

function initMobileNav() {
  const toggle = document.getElementById('mobile-menu-toggle')
  const navLinks = document.getElementById('nav-links')

  if (!toggle || !navLinks) return

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active')
    navLinks.classList.toggle('active')
  })

  const links = navLinks.querySelectorAll('.nav-link')
  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active')
      navLinks.classList.remove('active')
    })
  })
}

function initFeaturesAccordion() {
  const items = document.querySelectorAll('.features-all-item')
  if (!items.length) return

  items.forEach(item => {
    const trigger = item.querySelector('.features-all-item__trigger')
    const body = item.querySelector('.features-all-item__body')
    if (!trigger || !body) return

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open')
      if (isOpen) {
        item.classList.remove('is-open')
        trigger.setAttribute('aria-expanded', 'false')
        body.style.maxHeight = '0'
      } else {
        item.classList.add('is-open')
        trigger.setAttribute('aria-expanded', 'true')
        body.style.maxHeight = body.scrollHeight + 'px'
      }
    })
  })

  // Keep open panels correctly sized when the window resizes (e.g. mobile
  // rotation or viewport narrowing re-wraps the long body copy).
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      items.forEach(item => {
        if (!item.classList.contains('is-open')) return
        const body = item.querySelector('.features-all-item__body')
        if (body) body.style.maxHeight = body.scrollHeight + 'px'
      })
    }, 120)
  })
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href')
      if (targetId === '#') return

      const target = document.querySelector(targetId)
      if (!target) return

      e.preventDefault()

      const headerOffset = 80
      const elementPosition = target.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    })
  })
}
