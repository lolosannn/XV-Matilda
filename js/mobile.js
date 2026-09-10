// Motor de la página de PREVIEW mobile (copia del diseño de Figma).
// Reutiliza GUEST_GROUPS (guests.js) y EVENT_CONFIG (config.js) tal cual,
// sin modificarlos.

function mFormatNamesCommaOnly(names) {
  return names.join(", ");
}

function mRenderPipedNames(el, names) {
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

function mFitTextToOneLine(el, minFontPx) {
  let fontSize = parseFloat(window.getComputedStyle(el).fontSize);
  const maxWidth = el.clientWidth;
  while (el.scrollWidth > maxWidth && fontSize > minFontPx) {
    fontSize -= 1;
    el.style.fontSize = fontSize + "px";
  }
}

function mGetGuestSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("g");
}

function mFindGuestGroup(slug) {
  return GUEST_GROUPS.find((group) => group.slug === slug) || null;
}

function mRenderEventDetails() {
  document.getElementById("m-celebrant-name").textContent = EVENT_CONFIG.celebrantName;
  document.getElementById("m-event-date").textContent = EVENT_CONFIG.date;
  document.getElementById("m-event-time").textContent = EVENT_CONFIG.time;
  document.getElementById("m-event-venue").textContent = EVENT_CONFIG.venueName;
  document.getElementById("m-event-address").textContent = EVENT_CONFIG.venueAddress;
  document.getElementById("m-rsvp-button").href = EVENT_CONFIG.rsvpFormUrl;

  const mapQuery = encodeURIComponent(EVENT_CONFIG.venueName + ", " + EVENT_CONFIG.venueAddress);
  document.getElementById("m-map-link").href = "https://www.google.com/maps/search/?api=1&query=" + mapQuery;
}

function mPad2(n) {
  return String(n).padStart(2, "0");
}

function mUpdateCountdown() {
  const daysEl = document.getElementById("m-countdown-days");
  if (!daysEl) return;

  const target = new Date(EVENT_CONFIG.countdownTarget).getTime();
  const diff = Math.max(0, target - Date.now());

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  daysEl.textContent = mPad2(days);
  document.getElementById("m-countdown-hours").textContent = mPad2(hours);
  document.getElementById("m-countdown-minutes").textContent = mPad2(minutes);
  document.getElementById("m-countdown-seconds").textContent = mPad2(seconds);
}

function mShowNotFound() {
  document.getElementById("app").innerHTML =
    '<div style="padding:40px 24px;text-align:center;font-family:\'Libre Baskerville\',serif;">' +
    "<p>No encontramos tu invitación.</p>" +
    "<p>Verificá que estés usando el link que te enviamos.</p>" +
    "</div>";
}

// Escala cada .m-frame a su lienzo de diseño (mismo truco que main.js).
function mScaleFrame(frame) {
  const frameWidth = parseFloat(frame.dataset.frameWidth);
  const frameHeight = parseFloat(frame.dataset.frameHeight);
  const viewportWidth = document.documentElement.clientWidth;
  const scale = viewportWidth / frameWidth;

  frame.style.width = frameWidth + "px";
  frame.style.height = frameHeight + "px";
  frame.style.transform = "scale(" + scale + ")";
  frame.parentElement.style.height = frameHeight * scale + "px";
}

function mScaleAllFrames() {
  document.querySelectorAll(".m-frame").forEach(mScaleFrame);
}

let mEnvelopeOpened = false;

function mOpenEnvelope() {
  if (mEnvelopeOpened) return;
  mEnvelopeOpened = true;

  const envelopeFrame = document.getElementById("m-envelope-frame");
  envelopeFrame.classList.add("m-opening");

  window.setTimeout(function () {
    const envelopeScreen = document.getElementById("screen-envelope");
    const invitationScreen = document.getElementById("screen-invitation");
    envelopeScreen.classList.remove("m-screen--active");
    invitationScreen.classList.add("m-screen--active");
    mScaleAllFrames();
  }, 500);
}

function mInit() {
  const slug = mGetGuestSlugFromUrl();
  const group = slug ? mFindGuestGroup(slug) : null;

  if (!group) {
    mShowNotFound();
    return;
  }

  const envelopeNamesEl = document.getElementById("m-guest-names-envelope");
  envelopeNamesEl.textContent = mFormatNamesCommaOnly(group.names);

  const invitationNamesEl = document.getElementById("m-guest-names-invitation");
  mRenderPipedNames(invitationNamesEl, group.names);

  mRenderEventDetails();
  mUpdateCountdown();
  window.setInterval(mUpdateCountdown, 1000);

  mScaleAllFrames();
  mFitTextToOneLine(envelopeNamesEl, 18);
  mFitTextToOneLine(invitationNamesEl, 14);
  window.addEventListener("resize", mScaleAllFrames);

  const envelope = document.getElementById("m-envelope");
  envelope.addEventListener("click", mOpenEnvelope);
  envelope.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      mOpenEnvelope();
    }
  });
}

document.addEventListener("DOMContentLoaded", mInit);
