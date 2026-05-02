const backgrounds = Array.from({ length: 100 }, (_, i) => `./backgrounds/bg${i + 1}.jpg`);

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
  noPartyMessage:
    "The next party will be on November 14th – save the date! 🎉",
};

const elements = {
  ticketBox: document.getElementById("ticket-box"),
  refreshPopup: document.getElementById("refresh-popup"),
  refreshMessage: document.getElementById("refresh-message"),
  topText: document.getElementById("topText"),
  scrollingText: document.getElementById("scrolling-text"),
  frame1: document.getElementById("frame1"),
  frame2: document.getElementById("frame2"),
};

let currentIndex = Math.floor(Math.random() * backgrounds.length);
let lastChangeTime = 0;
let currentColor = "#FFFFFF";

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

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  return color;
}

function getContrastColor(hex) {
  const normalizedHex = hex.replace("#", "");
  const r = parseInt(normalizedHex.substr(0, 2), 16);
  const g = parseInt(normalizedHex.substr(2, 2), 16);
  const b = parseInt(normalizedHex.substr(4, 2), 16);
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

  if (elements.refreshPopup) {
    elements.refreshPopup.style.backgroundColor = currentColor;
    elements.refreshPopup.style.outlineColor = currentColor;
    elements.refreshPopup.style.color = getContrastColor(currentColor);
  }
}

function setBackground(index) {
  currentColor = getRandomColor();
  document.body.style.backgroundImage = `url('${backgrounds[index]}')`;
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

function initTopTextAnimation() {
  if (!elements.topText) return;

  const words = ["another", "fine", "mess"];

  words.forEach((word) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";

    for (const letter of word) {
      const letterSpan = document.createElement("span");
      letterSpan.className = "letter";
      letterSpan.textContent = letter;

      letterSpan.addEventListener("mouseover", () => {
        letterSpan.classList.add("fall");

        setTimeout(() => {
          letterSpan.classList.remove("fall");
        }, 3000);
      });

      wordSpan.appendChild(letterSpan);
    }

    elements.topText.appendChild(wordSpan);
    elements.topText.appendChild(document.createTextNode(" "));
  });
}

function initRefreshPopup() {
  if (!elements.refreshPopup || !elements.refreshMessage) return;

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  elements.refreshMessage.textContent = isTouchDevice
    ? "Tap/swipe to randomise!"
    : "Click/scroll to randomise!";

  const hidePopup = () => {
    elements.refreshPopup.style.opacity = "0";
    elements.refreshPopup.style.pointerEvents = "none";
    setTimeout(() => {
      elements.refreshPopup.style.display = "none";
    }, 500);
  };

  elements.refreshPopup.addEventListener("click", hidePopup);
  elements.refreshPopup.addEventListener("touchstart", hidePopup);

  setTimeout(hidePopup, 3000);
}

function buildPartyText(party) {
  return `${party.date} • ${party.time} • ${party.price} • ${party.location}`;
}

function renderScrollingText(text) {
  if (!elements.scrollingText) return;

  elements.scrollingText.innerHTML = "";

  for (const char of text) {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    elements.scrollingText.appendChild(span);
  }
}

function initScrollingText() {
  if (!elements.scrollingText) return;

  const text = siteContent.plannedParty
    ? buildPartyText(siteContent.plannedParty)
    : siteContent.noPartyMessage;

  elements.scrollingText.removeAttribute("href");
  elements.scrollingText.removeAttribute("target");
  elements.scrollingText.removeAttribute("rel");
  elements.scrollingText.classList.add("pointer-events-none");

  renderScrollingText(text);
}

function initInjectedLogos() {
  injectSvg("frame1-svg", "./logos/frame1.svg");
  injectSvg("frame2-svg", "./logos/frame2.svg");
}

function init() {
  initBackgroundRandomiser();
  initFrameAnimation();
  initTopTextAnimation();
  initScrollingText();
  initInjectedLogos();
  initRefreshPopup();
}

document.addEventListener("DOMContentLoaded", init);
