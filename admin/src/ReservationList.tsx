import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReservations } from './experienceStorage';
import type { ExperienceReservation } from './types';

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
  completed: { bg: '#dbeafe', color: '#1e40af' },
  no_show: { bg: '#f3f4f6', color: '#4b5563' },
};

export default function ReservationList() {
  const [reservations, setReservations] = useState<ExperienceReservation[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReservations();
  }, [statusFilter, typeFilter, search]);

  async function loadReservations() {
    const data = await getReservations({
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      search: search || undefined,
    });
    setReservations(data);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
        </select>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="lodging">Lodging</option>
          <option value="tee_time">Tee Time</option>
          <option value="package">Package</option>
        </select>
        <span style={{ color: '#888', fontSize: 14 }}>{reservations.length} results</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Guest</th>
              <th>Type</th>
              <th>Location / Course</th>
              <th>Dates</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => {
              const statusStyle = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending;
              return (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.id.slice(0, 8)}...</td>
                  <td><strong>{r.user_name ?? 'Unknown'}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{r.type.replace('_', ' ')}</td>
                  <td>{r.location_name ?? r.course_name ?? r.package_name ?? '–'}</td>
                  <td>
                    {r.check_in_date && r.check_out_date ? (
                      <>{formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}</>
                    ) : r.check_in_date ? (
                      formatDate(r.check_in_date)
                    ) : '–'}
                  </td>
                  <td><strong>{formatCents(r.total_price)}</strong></td>
                  <td>
                    <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {r.status}
                    </span>
                  </td>
                  <td>{formatDate(r.created_at)}</td>
                  <td>
                    <Link to={`/experiences/reservations/${r.id}`} className="btn btn-sm">View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {reservations.length === 0 && <div className="empty-state">No reservations found</div>}
      </div>
    </div>
  );
}
