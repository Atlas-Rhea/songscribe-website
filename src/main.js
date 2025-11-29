import './style-glass.css'
import { LiquidLogoCSS } from './LiquidLogoCSS.js'

const container = document.querySelector('#logo-container')
if (container) {
  const logo = new LiquidLogoCSS(container)
  logo.init()
}
