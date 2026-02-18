// FEGC Events Embed — Script Tag Loader
// Usage: <script src="https://[domain]/embed/embed.js" data-event="event-slug"></script>
(function () {
  var script = document.currentScript;
  if (!script) return;

  var eventSlug = script.getAttribute('data-event');
  if (!eventSlug) {
    console.error('[FEGC Events] Missing data-event attribute');
    return;
  }

  var baseUrl = script.src.replace(/\/embed\.js$/, '');
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/' + eventSlug;
  iframe.style.width = '100%';
  iframe.style.minHeight = '800px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('scrolling', 'no');

  // Auto-resize iframe based on content height
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'fegc-events-resize' && e.data.height) {
      iframe.style.height = e.data.height + 'px';
    }
  });

  script.parentNode.insertBefore(iframe, script.nextSibling);
})();
