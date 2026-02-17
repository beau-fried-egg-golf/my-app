import type { HoleAnnotation, AnnotationPin, PinPhoto } from './types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateAnnotationHTML(
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

    const photoGridHtml = photos.length > 0
      ? `<div class="ha-photo-grid">${photos.map(p =>
          `<figure class="ha-photo-figure">
            <img src="${escapeHtml(p.photo_url)}" alt="${escapeHtml(p.caption)}" loading="lazy" />
            ${p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : ''}
          </figure>`
        ).join('')}</div>`
      : '';

    const bodyHtml = pin.body_text
      ? pin.body_text.split('\n').filter(l => l.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('')
      : '';

    return `
    <section class="ha-section" data-pin-index="${index}">
      <div class="ha-section-number">${index + 1}</div>
      <h3 class="ha-section-headline">${escapeHtml(pin.headline)}</h3>
      ${bodyHtml}
      ${photoGridHtml}
    </section>`;
  }).join('');

  return `<div class="hole-annotation-embed">
<style>
.hole-annotation-embed {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
  max-width: 900px;
  margin: 0 auto;
}
.ha-container {
  position: relative;
}
.ha-sticky-wrapper {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
}
.ha-aerial-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
}
.ha-aerial-img {
  width: 100%;
  height: auto;
  display: block;
}
.ha-pin {
  position: absolute;
  transform: translate(-50%, -50%);
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
  transform: translate(-50%, -50%) scale(0.3);
  transition: opacity 0.4s ease, transform 0.4s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  pointer-events: none;
}
.ha-pin.ha-pin-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.ha-pin.ha-pin-past {
  opacity: 0.4;
}
.ha-content {
  position: relative;
  z-index: 1;
  padding-top: 32px;
}
.ha-section {
  padding: 40px 0;
  border-bottom: 1px solid #eee;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.ha-section.ha-section-visible {
  opacity: 1;
  transform: translateY(0);
}
.ha-section:last-child {
  border-bottom: none;
}
.ha-section-number {
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
  margin-bottom: 12px;
}
.ha-section-headline {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}
.ha-section p {
  font-size: 15px;
  color: #333;
  margin-bottom: 12px;
}
.ha-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.ha-photo-figure {
  margin: 0;
}
.ha-photo-figure img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}
.ha-photo-figure figcaption {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
@media (max-width: 600px) {
  .ha-sticky-wrapper {
    position: relative;
  }
  .ha-section {
    padding: 24px 0;
  }
  .ha-section-headline {
    font-size: 18px;
  }
  .ha-photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<div class="ha-container">
  <div class="ha-sticky-wrapper">
    <div class="ha-aerial-container">
      <img class="ha-aerial-img" src="${escapeHtml(annotation.aerial_image_url ?? '')}" alt="${escapeHtml(annotation.title)}" />
      ${pinMarkersHtml}
    </div>
  </div>
  <div class="ha-content">
    ${contentSectionsHtml}
  </div>
</div>
<script>
(function() {
  var embed = document.currentScript.closest('.hole-annotation-embed');
  if (!embed) return;
  var sections = embed.querySelectorAll('.ha-section');
  var pins = embed.querySelectorAll('.ha-pin');
  var activeIndex = -1;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var idx = parseInt(entry.target.getAttribute('data-pin-index'), 10);
      if (entry.isIntersecting) {
        // Show section
        entry.target.classList.add('ha-section-visible');
        // Show corresponding pin
        if (pins[idx]) {
          pins[idx].classList.add('ha-pin-visible');
          pins[idx].classList.remove('ha-pin-past');
        }
        // Mark previous pins as past
        for (var i = 0; i < idx; i++) {
          if (pins[i]) {
            pins[i].classList.add('ha-pin-visible');
            pins[i].classList.add('ha-pin-past');
          }
        }
        activeIndex = Math.max(activeIndex, idx);
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(function(section) {
    observer.observe(section);
  });
})();
</script>
</div>`;
}
