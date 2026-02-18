import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent, duplicateEvent } from './eventStorage';
import type { Event } from './eventTypes';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#4b5563' },
  published: { bg: '#dcfce7', color: '#166534' },
  sold_out: { bg: '#fef3c7', color: '#92400e' },
  closed: { bg: '#dbeafe', color: '#1e40af' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function EventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [statusFilter, search]);

  async function loadEvents() {
    const data = await getEvents({
      status: statusFilter || undefined,
      search: search || undefined,
    });
    setEvents(data);
  }

  async function handleDelete(id: string) {
    await deleteEvent(id);
    setConfirmDelete(null);
    loadEvents();
  }

  async function handleDuplicate(id: string) {
    const newId = await duplicateEvent(id);
    if (newId) {
      navigate(`/events/${newId}/edit`);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Events</h1>
        <Link to="/events/new" className="btn btn-primary">+ Create Event</Link>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="sold_out">Sold Out</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span style={{ color: '#888', fontSize: 14 }}>{events.length} events</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => {
              const statusStyle = STATUS_COLORS[e.status] ?? STATUS_COLORS.draft;
              const booked = e.total_booked ?? 0;
              const pct = Math.min(100, Math.round((booked / e.total_capacity) * 100));
              return (
                <tr key={e.id}>
                  <td>
                    <strong>{e.name}</strong>
                    <div style={{ fontSize: 12, color: '#888' }}>{e.slug}</div>
                  </td>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.location ?? '–'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="capacity-bar">
                        <div className="capacity-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{booked}/{e.total_capacity}</span>
                    </div>
                  </td>
                  <td>{formatCents(e.total_revenue ?? 0)}</td>
                  <td>
                    <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <Link to={`/events/${e.id}/edit`} className="btn btn-sm">Edit</Link>
                      <Link to={`/events/${e.id}/bookings`} className="btn btn-sm">Bookings</Link>
                      <button className="btn btn-sm" onClick={() => handleDuplicate(e.id)}>Dup</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(e.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {events.length === 0 && <div className="empty-state">No events found</div>}
      </div>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Delete Event?</div>
            <div className="confirm-text">This will permanently delete this event and all its bookings, ticket types, and add-ons.</div>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
