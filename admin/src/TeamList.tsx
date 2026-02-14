import { useEffect, useState } from 'react';
import { getAdminUsers, addAdminUser, removeAdminUser } from './storage';
import { supabase } from './supabase';
import type { AdminUser } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TeamList() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    getAdminUsers().then(setAdmins);
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentEmail(user?.email ?? null);
    });
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    await addAdminUser(email, name);
    const updated = await getAdminUsers();
    setAdmins(updated);
    setEmail('');
    setName('');
    setSaving(false);
  }

  async function handleRemove(id: string) {
    await removeAdminUser(id);
    setAdmins(admins.filter(a => a.id !== id));
    setRemoveId(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team</h1>
      </div>

      <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Invite Team Member</h3>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: 260 }}
            />
          </div>
          <div>
            <label className="form-label">Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Inviting...' : 'Invite'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          The invited person must have an existing account (signed up through the app) to log in.
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>{a.name || '-'}</td>
                <td>{formatDate(a.created_at)}</td>
                <td>
                  {a.email === currentEmail ? (
                    <span style={{ fontSize: 12, color: '#888' }}>You</span>
                  ) : removeId === a.id ? (
                    <div className="btn-group">
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemove(a.id)}>
                        Confirm
                      </button>
                      <button className="btn btn-sm" onClick={() => setRemoveId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-danger" onClick={() => setRemoveId(a.id)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && <div className="empty-state">No team members</div>}
      </div>
    </div>
  );
}
