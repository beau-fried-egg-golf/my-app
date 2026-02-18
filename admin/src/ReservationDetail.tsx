import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReservation, updateReservationStatus } from './experienceStorage';
import type { ExperienceReservation, ReservationItem } from './types';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  completed: { bg: '#dbeafe', color: '#1e40af' },
  no_show: { bg: '#f3f4f6', color: '#4b5563' },
};

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<ExperienceReservation | null>(null);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    const result = await getReservation(id);
    if (result) {
      setReservation(result.reservation);
      setItems(result.items);
      setAdminNotes(result.reservation.admin_notes ?? '');
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!id || !reservation) return;
    setUpdating(true);
    await updateReservationStatus(id, newStatus, adminNotes || undefined);
    await loadData();
    setUpdating(false);
  }

  if (!reservation) {
    return <div className="empty-state">Loading...</div>;
  }

  const statusStyle = STATUS_COLORS[reservation.status] ?? STATUS_COLORS.pending;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservation Detail</h1>
          <p style={{ color: '#888', marginTop: 4, fontFamily: 'monospace' }}>{reservation.id}</p>
        </div>
        <button className="btn" onClick={() => navigate('/experiences/reservations')}>Back to Reservations</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Main content */}
        <div>
          <div className="detail-container" style={{ marginBottom: 24 }}>
            <div className="detail-header">
              <div>
                <div className="detail-title" style={{ textTransform: 'capitalize' }}>
                  {reservation.type.replace('_', ' ')} Reservation
                </div>
                <div className="detail-meta">
                  Booked {formatDate(reservation.created_at)}
                </div>
              </div>
              <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: 14, padding: '4px 12px' }}>
                {reservation.status}
              </span>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Guest</div>
                <div style={{ fontWeight: 600 }}>{reservation.user_name ?? 'Unknown'}</div>
              </div>
              {reservation.location_name && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Location</div>
                  <div>{reservation.location_name}</div>
                </div>
              )}
              {reservation.check_in_date && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Check-in</div>
                  <div>{formatDate(reservation.check_in_date)}</div>
                </div>
              )}
              {reservation.check_out_date && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Check-out</div>
                  <div>{formatDate(reservation.check_out_date)}</div>
                </div>
              )}
              {reservation.room_type_name && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Room Type</div>
                  <div>{reservation.room_type_name} × {reservation.room_count}</div>
                </div>
              )}
              {reservation.course_name && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Course</div>
                  <div>{reservation.course_name}</div>
                </div>
              )}
              {reservation.player_count && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Players</div>
                  <div>{reservation.player_count}</div>
                </div>
              )}
              {reservation.package_name && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Package</div>
                  <div>{reservation.package_name}</div>
                </div>
              )}
            </div>

            {reservation.guest_names.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Guests</div>
                <div>{reservation.guest_names.join(', ')}</div>
              </div>
            )}

            {reservation.special_requests && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Special Requests</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{reservation.special_requests}</div>
              </div>
            )}

            {reservation.stripe_payment_intent_id && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Stripe Payment Intent</div>
                <code style={{ fontSize: 13 }}>{reservation.stripe_payment_intent_id}</code>
              </div>
            )}

            {reservation.cancelled_at && (
              <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: '#991b1b', textTransform: 'uppercase', marginBottom: 4 }}>Cancelled</div>
                <div>{formatDate(reservation.cancelled_at)}</div>
                {reservation.cancellation_reason && (
                  <div style={{ marginTop: 4, color: '#666' }}>{reservation.cancellation_reason}</div>
                )}
              </div>
            )}
          </div>

          {/* Line items */}
          {items.length > 0 && (
            <div className="detail-container">
              <h3 className="section-title" style={{ marginTop: 0 }}>Line Items</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td style={{ textTransform: 'capitalize' }}>{item.type.replace('_', ' ')}</td>
                        <td>{item.description}</td>
                        <td>{item.date ?? '–'}</td>
                        <td>{formatCents(item.unit_price)}</td>
                        <td>{item.quantity}</td>
                        <td><strong>{formatCents(item.subtotal)}</strong></td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                      <td><strong>{formatCents(reservation.total_price)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar actions */}
        <div>
          <div className="detail-container" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Total</h3>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCents(reservation.total_price)}</div>
          </div>

          <div className="detail-container" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Actions</h3>

            <div className="form-group">
              <label className="form-label">Admin Notes</label>
              <textarea
                className="form-input form-textarea"
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reservation.status === 'pending' && (
                <button className="btn btn-primary" disabled={updating} onClick={() => handleStatusChange('confirmed')}>
                  Confirm Reservation
                </button>
              )}
              {(reservation.status === 'confirmed' || reservation.status === 'pending') && (
                <button className="btn btn-danger" disabled={updating} onClick={() => handleStatusChange('cancelled')}>
                  Cancel Reservation
                </button>
              )}
              {reservation.status === 'confirmed' && (
                <button className="btn" disabled={updating} onClick={() => handleStatusChange('completed')}>
                  Mark Completed
                </button>
              )}
              {reservation.status === 'confirmed' && (
                <button className="btn" disabled={updating} onClick={() => handleStatusChange('no_show')}>
                  Mark No-Show
                </button>
              )}
              <button className="btn" disabled={updating} onClick={async () => {
                setUpdating(true);
                await updateReservationStatus(reservation.id, reservation.status, adminNotes);
                await loadData();
                setUpdating(false);
              }}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
