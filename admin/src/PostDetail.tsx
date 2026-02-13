import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPosts, getPostReplies, deletePost, deletePostReply, togglePostHidden } from './storage';
import type { Post, PostReply } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<PostReply[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPosts().then(posts => {
      const found = posts.find(p => p.id === id);
      setPost(found ?? null);
    });
    if (id) {
      getPostReplies(id).then(setReplies);
    }
  }, [id]);

  async function handleToggleHidden() {
    if (!post) return;
    await togglePostHidden(post.id, post.hidden);
    setPost({ ...post, hidden: !post.hidden });
  }

  async function handleDeletePost() {
    if (!post || !window.confirm('Delete this post permanently?')) return;
    setDeleting(true);
    await deletePost(post.id);
    window.location.hash = '#/posts';
  }

  async function handleDeleteReply(replyId: string) {
    if (!window.confirm('Delete this reply permanently?')) return;
    await deletePostReply(replyId);
    setReplies(replies.filter(r => r.id !== replyId));
  }

  if (!post) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Link to="/posts" className="btn btn-sm">&larr; Back to Posts</Link>
        </div>
        <div className="empty-state">Post not found</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/posts" className="btn btn-sm">&larr; Back to Posts</Link>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <div>
            <div className="detail-meta">
              <Link to={`/users/${post.user_id}`} className="link">
                {post.author_name ?? post.user_id.slice(0, 8)}
              </Link>
              {' '}&middot; {formatDate(post.created_at)}
            </div>
          </div>
          <div className="btn-group" style={{ marginLeft: 'auto' }}>
            <button className="btn btn-sm" onClick={handleToggleHidden}>
              {post.hidden ? 'Unhide' : 'Hide'}
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleDeletePost}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Post'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span className={`badge ${post.hidden ? 'badge-hidden' : 'badge-visible'}`}>
            {post.hidden ? 'Hidden' : 'Visible'}
          </span>
        </div>

        <div style={{ margin: '16px 0', fontSize: 15, lineHeight: 1.6 }}>
          {post.content}
        </div>

        {post.photos.length > 0 && (
          <>
            <h3 className="section-title">Photos ({post.photos.length})</h3>
            <div className="photo-grid">
              {post.photos.map(photo => (
                <div key={photo.id} className="photo-card">
                  <div className="photo-wrapper">
                    <img src={photo.url} alt={photo.caption || 'Post photo'} />
                  </div>
                  {photo.caption && (
                    <div className="photo-meta">{photo.caption}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 16, margin: '16px 0', fontSize: 14, color: '#666' }}>
          <span>{post.reaction_count} reaction{post.reaction_count !== 1 ? 's' : ''}</span>
          <span>{post.reply_count} repl{post.reply_count !== 1 ? 'ies' : 'y'}</span>
        </div>

        <h3 className="section-title" style={{ marginTop: 0 }}>
          Replies ({replies.length})
        </h3>

        {replies.length === 0 ? (
          <div className="empty-state">No replies on this post</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Content</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {replies.map(r => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/users/${r.user_id}`} className="link">
                        {r.author_name ?? r.user_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{r.content}</td>
                    <td>{formatTime(r.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteReply(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
