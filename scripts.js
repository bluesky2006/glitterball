const backgrounds = Array.from({ length: 14 }, (_, i) => `./backgrounds/bg${i + 1}.jpeg`);

// === Update This Section For The Next Party ===
const siteContent = {
  plannedParty: {
    date: "Saturday 14th November",
    time: "8pm - 3am",
    price: "£25",
    location: "Snag Farm - Snag Lane - BA9 9PJ",
  },
  noPartyMessage: "The next party is November 14th - mark your calendars! 😊",
  // Set true to show the hold-it/post-it note (renders plannedParty details, or noPartyMessage as fallback)
  showPostIt: false,
  // Set true to cycle the flyer-texture backgrounds; false keeps the static dark texture below
  useImageBackgrounds: false,
  // Static dark paper texture shown behind everything (when useImageBackgrounds is false)
  bgTexture: "./backgrounds/bg13.jpeg",
  bgBrightness: 0.6, // >1 lightens the texture so the grain is visible on black
};

// Logo gradient stops (left to right across the word): hot pink -> magenta -> violet
const LOGO_GRADIENT = [
  ["0%", "#FF3DA6"],
  ["48%", "#E240C4"],
  ["100%", "#7A2BF5"],
];

// Fixed accent colour for ticket box + social icons (replaces the old per-load random colour)
const ACCENT_COLOR = "#FF3DA6";

const elements = {
  ticketBox: document.getElementById("ticket-box"),
  ticketDate: document.getElementById("ticket-date"),
  postIt: document.getElementById("scrolling-text"),
  postItWrap: document.getElementById("post-it-wrap"),
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
      applyLogoGradient(svg, containerId);
    }
  } catch (error) {
    console.error(error);
  }
}

function applyLogoGradient(svg, containerId) {
  const svgNS = "http://www.w3.org/2000/svg";
  const width = svg.viewBox?.baseVal?.width || 500;
  const gradId = `glitter-grad-${containerId}`;

  const defs = document.createElementNS(svgNS, "defs");
  const grad = document.createElementNS(svgNS, "linearGradient");
  grad.setAttribute("id", gradId);
  grad.setAttribute("gradientUnits", "userSpaceOnUse");
  grad.setAttribute("x1", "0");
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", String(width));
  grad.setAttribute("y2", "0");

  for (const [offset, color] of LOGO_GRADIENT) {
    const stop = document.createElementNS(svgNS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    grad.appendChild(stop);
  }

  defs.appendChild(grad);
  svg.insertBefore(defs, svg.firstChild);

  // Inline style beats the SVG's internal `.st0 { fill: currentColor }` rule
  svg.querySelectorAll("path").forEach((p) => {
    p.style.fill = `url(#${gradId})`;
  });
}

function hslToHex(h, s, l) {
  const sl = s / 100;
  const ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
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

function applyAccentColor() {
  if (elements.postIt) {
    elements.postIt.style.backgroundColor = currentColor;
    elements.postIt.style.color = getContrastColor(currentColor);
  }
}

function createBgLayers() {
  bgLayerA = document.createElement("div");
  bgLayerA.className = "bg-layer";
  bgLayerA.style.opacity = "1";

  bgLayerB = document.createElement("div");
  bgLayerB.className = "bg-layer";
  bgLayerB.style.opacity = "0";

  // With image cycling off, show a single static (lightened) dark texture
  if (!siteContent.useImageBackgrounds && siteContent.bgTexture) {
    bgLayerA.style.backgroundImage = `url('${siteContent.bgTexture}')`;
    bgLayerA.style.filter = `brightness(${siteContent.bgBrightness ?? 1.6})`;
  }

  document.body.prepend(bgLayerB);
  document.body.prepend(bgLayerA);
}

function setBackground(index) {
  currentColor = siteContent.useImageBackgrounds ? getRandomColor() : ACCENT_COLOR;

  if (siteContent.useImageBackgrounds) {
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
  }

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

function initTicketDate() {
  if (!elements.ticketDate || !siteContent.plannedParty) return;
  elements.ticketDate.textContent = siteContent.plannedParty.date;
}

function initPostIt() {
  if (!elements.postIt || !siteContent.showPostIt) return;

  if (elements.postItWrap) elements.postItWrap.classList.remove("hidden");

  const text = siteContent.plannedParty
    ? buildPartyText(siteContent.plannedParty)
    : siteContent.noPartyMessage;

  elements.postIt.textContent = text;

  const angle = (Math.random() * 14 - 7).toFixed(1);
  elements.postIt.dataset.angle = angle;
  elements.postIt.style.transform = `rotate(${angle}deg)`;
}

function initParallax() {
  const strength = 18;

  window.addEventListener("mousemove", (e) => {
    const dx = (e.clientX / window.innerWidth - 0.5) * 2;
    const dy = (e.clientY / window.innerHeight - 0.5) * 2;
    const x = dx * strength;
    const y = dy * strength;

    [bgLayerA, bgLayerB].forEach((layer) => {
      if (layer) layer.style.transform = `scale(1.06) translate(${x}px, ${y}px)`;
    });
  });
}

function initPostItHover() {
  if (!elements.postIt) return;

  const base = parseFloat(elements.postIt.dataset.angle || 0);

  elements.postIt.addEventListener("mouseenter", () => {
    const nudge = (Math.random() * 6 - 3).toFixed(1);
    elements.postIt.style.transform = `rotate(${parseFloat(nudge) + base}deg) scale(1.04)`;
  });

  elements.postIt.addEventListener("mouseleave", () => {
    elements.postIt.style.transform = `rotate(${base}deg)`;
  });
}

function initLogoShimmer() {
  function shimmer() {
    [elements.frame1, elements.frame2].forEach((frame) => {
      const svg = frame?.querySelector("svg");
      if (!svg) return;
      svg.classList.add("logo-shimmer");
      setTimeout(() => svg.classList.remove("logo-shimmer"), 900);
    });

    setTimeout(shimmer, 3000 + Math.random() * 5000);
  }

  setTimeout(shimmer, 1500 + Math.random() * 2000);
}

function initGlitterRain() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:5;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const COUNT = 70;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Silver/white base with noticeable iridescent colour pops
  const GLITTER_PALETTE = [
    "#FFFFFF",
    "#FFFFFF",
    "#E0E0E0",
    "#E0E0E0",
    "#88C8FF", // icy blue
    "#88C8FF",
    "#FFD080", // warm gold
    "#FFD080",
    "#FF9EC8", // rose pink
    "#FF9EC8",
    "#90FFD8", // mint teal
    "#C8A8FF", // soft lavender
  ];

  function makeParticle(randomY = false) {
    return {
      originX: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -4,
      size: 1.5 + Math.random() * 3,
      speed: 0.1 + Math.random() * 0.35,
      swayFreq: 0.3 + Math.random() * 0.6,
      swayAmp: 20 + Math.random() * 40,
      swayPhase: Math.random() * Math.PI * 2,
      sparkleFreq: 3 + Math.random() * 5,
      sparklePhase: Math.random() * Math.PI * 2,
      color: GLITTER_PALETTE[Math.floor(Math.random() * GLITTER_PALETTE.length)],
    };
  }

  resize();
  let particles = Array.from({ length: COUNT }, () => makeParticle(true));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now() / 1000;

    for (const p of particles) {
      const sparkleVal = Math.abs(Math.sin(now * p.sparkleFreq + p.sparklePhase));
      const opacity = sparkleVal; // full range 0→1 for sharper flash
      const size = p.size * (0.4 + 0.6 * sparkleVal); // grow with brightness
      const x = p.originX + Math.sin(now * p.swayFreq + p.swayPhase) * p.swayAmp;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Glow halo on the bright half of the cycle
      if (sparkleVal > 0.5) {
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 4 + sparkleVal * 10;
      }

      // Flash to white at peak
      ctx.fillStyle = sparkleVal > 0.85 ? "#FFFFFF" : p.color;
      ctx.translate(x, p.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();

      p.y += p.speed;

      if (p.y > canvas.height + 4) Object.assign(p, makeParticle());
    }

    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener("resize", resize);
}

function initAmbientSound() {
  // Drop your track in ./audio/ and update this path
  const AUDIO_SRC = "./audio/ambient.mp3";
  const TARGET_VOL = 0.5;
  const FADE_SECS = 4;

  const ICON_ON = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const ICON_OFF = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.63.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

  let gainNode = null;
  let muted = true;
  let started = false;

  const btn = document.createElement("button");
  btn.id = "sound-toggle";
  btn.setAttribute("aria-label", "Toggle sound");
  btn.innerHTML = ICON_OFF;
  btn.classList.add("muted");
  document.body.appendChild(btn);

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    muted = !muted;
    btn.innerHTML = muted ? ICON_OFF : ICON_ON;
    btn.classList.toggle("muted", muted);

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
      const response = await fetch(AUDIO_SRC);
      const buffer = await audioCtx.decodeAudioData(await response.arrayBuffer());

      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(audioCtx.destination);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
    } catch (err) {
      console.error("Audio failed to load:", err);
    }
  }

  buildAudio();
}

function initInjectedLogos() {
  injectSvg("frame1-svg", "./logos/frame1.svg");
  injectSvg("frame2-svg", "./logos/frame2.svg");
}

function initBorderFrame() {
  const svg = document.getElementById("border-frame");
  if (!svg) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const m = 34; // inset from viewport edge
  const b = 18; // corner step depth

  function draw() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = "";

    const defs = document.createElementNS(svgNS, "defs");
    const grad = document.createElementNS(svgNS, "linearGradient");
    grad.setAttribute("id", "border-grad");
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    grad.setAttribute("x1", "0");
    grad.setAttribute("y1", String(H));
    grad.setAttribute("x2", String(W));
    grad.setAttribute("y2", "0");
    for (const [offset, color] of [
      ["0%", "#FF3DA6"],
      ["100%", "#7A2BF5"],
    ]) {
      const stop = document.createElementNS(svgNS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      grad.appendChild(stop);
    }
    defs.appendChild(grad);
    svg.appendChild(defs);

    const L = m;
    const T = m;
    const R = W - m;
    const B = H - m;
    // Rectangle inset by m with a stepped notch cut into each corner
    const d = [
      `M ${L + b} ${T}`,
      `L ${R - b} ${T}`,
      `L ${R - b} ${T + b}`,
      `L ${R} ${T + b}`,
      `L ${R} ${B - b}`,
      `L ${R - b} ${B - b}`,
      `L ${R - b} ${B}`,
      `L ${L + b} ${B}`,
      `L ${L + b} ${B - b}`,
      `L ${L} ${B - b}`,
      `L ${L} ${T + b}`,
      `L ${L + b} ${T + b}`,
      "Z",
    ].join(" ");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "url(#border-grad)");
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linejoin", "miter");
    svg.appendChild(path);
  }

  draw();
  window.addEventListener("resize", draw);
}

function init() {
  initBackgroundRandomiser();
  initFrameAnimation();
  initPostIt();
  initTicketDate();
  initBorderFrame();
  initInjectedLogos();
  initPostItHover();
  initLogoShimmer();
  initParallax();
  initGlitterRain();
  initAmbientSound();
}

document.addEventListener("DOMContentLoaded", init);
