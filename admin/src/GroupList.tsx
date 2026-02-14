import { useEffect, useState } from 'react';
import { getGroups } from './storage';
import type { Group } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  const filtered = groups.filter(g => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Groups</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="form-input"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Creator</th>
              <th>Members</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.name}</strong></td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.description || '-'}
                </td>
                <td>{g.creator_name ?? 'Member'}</td>
                <td>{g.member_count ?? 0}</td>
                <td>{formatDate(g.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No groups</div>}
      </div>
    </div>
  );
}
