// Arma un string de nombres separados por comas, tal como en el diseño de la pantalla 1.
// Ej: ["Ailen","Carlos","Laura"] -> "Ailen, Carlos, Laura"
function formatNamesCommaOnly(names) {
  return names.join(", ");
}

// Arma un string de nombres separados por comas, con "y" antes del último.
// Ej: ["Ailen","Carlos","Laura"] -> "Ailen, Carlos y Laura"
function formatNamesWithY(names) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(" y ");
  return names.slice(0, -1).join(", ") + " y " + names[names.length - 1];
}

// Escribe los nombres en el elemento de la pantalla 2 separados por una
// líneita vertical (no texto "|") entre cada uno.
function renderPipedNames(el, names) {
  el.textContent = "";
  names.forEach(function (name, index) {
    if (index > 0) {
      const sep = document.createElement("span");
      sep.className = "name-sep";
      el.appendChild(sep);
    }
    el.appendChild(document.createTextNode(name));
  });
}

// Reduce el tamaño de fuente hasta que el texto entre en el espacio
// disponible. Necesario porque la cantidad de invitados por grupo varía
// (de 1 a 5 nombres) y el diseño está pensado para un texto de ejemplo
// de longitud fija.
// "minDesignPx" es el piso de siempre, en píxeles de diseño (para no
// achicar de más en desktop). "minVisualPx" es un piso adicional en
// píxeles reales de pantalla, para que en mobile (donde todo escala
// mucho más chico) no termine ilegible; se usa el que sea más grande.
// "maxHeightPx" (opcional, en píxeles de diseño) es el alto disponible
// antes de chocar con el elemento de abajo: en mobile el texto puede
// pasar a una segunda línea (así no se corta el ancho de la pantalla),
// así que hace falta controlar también que no crezca de más en alto.
function fitTextToOneLine(el, minDesignPx, minVisualPx, scale, maxHeightPx) {
  let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
  const maxWidth = el.clientWidth;
  const minFontPx = Math.max(minDesignPx, minVisualPx / scale);
  while (
    (el.scrollWidth > maxWidth || (maxHeightPx && el.scrollHeight > maxHeightPx)) &&
    fontSize > minFontPx
  ) {
    fontSize -= 2;
    el.style.fontSize = fontSize + "px";
  }
}

function getGuestSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("g");
}

function findGuestGroup(slug) {
  return GUEST_GROUPS.find((group) => group.slug === slug) || null;
}

function renderEventDetails() {
  document.getElementById("celebrant-name").textContent = EVENT_CONFIG.celebrantName;
  document.getElementById("event-date").textContent = EVENT_CONFIG.date;
  document.getElementById("event-time").textContent = EVENT_CONFIG.time;
  document.getElementById("event-venue").textContent = EVENT_CONFIG.venueName;
  document.getElementById("event-address").textContent = EVENT_CONFIG.venueAddress;
  document.getElementById("rsvp-button").href = EVENT_CONFIG.rsvpFormUrl;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Cuenta regresiva en vivo hasta EVENT_CONFIG.countdownTarget, se
// actualiza segundo a segundo. Si el evento ya pasó, queda en cero.
function updateCountdown() {
  const daysEl = document.getElementById("countdown-days");
  if (!daysEl) return;

  const target = new Date(EVENT_CONFIG.countdownTarget).getTime();
  const diff = Math.max(0, target - Date.now());

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  daysEl.textContent = pad2(days);
  document.getElementById("countdown-hours").textContent = pad2(hours);
  document.getElementById("countdown-minutes").textContent = pad2(minutes);
  document.getElementById("countdown-seconds").textContent = pad2(seconds);
}

function showNotFound() {
  document.getElementById("app").innerHTML =
    '<div class="not-found">' +
    "<p>No encontramos tu invitación.</p>" +
    "<p>Verificá que estés usando el link que te enviamos.</p>" +
    "</div>";
}

// Crea pétalos que caen suavemente sobre la pantalla de la invitación,
// como un pequeño festejo al abrirse el sobre.
function spawnPetals(count) {
  const layer = document.getElementById("petal-layer");
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";
    const left = Math.random() * 100;
    const duration = 2.6 + Math.random() * 1.8;
    const delay = Math.random() * 0.5;
    const drift = (Math.random() - 0.5) * 160;
    const size = 10 + Math.random() * 8;

    petal.style.left = left + "vw";
    petal.style.width = size + "px";
    petal.style.height = size + "px";
    petal.style.animationDuration = duration + "s";
    petal.style.animationDelay = delay + "s";
    petal.style.setProperty("--drift", drift + "px");

    layer.appendChild(petal);
    window.setTimeout(function () {
      petal.remove();
    }, (duration + delay) * 1000 + 200);
  }
}

let envelopeOpened = false;

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;

  const envelopeScreen = document.getElementById("screen-envelope");
  const envelopeFrame = document.getElementById("envelope-frame");
  const invitationScreen = document.getElementById("screen-invitation");
  const sealGlow = document.getElementById("seal-glow");
  const flashBurst = document.getElementById("flash-burst");

  // 1. El sello brilla y el sobre empieza a alejarse.
  sealGlow.classList.add("pulse");
  envelopeFrame.classList.add("opening");

  // 2. Un destello cálido cubre la pantalla justo cuando termina de irse el sobre.
  window.setTimeout(function () {
    flashBurst.classList.add("active");
  }, 150);

  // 3. En el pico del destello, cambiamos de pantalla (queda oculto por la luz).
  window.setTimeout(function () {
    envelopeScreen.classList.remove("active");
    envelopeScreen.classList.add("hidden");

    invitationScreen.classList.remove("hidden");
    // Recién ahora es visible, así que recién ahora se puede medir su ancho
    // real para escalar sus frames y para ajustar el tamaño de los
    // nombres (antes, oculta, todo medía 0 y el ajuste no tenía efecto).
    const scale = scaleAllFrames();
    const invitationNamesEl = document.getElementById("guest-names-invitation");
    fitTextToOneLine(invitationNamesEl, 26, 14, scale, 240);
    void invitationScreen.offsetWidth;
    invitationScreen.classList.add("active", "entering");

    spawnPetals(16);
  }, 470);

  // 4. Limpieza de las clases de animación una vez que terminaron.
  window.setTimeout(function () {
    flashBurst.classList.remove("active");
  }, 1100);
}

// Espacio libre debajo del final real de la tarjeta (".s2-card"), en
// píxeles de diseño. Mismo criterio que se usó a mano en cada sección.
const CARD_BOTTOM_MARGIN = 87;

// Reproduce cada pantalla al tamaño exacto del diseño de Figma (un "frame" de
// ancho fijo) y lo escala uniformemente para que ocupe el ancho del dispositivo,
// igual que si fuera una imagen. Así el layout queda pixel-perfect en cualquier
// tamaño de pantalla.
function scaleFrame(scaler) {
  const frame = scaler.querySelector(".frame");
  const frameWidth = parseFloat(scaler.dataset.frameWidth);
  let frameHeight = parseFloat(scaler.dataset.frameHeight);
  const scale = scaler.clientWidth / frameWidth;

  // En mobile el texto se agranda (ver CSS, calc(Xpx / var(--frame-scale)))
  // para seguir siendo legible, así que la tarjeta puede terminar siendo
  // más alta que el número fijo calculado a mano para desktop. Acá se mide
  // el alto real de ".s2-card" (que crece por su contenido en flujo) y, si
  // hace falta más lugar que el declarado, se usa ese en su lugar.
  const card = frame.querySelector(".s2-card");
  if (card) {
    const cardTop = parseFloat(getComputedStyle(card).top) || 0;
    const neededHeight = cardTop + card.offsetHeight + CARD_BOTTOM_MARGIN;
    frameHeight = Math.max(frameHeight, neededHeight);
  }

  frame.style.width = frameWidth + "px";
  frame.style.height = frameHeight + "px";
  frame.style.transform = "scale(" + scale + ")";

  if (!scaler.classList.contains("frame-scaler--fixed")) {
    scaler.style.height = frameHeight * scale + "px";
  }
}

const DESIGN_WIDTH = 1920;

// Todos los frame-scalers comparten el mismo ancho de diseño (1920) y de
// pantalla, así que su factor de escala siempre es el mismo. Se calcula
// acá directo del ancho de la ventana (no del clientWidth de un scaler
// puntual, que puede estar oculto -y medir 0- si todavía no se abrió el
// sobre) y se guarda en una variable CSS ANTES de escalar los frames, para
// que en mobile el texto pueda "contrarrestar" el escalado (font-size:
// calc(Xpx / var(--frame-scale))) y verse legible aunque el resto del
// diseño siga escalando como imagen -y para que, al medir el alto real de
// la tarjeta en scaleFrame(), el texto ya tenga su tamaño mobile correcto.
function scaleAllFrames() {
  const scale = document.documentElement.clientWidth / DESIGN_WIDTH;
  document.documentElement.style.setProperty("--frame-scale", scale);
  document.querySelectorAll(".frame-scaler").forEach(scaleFrame);
  return scale;
}

function init() {
  const slug = getGuestSlugFromUrl();
  const group = slug ? findGuestGroup(slug) : null;

  if (!group) {
    showNotFound();
    return;
  }

  const envelopeNamesEl = document.getElementById("guest-names-envelope");
  envelopeNamesEl.textContent = formatNamesCommaOnly(group.names);

  const invitationNamesEl = document.getElementById("guest-names-invitation");
  renderPipedNames(invitationNamesEl, group.names);

  renderEventDetails();
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const scale = scaleAllFrames();
  // El alto disponible (maxHeightPx) es el espacio real antes de chocar
  // con el elemento de abajo (divider-vector en mobile, que se corre un
  // poco más abajo -ver CSS- para hacerle lugar a una segunda línea
  // cuando el grupo tiene varios invitados). Los nombres de la pantalla 2
  // se ajustan recién al abrir el sobre (ver openEnvelope), porque hasta
  // entonces esa pantalla está oculta y mide 0.
  fitTextToOneLine(envelopeNamesEl, 56, 18, scale, 250);
  window.addEventListener("resize", scaleAllFrames);

  const envelope = document.getElementById("envelope");
  envelope.addEventListener("click", openEnvelope);
  envelope.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEnvelope();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
