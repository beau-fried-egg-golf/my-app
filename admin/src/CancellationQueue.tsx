import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCancellationRequests, approveCancellationRequest, denyCancellationRequest } from './storage';
import type { CancellationRequest } from './types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#92400e', bg: '#fef3c7' },
  approved: { label: 'Approved', color: '#065f46', bg: '#d1fae5' },
  denied: { label: 'Denied', color: '#991b1b', bg: '#fecaca' },
};

export default function CancellationQueue() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCancellationRequests().then(r => {
      setRequests(r);
      setLoading(false);
    });
  }, []);

  async function handleApprove(req: CancellationRequest) {
    const adminNote = window.prompt('Admin note (optional):');
    if (adminNote === null) return; // cancelled
    await approveCancellationRequest(req.id, adminNote || undefined);
    setRequests(prev => prev.map(r =>
      r.id === req.id ? { ...r, status: 'approved' as const, admin_note: adminNote || null, resolved_at: new Date().toISOString() } : r
    ));
  }

  async function handleDeny(req: CancellationRequest) {
    const adminNote = window.prompt('Reason for denial (optional):');
    if (adminNote === null) return; // cancelled
    await denyCancellationRequest(req.id, adminNote || undefined);
    setRequests(prev => prev.map(r =>
      r.id === req.id ? { ...r, status: 'denied' as const, admin_note: adminNote || null, resolved_at: new Date().toISOString() } : r
    ));
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Cancellation Requests</h1>

      {requests.length === 0 ? (
        <div className="empty-state">No cancellation requests</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Meetup</th>
                <th>Note</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const si = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={req.id}>
                    <td>
                      <Link to={`/users/${req.user_id}`} className="link">
                        {req.user_name ?? 'Member'}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/meetups/${req.meetup_id}`} className="link">
                        {req.meetup_name ?? 'Meetup'}
                      </Link>
                      {req.meetup_date && (
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {new Date(req.meetup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.note}
                      {req.admin_note && (
                        <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>
                          Admin: {req.admin_note}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: si.color,
                        backgroundColor: si.bg,
                      }}>
                        {si.label}
                      </span>
                    </td>
                    <td>{formatTime(req.created_at)}</td>
                    <td>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ fontSize: 11, padding: '2px 8px', backgroundColor: '#d1fae5', color: '#065f46' }}
                            onClick={() => handleApprove(req)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ fontSize: 11, padding: '2px 8px', backgroundColor: '#fecaca', color: '#991b1b' }}
                            onClick={() => handleDeny(req)}
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
