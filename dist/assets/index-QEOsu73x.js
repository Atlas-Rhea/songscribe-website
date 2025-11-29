(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function o(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(t){if(t.ep)return;t.ep=!0;const s=o(t);fetch(t.href,s)}})();class l{constructor(e){this.container=e,this.layers=[],this.ticking=!1,this.mouseX=0,this.mouseY=0,this.tiltX=0,this.tiltY=0}init(){this.render(),this.addEvents()}render(){this.container.innerHTML=`
      <div class="glass-scene">
        <div class="glass-logo">
          <div class="glass-layer layer-1" style="--depth: 3;">
            <img src="/assets/images/Layer1.svg" alt="Layer 1">
          </div>
          <div class="glass-layer layer-2" style="--depth: 2;">
            <img src="/assets/images/Layer2.svg" alt="Layer 2">
          </div>
          <div class="glass-layer layer-3" style="--depth: 1;">
            <img src="/assets/images/Layer3.svg" alt="Layer 3">
          </div>
          <div class="glass-glow"></div>
        </div>
      </div>
    `}addEvents(){window.addEventListener("mousemove",this.onMouseMove.bind(this)),window.addEventListener("deviceorientation",this.onDeviceOrientation.bind(this))}onMouseMove(e){const o=e.clientX/window.innerWidth*2-1,i=e.clientY/window.innerHeight*2-1;this.mouseX=o,this.mouseY=i,this.requestUpdate()}onDeviceOrientation(e){e.gamma!==null&&e.beta!==null&&(this.tiltX=Math.max(-1,Math.min(1,e.gamma/45)),this.tiltY=Math.max(-1,Math.min(1,(e.beta-45)/45)),this.requestUpdate())}requestUpdate(){this.ticking||(requestAnimationFrame(this.update.bind(this)),this.ticking=!0)}update(){const e=document.documentElement,o=this.mouseX+this.tiltX,i=this.mouseY+this.tiltY;e.style.setProperty("--mouse-x",o),e.style.setProperty("--mouse-y",i),this.ticking=!1}}const a=document.querySelector("#logo-container");a&&new l(a).init();
