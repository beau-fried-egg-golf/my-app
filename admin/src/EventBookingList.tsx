import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBookings, getEvent, getTicketTypes, getFormFields, getEventStats, exportBookingsCsv } from './eventStorage';
import type { Event, EventBooking, TicketType, EventFormField, EventStats } from './eventTypes';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  refunded: { bg: '#f3f4f6', color: '#4b5563' },
};

export default function EventBookingList() {
  const { id: eventId } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [formFields, setFormFields] = useState<EventFormField[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then(setEvent);
    getTicketTypes(eventId).then(setTicketTypes);
    getFormFields(eventId).then(setFormFields);
    getEventStats(eventId).then(setStats);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    loadBookings();
  }, [eventId, statusFilter, ticketFilter, search]);

  async function loadBookings() {
    if (!eventId) return;
    const data = await getBookings(eventId, {
      status: statusFilter || undefined,
      ticket_type_id: ticketFilter || undefined,
      search: search || undefined,
    });
    setBookings(data);
  }

  function handleExport() {
    const csv = exportBookingsCsv(bookings, formFields);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.slug ?? 'bookings'}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!eventId) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{event?.name ?? 'Event'} — Bookings</h1>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            <Link to={`/events/${eventId}/edit`} className="link">Edit Event</Link>
            {' · '}
            <Link to={`/events/${eventId}/waitlist`} className="link">Waitlist</Link>
          </div>
        </div>
        <button className="btn" onClick={handleExport}>Export CSV</button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Confirmed</div>
            <div className="stat-value">{stats.total_confirmed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.total_pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">{formatCents(stats.total_revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Spots Left</div>
            <div className="stat-value">{stats.spots_remaining}</div>
          </div>
        </div>
      )}

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <select className="filter-select" value={ticketFilter} onChange={e => setTicketFilter(e.target.value)}>
          <option value="">All Ticket Types</option>
          {ticketTypes.map(tt => (
            <option key={tt.id} value={tt.id}>{tt.name}</option>
          ))}
        </select>
        <span style={{ color: '#888', fontSize: 14 }}>{bookings.length} bookings</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const statusStyle = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
              return (
                <tr key={b.id}>
                  <td><strong>{b.first_name} {b.last_name}</strong></td>
                  <td>{b.email}</td>
                  <td>{b.ticket_type_name}</td>
                  <td>{b.quantity ?? 1}</td>
                  <td><strong>{formatCents(b.total_amount)}</strong></td>
                  <td>
                    <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {b.status}
                    </span>
                  </td>
                  <td>{formatDate(b.created_at)}</td>
                  <td>
                    <Link to={`/events/${eventId}/bookings/${b.id}`} className="btn btn-sm">View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bookings.length === 0 && <div className="empty-state">No bookings found</div>}
      </div>
    </div>
  );
}
