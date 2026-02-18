import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWaitlist, removeWaitlistEntry, getEvent } from './eventStorage';
import type { Event, EventWaitlistEntry } from './eventTypes';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  waiting: { bg: '#fef3c7', color: '#92400e' },
  notified: { bg: '#dbeafe', color: '#1e40af' },
  converted: { bg: '#dcfce7', color: '#166534' },
  expired: { bg: '#f3f4f6', color: '#4b5563' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function EventWaitlist() {
  const { id: eventId } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<EventWaitlistEntry[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then(setEvent);
    loadEntries();
  }, [eventId]);

  async function loadEntries() {
    if (!eventId) return;
    const data = await getWaitlist(eventId);
    setEntries(data);
  }

  async function handleRemove(id: string) {
    await removeWaitlistEntry(id);
    setConfirmRemove(null);
    loadEntries();
  }

  if (!eventId) return null;

  const activeEntries = entries.filter(e => e.status === 'waiting' || e.status === 'notified');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{event?.name ?? 'Event'} — Waitlist</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            <Link to={`/events/${eventId}/edit`} className="link">Edit Event</Link>
            {' · '}
            <Link to={`/events/${eventId}/bookings`} className="link">Bookings</Link>
          </div>
        </div>
        <span style={{ color: '#888', fontSize: 14 }}>{activeEntries.length} active</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Ticket Type</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => {
              const statusStyle = STATUS_COLORS[e.status] ?? STATUS_COLORS.waiting;
              return (
                <tr key={e.id}>
                  <td><strong>{e.position}</strong></td>
                  <td><strong>{e.first_name} {e.last_name}</strong></td>
                  <td>{e.email}</td>
                  <td>{e.ticket_type_name ?? 'Any'}</td>
                  <td>
                    <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {e.status}
                    </span>
                  </td>
                  <td>{e.stripe_payment_method_id ? 'Saved' : 'None'}</td>
                  <td>{formatDate(e.created_at)}</td>
                  <td>
                    {(e.status === 'waiting' || e.status === 'notified') && (
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirmRemove(e.id)}>Remove</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 && <div className="empty-state">No waitlist entries</div>}
      </div>

      {confirmRemove && (
        <div className="confirm-overlay" onClick={() => setConfirmRemove(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Remove from Waitlist?</div>
            <div className="confirm-text">This will cancel their waitlist entry. They will not be notified.</div>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setConfirmRemove(null)}>Keep</button>
              <button className="btn btn-danger" onClick={() => handleRemove(confirmRemove)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
