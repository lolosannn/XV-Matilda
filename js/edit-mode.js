// ---------- Modo edición visual en vivo ----------
// Herramienta de trabajo para ajustar el diseño a mano (texto, tamaños,
// posición, imágenes) directamente sobre la página. Todo se guarda en
// localStorage del navegador donde se edita (no se publica solo). El
// flujo real es: se edita acá -> "Exportar cambios" -> se manda el JSON
// -> se aplica a mano en el código y se hace deploy. No toca la lógica
// de main.js, config.js ni guests.js: solo superpone overrides de estilo
// y contenido después de que la página ya se renderizó normalmente.
(function () {
  "use strict";

  var STORAGE_KEY = "xv-edit-overrides";
  var MOBILE_PREVIEW_KEY = "xv-edit-mobile-preview";
  var EDIT_MODE_ACTIVE_KEY = "xv-edit-mode-active";
  var MOBILE_BREAKPOINT = 760;
  var MOBILE_PREVIEW_WIDTH = 390;

  // Si venís de tocar "Vista mobile", esto tiene que quedar seteado ANTES
  // de que main.js calcule la escala por primera vez (para que no haya un
  // parpadeo mostrando el ancho real y después el simulado). Por eso va acá
  // arriba de todo, fuera de cualquier callback: este script se ejecuta
  // después de que main.js ya definió sus funciones, pero antes de que
  // dispare su DOMContentLoaded.
  if (window.sessionStorage && window.sessionStorage.getItem(MOBILE_PREVIEW_KEY) === "1") {
    window.__xvForcedViewportWidth = MOBILE_PREVIEW_WIDTH;
    document.body.classList.add("edit-mobile-preview");
  }

  function isMobilePreviewOn() {
    return !!window.__xvForcedViewportWidth;
  }

  // Determina si el override activo es el de "mobile" o el de "desktop":
  // por el ancho simulado (si se activó la vista previa) o, si no, por el
  // ancho real de pantalla. Así un visitante que abre el link desde su
  // celular de verdad recibe los ajustes de "mobile" sin necesitar nada
  // especial.
  function currentDevice() {
    var width = window.__xvForcedViewportWidth || document.documentElement.clientWidth;
    return width < MOBILE_BREAKPOINT ? "mobile" : "desktop";
  }

  function activeOverrides() {
    return overrides[currentDevice()];
  }

  function emptyDeviceOverrides() {
    return { items: {}, customElements: [], frameHeights: {}, cardSpacer: 0 };
  }

  function normalizeDeviceOverrides(data) {
    if (!data || typeof data !== "object") return emptyDeviceOverrides();
    if (!data.items) data.items = {};
    if (!data.customElements) data.customElements = [];
    if (!data.frameHeights) data.frameHeights = {};
    if (!data.cardSpacer) data.cardSpacer = 0;
    return data;
  }

  // Clases de los elementos que se pueden seleccionar/editar. Cada uno ya
  // tiene una clase propia y única en style.css, así que sirve como id
  // estable entre recargas sin tener que tocar el HTML.
  var EDITABLE_CLASSES = [
    "crown-logo", "eyebrow", "script-names", "divider-vector", "envelope-img", "hint",
    "s2-ribbon", "s2-flower", "s2-quote", "s2-divider-1", "s2-logo", "s2-photo", "s2-names",
    "s2-divider-2", "s2-callout", "s2-divider-3", "s2-dt-bg", "s2-dt-flower",
    "s2-dt-label", "s2-dt-label--fecha", "s2-dt-label--horario", "s2-dt-label--lugar",
    "s2-dt-value", "s2-dt-address", "s2-map-divider-top", "s2-map-link",
    "s2-map-divider-bottom", "s2-dresscode", "s2-countdown-bg", "s2-countdown-overlay",
    "s2-countdown-numbers", "s2-closing", "s2-rsvp-button"
  ];

  // Elementos cuyo texto lo arma JS a partir de config.js/guests.js (nombres
  // de invitados, fecha, cuenta regresiva, etc). Se pueden mover/agrandar,
  // pero no tiene sentido "editar el texto" a mano porque se pisa con cada
  // invitado/recarga.
  var DYNAMIC_TEXT_IDS = [
    "guest-names-envelope", "guest-names-invitation", "event-date", "event-time",
    "event-venue", "event-address", "countdown-days", "countdown-hours",
    "countdown-minutes", "countdown-seconds"
  ];
  // Elementos que son contenedores de otras piezas (imagen + texto): no
  // conviene volverlos contentEditable directo.
  var NO_TEXT_EDIT_CLASSES = ["s2-map-link"];

  // Imágenes disponibles en /images para el panel de "agregar imagen".
  var AVAILABLE_IMAGES = [
    "bg-envelope.jpg", "crown-logo.png", "divider.png", "dresscode.png", "envelope.png",
    "photo-placeholder.svg", "screen2-bg.jpg", "screen2-card.jpg", "screen2-countdown-bg.jpg",
    "screen2-countdown-overlay.png", "screen2-datetime-bg.png", "screen2-divider-1.png",
    "screen2-divider-2.png", "screen2-divider-3.png", "screen2-flower.png",
    "screen2-lace-fixed.png", "screen2-logo.png", "screen2-map-divider-bottom.png",
    "screen2-map-divider-top.png", "screen2-map.png", "screen2-photo.gif",
    "screen2-ribbon.png", "screen2-rsvp-bg.png",
    "Corona banca pantalla 2.png", "Separador blanco pantalla 2.png",
    "TRAJE PANTALLA 2.png", "VESTIDO PANTALLA 2.png", "Frame 1.png",
    "Gemini_Generated_Image_8u8sns8u8sns8u8s.jpg", "Gemini_Generated_Image_mrgo43mrgo43mrgo.png"
  ];

  // Nombres de archivo con espacios (como los que suben desde el celular)
  // necesitan ir codificados en la URL para que el navegador los cargue.
  function imagePath(filename) {
    return "images/" + filename.split("/").map(encodeURIComponent).join("/");
  }

  var TEXT_TAGS = ["P", "H1", "H2"];

  // Únicas fuentes y colores que se pueden elegir para texto agregado a
  // mano, para no salirse de la identidad visual ya cargada en la página.
  var TEXT_FONTS = [
    { label: "Serif", family: '"Libre Baskerville", serif', weight: "400", style: "normal" },
    { label: "Serif negrita", family: '"Libre Baskerville", serif', weight: "700", style: "normal" },
    { label: "Serif cursiva", family: '"Libre Baskerville", serif', weight: "400", style: "italic" },
    { label: "Script", family: '"Pinyon Script", cursive', weight: "400", style: "normal" }
  ];
  var TEXT_COLORS = [
    { label: "Marrón", value: "#654b38" },
    { label: "Blanco", value: "#ffffff" },
    { label: "Negro", value: "#000000" }
  ];

  // Cuánto crece/achica el largo de la tarjeta por click en "Más/Menos espacio".
  var FRAME_HEIGHT_STEP = 200;

  var overrides = loadOverrides();
  var state = { active: false, selected: null };
  var toolbarEl = null;
  var customCounter = 0;

  function loadOverrides() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") {
        return { desktop: emptyDeviceOverrides(), mobile: emptyDeviceOverrides() };
      }
      // Formato viejo (de antes de separar desktop/mobile): tenía
      // "items"/"customElements" sueltos en la raíz. Se migra tal cual a
      // "desktop" (que es donde se venía editando hasta ahora) y "mobile"
      // arranca de cero.
      if (!parsed.desktop && !parsed.mobile) {
        return { desktop: normalizeDeviceOverrides(parsed), mobile: emptyDeviceOverrides() };
      }
      return {
        desktop: normalizeDeviceOverrides(parsed.desktop),
        mobile: normalizeDeviceOverrides(parsed.mobile)
      };
    } catch (e) {
      return { desktop: emptyDeviceOverrides(), mobile: emptyDeviceOverrides() };
    }
  }

  function saveOverrides() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      // localStorage lleno o bloqueado: no hay mucho más para hacer acá.
    }
  }

  // ---------- Identificación estable de elementos ----------

  function stableId(el) {
    if (el.dataset.editCustomId) return el.dataset.editCustomId;
    if (el.id) return "id:" + el.id;
    var classes = Array.prototype.slice.call(el.classList).filter(function (c) {
      return EDITABLE_CLASSES.indexOf(c) !== -1;
    });
    return "cls:" + classes.join(".");
  }

  function findByStableId(id) {
    if (id.indexOf("custom-") === 0) {
      return document.querySelector('[data-edit-custom-id="' + id + '"]');
    }
    if (id.indexOf("id:") === 0) return document.getElementById(id.slice(3));
    if (id.indexOf("cls:") === 0) {
      var classes = id.slice(4).split(".");
      return document.querySelector("." + classes.join("."));
    }
    return null;
  }

  // ---------- Escala del frame (para convertir px de pantalla a px de diseño) ----------

  function getFrameScale(el) {
    var frame = el.closest(".frame");
    if (!frame) return 1;
    var t = window.getComputedStyle(frame).transform;
    if (!t || t === "none") return 1;
    try {
      var m = new DOMMatrix(t);
      return m.a || 1;
    } catch (e) {
      return 1;
    }
  }

  // ---------- Overrides: aplicar / guardar ----------

  function applyItemData(el, data) {
    if (!data) return;
    if (data.hidden) el.style.display = "none";
    if (data.left != null) el.style.left = data.left + "px";
    if (data.top != null) el.style.top = data.top + "px";
    if (data.fontSize != null) el.style.fontSize = data.fontSize + "px";
    if (data.letterSpacing != null) el.style.letterSpacing = data.letterSpacing + "px";
    if (data.width != null) el.style.width = data.width + "px";
    if (data.height != null) el.style.height = data.height + "px";
    if (data.zIndex != null) el.style.zIndex = data.zIndex;
    if (data.marginTop != null) el.style.marginTop = data.marginTop + "px";
    if (data.html != null) el.innerHTML = data.html;
    if (data.fontIndex != null) applyFontToElement(el, data.fontIndex);
    if (data.colorIndex != null) applyColorToElement(el, data.colorIndex);
  }

  function updateOverride(el, patch) {
    var id = stableId(el);
    if (!id) return;
    if (!activeOverrides().items[id]) activeOverrides().items[id] = {};
    Object.keys(patch).forEach(function (k) {
      activeOverrides().items[id][k] = patch[k];
    });
    saveOverrides();
  }

  function applyStoredOverrides() {
    // Los elementos agregados a mano hay que crearlos ANTES de intentar
    // aplicarles su override de posición/texto/tamaño (si no, todavía no
    // existen en el DOM y el override se pierde silenciosamente).
    activeOverrides().customElements.forEach(function (data) {
      insertCustomElement(data, true);
    });
    Object.keys(activeOverrides().items).forEach(function (id) {
      var el = findByStableId(id);
      if (el) applyItemData(el, activeOverrides().items[id]);
    });
  }

  function applyFrameHeightOverrides() {
    Object.keys(activeOverrides().frameHeights).forEach(function (scalerId) {
      var scaler = findScalerById(scalerId);
      if (scaler) scaler.dataset.frameHeight = activeOverrides().frameHeights[scalerId];
    });
    var spacer = document.getElementById("s2-edit-spacer");
    if (spacer && activeOverrides().cardSpacer) spacer.style.height = activeOverrides().cardSpacer + "px";
    if (window.scaleAllFrames) window.scaleAllFrames();
  }

  function findScalerById(scalerId) {
    if (scalerId === "invitation-scaler") return document.getElementById("invitation-scaler");
    if (scalerId === "envelope-scaler") {
      var envelopeFrame = document.getElementById("envelope-frame");
      return envelopeFrame ? envelopeFrame.closest(".frame-scaler") : null;
    }
    return null;
  }

  function getActiveContentScaler() {
    var envelopeActive = document.getElementById("screen-envelope").classList.contains("active");
    if (envelopeActive) {
      var envelopeFrame = document.getElementById("envelope-frame");
      return envelopeFrame ? envelopeFrame.closest(".frame-scaler") : null;
    }
    return document.getElementById("invitation-scaler");
  }

  function bumpFrameHeight(delta) {
    var scaler = getActiveContentScaler();
    if (!scaler) return;

    // La tarjeta blanca de pantalla 2 tiene overflow:hidden y su alto real
    // lo define su propio contenido en flujo (no el "lienzo" de diseño).
    // Para que de verdad se alargue hay que crecer un espaciador real
    // adentro de la tarjeta, además del lienzo (si no, lo que se gana acá
    // queda recortado por la tarjeta).
    var spacer = document.getElementById("s2-edit-spacer");
    if (spacer) {
      var currentSpacer = parseFloat(spacer.style.height) || 0;
      var nextSpacer = Math.max(0, currentSpacer + delta);
      spacer.style.height = nextSpacer + "px";
      activeOverrides().cardSpacer = nextSpacer;
    }

    var current = parseFloat(scaler.dataset.frameHeight) || 0;
    var next = Math.max(500, current + delta);
    scaler.dataset.frameHeight = next;
    if (window.scaleAllFrames) window.scaleAllFrames();
    if (state.selected) positionToolbar(state.selected);

    var scalerId = scaler.id === "invitation-scaler" ? "invitation-scaler" : "envelope-scaler";
    activeOverrides().frameHeights[scalerId] = next;
    saveOverrides();
  }

  // ---------- Selección + toolbar flotante ----------

  // Tamaño de fuente / espaciado / ancho de caja: válido para cualquier
  // texto, incluidos los que arma JS (fecha, hora, lugar, nombres...).
  // Achicar/agrandar esos no tiene ningún problema; lo único riesgoso es
  // tocar su contenido a mano (ver isTextContentEditable más abajo).
  function isTextResizable(el) {
    return TEXT_TAGS.indexOf(el.tagName) !== -1 ||
      (el.tagName === "A" && el.classList.contains("s2-rsvp-button"));
  }

  // Habilitar el botón "✎ Editar texto" / doble click. Se excluyen los
  // textos que arma JS a partir de config.js/guests.js (fecha, hora,
  // lugar, nombres, cuenta regresiva): si se les edita el contenido a
  // mano, se pisa solo con el próximo render o recarga.
  function isTextContentEditable(el) {
    if (NO_TEXT_EDIT_CLASSES.some(function (c) { return el.classList.contains(c); })) return false;
    if (el.id && DYNAMIC_TEXT_IDS.indexOf(el.id) !== -1) return false;
    return isTextResizable(el);
  }

  function selectElement(el) {
    if (state.selected && state.selected !== el) {
      state.selected.classList.remove("edit-selected");
    }
    state.selected = el;
    el.classList.add("edit-selected");
    showToolbar(el);
  }

  function deselect() {
    if (state.selected) state.selected.classList.remove("edit-selected");
    state.selected = null;
    hideToolbar();
  }

  function makeToolbarButton(label, title, handler) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.title = title;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      handler();
    });
    return btn;
  }

  function showToolbar(el) {
    hideToolbar();
    toolbarEl = document.createElement("div");
    toolbarEl.className = "edit-toolbar";

    var isImg = el.tagName === "IMG";
    var isFlowImg = isImg && !el.classList.contains("abs");
    var isCustomText = el.classList.contains("edit-custom-text");
    var isCountdown = el.classList.contains("s2-countdown-numbers");
    // El link del mapa es un <a> que envuelve la imagen + el texto de
    // ayuda, no una imagen suelta, pero también tiene que poder cambiar
    // de tamaño como bloque (la imagen adentro es width:100%, así que
    // sigue el ancho del contenedor sin deformarse).
    var isMapBlock = el.classList.contains("s2-map-link");
    var textResizable = isTextResizable(el);
    // El contador (días/horas/min/seg) no es un texto suelto sino un
    // contenedor con varios números adentro, pero también tiene que poder
    // agrandarse/achicarse como un bloque.
    var fontResizable = textResizable || isCountdown;

    if (fontResizable) {
      toolbarEl.appendChild(makeToolbarButton("A−", "Achicar texto", function () { bumpFontSize(el, -4); }));
      toolbarEl.appendChild(makeToolbarButton("A+", "Agrandar texto", function () { bumpFontSize(el, 4); }));
      toolbarEl.appendChild(makeToolbarButton("␣−", "Menos espaciado entre letras", function () { bumpLetterSpacing(el, -1); }));
      toolbarEl.appendChild(makeToolbarButton("␣+", "Más espaciado entre letras", function () { bumpLetterSpacing(el, 1); }));
    }

    if (isTextContentEditable(el)) {
      toolbarEl.appendChild(sep());
      toolbarEl.appendChild(makeToolbarButton("✎", "Editar texto (doble click también sirve)", function () { startTextEdit(el); }));
    }

    if (isCustomText) {
      toolbarEl.appendChild(sep());
      toolbarEl.appendChild(makeToolbarButton("Fuente", "Cambiar fuente", function () {
        var next = ((parseInt(el.dataset.fontIndex, 10) || 0) + 1) % TEXT_FONTS.length;
        applyFontToElement(el, next);
        updateOverride(el, { fontIndex: next });
      }));
      toolbarEl.appendChild(makeToolbarButton("Color", "Cambiar color", function () {
        var next = ((parseInt(el.dataset.colorIndex, 10) || 0) + 1) % TEXT_COLORS.length;
        applyColorToElement(el, next);
        updateOverride(el, { colorIndex: next });
      }));
    }

    if (isImg || isCustomText || textResizable || isCountdown || isMapBlock) {
      toolbarEl.appendChild(makeToolbarButton("↔−", "Achicar ancho de la caja", function () { bumpWidth(el, -20); }));
      toolbarEl.appendChild(makeToolbarButton("↔+", "Agrandar ancho de la caja", function () { bumpWidth(el, 20); }));
    }

    if (isImg || isCountdown) {
      // Alto independiente del ancho: en imágenes se recorta (no se
      // deforma) gracias a object-fit:cover; en la caja del contador solo
      // mueve el centro vertical de los números.
      toolbarEl.appendChild(makeToolbarButton("↕−", "Achicar alto", function () { bumpHeight(el, -20); }));
      toolbarEl.appendChild(makeToolbarButton("↕+", "Agrandar alto", function () { bumpHeight(el, 20); }));
    }

    if (isFlowImg) {
      toolbarEl.appendChild(sep());
      toolbarEl.appendChild(makeToolbarButton("↕−", "Menos espacio arriba", function () { bumpMarginTop(el, -10); }));
      toolbarEl.appendChild(makeToolbarButton("↕+", "Más espacio arriba", function () { bumpMarginTop(el, 10); }));
    }

    toolbarEl.appendChild(sep());
    toolbarEl.appendChild(makeToolbarButton("⤒", "Traer al frente", function () { bringToFront(el); }));
    toolbarEl.appendChild(makeToolbarButton("⤓", "Mandar al fondo", function () { sendToBack(el); }));

    toolbarEl.appendChild(sep());
    toolbarEl.appendChild(makeToolbarButton("↩", "Restaurar este elemento a como estaba", function () { resetElement(el); }));

    var isCustom = el.classList.contains("edit-custom");
    var delBtn = makeToolbarButton("🗑", isCustom ? "Eliminar imagen agregada" : "Ocultar elemento", function () {
      if (isCustom) removeCustomElement(el);
      else hideElement(el);
    });
    delBtn.classList.add("edit-danger");
    toolbarEl.appendChild(delBtn);

    document.body.appendChild(toolbarEl);
    positionToolbar(el);
  }

  function sep() {
    var s = document.createElement("span");
    s.className = "edit-toolbar-sep";
    return s;
  }

  function hideToolbar() {
    if (toolbarEl && toolbarEl.parentNode) toolbarEl.parentNode.removeChild(toolbarEl);
    toolbarEl = null;
  }

  function positionToolbar(el) {
    if (!toolbarEl) return;
    var rect = el.getBoundingClientRect();
    var toolbarHeight = toolbarEl.offsetHeight || 36;
    var maxTop = window.innerHeight - toolbarHeight - 4;
    var top = rect.top - toolbarHeight - 6;
    if (top < 4) top = rect.bottom + 8;
    // Si el elemento seleccionado es más grande que la pantalla (o quedó
    // scrolleado fuera de vista), la barra igual tiene que quedar siempre
    // alcanzable: la sujetamos dentro del alto visible.
    top = Math.max(4, Math.min(top, maxTop));
    var left = Math.max(4, Math.min(rect.left, window.innerWidth - 240));
    toolbarEl.style.top = top + "px";
    toolbarEl.style.left = left + "px";
  }

  // ---------- Acciones de la toolbar ----------

  function bumpFontSize(el, delta) {
    var current = parseFloat(window.getComputedStyle(el).fontSize) || 16;
    var next = Math.max(8, Math.min(220, current + delta));
    el.style.fontSize = next + "px";
    updateOverride(el, { fontSize: next });
    positionToolbar(el);
  }

  function bumpLetterSpacing(el, delta) {
    var current = parseFloat(window.getComputedStyle(el).letterSpacing) || 0;
    var next = current + delta;
    el.style.letterSpacing = next + "px";
    updateOverride(el, { letterSpacing: next });
  }

  function bumpWidth(el, delta) {
    var current = el.getBoundingClientRect().width / getFrameScale(el);
    // Tope para que no se pueda agrandar tanto que la barra de controles
    // termine quedando inalcanzable o el elemento tape media pantalla.
    var next = Math.max(20, Math.min(1800, current + delta));
    el.style.width = next + "px";
    updateOverride(el, { width: next });
    positionToolbar(el);
  }

  function bumpHeight(el, delta) {
    var current = el.getBoundingClientRect().height / getFrameScale(el);
    var next = Math.max(20, Math.min(1800, current + delta));
    el.style.height = next + "px";
    updateOverride(el, { height: next });
    positionToolbar(el);
  }

  // Orden de capas: mira el z-index de todos los elementos editables
  // visibles ahora mismo y ubica a "el" un paso por encima del que más
  // adelante está (o por debajo del que más atrás está). Así "traer al
  // frente"/"mandar al fondo" siempre gana, sin importar cuántas veces
  // se haya usado antes en otros elementos ni si la página se recargó.
  function siblingZIndexes(el) {
    var zs = [];
    document.querySelectorAll(".edit-target").forEach(function (other) {
      if (other === el) return;
      var z = parseFloat(window.getComputedStyle(other).zIndex);
      zs.push(isNaN(z) ? 0 : z);
    });
    return zs;
  }

  function bringToFront(el) {
    var zs = siblingZIndexes(el);
    var next = (zs.length ? Math.max.apply(null, zs) : 0) + 1;
    el.style.zIndex = next;
    updateOverride(el, { zIndex: next });
  }

  function sendToBack(el) {
    var zs = siblingZIndexes(el);
    var next = (zs.length ? Math.min.apply(null, zs) : 0) - 1;
    el.style.zIndex = next;
    updateOverride(el, { zIndex: next });
  }

  function bumpMarginTop(el, delta) {
    var current = parseFloat(window.getComputedStyle(el).marginTop) || 0;
    var next = Math.max(-2000, current + delta);
    el.style.marginTop = next + "px";
    updateOverride(el, { marginTop: next });
    positionToolbar(el);
  }

  function hideElement(el) {
    el.style.display = "none";
    updateOverride(el, { hidden: true });
    deselect();
  }

  function resetElement(el) {
    var id = stableId(el);
    delete activeOverrides().items[id];
    saveOverrides();
    window.location.reload();
  }

  function startTextEdit(el) {
    el.setAttribute("contenteditable", "true");
    el.classList.add("edit-text-active");
    el.focus();

    function onBlur() {
      el.removeAttribute("contenteditable");
      el.classList.remove("edit-text-active");
      updateOverride(el, { html: el.innerHTML });
      el.removeEventListener("blur", onBlur);
    }
    el.addEventListener("blur", onBlur);
  }

  // ---------- Líneas guía (para centrar/alinear al arrastrar) ----------

  var GUIDE_TOLERANCE = 6; // px de pantalla
  var guideVEl = null;
  var guideHEl = null;

  function ensureGuideEls() {
    if (!guideVEl) {
      guideVEl = document.createElement("div");
      guideVEl.className = "edit-guide edit-guide-v";
      document.body.appendChild(guideVEl);
    }
    if (!guideHEl) {
      guideHEl = document.createElement("div");
      guideHEl.className = "edit-guide edit-guide-h";
      document.body.appendChild(guideHEl);
    }
  }

  function hideGuides() {
    if (guideVEl) guideVEl.style.display = "none";
    if (guideHEl) guideHEl.style.display = "none";
  }

  // Junta, una sola vez al empezar a arrastrar, las cajas (en px de
  // pantalla) contra las que se puede alinear: el centro del contenedor
  // (tarjeta o sobre) y el resto de los elementos editables visibles de
  // esa misma pantalla.
  function getGuideTargets(el) {
    var frame = el.closest(".frame");
    var container = el.offsetParent || frame || el.parentElement;
    var others = [];
    if (frame) {
      frame.querySelectorAll(".edit-target").forEach(function (other) {
        if (other === el) return;
        if (window.getComputedStyle(other).display === "none") return;
        others.push(other.getBoundingClientRect());
      });
    }
    return { containerRect: container.getBoundingClientRect(), others: others };
  }

  // Compara la caja actual del elemento arrastrado contra los objetivos y
  // devuelve, si hay alguno a menos de GUIDE_TOLERANCE px, el mejor match
  // por eje (para centrar, o alinear bordes con otro elemento).
  function findGuideMatches(rect, targets) {
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var vMatch = null;
    var hMatch = null;

    function considerV(dragX, refX) {
      var diff = refX - dragX;
      if (Math.abs(diff) <= GUIDE_TOLERANCE && (!vMatch || Math.abs(diff) < Math.abs(vMatch.diff))) {
        vMatch = { screenX: refX, diff: diff };
      }
    }
    function considerH(dragY, refY) {
      var diff = refY - dragY;
      if (Math.abs(diff) <= GUIDE_TOLERANCE && (!hMatch || Math.abs(diff) < Math.abs(hMatch.diff))) {
        hMatch = { screenY: refY, diff: diff };
      }
    }

    // La guía más importante: el centro del contenedor (tarjeta/sobre).
    considerV(centerX, targets.containerRect.left + targets.containerRect.width / 2);

    targets.others.forEach(function (o) {
      considerV(rect.left, o.left);
      considerV(centerX, o.left + o.width / 2);
      considerV(rect.right, o.left + o.width);
      considerH(rect.top, o.top);
      considerH(centerY, o.top + o.height / 2);
      considerH(rect.bottom, o.top + o.height);
    });

    return { vMatch: vMatch, hMatch: hMatch };
  }

  // ---------- Selección + arrastre ----------

  function onPointerDown(e) {
    if (!state.active) return;
    var el = e.currentTarget;
    if (el.isContentEditable) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);

    var startX = e.clientX;
    var startY = e.clientY;
    var scale = getFrameScale(el);
    var startLeft = parseFloat(window.getComputedStyle(el).left) || 0;
    var startTop = parseFloat(window.getComputedStyle(el).top) || 0;
    var moved = false;
    var pointerId = e.pointerId;
    var guideTargets = getGuideTargets(el);

    try { el.setPointerCapture(pointerId); } catch (err) { /* no-op */ }

    function onMove(ev) {
      var dx = (ev.clientX - startX) / scale;
      var dy = (ev.clientY - startY) / scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
      if (!moved) return;
      el.style.left = (startLeft + dx) + "px";
      el.style.top = (startTop + dy) + "px";

      var matches = findGuideMatches(el.getBoundingClientRect(), guideTargets);
      ensureGuideEls();
      if (matches.vMatch) {
        el.style.left = (parseFloat(el.style.left) + matches.vMatch.diff / scale) + "px";
        guideVEl.style.left = matches.vMatch.screenX + "px";
        guideVEl.style.display = "block";
      } else {
        guideVEl.style.display = "none";
      }
      if (matches.hMatch) {
        el.style.top = (parseFloat(el.style.top) + matches.hMatch.diff / scale) + "px";
        guideHEl.style.top = matches.hMatch.screenY + "px";
        guideHEl.style.display = "block";
      } else {
        guideHEl.style.display = "none";
      }

      positionToolbar(el);
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      try { el.releasePointerCapture(pointerId); } catch (err) { /* no-op */ }
      hideGuides();
      if (moved) {
        updateOverride(el, {
          left: parseFloat(el.style.left),
          top: parseFloat(el.style.top)
        });
      }
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function onDblClick(e) {
    if (!state.active) return;
    var el = e.currentTarget;
    if (!isTextContentEditable(el)) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);
    startTextEdit(el);
  }

  function attachHandlers(el) {
    el.classList.add("edit-target");
    // Los elementos "en flujo" (sin .abs, como el pie de página o el
    // fondo de fecha/hora) no tienen position:absolute, así que left/top
    // no les hace nada: arrastrarlos se veía como si no funcionara. Con
    // position:relative sí se pueden correr visualmente y a la vez siguen
    // ocupando su lugar en el flujo (o sea, la tarjeta se sigue estirando
    // por ellos igual que antes).
    if (!el.classList.contains("abs") && !el.style.position) {
      el.style.position = "relative";
    }
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("dblclick", onDblClick);
    // Evita que el botón de RSVP o el link del mapa te saquen de la
    // página al seleccionarlos en modo edición (el preventDefault del
    // pointerdown no alcanza para frenar la navegación del link: el click
    // es un evento aparte).
    if (el.tagName === "A") {
      el.addEventListener("click", function (e) {
        if (state.active) e.preventDefault();
      });
    }
  }

  function collectEditableElements() {
    var selector = EDITABLE_CLASSES.map(function (c) { return "." + c; }).join(",");
    var found = document.querySelectorAll(selector);
    found.forEach(function (el) {
      if (!el.classList.contains("edit-target")) attachHandlers(el);
    });
  }

  // ---------- Elementos agregados a mano (imágenes y texto) ----------

  function currentScreen() {
    var envelopeVisible = document.getElementById("screen-envelope").classList.contains("active");
    return envelopeVisible ? "envelope" : "invitation";
  }

  function getContainerForScreen(screen) {
    return screen === "envelope"
      ? document.getElementById("envelope-frame")
      : document.querySelector("#invitation-frame .s2-card");
  }

  // Ubica los elementos nuevos justo debajo de lo que ya hay, así aparecen
  // en el espacio en blanco (el que se gana con "Más espacio abajo") en vez
  // de tapar algo que ya está puesto.
  function defaultNewElementPosition(screen) {
    var container = getContainerForScreen(screen);
    if (!container) return { left: 100, top: 100 };
    if (screen === "envelope") {
      var frameHeight = parseFloat(container.closest(".frame-scaler").dataset.frameHeight) || 2000;
      return { left: 300, top: frameHeight - 350 };
    }
    var scale = getFrameScale(container);
    var height = container.getBoundingClientRect().height / scale;

    // Si se estiró la tarjeta con "Más espacio abajo", ese espacio en
    // blanco es lo último que se sumó al alto de la tarjeta. Ubicar el
    // elemento nuevo en la mitad de esa zona (no pegado al final de todo)
    // deja margen de sobra arriba y abajo para poder centrarlo en pantalla.
    var spacer = document.getElementById("s2-edit-spacer");
    var spacerHeight = spacer ? (parseFloat(spacer.style.height) || 0) : 0;
    var top = spacerHeight > 80 ? height - spacerHeight / 2 : height + 40;
    return { left: 100, top: top };
  }

  function insertCustomElement(data, skipSave) {
    var el = data.type === "text" ? insertCustomText(data) : insertCustomImage(data);
    if (el && !skipSave) {
      activeOverrides().customElements.push(data);
      saveOverrides();
    }
    return el;
  }

  function insertCustomImage(data) {
    var container = getContainerForScreen(data.screen);
    if (!container) return null;

    var img = document.createElement("img");
    // Las fotos subidas desde el dispositivo quedan como data URL (no hay
    // forma de escribir un archivo nuevo en /images sin que yo lo suba al
    // código); las de la galería son un archivo real de esa carpeta.
    img.src = data.src.indexOf("data:") === 0 ? data.src : imagePath(data.src);
    img.alt = "";
    img.className = "abs edit-custom";
    img.dataset.editCustomId = data.id;
    img.style.left = data.left + "px";
    img.style.top = data.top + "px";
    img.style.width = data.width + "px";
    if (data.hidden) img.style.display = "none";

    container.appendChild(img);
    attachHandlers(img);
    return img;
  }

  function insertCustomText(data) {
    var container = getContainerForScreen(data.screen);
    if (!container) return null;

    var p = document.createElement("p");
    p.className = "abs edit-custom edit-custom-text";
    p.dataset.editCustomId = data.id;
    p.innerHTML = data.html;
    p.style.left = data.left + "px";
    p.style.top = data.top + "px";
    p.style.width = data.width + "px";
    p.style.fontSize = data.fontSize + "px";
    p.style.margin = "0";
    applyFontToElement(p, data.fontIndex || 0);
    applyColorToElement(p, data.colorIndex || 0);
    if (data.hidden) p.style.display = "none";

    container.appendChild(p);
    attachHandlers(p);
    return p;
  }

  function applyFontToElement(el, idx) {
    var f = TEXT_FONTS[idx % TEXT_FONTS.length];
    el.style.fontFamily = f.family;
    el.style.fontWeight = f.weight;
    el.style.fontStyle = f.style;
    el.dataset.fontIndex = idx % TEXT_FONTS.length;
  }

  function applyColorToElement(el, idx) {
    var c = TEXT_COLORS[idx % TEXT_COLORS.length];
    el.style.color = c.value;
    el.dataset.colorIndex = idx % TEXT_COLORS.length;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function removeCustomElement(el) {
    var id = el.dataset.editCustomId;
    activeOverrides().customElements = activeOverrides().customElements.filter(function (item) {
      return item.id !== id;
    });
    delete activeOverrides().items[id];
    saveOverrides();
    el.remove();
    deselect();
  }

  function addImageFromPicker(filename) {
    customCounter += 1;
    var screen = currentScreen();
    var pos = defaultNewElementPosition(screen);
    var data = {
      type: "image",
      id: "custom-" + Date.now() + "-" + customCounter,
      src: filename,
      screen: screen,
      left: pos.left,
      top: pos.top,
      width: 200
    };
    var img = insertCustomElement(data);
    if (img) revealNewElement(img);
  }

  function addCustomText(text, fontIndex, colorIndex) {
    customCounter += 1;
    var screen = currentScreen();
    var pos = defaultNewElementPosition(screen);
    var data = {
      type: "text",
      id: "custom-" + Date.now() + "-" + customCounter,
      html: escapeHtml(text).replace(/\n/g, "<br>"),
      screen: screen,
      left: pos.left,
      top: pos.top,
      width: 500,
      fontSize: 32,
      fontIndex: fontIndex,
      colorIndex: colorIndex
    };
    var el = insertCustomElement(data);
    if (el) revealNewElement(el);
  }

  // Los elementos nuevos se ubican debajo de todo lo que ya hay (para no
  // taparlo), y como la tarjeta es larga eso suele quedar fuera de la
  // pantalla sin hacer scroll. Sin este auto-scroll parece que "no se
  // agregó nada".
  function revealNewElement(el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    selectElement(el);
    el.classList.add("edit-just-added");
    window.setTimeout(function () {
      el.classList.remove("edit-just-added");
    }, 1600);
  }

  // ---------- Panel de control / export / import ----------

  function buildFab() {
    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "edit-fab";
    fab.title = "Modo edición";
    fab.textContent = "✎";
    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleEditMode();
    });
    document.body.appendChild(fab);
    return fab;
  }

  function buildPanel() {
    var panel = document.createElement("div");
    panel.className = "edit-panel";
    panel.style.display = "none";

    panel.appendChild(makePanelButton(
      isMobilePreviewOn() ? "🖥 Ver como desktop" : "📱 Ver como mobile",
      toggleMobilePreview
    ));
    panel.appendChild(makePanelButton("＋ Agregar imagen", openImagePicker));
    panel.appendChild(makePanelButton("＋ Agregar texto", openTextAdder));
    panel.appendChild(makePanelButton("↕＋ Más espacio abajo", function () { bumpFrameHeight(FRAME_HEIGHT_STEP); }));
    panel.appendChild(makePanelButton("↕－ Menos espacio abajo", function () { bumpFrameHeight(-FRAME_HEIGHT_STEP); }));
    panel.appendChild(makePanelButton("👁 Ver ocultos", openHiddenList));
    panel.appendChild(makePanelButton("⭳ Exportar cambios", openExportModal));
    panel.appendChild(makePanelButton("⭱ Importar cambios", openImportModal));
    panel.appendChild(makePanelButton("⟲ Reiniciar todo", resetAll));

    document.body.appendChild(panel);
    return panel;
  }

  function makePanelButton(label, handler) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      handler();
    });
    return btn;
  }

  function toggleEditMode() {
    state.active = !state.active;
    document.body.classList.toggle("edit-mode-active", state.active);
    fabEl.classList.toggle("is-active", state.active);
    panelEl.style.display = state.active ? "flex" : "none";
    if (!state.active) deselect();
    try {
      if (state.active) window.sessionStorage.setItem(EDIT_MODE_ACTIVE_KEY, "1");
      else window.sessionStorage.removeItem(EDIT_MODE_ACTIVE_KEY);
    } catch (e) { /* no-op */ }
  }

  // Simula un ancho de celular para poder editar la versión mobile desde
  // la compu, sin depender de tocar con el dedo en un teléfono real. Se
  // guarda en sessionStorage y se recarga la página para que main.js
  // vuelva a calcular todo con el ancho simulado desde el principio (ver
  // el bootstrap al comienzo de este archivo).
  function toggleMobilePreview() {
    try {
      if (isMobilePreviewOn()) {
        window.sessionStorage.removeItem(MOBILE_PREVIEW_KEY);
      } else {
        window.sessionStorage.setItem(MOBILE_PREVIEW_KEY, "1");
      }
      // Seguir en modo edición después de recargar, para no perder el hilo.
      window.sessionStorage.setItem(EDIT_MODE_ACTIVE_KEY, "1");
    } catch (e) { /* no-op */ }
    window.location.reload();
  }

  function resetAll() {
    if (!window.confirm("¿Borrar todos los cambios guardados en este navegador?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  // ---------- Modal genérico ----------

  function openModal(titleText, buildBody) {
    var overlay = document.createElement("div");
    overlay.className = "edit-overlay";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });

    var modal = document.createElement("div");
    modal.className = "edit-modal";
    var h3 = document.createElement("h3");
    h3.textContent = titleText;
    modal.appendChild(h3);
    buildBody(modal, function () { overlay.remove(); });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    return overlay;
  }

  function openImagePicker() {
    openModal("Agregar imagen desde /images", function (modal, close) {
      var grid = document.createElement("div");
      grid.className = "edit-picker-grid";
      AVAILABLE_IMAGES.forEach(function (filename) {
        var btn = document.createElement("button");
        btn.type = "button";
        var img = document.createElement("img");
        img.src = imagePath(filename);
        img.alt = filename;
        var span = document.createElement("span");
        span.textContent = filename;
        btn.appendChild(img);
        btn.appendChild(span);
        btn.addEventListener("click", function () {
          addImageFromPicker(filename);
          close();
        });
        grid.appendChild(btn);
      });
      modal.appendChild(grid);
    });
  }

  function openTextAdder() {
    openModal("Agregar texto", function (modal, close) {
      var textInput = document.createElement("textarea");
      textInput.placeholder = "Escribí el texto acá...";
      textInput.style.height = "80px";
      modal.appendChild(textInput);

      var fontLabel = document.createElement("label");
      fontLabel.textContent = "Fuente:";
      fontLabel.style.display = "block";
      fontLabel.style.margin = "10px 0 4px";
      fontLabel.style.fontSize = "13px";
      modal.appendChild(fontLabel);

      var fontSelect = document.createElement("select");
      fontSelect.style.width = "100%";
      fontSelect.style.marginBottom = "8px";
      TEXT_FONTS.forEach(function (f, i) {
        var opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = f.label;
        fontSelect.appendChild(opt);
      });
      modal.appendChild(fontSelect);

      var colorLabel = document.createElement("label");
      colorLabel.textContent = "Color:";
      colorLabel.style.display = "block";
      colorLabel.style.margin = "4px 0 4px";
      colorLabel.style.fontSize = "13px";
      modal.appendChild(colorLabel);

      var colorSelect = document.createElement("select");
      colorSelect.style.width = "100%";
      TEXT_COLORS.forEach(function (c, i) {
        var opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = c.label;
        colorSelect.appendChild(opt);
      });
      modal.appendChild(colorSelect);

      var actions = document.createElement("div");
      actions.className = "edit-modal-actions";
      actions.style.marginTop = "12px";
      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.textContent = "Agregar";
      addBtn.addEventListener("click", function () {
        var text = textInput.value.trim();
        if (!text) { close(); return; }
        addCustomText(text, parseInt(fontSelect.value, 10), parseInt(colorSelect.value, 10));
        close();
      });
      actions.appendChild(addBtn);
      modal.appendChild(actions);
    });
  }

  function openHiddenList() {
    openModal("Elementos ocultos", function (modal) {
      var hiddenIds = Object.keys(activeOverrides().items).filter(function (id) {
        return activeOverrides().items[id].hidden;
      });
      if (hiddenIds.length === 0) {
        var p = document.createElement("p");
        p.textContent = "No hay elementos ocultos.";
        modal.appendChild(p);
        return;
      }
      var list = document.createElement("div");
      list.className = "edit-hidden-list";
      hiddenIds.forEach(function (id) {
        var row = document.createElement("div");
        row.className = "edit-hidden-row";
        var label = document.createElement("span");
        label.textContent = id.replace(/^cls:/, "").replace(/^id:/, "");
        var showBtn = document.createElement("button");
        showBtn.type = "button";
        showBtn.textContent = "Mostrar";
        showBtn.addEventListener("click", function () {
          var el = findByStableId(id);
          if (el) el.style.display = "";
          delete activeOverrides().items[id].hidden;
          saveOverrides();
          row.remove();
        });
        row.appendChild(label);
        row.appendChild(showBtn);
        list.appendChild(row);
      });
      modal.appendChild(list);
    });
  }

  function openExportModal() {
    openModal("Exportar cambios", function (modal) {
      var json = JSON.stringify(overrides, null, 2);
      var textarea = document.createElement("textarea");
      textarea.readOnly = true;
      textarea.value = json;
      modal.appendChild(textarea);

      var actions = document.createElement("div");
      actions.className = "edit-modal-actions";

      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.textContent = "Copiar";
      copyBtn.addEventListener("click", function () {
        textarea.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(json).catch(function () {
            document.execCommand("copy");
          });
        } else {
          document.execCommand("copy");
        }
        copyBtn.textContent = "¡Copiado!";
        window.setTimeout(function () { copyBtn.textContent = "Copiar"; }, 1500);
      });

      var downloadBtn = document.createElement("button");
      downloadBtn.type = "button";
      downloadBtn.textContent = "Descargar .json";
      downloadBtn.addEventListener("click", function () {
        var blob = new Blob([json], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "xv-matilda-cambios.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(downloadBtn);
      modal.appendChild(actions);
    });
  }

  function openImportModal() {
    openModal("Importar cambios", function (modal, close) {
      var textarea = document.createElement("textarea");
      textarea.placeholder = "Pegá acá el JSON exportado...";
      modal.appendChild(textarea);

      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "application/json";
      fileInput.style.marginBottom = "10px";
      fileInput.addEventListener("change", function () {
        var file = fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { textarea.value = String(reader.result); };
        reader.readAsText(file);
      });
      modal.insertBefore(fileInput, textarea);

      var actions = document.createElement("div");
      actions.className = "edit-modal-actions";
      var applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.textContent = "Aplicar";
      applyBtn.addEventListener("click", function () {
        try {
          var parsed = JSON.parse(textarea.value);
          if (parsed.desktop || parsed.mobile) {
            overrides = {
              desktop: normalizeDeviceOverrides(parsed.desktop),
              mobile: normalizeDeviceOverrides(parsed.mobile)
            };
          } else {
            // JSON viejo (de antes de separar desktop/mobile): se aplica
            // tal cual a desktop, mobile queda como estaba.
            overrides.desktop = normalizeDeviceOverrides(parsed);
          }
          saveOverrides();
          close();
          window.location.reload();
        } catch (e) {
          window.alert("El JSON no es válido.");
        }
      });
      actions.appendChild(applyBtn);
      modal.appendChild(actions);
    });
  }

  // ---------- Init ----------

  var fabEl = null;
  var panelEl = null;

  function onGlobalClick(e) {
    if (!state.active) return;
    if (e.target.closest(".edit-target, .edit-toolbar, .edit-fab, .edit-panel, .edit-overlay")) return;
    deselect();
  }

  function init() {
    applyFrameHeightOverrides();
    applyStoredOverrides();
    collectEditableElements();
    fabEl = buildFab();
    panelEl = buildPanel();
    document.addEventListener("click", onGlobalClick);
    window.addEventListener("scroll", function () {
      if (state.selected) positionToolbar(state.selected);
    }, true);
    window.addEventListener("resize", function () {
      if (state.selected) positionToolbar(state.selected);
    });

    // Cuando se abre el sobre aparecen recién ahí los elementos de la
    // pantalla 2: hay que engancharlos también.
    var invitationScreen = document.getElementById("screen-invitation");
    if (invitationScreen) {
      var observer = new MutationObserver(collectEditableElements);
      observer.observe(invitationScreen, { attributes: true, attributeFilter: ["class"] });
    }

    // Si el modo edición estaba prendido antes de recargar (por ejemplo,
    // al tocar "Ver como mobile"), seguir donde se dejó.
    try {
      if (window.sessionStorage.getItem(EDIT_MODE_ACTIVE_KEY) === "1") toggleEditMode();
    } catch (e) { /* no-op */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.isXvEditModeActive = function () {
    return state.active;
  };
})();
