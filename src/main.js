import './style-glass.css'
import { LiquidLogoCSS } from './LiquidLogoCSS.js'

const container = document.querySelector('#logo-container')
if (container) {
  const logo = new LiquidLogoCSS(container)
  logo.init()
}

initMobileNav()
initSmoothScroll()

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
