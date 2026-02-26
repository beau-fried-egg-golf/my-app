import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBooking, cancelBooking, refundBooking } from './eventStorage';
import type { EventBooking } from './eventTypes';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  refunded: { bg: '#f3f4f6', color: '#4b5563' },
};

export default function EventBookingDetail() {
  const { id: eventId, bid } = useParams<{ id: string; bid: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'refund' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (bid) {
      getBooking(bid).then(setBooking);
    }
  }, [bid]);

  async function handleCancel() {
    if (!bid) return;
    setActionLoading(true);
    await cancelBooking(bid);
    setConfirmAction(null);
    setActionLoading(false);
    getBooking(bid).then(setBooking);
  }

  async function handleRefund() {
    if (!bid) return;
    setActionLoading(true);
    const result = await refundBooking(bid);
    if (result.error) {
      alert('Refund failed: ' + result.error);
    }
    setConfirmAction(null);
    setActionLoading(false);
    getBooking(bid).then(setBooking);
  }

  if (!booking) {
    return <div className="empty-state">Loading...</div>;
  }

  const statusStyle = STATUS_COLORS[booking.status] ?? STATUS_COLORS.pending;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to={`/events/${eventId}/bookings`} className="link">&larr; Back to Bookings</Link>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <div>
            <h1 className="detail-title">{booking.first_name} {booking.last_name}</h1>
            <div className="detail-meta">
              {booking.email} {booking.phone ? ` · ${booking.phone}` : ''}
            </div>
          </div>
          <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: 14, padding: '4px 12px' }}>
            {booking.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div>
            <div className="stat-label">Ticket Type</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{booking.ticket_type_name}</div>
          </div>
          <div>
            <div className="stat-label">Quantity</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{booking.quantity ?? 1}</div>
          </div>
          <div>
            <div className="stat-label">Total Amount</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{formatCents(booking.total_amount)}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {(booking.quantity ?? 1) > 1
                ? `${booking.quantity} × ${formatCents(booking.ticket_price_at_purchase)} per ticket`
                : `Ticket: ${formatCents(booking.ticket_price_at_purchase)}`}
            </div>
          </div>
          <div>
            <div className="stat-label">Created</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>{formatDate(booking.created_at)}</div>
          </div>
          <div>
            <div className="stat-label">Booking ID</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>{booking.id}</div>
          </div>
        </div>

        {booking.stripe_payment_intent_id && (
          <div style={{ marginBottom: 24 }}>
            <div className="stat-label">Stripe Payment Intent</div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 4 }}>{booking.stripe_payment_intent_id}</div>
          </div>
        )}

        {booking.notes && (
          <div style={{ marginBottom: 24 }}>
            <div className="stat-label">Notes</div>
            <div style={{ fontSize: 14, marginTop: 4, whiteSpace: 'pre-wrap' }}>{booking.notes}</div>
          </div>
        )}

        {/* Add-ons */}
        {booking.add_ons && booking.add_ons.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 className="section-title" style={{ marginTop: 0 }}>Add-Ons</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Add-On</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.add_ons.map(ao => {
                    const aoQty = ao.quantity ?? 1;
                    return (
                      <tr key={ao.id}>
                        <td>{ao.add_on_name}</td>
                        <td>{aoQty}</td>
                        <td>
                          {formatCents(ao.price_at_purchase * aoQty)}
                          {aoQty > 1 && <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>({aoQty} x {formatCents(ao.price_at_purchase)})</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Responses */}
        {booking.form_responses && booking.form_responses.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 className="section-title" style={{ marginTop: 0 }}>Form Responses</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.form_responses.map(fr => (
                    <tr key={fr.id}>
                      <td>{fr.field_label}</td>
                      <td>{fr.value ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <div className="btn-group" style={{ marginTop: 24 }}>
            {booking.status === 'confirmed' && (
              <button className="btn btn-danger" onClick={() => setConfirmAction('refund')}>Refund</button>
            )}
            <button className="btn btn-danger" onClick={() => setConfirmAction('cancel')}>Cancel Booking</button>
          </div>
        )}
      </div>

      {confirmAction && (
        <div className="confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">
              {confirmAction === 'refund' ? 'Refund Booking?' : 'Cancel Booking?'}
            </div>
            <div className="confirm-text">
              {confirmAction === 'refund'
                ? `This will refund ${formatCents(booking.total_amount)} to the customer and release their spot.`
                : 'This will cancel the booking and release the spot. The customer will not be automatically refunded.'}
            </div>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setConfirmAction(null)} disabled={actionLoading}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={confirmAction === 'refund' ? handleRefund : handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : confirmAction === 'refund' ? 'Refund' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
