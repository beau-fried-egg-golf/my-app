import { useEffect, useState } from 'react';
import { FUNCTIONS_URL } from './supabase';
import type { GetEventResponse, EventData, TicketType, AddOnGroup, AddOn, FormField } from './types';
import TicketSelector from './TicketSelector';
import AddOnSelector from './AddOnSelector';
import RegistrationForm from './RegistrationForm';
import OrderSummary from './OrderSummary';
import WaitlistForm from './WaitlistForm';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes: string;
  custom: Record<string, string>;
}

const EMPTY_FORM: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  notes: '',
  custom: {},
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

interface Props {
  slug: string;
}

export default function EventWidget({ slug }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState<EventData | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [addOnGroups, setAddOnGroups] = useState<AddOnGroup[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Selection state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Success state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Check URL for returning from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success' && params.get('booking')) {
      setBookingSuccess(true);
      setBookingId(params.get('booking') ?? '');
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setError('No event specified');
      setLoading(false);
      return;
    }

    fetch(`${FUNCTIONS_URL}/get-event?slug=${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then((data: GetEventResponse) => {
        if ((data as any).error) {
          setError((data as any).error);
          return;
        }
        setEvent(data.event);
        setTicketTypes(data.ticket_types);
        setAddOnGroups(data.add_on_groups);
        setAddOns(data.add_ons);
        setFormFields(data.form_fields);

        // Auto-select required add-ons
        const requiredIds = data.add_ons.filter(a => a.required).map(a => a.id);
        setSelectedAddOnIds(requiredIds);

        // Auto-select first available ticket if only one
        const available = data.ticket_types.filter(t => t.available === null || t.available > 0);
        if (available.length === 1) {
          setSelectedTicketId(available[0].id);
        }
      })
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleTicketSelect(id: string) {
    setSelectedTicketId(id);
    // Reset quantity to the new ticket's min_per_order
    const tt = ticketTypes.find(t => t.id === id);
    setQuantity(tt?.min_per_order ?? 1);
  }

  function toggleAddOn(id: string) {
    setSelectedAddOnIds(prev => {
      if (prev.includes(id)) {
        // Remove quantity tracking when deselecting
        setAddOnQuantities(q => { const next = { ...q }; delete next[id]; return next; });
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  }

  function selectOneInGroup(groupId: string, addOnId: string) {
    const groupAddOnIds = addOns.filter(a => a.add_on_group_id === groupId).map(a => a.id);
    // Clean up quantities for deselected group items
    setAddOnQuantities(q => {
      const next = { ...q };
      groupAddOnIds.forEach(id => { if (id !== addOnId) delete next[id]; });
      return next;
    });
    setSelectedAddOnIds(prev => [
      ...prev.filter(id => !groupAddOnIds.includes(id)),
      addOnId,
    ]);
  }

  function handleAddOnQtyChange(id: string, qty: number) {
    setAddOnQuantities(prev => ({ ...prev, [id]: qty }));
  }

  async function handleSubmit() {
    if (!event || !selectedTicketId || !formData.first_name || !formData.last_name || !formData.email) return;

    // Validate required custom fields
    for (const ff of formFields) {
      if (ff.required && !formData.custom[ff.id]) {
        setSubmitError(`"${ff.label}" is required`);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formResponses = Object.entries(formData.custom)
        .filter(([_, v]) => v)
        .map(([fieldId, value]) => ({ field_id: fieldId, value }));

      const res = await fetch(`${FUNCTIONS_URL}/create-event-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: selectedTicketId,
          add_on_ids: selectedAddOnIds,
          add_on_quantities: selectedAddOnIds.map(id => addOnQuantities[id] ?? 1),
          quantity,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          notes: formData.notes || null,
          form_responses: formResponses,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === 'sold_out') {
          setSubmitError(
            data.level === 'ticket_type'
              ? 'This ticket type just sold out. Please select a different ticket.'
              : 'This event just sold out.',
          );
        } else {
          setSubmitError(data.error || 'Booking failed. Please try again.');
        }
        return;
      }

      // Free booking — confirmed directly
      if (data.free) {
        setBookingSuccess(true);
        setBookingId(data.booking_id);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render states ──

  if (loading) {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-loading">Loading event...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-error-state">{error}</div>
      </div>
    );
  }

  if (!event) return null;

  // Booking success
  if (bookingSuccess) {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-success-state">
          <div className="fegc-success-icon">&#10003;</div>
          <h2>You're Registered!</h2>
          <p>Your booking has been confirmed. A confirmation email will be sent shortly.</p>
          {bookingId && (
            <p className="fegc-booking-ref">Booking reference: {bookingId.slice(0, 8)}</p>
          )}
        </div>
      </div>
    );
  }

  // Cancelled event
  if (event.status === 'cancelled') {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-event-header">
          <h2 className="fegc-event-name">{event.name}</h2>
        </div>
        <div className="fegc-error-state">This event has been cancelled.</div>
      </div>
    );
  }

  // Registration closed
  const now = new Date();
  if (event.status === 'closed' || (event.registration_closes_at && new Date(event.registration_closes_at) < now)) {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-event-header">
          <h2 className="fegc-event-name">{event.name}</h2>
          <EventMeta event={event} />
        </div>
        <div className="fegc-info-state">Registration is closed.</div>
      </div>
    );
  }

  // Pre-registration
  if (event.registration_opens_at && new Date(event.registration_opens_at) > now) {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-event-header">
          <h2 className="fegc-event-name">{event.name}</h2>
          <EventMeta event={event} />
          {event.description && <p className="fegc-event-desc">{event.description}</p>}
        </div>
        <div className="fegc-info-state">
          Registration opens {new Date(event.registration_opens_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
        </div>
      </div>
    );
  }

  // Sold out
  const allSoldOut = event.spots_remaining <= 0 || ticketTypes.every(tt => tt.available !== null && tt.available <= 0);
  if (allSoldOut) {
    return (
      <div className="fegc-events-widget">
        <div className="fegc-event-header">
          <h2 className="fegc-event-name">{event.name}</h2>
          <EventMeta event={event} />
          {event.description && <p className="fegc-event-desc">{event.description}</p>}
        </div>
        {event.waitlist_enabled ? (
          <WaitlistForm event={event} ticketTypes={ticketTypes} />
        ) : (
          <div className="fegc-info-state">This event is sold out.</div>
        )}
      </div>
    );
  }

  // Open registration
  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId) ?? null;
  const selectedAddOnsData = addOns.filter(a => selectedAddOnIds.includes(a.id));

  return (
    <div className="fegc-events-widget">
      <div className="fegc-event-header">
        {event.image_url && <img src={event.image_url} className="fegc-event-image" alt={event.name} />}
        <h2 className="fegc-event-name">{event.name}</h2>
        <EventMeta event={event} />
        {event.description && <p className="fegc-event-desc">{event.description}</p>}
      </div>

      <TicketSelector
        ticketTypes={ticketTypes}
        selectedId={selectedTicketId}
        onSelect={handleTicketSelect}
        quantity={quantity}
        onQuantityChange={setQuantity}
      />

      {addOns.length > 0 && (
        <AddOnSelector
          addOnGroups={addOnGroups}
          addOns={addOns}
          selectedIds={selectedAddOnIds}
          addOnQuantities={addOnQuantities}
          onToggle={toggleAddOn}
          onSelectOne={selectOneInGroup}
          onAddOnQtyChange={handleAddOnQtyChange}
        />
      )}

      {selectedTicketId && (
        <RegistrationForm
          formFields={formFields}
          data={formData}
          onChange={setFormData}
        />
      )}

      {submitError && <div className="fegc-error">{submitError}</div>}

      <OrderSummary
        ticket={selectedTicket}
        quantity={quantity}
        selectedAddOns={selectedAddOnsData}
        addOnQuantities={addOnQuantities}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      {event.policy_url && (
        <p className="fegc-policy-link">
          By registering, you agree to the <a href={event.policy_url} target="_blank" rel="noopener noreferrer">event policies</a>.
        </p>
      )}
    </div>
  );
}

function EventMeta({ event }: { event: EventData }) {
  return (
    <div className="fegc-event-meta">
      <span>{formatDate(event.date)}</span>
      {event.time && <span> &middot; {formatTime(event.time)}</span>}
      {event.location && <span> &middot; {event.location}</span>}
      <span className="fegc-spots-badge">
        {event.spots_remaining > 0 ? `${event.spots_remaining} spots left` : 'Sold Out'}
      </span>
    </div>
  );
}
