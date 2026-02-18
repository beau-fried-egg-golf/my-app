import { useState } from 'react';
import type { EventData, TicketType } from './types';
import { FUNCTIONS_URL } from './supabase';

interface Props {
  event: EventData;
  ticketTypes: TicketType[];
}

export default function WaitlistForm({ event, ticketTypes }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${FUNCTIONS_URL}/join-event-waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: ticketTypeId || null,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          desired_add_on_ids: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to join waitlist');
        return;
      }

      setPosition(data.position);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="fegc-section fegc-waitlist-success">
        <div className="fegc-success-icon">&#10003;</div>
        <h3 className="fegc-section-title">You're on the Waitlist!</h3>
        <p className="fegc-text">
          You're #{position} on the waitlist. We'll notify you at <strong>{email}</strong> if a spot opens up.
        </p>
      </div>
    );
  }

  return (
    <div className="fegc-section">
      <h3 className="fegc-section-title">Join the Waitlist</h3>
      <p className="fegc-text">This event is currently sold out. Join the waitlist and we'll notify you if a spot opens up.</p>

      <form onSubmit={handleSubmit}>
        <div className="fegc-form-row">
          <div className="fegc-form-group">
            <label className="fegc-label">First Name *</label>
            <input className="fegc-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div className="fegc-form-group">
            <label className="fegc-label">Last Name *</label>
            <input className="fegc-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="fegc-form-row">
          <div className="fegc-form-group">
            <label className="fegc-label">Email *</label>
            <input className="fegc-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="fegc-form-group">
            <label className="fegc-label">Phone</label>
            <input className="fegc-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        {ticketTypes.length > 1 && (
          <div className="fegc-form-group">
            <label className="fegc-label">Preferred Ticket Type</label>
            <select className="fegc-input" value={ticketTypeId} onChange={e => setTicketTypeId(e.target.value)}>
              <option value="">Any available</option>
              {ticketTypes.map(tt => (
                <option key={tt.id} value={tt.id}>{tt.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="fegc-error">{error}</div>}

        <button className="fegc-submit-btn" type="submit" disabled={submitting}>
          {submitting ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  );
}
