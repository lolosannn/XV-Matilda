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

// Arma un string de nombres separados por "|", como en la invitación.
// Ej: ["Ailen","Carlos","Laura"] -> "Ailen | Carlos | Laura"
function formatNamesWithPipe(names) {
  return names.join(" | ");
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
  document.getElementById("event-date").textContent = EVENT_CONFIG.date;
  document.getElementById("event-time").textContent = EVENT_CONFIG.time;
  document.getElementById("event-venue-name").textContent = EVENT_CONFIG.venueName;
  document.getElementById("event-venue-address").textContent = EVENT_CONFIG.venueAddress;
  document.getElementById("event-dress-code").textContent = EVENT_CONFIG.dressCode;
  document.getElementById("celebrant-name").textContent = EVENT_CONFIG.celebrantName;

  const rsvpLink = document.getElementById("rsvp-link");
  rsvpLink.href = EVENT_CONFIG.rsvpFormUrl;

  const photo = document.getElementById("event-photo");
  photo.src = EVENT_CONFIG.photoSrc;
}

function showNotFound() {
  document.getElementById("app").innerHTML =
    '<div class="not-found">' +
    "<p>No encontramos tu invitación.</p>" +
    "<p>Verificá que estés usando el link que te enviamos.</p>" +
    "</div>";
}

function openEnvelope() {
  const envelopeScreen = document.getElementById("screen-envelope");
  const invitationScreen = document.getElementById("screen-invitation");

  envelopeScreen.classList.add("opening");

  window.setTimeout(function () {
    envelopeScreen.classList.remove("active");
    envelopeScreen.classList.add("hidden");
    invitationScreen.classList.remove("hidden");
    // Forzamos reflow para que la transición de opacidad se dispare.
    void invitationScreen.offsetWidth;
    invitationScreen.classList.add("active");
  }, 600);
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
  scaler.style.height = frameHeight * scale + "px";
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

  document.getElementById("guest-names-invitation").textContent = formatNamesWithPipe(group.names);

  renderEventDetails();

  scaleAllFrames();
  fitTextToOneLine(envelopeNamesEl, 56);
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
