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
  // mapear el sistema de coordenadas para trabajar en px "CSS"
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

  // parámetros básicos
  const size = CANVAS_SIZE;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) - 12; // margen para el borde
  const textRadius = radius * TEXT_RADIUS_RATIO;

  // arc en radianes (2π / n)
  arc = (2 * Math.PI) / opciones.length;

  // limpiar
  ctx.clearRect(0, 0, size, size);

  // dibujar sectores
  for (let i = 0; i < opciones.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = colores[i % colores.length];

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + arc, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // ------- texto: ajusta tamaño según ancho disponible -------
    ctx.save();
    ctx.fillStyle = "white";

    // Ancho disponible *aprox* a lo largo del arco en el radio donde colocamos texto:
    // arcLength = angle (rad) * textRadius
    let availableWidth = Math.max(30, arc * textRadius * 0.9);

    // Iniciamos con un fontSize razonable y reducimos hasta que quepa
    let fontSize = Math.min(MAX_FONT, Math.floor(availableWidth / 6) + 6); // heurística inicial
    if (fontSize > MAX_FONT) fontSize = MAX_FONT;
    if (fontSize < MIN_FONT) fontSize = MIN_FONT;

    // Probar y ajustar con measureText
    ctx.font = `bold ${fontSize}px Poppins, Arial`;
    let displayText = String(opciones[i]);

    // Si no cabe, reducir fontSize hasta MIN_FONT
    while (ctx.measureText(displayText).width > availableWidth && fontSize > MIN_FONT) {
      fontSize--;
      ctx.font = `bold ${fontSize}px Poppins, Arial`;
    }

    // Si aún no cabe (muy largo), truncar con "..."
    if (ctx.measureText(displayText).width > availableWidth) {
      // recortar caracteres hasta que quepa
      let txt = displayText;
      while (txt.length > 3 && ctx.measureText(txt + "...").width > availableWidth) {
        txt = txt.slice(0, -1);
      }
      displayText = txt.length > 3 ? txt + "..." : txt;
    }

    // posición del texto en coordenadas polares
    const textX = centerX + Math.cos(angle + arc / 2) * textRadius;
    const textY = centerY + Math.sin(angle + arc / 2) * textRadius;

    ctx.translate(textX, textY);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);

    // dibujar texto centrado
    ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 0);

    ctx.restore();
  }

  // dibujar borde y centro opcional
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
  ctx.stroke();

  // flecha superior
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(centerX - 10, 6);
  ctx.lineTo(centerX + 10, 6);
  ctx.lineTo(centerX, 34);
  ctx.closePath();
  ctx.fill();
}

function girarRuleta() {
  spinAngleStart = Math.random() * 30 + 20; // fuerza inicial
  spinTime = 0;
  spinTimeTotal = Math.random() * 4000 + 5000; // duración total
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
  // calcular índice ganador
  // normalizar startAngle a grados
  let degrees = (startAngle * 180) / Math.PI + 90;
  let arcd = (arc * 180) / Math.PI;
  let index = Math.floor((360 - (degrees % 360)) / arcd) % opciones.length;
  if (index < 0) index += opciones.length;
  const text = opciones[index];

  // mostrar mensaje flotante y confeti
  const msg = document.getElementById("ganadorMsg");
  if (msg) {
    msg.textContent = "🎉 ¡Ganador: " + text + " 🎉";
    msg.classList.add("show");
  }
  lanzarConfeti();

  setTimeout(() => {
    if (msg) msg.classList.remove("show");
  }, 3500);
}

function easeOut(t, b, c, d) {
  let ts = (t /= d) * t;
  let tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

// opcional: asegurarse de que el botón de girar llame a la función si no está enlazado por el HTML
document.getElementById("spinBtn")?.addEventListener("click", girarRuleta);

// reajustar canvas si cambia el DPI o se redimensiona ventana
window.addEventListener("resize", () => {
  setupCanvasHiDPI();
  dibujarRuleta();
});
