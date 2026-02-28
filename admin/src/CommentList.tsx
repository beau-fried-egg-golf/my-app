import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getComments, getCommentCollections, suspendComment, unsuspendComment, deleteCommentAdmin } from './storage';
import type { Comment, CommentCollection } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(c: Comment): { label: string; className: string } {
  if (c.is_deleted) return { label: 'Deleted', className: 'badge badge-hidden' };
  if (c.is_suspended) return { label: 'Suspended', className: 'badge badge-hidden' };
  if (c.is_edited) return { label: 'Edited', className: 'badge' };
  return { label: 'Active', className: 'badge badge-visible' };
}

export default function CommentList() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [collections, setCollections] = useState<CommentCollection[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'deleted'>('all');
  const [collectionFilter, setCollectionFilter] = useState('');

  useEffect(() => {
    Promise.all([
      getComments(),
      getCommentCollections(),
    ]).then(([c, cols]) => {
      setComments(c);
      setCollections(cols);
    });
  }, []);

  async function reload() {
    const c = await getComments();
    setComments(c);
  }

  async function handleSuspend(id: string) {
    await suspendComment(id);
    reload();
  }

  async function handleUnsuspend(id: string) {
    await unsuspendComment(id);
    reload();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Permanently delete this comment? This will also remove all replies, reactions, and images.')) return;
    await deleteCommentAdmin(id);
    reload();
  }

  const filtered = useMemo(() => {
    let result = [...comments];

    if (statusFilter === 'active') {
      result = result.filter(c => !c.is_deleted && !c.is_suspended);
    } else if (statusFilter === 'suspended') {
      result = result.filter(c => c.is_suspended);
    } else if (statusFilter === 'deleted') {
      result = result.filter(c => c.is_deleted);
    }

    if (collectionFilter) {
      result = result.filter(c => c.collection_slug === collectionFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          c.body_text.toLowerCase().includes(q) ||
          c.member_name.toLowerCase().includes(q) ||
          c.article_slug.toLowerCase().includes(q),
      );
    }

    return result;
  }, [comments, search, statusFilter, collectionFilter]);

  return (
    <div>
      <nav className="page-tabs">
        <NavLink to="/comments" end className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Comments</NavLink>
        <NavLink to="/comments/collections" className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Collections</NavLink>
        <NavLink to="/comments/install" className={({ isActive }) => `page-tab${isActive ? ' active' : ''}`}>Install Guide</NavLink>
      </nav>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search content, author, or article..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{ width: 140 }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
        <select
          className="filter-input"
          value={collectionFilter}
          onChange={e => setCollectionFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="">All Collections</option>
          {collections.map(col => (
            <option key={col.id} value={col.collection_slug}>
              {col.collection_name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Content</th>
              <th>Author</th>
              <th>Article</th>
              <th>Status</th>
              <th>Reactions</th>
              <th>Replies</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const status = getStatusBadge(c);
              return (
                <tr key={c.id}>
                  <td>
                    <Link to={`/comments/${c.id}`} className="link">
                      <span className="truncate" style={{ display: 'inline-block', maxWidth: 250 }}>
                        {c.body_text.length > 80 ? c.body_text.slice(0, 80) + '...' : c.body_text}
                      </span>
                    </Link>
                    {c.parent_id && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4, backgroundColor: '#e8f4fd', color: '#1a73e8' }}>
                        REPLY
                      </span>
                    )}
                  </td>
                  <td>{c.member_name}</td>
                  <td>
                    <span className="truncate" style={{ display: 'inline-block', maxWidth: 150 }}>
                      {c.article_slug}
                    </span>
                  </td>
                  <td><span className={status.className}>{status.label}</span></td>
                  <td>{c.reaction_count ?? 0}</td>
                  <td>{c.reply_count ?? 0}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td>
                    <div className="btn-group">
                      {c.is_suspended ? (
                        <button className="btn btn-sm" onClick={() => handleUnsuspend(c.id)}>
                          Unsuspend
                        </button>
                      ) : !c.is_deleted ? (
                        <button className="btn btn-sm" onClick={() => handleSuspend(c.id)}>
                          Suspend
                        </button>
                      ) : null}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No comments found</div>}
      </div>
    </div>
  );
}
