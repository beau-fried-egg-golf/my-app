import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMeetups, deleteMeetup, suspendMeetup, toggleMeetupPinned } from './storage';
import type { Meetup } from './types';

type FEFilter = 'all' | 'yes' | 'no';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function MeetupList() {
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feFilter, setFEFilter] = useState<FEFilter>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getMeetups().then(setMeetups);
  }, []);

  const filtered = meetups.filter(m => {
    if (feFilter === 'yes' && !m.is_fe_coordinated) return false;
    if (feFilter === 'no' && m.is_fe_coordinated) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!m.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleDelete(id: string) {
    await deleteMeetup(id);
    setMeetups(meetups.filter(m => m.id !== id));
    setDeleteId(null);
  }

  async function handleSuspendToggle(id: string, currentlySuspended: boolean) {
    await suspendMeetup(id, !currentlySuspended);
    setMeetups(meetups.map(m => m.id === id ? { ...m, suspended: !currentlySuspended } : m));
  }

  async function handleTogglePin(id: string) {
    const meetup = meetups.find(m => m.id === id);
    if (!meetup) return;
    await toggleMeetupPinned(id, !!meetup.pinned);
    setMeetups(meetups.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Meetups</h1>
        <button className="btn btn-primary" onClick={() => navigate('/meetups/new')}>
          + Create Meetup
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <select
          className="form-input"
          value={feFilter}
          onChange={(e) => setFEFilter(e.target.value as FEFilter)}
          style={{ maxWidth: 180 }}
        >
          <option value="all">All Meetups</option>
          <option value="yes">FE Coordinated</option>
          <option value="no">Not FE Coordinated</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Host</th>
              <th>Date</th>
              <th>Location</th>
              <th>Spots</th>
              <th>Cost</th>
              <th>FE</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} style={m.suspended ? { opacity: 0.5 } : undefined}>
                <td>
                  <Link to={`/meetups/${m.id}`} className="link"><strong>{m.name}</strong></Link>
                  {m.pinned && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4, backgroundColor: '#fef3c7', color: '#92400e' }}>
                      PINNED
                    </span>
                  )}
                  {m.suspended && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4, backgroundColor: '#fecaca', color: '#991b1b' }}>
                      SUSPENDED
                    </span>
                  )}
                </td>
                <td>{m.host_name ?? 'Member'}</td>
                <td>{formatDate(m.meetup_date)}</td>
                <td>{m.location_name}</td>
                <td>{m.member_count ?? 0}/{m.total_slots}</td>
                <td>{m.cost}</td>
                <td>
                  {m.is_fe_coordinated ? (
                    <span style={{ backgroundColor: '#FFEE54', color: '#000', fontWeight: 'bold', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>FE</span>
                  ) : '-'}
                </td>
                <td>
                  <div className="btn-group">
                    <Link to={`/meetups/${m.id}/edit`} className="btn btn-sm">Edit</Link>
                    <button
                      className="btn btn-sm"
                      style={m.pinned ? { backgroundColor: '#fef3c7', color: '#92400e' } : undefined}
                      onClick={() => handleTogglePin(m.id)}
                    >
                      {m.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={m.suspended ? { backgroundColor: '#d1fae5', color: '#065f46' } : { backgroundColor: '#fef3c7', color: '#92400e' }}
                      onClick={() => handleSuspendToggle(m.id, !!m.suspended)}
                    >
                      {m.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    {deleteId === m.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>
                          Confirm
                        </button>
                        <button className="btn btn-sm" onClick={() => setDeleteId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(m.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No meetups</div>}
      </div>
    </div>
  );
}
