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

function init() {
  const slug = getGuestSlugFromUrl();
  const group = slug ? findGuestGroup(slug) : null;

  if (!group) {
    showNotFound();
    return;
  }

  document.getElementById("guest-names-envelope").textContent = formatNamesWithY(group.names);
  document.getElementById("guest-names-invitation").textContent = formatNamesWithPipe(group.names);

  renderEventDetails();

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
