const backgrounds = Array.from({ length: 73 }, (_, i) => `./backgrounds/bg${i + 1}.jpeg`);

// === Update This Section For The Next Party ===
const siteContent = {
  plannedParty: null,
  // Example:
  // plannedParty: {
  //   date: "Saturday 7th November 2026",
  //   time: "8pm - 2am",
  //   price: "£20",
  //   location: "Snag Farm - Snag Lane - BA9 9PJ",
  // },
  noPartyMessage: "The next party is November 14th - mark your calendars! 😊",
};

const elements = {
  ticketBox: document.getElementById("ticket-box"),
  scrollingText: document.getElementById("scrolling-text"),
  frame1: document.getElementById("frame1"),
  frame2: document.getElementById("frame2"),
};

let currentIndex = Math.floor(Math.random() * backgrounds.length);
let lastChangeTime = 0;
let currentColor = "#FFFFFF";
let bgLayerA = null;
let bgLayerB = null;
let activeBgLayer = "a";

const throttleDuration = 800;

async function injectSvg(containerId, path) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }

    const svgMarkup = await response.text();
    container.innerHTML = svgMarkup;

    const svg = container.querySelector("svg");
    if (svg) {
      svg.removeAttribute("class");
      svg.classList.add("logo-art");
    }
  } catch (error) {
    console.error(error);
  }
}

function hslToHex(h, s, l) {
  const sl = s / 100;
  const ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getRandomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 80 + Math.floor(Math.random() * 20);
  const l = 55 + Math.floor(Math.random() * 20);
  return hslToHex(h, s, l);
}

function getContrastColor(hex) {
  const normalizedHex = hex.replace("#", "");
  const r = parseInt(normalizedHex.substring(0, 2), 16);
  const g = parseInt(normalizedHex.substring(2, 4), 16);
  const b = parseInt(normalizedHex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
}

function initTicketBoxWiggle(ticketBox) {
  if (!ticketBox || ticketBox.dataset.wiggleInit) return;

  ticketBox.dataset.wiggleInit = "true";

  setInterval(() => {
    ticketBox.classList.add("wiggle");
    setTimeout(() => {
      ticketBox.classList.remove("wiggle");
    }, 600);
  }, 5000);
}

function applyAccentColor() {
  if (elements.ticketBox) {
    elements.ticketBox.style.backgroundColor = currentColor;
    elements.ticketBox.style.color = getContrastColor(currentColor);
    elements.ticketBox.style.outlineColor = currentColor;
    initTicketBoxWiggle(elements.ticketBox);
  }

  if (elements.scrollingText) {
    elements.scrollingText.style.backgroundColor = currentColor;
    elements.scrollingText.style.color = getContrastColor(currentColor);
  }
}

function createBgLayers() {
  bgLayerA = document.createElement("div");
  bgLayerA.className = "bg-layer";
  bgLayerA.style.opacity = "1";

  bgLayerB = document.createElement("div");
  bgLayerB.className = "bg-layer";
  bgLayerB.style.opacity = "0";

  document.body.prepend(bgLayerB);
  document.body.prepend(bgLayerA);
}

function setBackground(index) {
  currentColor = getRandomColor();

  const incoming = activeBgLayer === "a" ? bgLayerB : bgLayerA;
  const outgoing = activeBgLayer === "a" ? bgLayerA : bgLayerB;

  incoming.style.backgroundImage = `url('${backgrounds[index]}')`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      incoming.style.opacity = "1";
      outgoing.style.opacity = "0";
    });
  });

  activeBgLayer = activeBgLayer === "a" ? "b" : "a";
  document.body.style.color = currentColor;
  applyAccentColor();
}

function changeBackground() {
  const now = Date.now();
  if (now - lastChangeTime < throttleDuration) return;

  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * backgrounds.length);
  } while (nextIndex === currentIndex && backgrounds.length > 1);

  currentIndex = nextIndex;
  setBackground(currentIndex);
  lastChangeTime = now;
}

function shouldIgnoreBackgroundChange(target) {
  return target instanceof Element
    ? target.closest("a, button, input, select, textarea, [role='button']")
    : false;
}

function initBackgroundRandomiser() {
  createBgLayers();

  let touchStartY = 0;

  setBackground(currentIndex);

  window.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) > 20) {
      changeBackground();
    }
  });

  window.addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0].clientY;
  });

  window.addEventListener("touchend", (event) => {
    const touchEndY = event.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;

    if (Math.abs(deltaY) > 30) {
      changeBackground();
    }
  });

  document.addEventListener("click", (event) => {
    if (shouldIgnoreBackgroundChange(event.target)) return;
    changeBackground();
  });
}

function initFrameAnimation() {
  if (!elements.frame1 || !elements.frame2) return;

  let currentFrame = 1;

  setInterval(() => {
    const activeFrame = currentFrame === 1 ? elements.frame1 : elements.frame2;
    const nextFrame = currentFrame === 1 ? elements.frame2 : elements.frame1;

    activeFrame.classList.remove("visible");
    nextFrame.classList.add("visible");
    currentFrame = currentFrame === 1 ? 2 : 1;
  }, 700);
}

function buildPartyText(party) {
  return `${party.date} • ${party.time} • ${party.price} • ${party.location}`;
}

function initScrollingText() {
  if (!elements.scrollingText) return;

  const text = siteContent.plannedParty
    ? buildPartyText(siteContent.plannedParty)
    : siteContent.noPartyMessage;

  elements.scrollingText.textContent = text;

  const angle = (Math.random() * 14 - 7).toFixed(1);
  elements.scrollingText.dataset.angle = angle;
  elements.scrollingText.style.transform = `rotate(${angle}deg)`;
}

function initParallax() {
  const strength = 18;

  window.addEventListener('mousemove', (e) => {
    const dx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const dy = (e.clientY / window.innerHeight - 0.5) * 2;
    const x = dx * strength;
    const y = dy * strength;

    [bgLayerA, bgLayerB].forEach(layer => {
      if (layer) layer.style.transform = `scale(1.06) translate(${x}px, ${y}px)`;
    });
  });
}

function initPostItHover() {
  if (!elements.scrollingText) return;

  const base = parseFloat(elements.scrollingText.dataset.angle || 0);

  elements.scrollingText.addEventListener('mouseenter', () => {
    const nudge = (Math.random() * 6 - 3).toFixed(1);
    elements.scrollingText.style.transform = `rotate(${parseFloat(nudge) + base}deg) scale(1.04)`;
  });

  elements.scrollingText.addEventListener('mouseleave', () => {
    elements.scrollingText.style.transform = `rotate(${base}deg)`;
  });
}

function initLogoShimmer() {
  function shimmer() {
    [elements.frame1, elements.frame2].forEach(frame => {
      const svg = frame?.querySelector('svg');
      if (!svg) return;
      svg.classList.add('logo-shimmer');
      setTimeout(() => svg.classList.remove('logo-shimmer'), 900);
    });

    setTimeout(shimmer, 3000 + Math.random() * 5000);
  }

  setTimeout(shimmer, 1500 + Math.random() * 2000);
}

function initGlitterRain() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const COUNT = 70;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle(randomY = false) {
    return {
      originX:      Math.random() * canvas.width,
      y:            randomY ? Math.random() * canvas.height : -4,
      size:         1.5 + Math.random() * 3,
      speed:        0.1 + Math.random() * 0.35,
      swayFreq:     0.3 + Math.random() * 0.6,
      swayAmp:      20 + Math.random() * 40,
      swayPhase:    Math.random() * Math.PI * 2,
      sparkleFreq:  3 + Math.random() * 5,
      sparklePhase: Math.random() * Math.PI * 2,
    };
  }

  resize();
  let particles = Array.from({ length: COUNT }, () => makeParticle(true));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now() / 1000;

    for (const p of particles) {
      const opacity = 0.2 + 0.8 * Math.abs(Math.sin(now * p.sparkleFreq + p.sparklePhase));
      const x = p.originX + Math.sin(now * p.swayFreq + p.swayPhase) * p.swayAmp;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = currentColor;
      ctx.translate(x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      p.y += p.speed;

      if (p.y > canvas.height + 4) Object.assign(p, makeParticle());
    }

    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener('resize', resize);
}

function initAmbientSound() {
  // Drop your track in ./audio/ and update this path
  const AUDIO_SRC    = './audio/ambient.mp3';
  const TARGET_VOL  = 0.5;
  const FADE_SECS   = 4;

  const ICON_ON  = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const ICON_OFF = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.63.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

  let gainNode = null;
  let muted    = true;
  let started  = false;

  const btn = document.createElement('button');
  btn.id = 'sound-toggle';
  btn.setAttribute('aria-label', 'Toggle sound');
  btn.innerHTML = ICON_OFF;
  btn.classList.add('muted');
  document.body.appendChild(btn);

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    muted = !muted;
    btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    btn.classList.toggle('muted', muted);

    if (!gainNode) return;
    const ctx = gainNode.context;
    if (!muted) {
      await ctx.resume();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(TARGET_VOL, ctx.currentTime + FADE_SECS);
    } else {
      gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }
  });

  async function buildAudio() {
    if (started) return;
    started = true;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const response  = await fetch(AUDIO_SRC);
      const buffer    = await audioCtx.decodeAudioData(await response.arrayBuffer());

      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(audioCtx.destination);

      const source  = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop   = true;
      source.connect(gainNode);
      source.start();
    } catch (err) {
      console.error('Audio failed to load:', err);
    }
  }

  buildAudio();
}

function initInjectedLogos() {
  injectSvg("frame1-svg", "./logos/frame1.svg");
  injectSvg("frame2-svg", "./logos/frame2.svg");
}

function init() {
  initBackgroundRandomiser();
  initFrameAnimation();
  initScrollingText();
  initInjectedLogos();
  initPostItHover();
  initLogoShimmer();
  initParallax();
  initGlitterRain();
  initAmbientSound();
}

document.addEventListener("DOMContentLoaded", init);
