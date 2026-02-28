import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getCommentCollections, upsertCommentCollection, toggleCommentCollection } from './storage';
import type { CommentCollection } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CommentCollections() {
  const [collections, setCollections] = useState<CommentCollection[]>([]);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCommentCollections().then(setCollections);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !name.trim()) return;
    setSaving(true);
    await upsertCommentCollection({
      collection_slug: slug.trim().toLowerCase(),
      collection_name: name.trim(),
      is_enabled: true,
    });
    const updated = await getCommentCollections();
    setCollections(updated);
    setSlug('');
    setName('');
    setSaving(false);
  }

  async function handleToggle(id: string, currentEnabled: boolean) {
    await toggleCommentCollection(id, !currentEnabled);
    setCollections(prev =>
      prev.map(c => c.id === id ? { ...c, is_enabled: !currentEnabled } : c),
    );
  }

  return (
    <div>
      <nav className="page-tabs">
        <NavLink to="/comments" end className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Comments</NavLink>
        <NavLink to="/comments/collections" className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Collections</NavLink>
        <NavLink to="/comments/install" className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Install Guide</NavLink>
      </nav>

      <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px' }}>Add Collection</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Slug</label>
            <input
              className="form-input"
              type="text"
              placeholder="articles"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              style={{ width: 200 }}
            />
          </div>
          <div>
            <label className="form-label">Display Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Articles"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: 200 }}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          The slug must match the Webflow CMS collection slug used in the embed code.
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Slug</th>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id}>
                <td><code>{c.collection_slug}</code></td>
                <td>{c.collection_name}</td>
                <td>
                  <span
                    className={`badge ${c.is_enabled ? 'badge-visible' : 'badge-hidden'}`}
                  >
                    {c.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td>{formatDate(c.created_at)}</td>
                <td>
                  <button
                    className={`btn btn-sm ${c.is_enabled ? 'btn-danger' : ''}`}
                    onClick={() => handleToggle(c.id, c.is_enabled)}
                  >
                    {c.is_enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {collections.length === 0 && (
          <div className="empty-state">No collections configured</div>
        )}
      </div>
    </div>
  );
}
