import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getBookings } from './eventStorage';
import type { Event, EventBooking } from './eventTypes';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#4b5563' },
  published: { bg: '#dcfce7', color: '#166534' },
  sold_out: { bg: '#fef3c7', color: '#92400e' },
  closed: { bg: '#dbeafe', color: '#1e40af' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function EventsDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [recentBookings, setRecentBookings] = useState<EventBooking[]>([]);

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data);
      // Load recent bookings from the first upcoming event
      const upcoming = data.filter(e => e.status === 'published' || e.status === 'sold_out');
      if (upcoming.length > 0) {
        getBookings(upcoming[0].id).then(bookings => {
          setRecentBookings(bookings.slice(0, 10));
        });
      }
    });
  }, []);

  const upcoming = events.filter(e => new Date(e.date) >= new Date() && e.status !== 'cancelled');
  const totalRevenue = events.reduce((sum, e) => sum + (e.total_revenue ?? 0), 0);
  const totalBooked = events.reduce((sum, e) => sum + (e.total_booked ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Events</h1>
        <Link to="/events/new" className="btn btn-primary">+ Create Event</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Upcoming Events</div>
          <div className="stat-value">{upcoming.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{totalBooked}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCents(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">All Events</div>
          <div className="stat-value">{events.length}</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <h2 className="section-title">Upcoming Events</h2>
      <div className="table-container" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Capacity</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map(e => {
              const statusStyle = STATUS_COLORS[e.status] ?? STATUS_COLORS.draft;
              const booked = e.total_booked ?? 0;
              const pct = Math.min(100, Math.round((booked / e.total_capacity) * 100));
              return (
                <tr key={e.id}>
                  <td><strong>{e.name}</strong></td>
                  <td>{formatDate(e.date)}</td>
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {upcoming.length === 0 && <div className="empty-state">No upcoming events</div>}
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <>
          <h2 className="section-title">Recent Bookings</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Ticket</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.first_name} {b.last_name}</strong></td>
                    <td>{b.email}</td>
                    <td>{b.ticket_type_name}</td>
                    <td>{formatCents(b.total_amount)}</td>
                    <td>
                      <span className="badge" style={{
                        background: STATUS_COLORS[b.status]?.bg ?? '#f3f4f6',
                        color: STATUS_COLORS[b.status]?.color ?? '#4b5563',
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td>{formatDate(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
