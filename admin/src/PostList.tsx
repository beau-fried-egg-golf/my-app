import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPosts, deletePost, togglePostPinned } from './storage';
import type { Post } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPosts().then(setPosts);
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this post permanently?')) return;
    await deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function handleTogglePin(id: string) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    await togglePostPinned(id, !!post.pinned);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  }

  const filtered = useMemo(() => {
    let result = [...posts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.content.toLowerCase().includes(q) || (p.author_name ?? '').toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, search]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Posts</h1>
        <button className="btn btn-primary" onClick={() => navigate('/posts/fe-post')}>
          Create FE Post
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search content or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Content</th>
              <th>Author</th>
              <th>Date</th>
              <th>Photos</th>
              <th>Reactions</th>
              <th>Replies</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <Link to={`/posts/${p.id}`} className="link">
                    <span className="truncate" style={{ display: 'inline-block', maxWidth: 300 }}>
                      {p.content.length > 80 ? p.content.slice(0, 80) + '...' : p.content}
                    </span>
                  </Link>
                  {p.pinned && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4, backgroundColor: '#fef3c7', color: '#92400e' }}>
                      PINNED
                    </span>
                  )}
                </td>
                <td>
                  <Link to={`/users/${p.user_id}`} className="link">
                    {p.author_name ?? p.user_id.slice(0, 8)}
                  </Link>
                </td>
                <td>{formatDate(p.created_at)}</td>
                <td>{p.photos.length}</td>
                <td>{p.reaction_count}</td>
                <td>{p.reply_count}</td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm"
                      style={p.pinned ? { backgroundColor: '#fef3c7', color: '#92400e' } : undefined}
                      onClick={() => handleTogglePin(p.id)}
                    >
                      {p.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No posts found</div>}
      </div>
    </div>
  );
}
