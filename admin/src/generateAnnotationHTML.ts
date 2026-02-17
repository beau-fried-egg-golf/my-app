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
  // If it already contains HTML tags (from rich text editor), use as-is
  if (/<[a-z][\s\S]*>/i.test(bodyText)) {
    return bodyText;
  }
  // Otherwise convert plain text paragraphs
  return bodyText.split('\n').filter(l => l.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

function buildPhotoGrid(photos: PinPhoto[]): string {
  if (photos.length === 0) return '';
  return `<div class="ha-photo-grid">${photos.map(p =>
    `<figure class="ha-photo-figure">
      <img src="${escapeHtml(p.photo_url)}" alt="${escapeHtml(p.caption)}" loading="lazy" />
      ${p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : ''}
    </figure>`
  ).join('')}</div>`;
}

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
// SCROLL TYPE — pins + content overlay on top of sticky aerial image
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

    return `
    <div class="ha-scroll-section" data-pin-index="${index}">
      <div class="ha-scroll-card">
        <div class="ha-scroll-card-number">${index + 1}</div>
        <h3 class="ha-scroll-card-headline">${escapeHtml(pin.headline)}</h3>
        <div class="ha-scroll-card-body">${renderBodyHtml(pin.body_text)}</div>
        ${buildPhotoGrid(photos)}
      </div>
    </div>`;
  }).join('');

  return `<div class="hole-annotation-embed ha-scroll-embed">
<style>
.ha-scroll-embed {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
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
.ha-scroll-aerial img {
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
.ha-scroll-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 10px;
  padding: 24px;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  pointer-events: auto;
}
.ha-scroll-section.ha-section-visible .ha-scroll-card {
  opacity: 1;
  transform: translateY(0);
}
.ha-scroll-card-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
}
.ha-scroll-card-headline {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.ha-scroll-card-body p {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}
.ha-scroll-card-body a {
  color: #1a1a1a;
  text-decoration: underline;
}
.ha-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.ha-photo-figure {
  margin: 0;
}
.ha-photo-figure img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}
.ha-photo-figure figcaption {
  font-size: 11px;
  color: #888;
  margin-top: 3px;
}
@media (max-width: 600px) {
  .ha-scroll-aerial { position: relative; }
  .ha-scroll-section { min-height: auto; padding: 16px; }
  .ha-scroll-section:first-child { padding-top: 16px; }
  .ha-scroll-card { max-width: 100%; }
  .ha-photo-grid { grid-template-columns: 1fr 1fr; }
}
</style>
<div class="ha-scroll-wrap">
  <div class="ha-scroll-aerial">
    <div class="ha-scroll-aerial-inner">
      <img src="${escapeHtml(annotation.aerial_image_url ?? '')}" alt="${escapeHtml(annotation.title)}" />
      ${pinMarkersHtml}
    </div>
  </div>
  <div class="ha-scroll-content">
    ${contentSectionsHtml}
  </div>
</div>
<script>
(function() {
  var embed = document.currentScript.closest('.ha-scroll-embed');
  if (!embed) return;
  var sections = embed.querySelectorAll('.ha-scroll-section');
  var pins = embed.querySelectorAll('.ha-pin');
  var currentActive = -1;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var idx = parseInt(entry.target.getAttribute('data-pin-index'), 10);
      if (entry.isIntersecting) {
        entry.target.classList.add('ha-section-visible');
        // Update pin states
        for (var i = 0; i < pins.length; i++) {
          pins[i].classList.remove('ha-pin-active');
          if (i < idx) {
            pins[i].classList.add('ha-pin-visited');
          } else if (i === idx) {
            pins[i].classList.add('ha-pin-active');
            pins[i].classList.remove('ha-pin-visited');
          }
        }
        currentActive = idx;
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(function(s) { observer.observe(s); });
})();
</script>
</div>`;
}

// =============================================================================
// INTERACTIVE TYPE — all pins visible, click to reveal overlay content
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

    return `
    <div class="ha-ipanel" data-panel-index="${index}">
      <button class="ha-ipanel-close">&times;</button>
      <div class="ha-ipanel-number">${index + 1}</div>
      <h3 class="ha-ipanel-headline">${escapeHtml(pin.headline)}</h3>
      <div class="ha-ipanel-body">${renderBodyHtml(pin.body_text)}</div>
      ${buildPhotoGrid(photos)}
    </div>`;
  }).join('');

  return `<div class="hole-annotation-embed ha-interactive-embed">
<style>
.ha-interactive-embed {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
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
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 28px;
  max-width: 440px;
  width: 85%;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
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
.ha-ipanel-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
  line-height: 1;
  padding: 4px;
}
.ha-ipanel-close:hover { color: #1a1a1a; }
.ha-ipanel-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
}
.ha-ipanel-headline {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
}
.ha-ipanel-body p {
  font-size: 15px;
  color: #333;
  margin-bottom: 10px;
}
.ha-ipanel-body a {
  color: #1a1a1a;
  text-decoration: underline;
}
.ha-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.ha-photo-figure { margin: 0; }
.ha-photo-figure img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}
.ha-photo-figure figcaption {
  font-size: 11px;
  color: #888;
  margin-top: 3px;
}
@media (max-width: 600px) {
  .ha-ipanel { width: 92%; max-width: none; padding: 20px; }
  .ha-photo-grid { grid-template-columns: 1fr 1fr; }
}
</style>
<div class="ha-interactive-container">
  <img class="ha-aerial-img" src="${escapeHtml(annotation.aerial_image_url ?? '')}" alt="${escapeHtml(annotation.title)}" />
  ${pinMarkersHtml}
  <div class="ha-overlay"></div>
  ${pinPanelsHtml}
</div>
<script>
(function() {
  var embed = document.currentScript.closest('.ha-interactive-embed');
  if (!embed) return;
  var container = embed.querySelector('.ha-interactive-container');
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
