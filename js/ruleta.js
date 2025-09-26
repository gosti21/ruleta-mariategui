// -------- confeti -------------
function lanzarConfeti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  (function frame() {
    confetti({
      particleCount: 7,
      angle: randomInRange(55, 125),
      spread: randomInRange(50, 70),
      origin: { y: 0.6 },
      ...defaults
    });
    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  })();
}

// -------- sonido -------------
const spinSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");

const winSound = new Audio("https://www.myinstants.com/media/sounds/tadaa.mp3");
// -------- ruleta -------------
let opciones = []; // lista de alumnos por sección
let startAngle = 0;
let arc = 0;
let spinTimeout = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

// Canvas / contexto
const canvas = document.getElementById("ruletaCanvas");
const ctx = canvas?.getContext("2d");

// colores vivos
const colores = [
  "#FF4C4C", "#FF914D", "#FFD93D", "#6BCB77",
  "#4D96FF", "#843b62", "#f72585", "#06d6a0"
];

// settings de diseño
const CANVAS_SIZE = 500; // tamaño "visual" en px
const MIN_FONT = 9;      // tamaño mínimo de fuente
const MAX_FONT = 22;     // tamaño máximo inicial
const TEXT_RADIUS_RATIO = 0.62; // distancia radial para el texto (relación al radio)

function setupCanvasHiDPI() {
  if (!canvas || !ctx) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = CANVAS_SIZE + "px";
  canvas.style.height = CANVAS_SIZE + "px";
  canvas.width = Math.round(CANVAS_SIZE * ratio);
  canvas.height = Math.round(CANVAS_SIZE * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function inicializarRuleta(lista) {
  opciones = Array.isArray(lista) ? lista : [];
  setupCanvasHiDPI();
  dibujarRuleta();
}

// dibuja la ruleta con texto ajustado dinámicamente
function dibujarRuleta() {
  if (!ctx || opciones.length === 0 || !canvas) return;

  const size = CANVAS_SIZE;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) - 12;
  const textRadius = radius * TEXT_RADIUS_RATIO;

  arc = (2 * Math.PI) / opciones.length;
  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < opciones.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = colores[i % colores.length];

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + arc, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "white";

    let availableWidth = Math.max(30, arc * textRadius * 0.9);
    let fontSize = Math.min(MAX_FONT, Math.floor(availableWidth / 6) + 6);
    if (fontSize > MAX_FONT) fontSize = MAX_FONT;
    if (fontSize < MIN_FONT) fontSize = MIN_FONT;

    ctx.font = `bold ${fontSize}px Poppins, Arial`;
    let displayText = String(opciones[i]);

    while (ctx.measureText(displayText).width > availableWidth && fontSize > MIN_FONT) {
      fontSize--;
      ctx.font = `bold ${fontSize}px Poppins, Arial`;
    }

    if (ctx.measureText(displayText).width > availableWidth) {
      let txt = displayText;
      while (txt.length > 3 && ctx.measureText(txt + "...").width > availableWidth) {
        txt = txt.slice(0, -1);
      }
      displayText = txt.length > 3 ? txt + "..." : txt;
    }

    const textX = centerX + Math.cos(angle + arc / 2) * textRadius;
    const textY = centerY + Math.sin(angle + arc / 2) * textRadius;

    ctx.translate(textX, textY);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);
    ctx.restore();
  }

  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(centerX - 10, 6);
  ctx.lineTo(centerX + 10, 6);
  ctx.lineTo(centerX, 34);
  ctx.closePath();
  ctx.fill();
}

function girarRuleta() {
  spinAngleStart = Math.random() * 30 + 20;
  spinTime = 0;
  spinTimeTotal = Math.random() * 2000 + 3000;

  // reproducir sonido de giro en loop
  spinSound.loop = true;
  spinSound.play();

  girarAnimacion();
}

function girarAnimacion() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    detenerGiro();
    return;
  }
  let spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI) / 180;
  dibujarRuleta();
  spinTimeout = setTimeout(girarAnimacion, 30);
}

function detenerGiro() {
  clearTimeout(spinTimeout);
  spinSound.pause();
  spinSound.currentTime = 0;

  let degrees = (startAngle * 180) / Math.PI + 90;
  let arcd = (arc * 180) / Math.PI;
  let index = Math.floor((360 - (degrees % 360)) / arcd) % opciones.length;
  if (index < 0) index += opciones.length;
  const text = opciones[index];

  const msg = document.getElementById("ganadorMsg");
  if (msg) {
    msg.textContent = "🎉 ¡Ganador: " + text + " 🎉";
    msg.classList.add("show");
  }
  lanzarConfeti();

  // reproducir sonido de ganador
  winSound.play();

  setTimeout(() => {
    if (msg) msg.classList.remove("show");
  }, 3500);
}

function easeOut(t, b, c, d) {
  let ts = (t /= d) * t;
  let tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

document.getElementById("spinBtn")?.addEventListener("click", girarRuleta);

window.addEventListener("resize", () => {
  setupCanvasHiDPI();
  dibujarRuleta();
});
