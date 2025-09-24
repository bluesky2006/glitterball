// === Random Colour Function ===
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// === Generate Background Image Array ===
const backgrounds = Array.from({ length: 73 }, (_, i) => `./backgrounds/bg${i + 1}.jpeg`);

// === State Variables ===
let currentIndex = Math.floor(Math.random() * backgrounds.length);
let lastChangeTime = 0;
const throttleDuration = 800; // ms
let currentColor = "#FFFFFF"; // Default

// === Apply Background + Random Colour ===
function setBackground(index) {
  const randomColor = getRandomColor();
  document.body.style.backgroundImage = `url('${backgrounds[index]}')`;
  document.body.style.color = randomColor;
  currentColor = randomColor;

  // ✅ Also update Tickets box to match
  const ticketBox = document.getElementById("ticket-box");
  if (ticketBox) {
    ticketBox.style.backgroundColor = currentColor;
    ticketBox.style.color = "white"; // Optional: ensure good contrast
  }
}

// === Change Background Logic ===
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

// === Initial State ===
setBackground(currentIndex);

// === Event Listeners ===
// Wheel scroll
window.addEventListener("wheel", (e) => {
  if (Math.abs(e.deltaY) > 20) {
    changeBackground();
  }
});

// Swipe detection
let touchStartY = 0;
window.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {
  const touchEndY = e.changedTouches[0].clientY;
  const deltaY = touchStartY - touchEndY;

  if (Math.abs(deltaY) > 30) {
    changeBackground();
  }
});

// Click or tap
document.addEventListener("click", changeBackground);
document.addEventListener("touchstart", changeBackground);

// === Frame Swap Animation ===
let currentFrame = 1;
setInterval(() => {
  document.getElementById(`frame${currentFrame}`).classList.remove("visible");
  currentFrame = currentFrame === 1 ? 2 : 1;
  document.getElementById(`frame${currentFrame}`).classList.add("visible");
}, 500);

// === Top Text Animation ===
// const words = ["another", "fine", "mess"];
// const topText = document.getElementById("topText");

// words.forEach((word) => {
//   const wordSpan = document.createElement("span");
//   wordSpan.className = "word";

//   for (let letter of word) {
//     const letterSpan = document.createElement("span");
//     letterSpan.className = "letter";
//     letterSpan.textContent = letter;

//     letterSpan.addEventListener("mouseover", () => {
//       letterSpan.classList.add("fall");

//       setTimeout(() => {
//         letterSpan.classList.remove("fall");
//       }, 3000);
//     });

//     wordSpan.appendChild(letterSpan);
//   }

//   const space = document.createTextNode(" ");
//   topText.appendChild(wordSpan);
//   topText.appendChild(space);
// });

// === Refresh Popup ===
document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("refresh-popup");
  const message = document.getElementById("refresh-message");

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  message.textContent = isTouchDevice ? "Tap to refresh!" : "Click to refresh!";

  const hidePopup = () => {
    popup.style.opacity = "0";
    popup.style.pointerEvents = "none";
    setTimeout(() => {
      popup.style.display = "none";
    }, 500);
  };

  popup.addEventListener("click", hidePopup);
  popup.addEventListener("touchstart", hidePopup);

  setTimeout(hidePopup, 3000);
});

// === Insert scrolling text ===

const eventDetails = {
  date: "Saturday 20th September",
  time: "8pm – 2am",
  price: "£15",
  location: "Snag Farm • Snag Lane • BA9 9PJ",
};

const text = `${eventDetails.date} • ${eventDetails.time} • ${eventDetails.price} • ${eventDetails.location}`;
const container = document.getElementById("scrolling-text");

container.innerHTML = ""; // Clear any existing content

for (const char of text) {
  const span = document.createElement("span");
  span.innerHTML = char === " " ? "&nbsp;" : char;
  container.appendChild(span);
}
