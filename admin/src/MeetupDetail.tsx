import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMeetups, getMeetupMembers, updateMeetupMemberPayment } from './storage';
import type { Meetup, MeetupMember } from './types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#92400e', bg: '#fef3c7' },
  paid: { label: 'Paid', color: '#065f46', bg: '#d1fae5' },
  waived: { label: 'Waived', color: '#1e40af', bg: '#dbeafe' },
};

export default function MeetupDetail() {
  const { id } = useParams<{ id: string }>();
  const [meetup, setMeetup] = useState<Meetup | null>(null);
  const [members, setMembers] = useState<MeetupMember[]>([]);

  useEffect(() => {
    if (!id) return;
    getMeetups().then((meetups) => {
      setMeetup(meetups.find(m => m.id === id) ?? null);
    });
    getMeetupMembers(id).then(setMembers);
  }, [id]);

  async function handlePaymentChange(memberId: string, status: string) {
    await updateMeetupMemberPayment(memberId, status);
    setMembers(members.map(m =>
      m.id === memberId ? { ...m, payment_status: status } : m
    ));
  }

  if (!meetup) {
    return <div className="empty-state">Meetup not found</div>;
  }

  const statusInfo = (status: string) => STATUS_LABELS[status] ?? STATUS_LABELS.pending;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/meetups" className="btn btn-sm">&larr; Back to Meetups</Link>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <div>
            <div className="detail-title">{meetup.name}</div>
            <div className="detail-meta">
              {meetup.host_name ?? 'Member'} &middot; {formatDate(meetup.meetup_date)} &middot; {meetup.location_name}
            </div>
          </div>
          <div className="btn-group">
            <Link to={`/meetups/${meetup.id}/edit`} className="btn btn-sm">Edit</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ fontSize: 13 }}>
            <strong>Spots:</strong> {meetup.member_count ?? 0}/{meetup.total_slots}
          </div>
          <div style={{ fontSize: 13 }}>
            <strong>Cost:</strong> {meetup.cost}
          </div>
          {meetup.is_fe_coordinated && (
            <span style={{ backgroundColor: '#FFEE54', color: '#000', fontWeight: 'bold', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
              FE Coordinated
            </span>
          )}
        </div>

        {meetup.stripe_payment_url && (
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            <strong>Stripe URL:</strong>{' '}
            <a href={meetup.stripe_payment_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
              {meetup.stripe_payment_url}
            </a>
          </div>
        )}

        {meetup.description && (
          <div className="detail-body" style={{ marginBottom: 16 }}>{meetup.description}</div>
        )}

        <h3 className="section-title" style={{ marginTop: 24 }}>
          Attendees ({members.length})
        </h3>

        {members.length === 0 ? (
          <div className="empty-state">No attendees yet</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Joined</th>
                  {meetup.is_fe_coordinated && <th>Payment</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const si = statusInfo(m.payment_status);
                  return (
                    <tr key={m.id}>
                      <td>
                        <Link to={`/users/${m.user_id}`} className="link">
                          {m.member_name ?? 'Member'}
                        </Link>
                      </td>
                      <td>{formatShortDate(m.joined_at)}</td>
                      {meetup.is_fe_coordinated && (
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                            {m.payment_status !== 'paid' && (
                              <button
                                className="btn btn-sm"
                                style={{ fontSize: 11, padding: '1px 6px' }}
                                onClick={() => handlePaymentChange(m.id, 'paid')}
                              >
                                Mark Paid
                              </button>
                            )}
                            {m.payment_status !== 'waived' && (
                              <button
                                className="btn btn-sm"
                                style={{ fontSize: 11, padding: '1px 6px' }}
                                onClick={() => handlePaymentChange(m.id, 'waived')}
                              >
                                Waive
                              </button>
                            )}
                            {m.payment_status !== 'pending' && (
                              <button
                                className="btn btn-sm"
                                style={{ fontSize: 11, padding: '1px 6px' }}
                                onClick={() => handlePaymentChange(m.id, 'pending')}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
