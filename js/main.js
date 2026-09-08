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

// Reduce el tamaño de fuente hasta que el texto entre en una sola línea
// dentro del ancho de su contenedor. Necesario porque la cantidad de
// invitados por grupo varía (de 1 a 5 nombres) y el diseño está pensado
// para un texto de ejemplo de longitud fija.
function fitTextToOneLine(el, minFontPx) {
  let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
  const maxWidth = el.clientWidth;
  while (el.scrollWidth > maxWidth && fontSize > minFontPx) {
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
    // real para escalar sus frames (antes, oculta, medía 0).
    scaleAllFrames();
    void invitationScreen.offsetWidth;
    invitationScreen.classList.add("active", "entering");

    spawnPetals(16);
  }, 470);

  // 4. Limpieza de las clases de animación una vez que terminaron.
  window.setTimeout(function () {
    flashBurst.classList.remove("active");
  }, 1100);
}

// Reproduce cada pantalla al tamaño exacto del diseño de Figma (un "frame" de
// ancho fijo) y lo escala uniformemente para que ocupe el ancho del dispositivo,
// igual que si fuera una imagen. Así el layout queda pixel-perfect en cualquier
// tamaño de pantalla.
function scaleFrame(scaler) {
  const frame = scaler.querySelector(".frame");
  const frameWidth = parseFloat(scaler.dataset.frameWidth);
  const frameHeight = parseFloat(scaler.dataset.frameHeight);
  const scale = scaler.clientWidth / frameWidth;

  frame.style.width = frameWidth + "px";
  frame.style.height = frameHeight + "px";
  frame.style.transform = "scale(" + scale + ")";

  if (!scaler.classList.contains("frame-scaler--fixed")) {
    scaler.style.height = frameHeight * scale + "px";
  }
}

function scaleAllFrames() {
  document.querySelectorAll(".frame-scaler").forEach(scaleFrame);
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

  scaleAllFrames();
  fitTextToOneLine(envelopeNamesEl, 56);
  fitTextToOneLine(invitationNamesEl, 26);
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
