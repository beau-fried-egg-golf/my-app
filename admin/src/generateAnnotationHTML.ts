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
  src: url('/fonts/GreyLLTT-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Grey LL';
  src: url('/fonts/GreyLLTT-Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Grey LL';
  src: url('/fonts/GreyLLTT-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --card-max-width: 520px;
  --card-radius: 6px;
  --card-bg: #ffffff;
  --card-shadow: 0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12);
  --card-font: 'Grey LL', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
  cursor: pointer;
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

const LIGHTBOX_CSS = `
.ha-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(10, 10, 10, 0.96);
  display: none;
  flex-direction: column;
  font-family: var(--card-font);
}
.ha-lightbox.ha-lightbox-open {
  display: flex;
}
.ha-lightbox-topbar {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  z-index: 2;
}
.ha-lightbox-btn {
  background: none;
  border: none;
  color: #fff;
  font-family: var(--card-font);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.85;
  transition: opacity 0.2s;
  padding: 8px 4px;
}
.ha-lightbox-btn:hover { opacity: 1; }
.ha-lightbox-counter {
  color: #fff;
  font-family: var(--card-font);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  opacity: 0.85;
}
.ha-lightbox-img-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 72px 80px 60px;
  position: relative;
}
.ha-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}
.ha-lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2;
}
.ha-lightbox-nav:hover { background: rgba(255,255,255,0.28); }
.ha-lightbox-prev { left: 24px; }
.ha-lightbox-next { right: 24px; }
.ha-lightbox-caption {
  text-align: center;
  padding: 0 24px 24px;
  color: #fff;
  font-family: var(--card-font);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.8;
}
@media (max-width: 600px) {
  .ha-lightbox-img-wrap { padding: 64px 16px 48px; }
  .ha-lightbox-prev { left: 8px; }
  .ha-lightbox-next { right: 8px; }
  .ha-lightbox-nav { width: 36px; height: 36px; font-size: 18px; border-radius: 8px; }
  .ha-lightbox-topbar { padding: 16px 16px; }
}
`;

const LIGHTBOX_HTML = `
<div class="ha-lightbox">
  <div class="ha-lightbox-topbar">
    <button class="ha-lightbox-btn ha-lb-close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      BACK
    </button>
    <span class="ha-lightbox-counter">01 / 01</span>
    <span></span>
  </div>
  <div class="ha-lightbox-img-wrap">
    <button class="ha-lightbox-nav ha-lightbox-prev">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <img class="ha-lightbox-img" src="" alt="" />
    <button class="ha-lightbox-nav ha-lightbox-next">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>
    </button>
  </div>
  <div class="ha-lightbox-caption"></div>
</div>
`;

const LIGHTBOX_JS = `
if (!window._haLightboxInit) {
  window._haLightboxInit = true;

  window.haLightboxOpen = function(galleryEl) {
    var embed = galleryEl.closest('.hole-annotation-embed');
    var lb = embed && embed.querySelector('.ha-lightbox');
    if (!lb) return;
    var photos = JSON.parse(galleryEl.getAttribute('data-photos') || '[]');
    if (!photos.length) return;
    var idx = parseInt(galleryEl.getAttribute('data-active-index') || '0', 10);
    lb._photos = photos;
    lb._idx = idx;
    lb.classList.add('ha-lightbox-open');
    document.body.style.overflow = 'hidden';
    haLbRender(lb);
  };

  window.haLbRender = function(lb) {
    var photo = lb._photos[lb._idx];
    lb.querySelector('.ha-lightbox-img').src = photo.url;
    lb.querySelector('.ha-lightbox-counter').textContent =
      String(lb._idx + 1).padStart(2, '0') + ' / ' + String(lb._photos.length).padStart(2, '0');
    var cap = lb.querySelector('.ha-lightbox-caption');
    cap.textContent = photo.caption || '';
    cap.style.display = photo.caption ? '' : 'none';
    var showNav = lb._photos.length > 1;
    lb.querySelector('.ha-lightbox-prev').style.display = showNav ? '' : 'none';
    lb.querySelector('.ha-lightbox-next').style.display = showNav ? '' : 'none';
  };

  window.haLbClose = function(lb) {
    lb.classList.remove('ha-lightbox-open');
    document.body.style.overflow = '';
  };

  window.haLbNav = function(lb, dir) {
    if (!lb._photos || lb._photos.length <= 1) return;
    lb._idx = (lb._idx + dir + lb._photos.length) % lb._photos.length;
    haLbRender(lb);
  };

  window.haLbShare = function(lb) {
    var photo = lb._photos[lb._idx];
    if (navigator.share) {
      navigator.share({ url: photo.url }).catch(function() {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(photo.url).then(function() { alert('Image URL copied!'); });
    }
  };

  document.addEventListener('keydown', function(e) {
    var lb = document.querySelector('.ha-lightbox.ha-lightbox-open');
    if (!lb) return;
    if (e.key === 'Escape') haLbClose(lb);
    if (e.key === 'ArrowLeft') haLbNav(lb, -1);
    if (e.key === 'ArrowRight') haLbNav(lb, 1);
  });
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
  var gallery = thumbEl.closest('.card-gallery');
  if (gallery) gallery.setAttribute('data-active-index', thumbEl.getAttribute('data-index') || '0');
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
    const photosJson = escapeHtml(JSON.stringify(photos.map(p => ({ url: p.photo_url, caption: p.caption }))));
    let thumbsHtml = '';

    if (photos.length > 1) {
      thumbsHtml = `<div class="card-thumbnails">${photos.map((p, i) =>
        `<img class="card-thumb${i === 0 ? ' active' : ''}"
          src="${escapeHtml(p.photo_url)}"
          data-full="${escapeHtml(p.photo_url)}"
          data-index="${i}"
          alt="${escapeHtml(p.caption || `View ${i + 1}`)}" loading="lazy"
          onclick="swapHero('${heroId}', this)" />`
      ).join('')}</div>`;
    }

    galleryHtml = `
    <div class="card-gallery" data-photos="${photosJson}" data-active-index="0">
      <img class="card-hero" id="${heroId}"
        src="${escapeHtml(heroPhoto.photo_url)}"
        alt="${escapeHtml(heroPhoto.caption || pin.headline)}" loading="lazy"
        onclick="haLightboxOpen(this.closest('.card-gallery'))" />
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
// Compact horizontal card for interactive annotations
// ---------------------------------------------------------------------------

function buildCompactCard(
  pin: AnnotationPin,
): string {
  const pills: string[] = [];
  if (pin.par) pills.push(`<span class="ha-compact-pill">${escapeHtml(pin.par)}</span>`);
  if (pin.yardage) pills.push(`<span class="ha-compact-pill">${escapeHtml(pin.yardage)}</span>`);
  if (pin.handicap) pills.push(`<span class="ha-compact-pill">${escapeHtml(pin.handicap)}</span>`);
  const pillsHtml = pills.length > 0 ? `<div class="ha-compact-pills">${pills.join('')}</div>` : '';

  const bodyText = pin.body_text.replace(/<[^>]*>/g, '').trim();
  const bodyHtml = bodyText ? `<div class="ha-compact-body"><p>${escapeHtml(bodyText)}</p></div>` : '';

  const linkHtml = pin.link_url
    ? `<div class="ha-compact-footer"><a class="ha-compact-link" href="${escapeHtml(pin.link_url)}" target="_blank" rel="noopener">Find out more</a></div>`
    : '';

  return `
  <div class="ha-compact-card">
    <div class="ha-compact-content">
      <h3 class="ha-compact-title">${escapeHtml(pin.headline)}</h3>
      ${pillsHtml}
      ${bodyHtml}
      ${linkHtml}
    </div>
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

function getDirectionStyles(dir: string) {
  switch (dir) {
    case 'top':
      return { alignItems: 'flex-start', justifyContent: 'center', edgePadding: 'padding-top: 5vh', hiddenTransform: 'translateY(-30px)' };
    case 'left':
      return { alignItems: 'center', justifyContent: 'flex-start', edgePadding: 'padding-left: 5vw', hiddenTransform: 'translateX(-30px)' };
    case 'right':
      return { alignItems: 'center', justifyContent: 'flex-end', edgePadding: 'padding-right: 5vw', hiddenTransform: 'translateX(30px)' };
    default: // bottom
      return { alignItems: 'flex-end', justifyContent: 'center', edgePadding: 'padding-bottom: 5vh', hiddenTransform: 'translateY(30px)' };
  }
}

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

  // Spacer sections just create scroll distance — cards are rendered separately as fixed overlays
  const spacerSectionsHtml = sortedPins.map((_, index) => `
    <div class="ha-scroll-section" data-pin-index="${index}"></div>`
  ).join('');

  const fixedCardsHtml = sortedPins.map((pin, index) => {
    const photos = pinPhotos
      .filter(p => p.pin_id === pin.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const cardHtml = buildOverlayCard(pin, photos, `ha-scroll-hero-${index}`);

    return `
    <div class="ha-scroll-card" data-direction="${pin.scroll_direction || 'bottom'}" data-card-index="${index}">
      ${cardHtml}
    </div>`;
  }).join('');

  const embedId = `ha-scroll-${annotation.id.slice(0, 8)}`;

  return `<div id="${embedId}" class="hole-annotation-embed ha-scroll-embed">
<style>
${OVERLAY_CARD_CSS}
${LIGHTBOX_CSS}

.ha-scroll-embed {
  max-width: 900px;
  margin: 0 auto;
  font-family: var(--card-font);
}
.ha-scroll-embed * { box-sizing: border-box; }
.ha-scroll-embed h2, .ha-scroll-embed h3 { margin: 0; padding: 0; font-family: var(--card-font); }
.ha-scroll-embed p { margin: 0; padding: 0; font-family: var(--card-font); }
.ha-scroll-embed a { font-family: var(--card-font); }
.ha-scroll-embed img { max-width: 100%; }
.ha-scroll-embed button { font-family: var(--card-font); padding: 0; }
.ha-scroll-wrap {
  position: relative;
}
.ha-scroll-aerial {
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}
.ha-scroll-aerial-inner {
  position: relative;
  max-width: 100%;
}
.ha-scroll-aerial img.ha-aerial-img {
  display: block;
  max-width: 100%;
  max-height: 100vh;
  width: auto;
  height: auto;
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
  height: 150vh;
  pointer-events: none;
}
.ha-scroll-section:first-child {
  margin-top: 40vh;
}
.ha-scroll-section:last-child {
  margin-bottom: 40vh;
}
.ha-scroll-card {
  position: fixed;
  z-index: 100;
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
  max-width: var(--card-max-width);
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.ha-scroll-card[data-direction="bottom"] { transform: translateY(100vh); }
.ha-scroll-card[data-direction="top"]    { transform: translateY(-100vh); }
.ha-scroll-card[data-direction="left"]   { transform: translateX(-100vw); }
.ha-scroll-card[data-direction="right"]  { transform: translateX(100vw); }
.ha-scroll-card.ha-card-visible {
  opacity: 1;
  transform: translate(0, 0);
  pointer-events: auto;
}
@media (max-width: 600px) {
  .ha-scroll-aerial { position: relative; height: auto; }
  .ha-scroll-section { height: auto; margin: 0; }
  .ha-scroll-card { position: relative; max-width: 100%; opacity: 1 !important; transform: none !important; padding: 16px; }
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
    ${spacerSectionsHtml}
  </div>
  ${fixedCardsHtml}
</div>
${LIGHTBOX_HTML}
<script>
${SWAP_HERO_JS}
${LIGHTBOX_JS}
(function() {
  var embed = document.getElementById('${embedId}');
  if (!embed) return;
  var sections = embed.querySelectorAll('.ha-scroll-section');
  var cards = embed.querySelectorAll('.ha-scroll-card');
  var pins = embed.querySelectorAll('.ha-pin');
  var visibleCard = -1;
  var pendingCard = -1;
  var showTimer = null;

  function requestShow(idx) {
    if (idx >= 0 && (idx === visibleCard || idx === pendingCard)) return;
    if (idx === -1 && visibleCard === -1 && pendingCard === -1) return;
    if (showTimer) { clearTimeout(showTimer); showTimer = null; pendingCard = -1; }

    // Hide current card
    if (visibleCard >= 0) {
      cards[visibleCard].classList.remove('ha-card-visible');
    }
    var hadVisible = visibleCard >= 0;
    visibleCard = -1;

    if (idx >= 0) {
      pendingCard = idx;
      showTimer = setTimeout(function() {
        cards[idx].classList.add('ha-card-visible');
        visibleCard = idx;
        pendingCard = -1;
        showTimer = null;
      }, hadVisible ? 800 : 0);
    }
  }

  function update() {
    var vh = window.innerHeight;
    var ew = embed.offsetWidth;
    var eleft = embed.getBoundingClientRect().left;
    var pad = 24;

    // Position all cards at their home spots and find the best one to show
    var bestIdx = -1;
    for (var i = 0; i < sections.length; i++) {
      var rect = sections[i].getBoundingClientRect();
      var card = cards[i];
      var dir = card.getAttribute('data-direction') || 'bottom';
      var cardW = card.offsetWidth || 400;
      var cardH = card.offsetHeight || 300;

      switch (dir) {
        case 'bottom':
          card.style.left = (eleft + (ew - cardW) / 2) + 'px';
          card.style.top = (vh - cardH - pad) + 'px';
          break;
        case 'top':
          card.style.left = (eleft + (ew - cardW) / 2) + 'px';
          card.style.top = pad + 'px';
          break;
        case 'left':
          card.style.left = (eleft + pad) + 'px';
          card.style.top = ((vh - cardH) / 2) + 'px';
          break;
        case 'right':
          card.style.left = (eleft + ew - cardW - pad) + 'px';
          card.style.top = ((vh - cardH) / 2) + 'px';
          break;
      }

      var progress = (vh - rect.top) / (vh + rect.height);
      progress = Math.max(0, Math.min(1, progress));

      if (progress > 0.3 && progress < 0.7) {
        bestIdx = i;
      }
    }

    requestShow(bestIdx);

    var activeIdx = visibleCard >= 0 ? visibleCard : pendingCard;

    // Update pin markers
    for (var j = 0; j < pins.length; j++) {
      pins[j].classList.remove('ha-pin-active', 'ha-pin-visited');
      if (j < activeIdx) pins[j].classList.add('ha-pin-visited');
      else if (j === activeIdx) pins[j].classList.add('ha-pin-active');
    }

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);

  // Lightbox close/nav buttons
  var lb = embed.querySelector('.ha-lightbox');
  if (lb) {
    lb.querySelector('.ha-lb-close').addEventListener('click', function() { haLbClose(lb); });
    lb.querySelector('.ha-lightbox-prev').addEventListener('click', function() { haLbNav(lb, -1); });
    lb.querySelector('.ha-lightbox-next').addEventListener('click', function() { haLbNav(lb, 1); });
  }
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
  const color = annotation.pin_color || 'black';

  const yellowBubble = `<svg class="ha-ipin-bubble" width="38" height="33" viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.67 0.673C24.811-1.561 34.895 1.948 37.194 8.512 39.316 14.569 34.066 21.11 25.275 23.84L20.565 32c-.77 1.334-2.695 1.334-3.465 0L12.963 24.834C6.89 23.935 1.986 20.935.47 16.605-1.829 10.041 4.529 2.908 14.67.673Z" fill="#FFEE54" stroke="#1B1A1A" stroke-width="1.5"/></svg>`;
  const blackBubble = `<svg class="ha-ipin-bubble" width="38" height="33" viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.67 0.673C24.811-1.561 34.895 1.948 37.194 8.512 39.316 14.569 34.066 21.11 25.275 23.84L20.565 32c-.77 1.334-2.695 1.334-3.465 0L12.963 24.834C6.89 23.935 1.986 20.935.47 16.605-1.829 10.041 4.529 2.908 14.67.673Z" fill="black" stroke="#F3F1E7" stroke-width="1.5"/></svg>`;

  const bubbleSvg = color === 'yellow' ? yellowBubble : blackBubble;
  const numColor = color === 'yellow' ? '#1B1A1A' : '#F3F1E7';

  const pinMarkersHtml = sortedPins.map((pin, index) => `
    <button class="ha-ipin" data-pin-index="${index}" style="left:${pin.position_x}%;top:${pin.position_y}%">
      ${bubbleSvg}
      <span class="ha-ipin-num" style="color:${numColor}">${index + 1}</span>
    </button>`
  ).join('');

  const pinPanelsHtml = sortedPins.map((pin, index) => {
    const cardHtml = buildCompactCard(pin);

    return `
    <div class="ha-ipanel" data-panel-index="${index}">
      ${cardHtml}
    </div>`;
  }).join('');

  const embedId = `ha-interactive-${annotation.id.slice(0, 8)}`;

  return `<div id="${embedId}" class="hole-annotation-embed ha-interactive-embed">
<style>
${OVERLAY_CARD_CSS}
${LIGHTBOX_CSS}

.ha-interactive-embed {
  max-width: 900px;
  margin: 0 auto;
  font-family: var(--card-font);
}
.ha-interactive-embed * { box-sizing: border-box; }
.ha-interactive-embed h2, .ha-interactive-embed h3 { margin: 0; padding: 0; font-family: var(--card-font); }
.ha-interactive-embed p { margin: 0; padding: 0; font-family: var(--card-font); }
.ha-interactive-embed a { font-family: var(--card-font); }
.ha-interactive-embed img { max-width: 100%; }
.ha-interactive-embed button { font-family: var(--card-font); padding: 0; }
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
  transform: translate(-50%, -100%);
  width: 29px;
  height: 25px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
  z-index: 3;
  display: block;
}
.ha-ipin-bubble {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
}
.ha-ipin-num {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--card-font);
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
}
.ha-ipin.ha-ipin-active {
  filter: drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.3));
  z-index: 5;
}
.ha-detail-area {
  overflow: hidden;
}
.ha-ipanel {
  display: none;
}
.ha-compact-card {
  background: #fff;
  font-family: var(--card-font);
  cursor: default;
}
.ha-compact-content {
  padding: 22px 24px;
}
.ha-compact-title {
  font-size: 1.35rem;
  font-weight: 400;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.ha-compact-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.ha-compact-pill {
  display: inline-block;
  padding: 4px 12px;
  background: #F3F1E7;
  border-radius: 20px;
  font-family: var(--card-font);
  font-size: 0.75rem;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ha-compact-body {
  font-size: 0.95rem;
  font-weight: 400;
  color: #1a1a1a;
  line-height: 1.65;
}
.ha-compact-body p { margin: 0; }
.ha-compact-body p + p { margin-top: 0.75em; }
.ha-compact-footer {
  padding: 0;
  margin-top: 14px;
}
.ha-compact-link {
  font-family: var(--card-font);
  font-size: 0.88rem;
  font-weight: 400;
  color: #1a1a1a;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  transition: color 0.2s;
}
.ha-compact-link:hover { color: #3a6a3a; }
@media (max-width: 600px) {
  .ha-compact-content { padding: 18px 18px; }
  .ha-compact-title { font-size: 1.15rem; }
  .ha-compact-body { font-size: 0.88rem; }
}
</style>
<div class="ha-interactive-container">
  <img class="ha-aerial-img" src="${escapeHtml(annotation.aerial_image_url ?? '')}" alt="${escapeHtml(annotation.title)}" />
  ${pinMarkersHtml}
</div>
<div class="ha-detail-area">
  ${pinPanelsHtml}
</div>
${LIGHTBOX_HTML}
<script>
${SWAP_HERO_JS}
${LIGHTBOX_JS}
(function() {
  var embed = document.getElementById('${embedId}');
  if (!embed) return;
  var pins = embed.querySelectorAll('.ha-ipin');
  var panels = embed.querySelectorAll('.ha-ipanel');
  var activeIdx = -1;

  function openPanel(idx) {
    closePanel();
    activeIdx = idx;
    pins[idx].classList.add('ha-ipin-active');
    panels[idx].style.display = 'block';
  }

  function closePanel() {
    if (activeIdx >= 0) {
      pins[activeIdx].classList.remove('ha-ipin-active');
      panels[activeIdx].style.display = 'none';
    }
    activeIdx = -1;
  }

  pins.forEach(function(pin, i) {
    pin.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activeIdx === i) { closePanel(); return; }
      openPanel(i);
    });
  });

  // Lightbox close/nav buttons
  var lb = embed.querySelector('.ha-lightbox');
  if (lb) {
    lb.querySelector('.ha-lb-close').addEventListener('click', function() { haLbClose(lb); });
    lb.querySelector('.ha-lightbox-prev').addEventListener('click', function() { haLbNav(lb, -1); });
    lb.querySelector('.ha-lightbox-next').addEventListener('click', function() { haLbNav(lb, 1); });
  }
})();
</script>
</div>`;
}
