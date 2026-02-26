const FUNCTIONS_URL = 'https://maylqohoflkarvgadttn.supabase.co/functions/v1';

export function generateEventEmbedHTML(slug: string): string {
  const uid = 'evt-' + slug.replace(/[^a-z0-9]/g, '').slice(0, 16);

  return `<div id="${uid}" class="fegc-evt-embed">
<style>
@font-face {
  font-family: 'Grey LL';
  src: url('/fonts/GreyLLTT-Regular.ttf') format('truetype');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Grey LL';
  src: url('/fonts/GreyLLTT-Medium.ttf') format('truetype');
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Grey LL';
  src: url('/fonts/GreyLLTT-Bold.ttf') format('truetype');
  font-weight: 700; font-style: normal; font-display: swap;
}

.fegc-evt-embed {
  --evt-font: 'Grey LL', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --evt-color: #1a1a1a;
  --evt-muted: #666;
  --evt-border: #e5e5e0;
  --evt-bg: #ffffff;
  --evt-bg-alt: #faf9f5;
  --evt-accent: #1a1a1a;
  --evt-accent-text: #ffffff;
  --evt-radius: 6px;
  max-width: 560px;
  margin: 0 auto;
  font-family: var(--evt-font);
  color: var(--evt-color);
  line-height: 1.5;
}
.fegc-evt-embed * { box-sizing: border-box; margin: 0; padding: 0; }

.evt-loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--evt-muted);
  font-size: 15px;
}
.evt-spinner {
  display: inline-block;
  width: 24px; height: 24px;
  border: 2.5px solid var(--evt-border);
  border-top-color: var(--evt-color);
  border-radius: 50%;
  animation: evt-spin 0.7s linear infinite;
  margin-bottom: 12px;
}
@keyframes evt-spin { to { transform: rotate(360deg); } }

.evt-error {
  text-align: center;
  padding: 48px 20px;
  color: #991b1b;
  font-size: 15px;
}

/* Header */
.evt-header {
  padding: 28px 0 20px;
  border-bottom: 1px solid var(--evt-border);
  margin-bottom: 24px;
}
.evt-header h1 {
  font-family: var(--evt-font);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}
.evt-meta {
  font-size: 14px;
  color: var(--evt-muted);
  margin-bottom: 4px;
}
.evt-spots {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  margin-top: 8px;
}
.evt-spots-ok { background: #dcfce7; color: #166534; }
.evt-spots-low { background: #fef3c7; color: #92400e; }
.evt-spots-none { background: #fee2e2; color: #991b1b; }

/* Section titles */
.evt-section-title {
  font-family: var(--evt-font);
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
  color: var(--evt-muted);
}

/* Ticket cards */
.evt-ticket {
  border: 2px solid var(--evt-border);
  border-radius: var(--evt-radius);
  padding: 16px 18px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.evt-ticket:hover { border-color: #ccc; }
.evt-ticket.evt-selected { border-color: var(--evt-accent); background: var(--evt-bg-alt); }
.evt-ticket.evt-sold-out {
  opacity: 0.5;
  cursor: default;
  background: #f9f9f9;
}
.evt-ticket-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 2px;
}
.evt-ticket-desc {
  font-size: 13px;
  color: var(--evt-muted);
}
.evt-ticket-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16px;
}
.evt-ticket-price {
  font-weight: 700;
  font-size: 16px;
}
.evt-ticket-avail {
  font-size: 12px;
  color: var(--evt-muted);
}
.evt-badge-sold-out {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #991b1b;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 3px;
}
.evt-badge-sale {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 3px;
  margin-top: 4px;
  display: inline-block;
}
.evt-badge-coming-soon { background: #e0e7ff; color: #3730a3; }
.evt-badge-sale-ended { background: #f3f4f6; color: #6b7280; }

/* Quantity stepper */
.evt-qty {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 12px;
  margin-bottom: 4px;
}
.evt-qty-inline {
  margin: 0;
  padding: 6px 18px 10px;
  background: var(--evt-bg-alt);
  border: 2px solid var(--evt-accent);
  border-top: none;
  border-radius: 0 0 var(--evt-radius) var(--evt-radius);
  margin-top: -10px;
  margin-bottom: 8px;
}
.evt-qty-label {
  font-size: 14px;
  font-weight: 500;
  margin-right: 12px;
}
.evt-qty-btn {
  width: 32px; height: 32px;
  border: 1px solid var(--evt-border);
  background: var(--evt-bg);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--evt-font);
  color: var(--evt-color);
  transition: background 0.15s;
}
.evt-qty-btn:first-of-type { border-radius: var(--evt-radius) 0 0 var(--evt-radius); }
.evt-qty-btn:last-of-type { border-radius: 0 var(--evt-radius) var(--evt-radius) 0; }
.evt-qty-btn:hover { background: var(--evt-bg-alt); }
.evt-qty-btn:disabled { opacity: 0.3; cursor: default; }
.evt-qty-val {
  width: 40px; height: 32px;
  border-top: 1px solid var(--evt-border);
  border-bottom: 1px solid var(--evt-border);
  border-left: none; border-right: none;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--evt-font);
  background: var(--evt-bg);
  color: var(--evt-color);
}

/* Access code */
.evt-ticket.evt-locked { opacity: 0.7; cursor: default; }
.evt-code-row {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  padding: 8px 18px 10px;
  background: var(--evt-bg-alt);
  border: 2px solid var(--evt-border);
  border-top: none;
  border-radius: 0 0 var(--evt-radius) var(--evt-radius);
  margin-bottom: 8px;
}
.evt-code-input {
  flex: 1; min-width: 120px;
  padding: 6px 10px;
  border: 1px solid var(--evt-border);
  border-radius: var(--evt-radius);
  font-family: var(--evt-font);
  font-size: 13px;
  outline: none;
  background: var(--evt-bg);
  color: var(--evt-color);
}
.evt-code-input:focus { border-color: var(--evt-accent); }
.evt-code-btn {
  padding: 6px 14px;
  background: var(--evt-accent);
  color: var(--evt-accent-text);
  border: none;
  border-radius: var(--evt-radius);
  font-family: var(--evt-font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.evt-code-btn:hover { opacity: 0.85; }
.evt-code-error { width: 100%; font-size: 12px; color: #dc2626; margin-top: 2px; }

/* Add-ons */
.evt-addons { margin-bottom: 24px; }
.evt-addon {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid var(--evt-border);
  border-radius: var(--evt-radius);
  margin-bottom: 6px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.evt-addon:hover { border-color: #ccc; }
.evt-addon.evt-addon-selected { border-color: var(--evt-accent); background: var(--evt-bg-alt); }
.evt-addon.evt-addon-sold-out { opacity: 0.5; cursor: default; }
.evt-addon input[type="checkbox"] {
  margin-top: 2px;
  width: 16px; height: 16px;
  flex-shrink: 0;
}
.evt-addon-info { flex: 1; }
.evt-addon-name { font-weight: 500; font-size: 14px; }
.evt-addon-desc { font-size: 13px; color: var(--evt-muted); }
.evt-addon-price { font-weight: 600; font-size: 14px; flex-shrink: 0; }
.evt-group-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  margin-top: 16px;
}
.evt-group-name:first-child { margin-top: 0; }

/* Form */
.evt-form { margin-bottom: 24px; }
.evt-row { display: flex; gap: 10px; }
.evt-input {
  display: block;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--evt-border);
  border-radius: var(--evt-radius);
  font-family: var(--evt-font);
  font-size: 14px;
  margin-bottom: 10px;
  outline: none;
  transition: border-color 0.15s;
  background: var(--evt-bg);
  color: var(--evt-color);
}
.evt-input:focus { border-color: var(--evt-accent); }
.evt-input::placeholder { color: #aaa; }
.evt-input.evt-input-error { border-color: #dc2626; }
select.evt-input { appearance: auto; }
textarea.evt-input { resize: vertical; min-height: 60px; }

/* Order summary */
.evt-summary {
  background: var(--evt-bg-alt);
  border: 1px solid var(--evt-border);
  border-radius: var(--evt-radius);
  padding: 16px 18px;
  margin-bottom: 20px;
}
.evt-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 4px 0;
}
.evt-total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  border-top: 1px solid var(--evt-border);
  padding-top: 10px;
  margin-top: 8px;
}

/* Buttons */
.evt-btn {
  display: block;
  width: 100%;
  padding: 14px 24px;
  background: var(--evt-accent);
  color: var(--evt-accent-text);
  border: none;
  border-radius: var(--evt-radius);
  font-family: var(--evt-font);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: opacity 0.15s;
}
.evt-btn:hover { opacity: 0.88; }
.evt-btn:disabled { opacity: 0.5; cursor: default; }
.evt-btn-back {
  background: none;
  border: none;
  font-family: var(--evt-font);
  font-size: 13px;
  color: var(--evt-muted);
  cursor: pointer;
  padding: 10px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.evt-btn-back:hover { color: var(--evt-color); }

/* Success */
.evt-success {
  text-align: center;
  padding: 48px 20px;
}
.evt-success-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #dcfce7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.evt-success h2 {
  font-family: var(--evt-font);
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.evt-success p {
  font-size: 15px;
  color: var(--evt-muted);
}

/* Closed / cancelled */
.evt-closed {
  text-align: center;
  padding: 48px 20px;
  color: var(--evt-muted);
  font-size: 15px;
}

@media (max-width: 480px) {
  .fegc-evt-embed { padding: 0 4px; }
  .evt-header h1 { font-size: 1.3rem; }
  .evt-row { flex-direction: column; gap: 0; }
  .evt-ticket { padding: 12px 14px; }
}
</style>

<div class="evt-loading">
  <div class="evt-spinner"></div>
  <div>Loading event...</div>
</div>

<script>
(function() {
  var ROOT = document.getElementById('${uid}');
  if (!ROOT) return;

  var API = '${FUNCTIONS_URL}';
  var SLUG = '${slug}';
  var state = { step: 'loading', event: null, tickets: [], addOns: [], addOnGroups: [], formFields: [], selectedTicket: null, selectedAddOns: [], addOnQtys: {}, formData: {}, quantity: 1, unlockedTickets: {}, ticketCodes: {}, codeErrors: {} };

  // Check for Stripe redirect
  var params = new URLSearchParams(window.location.search);
  var bookingStatus = params.get('fegc_booking');
  if (bookingStatus === 'success') {
    state.step = 'success';
    render();
    // Clean URL
    var cleanUrl = window.location.href.split('?')[0];
    var remaining = [];
    params.forEach(function(v, k) { if (k !== 'fegc_booking') remaining.push(k + '=' + encodeURIComponent(v)); });
    history.replaceState(null, '', cleanUrl + (remaining.length ? '?' + remaining.join('&') : ''));
  } else if (bookingStatus === 'cancelled') {
    // Remove param and load normally
    var cleanUrl2 = window.location.href.split('?')[0];
    var remaining2 = [];
    params.forEach(function(v, k) { if (k !== 'fegc_booking') remaining2.push(k + '=' + encodeURIComponent(v)); });
    history.replaceState(null, '', cleanUrl2 + (remaining2.length ? '?' + remaining2.join('&') : ''));
    loadEvent();
  } else {
    loadEvent();
  }

  function loadEvent() {
    fetch(API + '/get-event?slug=' + encodeURIComponent(SLUG))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { state.step = 'error'; state.errorMsg = data.error; render(); return; }
        state.event = data.event;
        state.tickets = data.ticket_types || [];
        state.addOns = data.add_ons || [];
        state.addOnGroups = data.add_on_groups || [];
        state.formFields = data.form_fields || [];

        if (state.event.status === 'cancelled') { state.step = 'cancelled'; }
        else if (state.event.status === 'closed') { state.step = 'closed'; }
        else if (state.event.spots_remaining <= 0 && !state.event.waitlist_enabled) { state.step = 'sold_out'; }
        else {
          // Check registration window
          var now = new Date();
          if (state.event.registration_opens_at && new Date(state.event.registration_opens_at) > now) { state.step = 'not_open'; }
          else if (state.event.registration_closes_at && new Date(state.event.registration_closes_at) < now) { state.step = 'closed'; }
          else { state.step = 'tickets'; }
        }
        render();
      })
      .catch(function() { state.step = 'error'; state.errorMsg = 'Failed to load event.'; render(); });
  }

  function unlockTicket(tid) {
    var code = (state.ticketCodes[tid] || '').trim();
    if (!code) return;
    // Unlock locally — server validates on submit
    state.unlockedTickets[tid] = code;
    delete state.codeErrors[tid];
    render();
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function fmtPrice(cents) { return cents === 0 ? 'Free' : '$' + (cents / 100).toFixed(2); }

  function fmtDate(dateStr, timeStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var s = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (timeStr) {
      var parts = timeStr.split(':');
      var h = parseInt(parts[0]); var m = parts[1];
      var ampm = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12; if (h === 0) h = 12;
      s += ' at ' + h + ':' + m + ' ' + ampm;
    }
    return s;
  }

  function renderHeader() {
    var e = state.event;
    var spots = e.spots_remaining;
    var spotsClass = spots > 10 ? 'evt-spots-ok' : spots > 0 ? 'evt-spots-low' : 'evt-spots-none';
    var spotsText = spots > 0 ? spots + ' spot' + (spots !== 1 ? 's' : '') + ' remaining' : 'Sold out';
    return '<div class="evt-header">' +
      '<h1>' + esc(e.name) + '</h1>' +
      '<div class="evt-meta">' + esc(fmtDate(e.date, e.time)) + '</div>' +
      (e.location ? '<div class="evt-meta">' + esc(e.location) + '</div>' : '') +
      '<span class="evt-spots ' + spotsClass + '">' + spotsText + '</span>' +
    '</div>';
  }

  function renderTickets() {
    var html = renderHeader();
    html += '<div class="evt-section-title">Select Ticket</div>';
    state.tickets.forEach(function(t) {
      var soldOut = t.available !== null && t.available <= 0;
      var notOnSale = t.sale_status === 'not_started';
      var saleEnded = t.sale_status === 'ended';
      var locked = t.requires_code && !state.unlockedTickets[t.id];
      var disabled = soldOut || notOnSale || saleEnded || locked;
      var sel = state.selectedTicket === t.id;
      var hasQty = sel && !disabled && t.max_per_order > 1;
      var hasCodeRow = locked && !soldOut && !notOnSale && !saleEnded;
      html += '<div class="evt-ticket' + (sel ? ' evt-selected' : '') + (disabled ? ' evt-sold-out' : '') + (locked ? ' evt-locked' : '') + '"' + ((hasQty || hasCodeRow) ? ' style="border-radius:var(--evt-radius) var(--evt-radius) 0 0;margin-bottom:0"' : '') + ' data-ticket-id="' + t.id + '">';
      html += '<div><div class="evt-ticket-name">' + (locked ? '&#128274; ' : '') + esc(t.name) + '</div>';
      if (t.description) html += '<div class="evt-ticket-desc">' + esc(t.description) + '</div>';
      html += '</div>';
      html += '<div class="evt-ticket-right">';
      if (soldOut) { html += '<span class="evt-badge-sold-out">Sold Out</span>'; }
      else if (notOnSale) { html += '<span class="evt-badge-sale evt-badge-coming-soon">Coming Soon</span>'; }
      else if (saleEnded) { html += '<span class="evt-badge-sale evt-badge-sale-ended">Sale Ended</span>'; }
      else {
        html += '<div class="evt-ticket-price">' + fmtPrice(t.price) + '</div>';
        if (t.available !== null) html += '<div class="evt-ticket-avail">' + t.available + ' left</div>';
      }
      html += '</div></div>';
      // Access code input row
      if (hasCodeRow) {
        html += '<div class="evt-code-row">';
        html += '<input class="evt-code-input" data-code-ticket="' + t.id + '" placeholder="Enter access code" value="' + esc(state.ticketCodes[t.id] || '') + '" />';
        html += '<button class="evt-code-btn" data-action="unlock-ticket" data-ticket-id="' + t.id + '">Unlock</button>';
        if (state.codeErrors[t.id]) html += '<div class="evt-code-error">' + esc(state.codeErrors[t.id]) + '</div>';
        html += '</div>';
      }
      // Inline quantity stepper inside selected ticket card
      if (sel && !disabled && t.max_per_order > 1) {
        html += '<div class="evt-qty evt-qty-inline">';
        html += '<span class="evt-qty-label">Quantity</span>';
        html += '<button class="evt-qty-btn" data-action="qty-minus"' + (state.quantity <= (t.min_per_order || 1) ? ' disabled' : '') + '>&minus;</button>';
        html += '<input class="evt-qty-val" type="text" value="' + state.quantity + '" readonly />';
        html += '<button class="evt-qty-btn" data-action="qty-plus"' + (state.quantity >= t.max_per_order ? ' disabled' : '') + '>+</button>';
        html += '</div>';
      }
    });

    // Add-ons (shown alongside tickets)
    if (state.addOns.length > 0) {
      html += '<div class="evt-addons"><div class="evt-section-title">Add-Ons</div>';
      var groupedIds = new Set();
      state.addOnGroups.forEach(function(g) {
        var groupAddOns = state.addOns.filter(function(a) { return a.add_on_group_id === g.id; });
        if (groupAddOns.length === 0) return;
        html += '<div class="evt-group-name">' + esc(g.name) + '</div>';
        if (g.description) html += '<div class="evt-ticket-desc" style="margin-bottom:8px">' + esc(g.description) + '</div>';
        groupAddOns.forEach(function(a) {
          groupedIds.add(a.id);
          html += renderAddOn(a);
        });
      });
      var ungrouped = state.addOns.filter(function(a) { return !groupedIds.has(a.id); });
      ungrouped.forEach(function(a) { html += renderAddOn(a); });
      html += '</div>';
    }

    html += '<button class="evt-btn" ' + (!state.selectedTicket ? 'disabled' : '') + ' data-action="to-details">Continue</button>';
    return html;
  }

  function renderDetails() {
    var ticket = state.tickets.find(function(t) { return t.id === state.selectedTicket; });
    var html = renderHeader();

    // Form
    html += '<div class="evt-form"><div class="evt-section-title">Your Information</div>';
    html += '<div class="evt-row">';
    html += '<input class="evt-input" data-field="first_name" placeholder="First Name" required value="' + esc(state.formData.first_name || '') + '" />';
    html += '<input class="evt-input" data-field="last_name" placeholder="Last Name" required value="' + esc(state.formData.last_name || '') + '" />';
    html += '</div>';
    html += '<input class="evt-input" data-field="email" type="email" placeholder="Email" required value="' + esc(state.formData.email || '') + '" />';
    html += '<input class="evt-input" data-field="phone" placeholder="Phone (optional)" value="' + esc(state.formData.phone || '') + '" />';

    // Custom form fields
    state.formFields.forEach(function(f) {
      var val = state.formData['custom_' + f.id] || '';
      if (f.field_type === 'textarea') {
        html += '<textarea class="evt-input" data-field="custom_' + f.id + '" placeholder="' + esc(f.label) + '"' + (f.required ? ' required' : '') + '>' + esc(val) + '</textarea>';
      } else if (f.field_type === 'select' && f.options) {
        html += '<select class="evt-input" data-field="custom_' + f.id + '"' + (f.required ? ' required' : '') + '>';
        html += '<option value="">' + esc(f.label) + '</option>';
        f.options.forEach(function(o) { html += '<option value="' + esc(o) + '"' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>'; });
        html += '</select>';
      } else if (f.field_type === 'checkbox') {
        html += '<label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:14px;cursor:pointer"><input type="checkbox" data-field="custom_' + f.id + '"' + (val === 'true' ? ' checked' : '') + ' /> ' + esc(f.label) + '</label>';
      } else {
        html += '<input class="evt-input" data-field="custom_' + f.id + '" type="' + (f.field_type === 'number' ? 'number' : 'text') + '" placeholder="' + esc(f.placeholder || f.label) + '"' + (f.required ? ' required' : '') + ' value="' + esc(val) + '" />';
      }
    });
    html += '<input class="evt-input" data-field="notes" placeholder="Notes (optional)" value="' + esc(state.formData.notes || '') + '" />';
    html += '</div>';

    // Order summary (with quantity)
    var qty = state.quantity || 1;
    var ticketLineTotal = ticket ? ticket.price * qty : 0;
    var total = ticketLineTotal;
    html += '<div class="evt-summary">';
    var ticketLabel = ticket ? (qty > 1 ? qty + 'x ' + esc(ticket.name) : esc(ticket.name)) : 'Ticket';
    html += '<div class="evt-line"><span>' + ticketLabel + '</span><span>' + fmtPrice(ticketLineTotal) + '</span></div>';
    state.selectedAddOns.forEach(function(aoId) {
      var ao = state.addOns.find(function(a) { return a.id === aoId; });
      if (ao) {
        var aoQ = state.addOnQtys[ao.id] || 1;
        var aoLineTotal = ao.price * aoQ;
        total += aoLineTotal;
        var aoLabel = aoQ > 1 ? aoQ + 'x ' + esc(ao.name) : esc(ao.name);
        html += '<div class="evt-line"><span>' + aoLabel + '</span><span>' + fmtPrice(aoLineTotal) + '</span></div>';
      }
    });
    html += '<div class="evt-total"><span>Total</span><span>' + fmtPrice(total) + '</span></div>';
    html += '</div>';

    html += '<button class="evt-btn" data-action="submit">Complete Booking</button>';
    html += '<button class="evt-btn-back" data-action="to-tickets">&larr; Back to tickets</button>';
    return html;
  }

  function renderAddOn(a) {
    var soldOut = a.available !== null && a.available <= 0;
    var checked = state.selectedAddOns.indexOf(a.id) >= 0;
    var aoQty = state.addOnQtys[a.id] || 1;
    var maxQty = a.available !== null ? Math.min(a.max_per_order || 1, a.available) : (a.max_per_order || 1);
    var showQty = checked && maxQty > 1;
    var html = '<label class="evt-addon' + (checked ? ' evt-addon-selected' : '') + (soldOut ? ' evt-addon-sold-out' : '') + '"' + (showQty ? ' style="border-radius:var(--evt-radius) var(--evt-radius) 0 0;margin-bottom:0"' : '') + '>' +
      '<input type="checkbox" data-addon-id="' + a.id + '"' + (checked ? ' checked' : '') + (soldOut ? ' disabled' : '') + ' />' +
      '<div class="evt-addon-info"><div class="evt-addon-name">' + esc(a.name) + '</div>' +
      (a.description ? '<div class="evt-addon-desc">' + esc(a.description) + '</div>' : '') +
      (!soldOut && a.available !== null ? '<div style="font-size:11px;color:#92400e;margin-top:2px">' + a.available + ' remaining</div>' : '') +
      '</div>' +
      '<span class="evt-addon-price">' + (soldOut ? '<span class="evt-badge-sold-out">Sold Out</span>' : fmtPrice(a.price)) + '</span>' +
    '</label>';
    if (showQty) {
      html += '<div class="evt-qty evt-qty-inline" style="margin-top:-1px;border-top:1px solid var(--evt-border)">';
      html += '<span class="evt-qty-label">Quantity</span>';
      html += '<button class="evt-qty-btn" data-action="ao-qty-minus" data-ao-id="' + a.id + '"' + (aoQty <= 1 ? ' disabled' : '') + '>&minus;</button>';
      html += '<input class="evt-qty-val" type="text" value="' + aoQty + '" readonly />';
      html += '<button class="evt-qty-btn" data-action="ao-qty-plus" data-ao-id="' + a.id + '"' + (aoQty >= maxQty ? ' disabled' : '') + '>+</button>';
      html += '</div>';
    }
    return html;
  }

  function render() {
    var html = '';
    if (state.step === 'loading') {
      html = '<div class="evt-loading"><div class="evt-spinner"></div><div>Loading event...</div></div>';
    } else if (state.step === 'error') {
      html = '<div class="evt-error">' + esc(state.errorMsg || 'Something went wrong.') + '</div>';
    } else if (state.step === 'cancelled') {
      html = renderHeader() + '<div class="evt-closed">This event has been cancelled.</div>';
    } else if (state.step === 'closed') {
      html = renderHeader() + '<div class="evt-closed">Registration is closed.</div>';
    } else if (state.step === 'not_open') {
      var opens = new Date(state.event.registration_opens_at);
      html = renderHeader() + '<div class="evt-closed">Registration opens ' + opens.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '.</div>';
    } else if (state.step === 'sold_out') {
      html = renderHeader() + '<div class="evt-closed">This event is sold out.</div>';
    } else if (state.step === 'tickets') {
      html = renderTickets();
    } else if (state.step === 'details') {
      html = renderDetails();
    } else if (state.step === 'submitting') {
      html = renderHeader() + '<div class="evt-loading"><div class="evt-spinner"></div><div>Reserving your spot...</div></div>';
    } else if (state.step === 'success') {
      html = '<div class="evt-success">' +
        '<div class="evt-success-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<h2>Booking Confirmed!</h2>' +
        '<p>Check your email for confirmation details.</p>' +
      '</div>';
    }
    ROOT.innerHTML = '<style>' + ROOT.querySelector('style').textContent + '</style>' + html;
    bindEvents();
  }

  function bindEvents() {
    // Ticket selection (reset quantity on change, skip locked)
    ROOT.querySelectorAll('.evt-ticket[data-ticket-id]').forEach(function(el) {
      el.addEventListener('click', function() {
        if (el.classList.contains('evt-sold-out')) return;
        if (el.classList.contains('evt-locked')) return;
        var newId = el.getAttribute('data-ticket-id');
        if (state.selectedTicket !== newId) {
          state.selectedTicket = newId;
          var t = state.tickets.find(function(t) { return t.id === newId; });
          state.quantity = t ? (t.min_per_order || 1) : 1;
        }
        render();
      });
    });

    // Access code inputs — save on input
    ROOT.querySelectorAll('[data-code-ticket]').forEach(function(el) {
      el.addEventListener('input', function() {
        state.ticketCodes[el.getAttribute('data-code-ticket')] = el.value;
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var tid = el.getAttribute('data-code-ticket');
          unlockTicket(tid);
        }
      });
    });

    // Unlock buttons
    ROOT.querySelectorAll('[data-action="unlock-ticket"]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var tid = el.getAttribute('data-ticket-id');
        unlockTicket(tid);
      });
    });

    // Quantity stepper
    var qtyMinus = ROOT.querySelector('[data-action="qty-minus"]');
    if (qtyMinus) qtyMinus.addEventListener('click', function() {
      var t = state.tickets.find(function(t) { return t.id === state.selectedTicket; });
      var min = t ? (t.min_per_order || 1) : 1;
      if (state.quantity > min) { state.quantity--; render(); }
    });
    var qtyPlus = ROOT.querySelector('[data-action="qty-plus"]');
    if (qtyPlus) qtyPlus.addEventListener('click', function() {
      var t = state.tickets.find(function(t) { return t.id === state.selectedTicket; });
      var max = t ? t.max_per_order : 1;
      if (state.quantity < max) { state.quantity++; render(); }
    });

    // Add-on toggles
    ROOT.querySelectorAll('[data-addon-id]').forEach(function(el) {
      el.addEventListener('change', function() {
        var id = el.getAttribute('data-addon-id');
        if (el.checked) { if (state.selectedAddOns.indexOf(id) < 0) state.selectedAddOns.push(id); }
        else { state.selectedAddOns = state.selectedAddOns.filter(function(x) { return x !== id; }); delete state.addOnQtys[id]; }
        render();
      });
    });

    // Add-on quantity steppers
    ROOT.querySelectorAll('[data-action="ao-qty-minus"]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var id = el.getAttribute('data-ao-id');
        var cur = state.addOnQtys[id] || 1;
        if (cur > 1) { state.addOnQtys[id] = cur - 1; render(); }
      });
    });
    ROOT.querySelectorAll('[data-action="ao-qty-plus"]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        var id = el.getAttribute('data-ao-id');
        var ao = state.addOns.find(function(a) { return a.id === id; });
        var maxPerOrder = ao ? (ao.max_per_order || 1) : 1;
        var maxQ = ao && ao.available !== null ? Math.min(maxPerOrder, ao.available) : maxPerOrder;
        var cur = state.addOnQtys[id] || 1;
        if (cur < maxQ) { state.addOnQtys[id] = cur + 1; render(); }
      });
    });

    // Form inputs — save on change
    ROOT.querySelectorAll('[data-field]').forEach(function(el) {
      el.addEventListener('input', function() {
        var key = el.getAttribute('data-field');
        if (el.type === 'checkbox') { state.formData[key] = el.checked ? 'true' : ''; }
        else { state.formData[key] = el.value; }
      });
    });

    // Navigation buttons
    var toDetails = ROOT.querySelector('[data-action="to-details"]');
    if (toDetails) toDetails.addEventListener('click', function() {
      if (!state.selectedTicket) return;
      state.step = 'details';
      render();
    });

    var toTickets = ROOT.querySelector('[data-action="to-tickets"]');
    if (toTickets) toTickets.addEventListener('click', function() {
      state.step = 'tickets';
      render();
    });

    var submitBtn = ROOT.querySelector('[data-action="submit"]');
    if (submitBtn) submitBtn.addEventListener('click', function() { submitBooking(); });
  }

  function submitBooking() {
    // Validate required fields
    var fn = state.formData.first_name || '';
    var ln = state.formData.last_name || '';
    var em = state.formData.email || '';
    if (!fn.trim() || !ln.trim() || !em.trim()) {
      // Highlight empty required inputs
      ROOT.querySelectorAll('[data-field]').forEach(function(el) {
        if (el.hasAttribute('required') && !el.value.trim()) el.classList.add('evt-input-error');
        else el.classList.remove('evt-input-error');
      });
      return;
    }

    state.step = 'submitting';
    render();

    // Build success/cancel URLs from current page
    var base = window.location.href.split('?')[0];
    var successUrl = base + '?fegc_booking=success';
    var cancelUrl = base + '?fegc_booking=cancelled';

    var formResponses = [];
    state.formFields.forEach(function(f) {
      var val = state.formData['custom_' + f.id] || '';
      if (val) formResponses.push({ field_id: f.id, value: val });
    });

    fetch(API + '/create-event-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: state.event.id,
        ticket_type_id: state.selectedTicket,
        add_on_ids: state.selectedAddOns,
        add_on_quantities: state.selectedAddOns.map(function(id) { return state.addOnQtys[id] || 1; }),
        quantity: state.quantity || 1,
        access_code: state.unlockedTickets[state.selectedTicket] || undefined,
        first_name: fn.trim(),
        last_name: ln.trim(),
        email: em.trim(),
        phone: (state.formData.phone || '').trim() || null,
        notes: (state.formData.notes || '').trim() || null,
        form_responses: formResponses,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (!res.ok) {
        if (res.data.error === 'sold_out') { state.step = 'sold_out'; }
        else if (res.data.error === 'invalid_access_code') {
          // Re-lock the ticket so user can re-enter
          delete state.unlockedTickets[state.selectedTicket];
          state.codeErrors[state.selectedTicket] = 'Invalid access code';
          state.selectedTicket = null;
          state.step = 'tickets';
        }
        else { state.step = 'error'; state.errorMsg = res.data.detail || res.data.error || 'Booking failed.'; }
        render();
        return;
      }
      if (res.data.free || res.data.status === 'confirmed') {
        state.step = 'success';
        render();
      } else if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        state.step = 'error';
        state.errorMsg = 'Unexpected response.';
        render();
      }
    })
    .catch(function() {
      state.step = 'error';
      state.errorMsg = 'Network error. Please try again.';
      render();
    });
  }

  if (state.step !== 'success') { /* already loaded or loading */ }
})();
</script>
</div>`;
}
