import type { HoleAnnotation, AnnotationPin, PinPhoto } from './types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBodyHtml(bodyText: string): string {
  if (/<[a-z][\s\S]*>/i.test(bodyText)) return bodyText;
  return bodyText.split('\n').filter(l => l.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

// ---------------------------------------------------------------------------
// Shared overlay card CSS + JS (used by both scroll and interactive exports)
// ---------------------------------------------------------------------------

const OVERLAY_CARD_CSS = `
@font-face {
  font-family: 'Grey LL';
  src: local('Grey LL');
}

:root {
  --card-max-width: 520px;
  --card-radius: 6px;
  --card-bg: #ffffff;
  --card-shadow: 0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12);
  --card-font: 'Grey LL', 'Georgia', serif;
  --card-color-text: #1a1a1a;
  --card-color-link: #1a1a1a;
  --card-color-link-hover: #3a6a3a;
  --card-thumb-size: 64px;
  --card-hero-aspect: 16 / 10;
}

.overlay-card {
  max-width: var(--card-max-width);
  width: 100%;
  background: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.card-gallery {
  position: relative;
  width: 100%;
  background: #e8e5df;
}

.card-hero {
  width: 100%;
  aspect-ratio: var(--card-hero-aspect);
  object-fit: cover;
  display: block;
  transition: opacity 0.3s ease;
}

.card-thumbnails {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
}

.card-thumb {
  width: var(--card-thumb-size);
  height: var(--card-thumb-size);
  object-fit: cover;
  border-radius: 4px;
  border: 2px solid rgba(255,255,255,0.5);
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.card-thumb:hover {
  opacity: 1;
  border-color: rgba(255,255,255,0.9);
  transform: scale(1.03);
}

.card-thumb.active {
  opacity: 1;
  border-color: #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.15);
}

.card-content {
  padding: 22px 24px 4px 24px;
}

.overlay-card:not(:has(.card-gallery)) .card-content {
  padding-top: 28px;
}

.card-title {
  font-family: var(--card-font);
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--card-color-text);
  line-height: 1.25;
  margin-bottom: 14px;
  letter-spacing: -0.01em;
}

.card-body {
  font-family: var(--card-font);
  font-size: 0.97rem;
  font-weight: 400;
  color: var(--card-color-text);
  line-height: 1.65;
}

.card-body a {
  color: var(--card-color-link);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: color 0.2s ease;
}
.card-body a:hover { color: var(--card-color-link-hover); }
.card-body p + p { margin-top: 0.75em; }
.card-body strong { font-weight: 600; }
.card-body em { font-style: italic; }
.card-body ul, .card-body ol { margin: 0.5em 0 0.5em 1.2em; }
.card-body li { margin-bottom: 0.25em; }

.card-footer {
  padding: 10px 24px 24px 24px;
}

.card-link {
  font-family: var(--card-font);
  font-size: 0.88rem;
  font-weight: 400;
  color: var(--card-color-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: color 0.2s ease;
}
.card-link:hover { color: var(--card-color-link-hover); }

@media (max-width: 480px) {
  .overlay-card { border-radius: 4px; }
  .card-title { font-size: 1.3rem; }
  .card-body { font-size: 0.9rem; }
  .card-content { padding: 18px 18px 4px 18px; }
  .card-footer { padding: 8px 18px 20px 18px; }
  .card-thumbnails { bottom: 8px; right: 8px; gap: 4px; }
  .card-thumb { width: 52px; height: 52px; }
}
`;

const SWAP_HERO_JS = `
function swapHero(heroId, thumbEl) {
  var hero = document.getElementById(heroId);
  if (!hero) return;
  var fullSrc = thumbEl.getAttribute('data-full');
  hero.style.opacity = '0';
  setTimeout(function() {
    hero.src = fullSrc;
    hero.onload = function() { hero.style.opacity = '1'; };
  }, 200);
  var siblings = thumbEl.parentElement.querySelectorAll('.card-thumb');
  siblings.forEach(function(t) { t.classList.remove('active'); });
  thumbEl.classList.add('active');
}
`;

// ---------------------------------------------------------------------------
// Build a single overlay card HTML from pin data
// ---------------------------------------------------------------------------

function buildOverlayCard(
  pin: AnnotationPin,
  photos: PinPhoto[],
  heroId: string,
): string {
  let galleryHtml = '';

  if (photos.length > 0) {
    const heroPhoto = photos[0];
    let thumbsHtml = '';

    if (photos.length > 1) {
      thumbsHtml = `<div class="card-thumbnails">${photos.map((p, i) =>
        `<img class="card-thumb${i === 0 ? ' active' : ''}"
          src="${escapeHtml(p.photo_url)}"
          data-full="${escapeHtml(p.photo_url)}"
          alt="${escapeHtml(p.caption || `View ${i + 1}`)}" loading="lazy"
          onclick="swapHero('${heroId}', this)" />`
      ).join('')}</div>`;
    }

    galleryHtml = `
    <div class="card-gallery">
      <img class="card-hero" id="${heroId}"
        src="${escapeHtml(heroPhoto.photo_url)}"
        alt="${escapeHtml(heroPhoto.caption || pin.headline)}" loading="lazy" />
      ${thumbsHtml}
    </div>`;
  }

  const footerHtml = pin.link_url
    ? `<div class="card-footer"><a class="card-link" href="${escapeHtml(pin.link_url)}" target="_blank" rel="noopener">Find out more</a></div>`
    : '';

  return `
  <div class="overlay-card">
    ${galleryHtml}
    <div class="card-content">
      <h2 class="card-title">${escapeHtml(pin.headline)}</h2>
      <div class="card-body">${renderBodyHtml(pin.body_text)}</div>
    </div>
    ${footerHtml}
  </div>`;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function generateAnnotationHTML(
  annotation: HoleAnnotation,
  pins: AnnotationPin[],
  pinPhotos: PinPhoto[],
): string {
  if (annotation.annotation_type === 'interactive') {
    return generateInteractiveHTML(annotation, pins, pinPhotos);
  }
  return generateScrollHTML(annotation, pins, pinPhotos);
}

// =============================================================================
// SCROLL TYPE — pins + overlay cards on top of sticky aerial image
// =============================================================================

function generateScrollHTML(
  annotation: HoleAnnotation,
  pins: AnnotationPin[],
  pinPhotos: PinPhoto[],
): string {
  const sortedPins = [...pins].sort((a, b) => a.sort_order - b.sort_order);

  const pinMarkersHtml = sortedPins.map((pin, index) => `
    <div class="ha-pin" data-pin-index="${index}" style="left:${pin.position_x}%;top:${pin.position_y}%">
      ${index + 1}
    </div>`
  ).join('');

  const contentSectionsHtml = sortedPins.map((pin, index) => {
    const photos = pinPhotos
      .filter(p => p.pin_id === pin.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const cardHtml = buildOverlayCard(pin, photos, `ha-scroll-hero-${index}`);

    return `
    <div class="ha-scroll-section" data-pin-index="${index}">
      ${cardHtml}
    </div>`;
  }).join('');

  return `<div class="hole-annotation-embed ha-scroll-embed">
<style>
${OVERLAY_CARD_CSS}

.ha-scroll-embed {
  max-width: 900px;
  margin: 0 auto;
}
.ha-scroll-wrap {
  position: relative;
}
.ha-scroll-aerial {
  position: sticky;
  top: 0;
  z-index: 1;
  border-radius: 8px;
  overflow: hidden;
}
.ha-scroll-aerial-inner {
  position: relative;
  width: 100%;
}
.ha-scroll-aerial img.ha-aerial-img {
  width: 100%;
  height: auto;
  display: block;
}
.ha-pin {
  position: absolute;
  transform: translate(-50%, -50%) scale(0.3);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(26, 26, 26, 0.85);
  color: #fff;
  font-family: var(--card-font);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.4s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  pointer-events: none;
  z-index: 3;
}
.ha-pin.ha-pin-active {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.15);
  background: rgba(26, 26, 26, 0.95);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.6), 0 3px 12px rgba(0,0,0,0.35);
}
.ha-pin.ha-pin-visited {
  opacity: 0.5;
  transform: translate(-50%, -50%) scale(1);
}
.ha-scroll-content {
  position: relative;
  z-index: 2;
  pointer-events: none;
}
.ha-scroll-section {
  min-height: 60vh;
  display: flex;
  align-items: flex-end;
  padding: 24px;
  pointer-events: none;
}
.ha-scroll-section:first-child {
  padding-top: 40vh;
}
.ha-scroll-section:last-child {
  padding-bottom: 20vh;
}
.ha-scroll-section .overlay-card {
  pointer-events: auto;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.ha-scroll-section.ha-section-visible .overlay-card {
  opacity: 1;
  transform: translateY(0);
}
@media (max-width: 600px) {
  .ha-scroll-aerial { position: relative; }
  .ha-scroll-section { min-height: auto; padding: 16px; }
  .ha-scroll-section:first-child { padding-top: 16px; }
  .ha-scroll-section .overlay-card { max-width: 100%; }
}
</style>
<div class="ha-scroll-wrap">
  <div class="ha-scroll-aerial">
    <div class="ha-scroll-aerial-inner">
      <img class="ha-aerial-img" src="${escapeHtml(annotation.aerial_image_url ?? '')}" alt="${escapeHtml(annotation.title)}" />
      ${pinMarkersHtml}
    </div>
  </div>
  <div class="ha-scroll-content">
    ${contentSectionsHtml}
  </div>
</div>
<script>
${SWAP_HERO_JS}
(function() {
  var embed = document.currentScript.closest('.ha-scroll-embed');
  if (!embed) return;
  var sections = embed.querySelectorAll('.ha-scroll-section');
  var pins = embed.querySelectorAll('.ha-pin');

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var idx = parseInt(entry.target.getAttribute('data-pin-index'), 10);
      if (entry.isIntersecting) {
        entry.target.classList.add('ha-section-visible');
        for (var i = 0; i < pins.length; i++) {
          pins[i].classList.remove('ha-pin-active');
          if (i < idx) {
            pins[i].classList.add('ha-pin-visited');
          } else if (i === idx) {
            pins[i].classList.add('ha-pin-active');
            pins[i].classList.remove('ha-pin-visited');
          }
        }
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(function(s) { observer.observe(s); });
})();
</script>
</div>`;
}

// =============================================================================
// INTERACTIVE TYPE — all pins visible, click to reveal overlay card
// =============================================================================

function generateInteractiveHTML(
  annotation: HoleAnnotation,
  pins: AnnotationPin[],
  pinPhotos: PinPhoto[],
): string {
  const sortedPins = [...pins].sort((a, b) => a.sort_order - b.sort_order);

  const pinMarkersHtml = sortedPins.map((pin, index) => `
    <button class="ha-ipin" data-pin-index="${index}" style="left:${pin.position_x}%;top:${pin.position_y}%">
      ${index + 1}
    </button>`
  ).join('');

  const pinPanelsHtml = sortedPins.map((pin, index) => {
    const photos = pinPhotos
      .filter(p => p.pin_id === pin.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const cardHtml = buildOverlayCard(pin, photos, `ha-int-hero-${index}`);

    return `
    <div class="ha-ipanel" data-panel-index="${index}">
      <button class="ha-ipanel-close">&times;</button>
      ${cardHtml}
    </div>`;
  }).join('');

  return `<div class="hole-annotation-embed ha-interactive-embed">
<style>
${OVERLAY_CARD_CSS}

.ha-interactive-embed {
  max-width: 900px;
  margin: 0 auto;
}
.ha-interactive-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}
.ha-interactive-container img.ha-aerial-img {
  width: 100%;
  height: auto;
  display: block;
}
.ha-ipin {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(26, 26, 26, 0.85);
  color: #fff;
  font-family: var(--card-font);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.7);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  z-index: 3;
}
.ha-ipin:hover {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  background: rgba(26, 26, 26, 0.95);
}
.ha-ipin.ha-ipin-active {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 0 0 4px rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.4);
  background: #1a1a1a;
  z-index: 5;
}
.ha-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 4;
}
.ha-overlay.ha-overlay-visible {
  opacity: 1;
  pointer-events: auto;
}
.ha-ipanel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  max-height: 85%;
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: 6;
}
.ha-ipanel.ha-ipanel-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  pointer-events: auto;
}
.ha-ipanel .overlay-card {
  position: relative;
}
.ha-ipanel-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: rgba(255,255,255,0.85);
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #555;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 7;
  transition: color 0.15s, background 0.15s;
}
.ha-ipanel-close:hover { color: #1a1a1a; background: #fff; }
@media (max-width: 600px) {
  .ha-ipanel { max-height: 90%; }
  .ha-ipanel .overlay-card { max-width: none; }
}
</style>
<div class="ha-interactive-container">
  <img class="ha-aerial-img" src="${escapeHtml(annotation.aerial_image_url ?? '')}" alt="${escapeHtml(annotation.title)}" />
  ${pinMarkersHtml}
  <div class="ha-overlay"></div>
  ${pinPanelsHtml}
</div>
<script>
${SWAP_HERO_JS}
(function() {
  var embed = document.currentScript.closest('.ha-interactive-embed');
  if (!embed) return;
  var pins = embed.querySelectorAll('.ha-ipin');
  var panels = embed.querySelectorAll('.ha-ipanel');
  var overlay = embed.querySelector('.ha-overlay');
  var activeIdx = -1;

  function openPanel(idx) {
    closePanel();
    activeIdx = idx;
    overlay.classList.add('ha-overlay-visible');
    pins[idx].classList.add('ha-ipin-active');
    panels[idx].classList.add('ha-ipanel-visible');
  }

  function closePanel() {
    if (activeIdx >= 0) {
      pins[activeIdx].classList.remove('ha-ipin-active');
      panels[activeIdx].classList.remove('ha-ipanel-visible');
    }
    overlay.classList.remove('ha-overlay-visible');
    activeIdx = -1;
  }

  pins.forEach(function(pin, i) {
    pin.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activeIdx === i) { closePanel(); return; }
      openPanel(i);
    });
  });

  embed.querySelectorAll('.ha-ipanel-close').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      closePanel();
    });
  });

  overlay.addEventListener('click', function() { closePanel(); });
})();
</script>
</div>`;
}
