import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getComment,
  getCommentReactions,
  getCommentEditHistory,
  getCommentReplies,
  suspendComment,
  unsuspendComment,
  deleteCommentAdmin,
} from './storage';
import type { Comment, CommentReaction, CommentEditHistoryEntry } from './types';

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

function getStatusBadges(c: Comment): { label: string; className: string }[] {
  const badges: { label: string; className: string }[] = [];
  if (c.is_deleted) badges.push({ label: 'Deleted', className: 'badge badge-hidden' });
  if (c.is_suspended) badges.push({ label: 'Suspended', className: 'badge badge-hidden' });
  if (c.is_edited) badges.push({ label: 'Edited', className: 'badge' });
  if (!c.is_deleted && !c.is_suspended) badges.push({ label: 'Active', className: 'badge badge-visible' });
  return badges;
}

export default function CommentDetail() {
  const { id } = useParams<{ id: string }>();
  const [comment, setComment] = useState<Comment | null>(null);
  const [reactions, setReactions] = useState<CommentReaction[]>([]);
  const [editHistory, setEditHistory] = useState<CommentEditHistoryEntry[]>([]);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    getComment(id).then(setComment);
    getCommentReactions(id).then(setReactions);
    getCommentEditHistory(id).then(setEditHistory);
    getCommentReplies(id).then(setReplies);
  }, [id]);

  async function handleSuspend() {
    if (!comment) return;
    await suspendComment(comment.id);
    setComment({ ...comment, is_suspended: true });
  }

  async function handleUnsuspend() {
    if (!comment) return;
    await unsuspendComment(comment.id);
    setComment({ ...comment, is_suspended: false });
  }

  async function handleDelete() {
    if (!comment) return;
    setDeleting(true);
    await deleteCommentAdmin(comment.id);
    window.location.hash = '#/comments';
  }

  if (!comment) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Link to="/comments" className="btn btn-sm">&larr; Back to Comments</Link>
        </div>
        <div className="empty-state">Comment not found</div>
      </div>
    );
  }

  const badges = getStatusBadges(comment);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/comments" className="btn btn-sm">&larr; Back to Comments</Link>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <div>
            <div className="detail-meta">
              {comment.member_name} &middot; {formatDate(comment.created_at)}
            </div>
          </div>
          <div className="btn-group" style={{ marginLeft: 'auto' }}>
            {comment.is_suspended ? (
              <button className="btn btn-sm" onClick={handleUnsuspend}>
                Unsuspend
              </button>
            ) : !comment.is_deleted ? (
              <button className="btn btn-sm" onClick={handleSuspend}>
                Suspend
              </button>
            ) : null}
            {confirmDelete ? (
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          {badges.map((b, i) => (
            <span key={i} className={b.className}>{b.label}</span>
          ))}
        </div>

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 12px', fontSize: 14, color: '#666', marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>Article:</span>
          <span>{comment.article_slug}</span>
          <span style={{ fontWeight: 600 }}>Collection:</span>
          <span>{comment.collection_slug}</span>
          <span style={{ fontWeight: 600 }}>Member ID:</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{comment.member_id}</span>
          {comment.parent_id && (
            <>
              <span style={{ fontWeight: 600 }}>Parent:</span>
              <Link to={`/comments/${comment.parent_id}`} className="link">
                {comment.parent_id.slice(0, 8)}...
              </Link>
            </>
          )}
        </div>

        {/* Body */}
        <h3 className="section-title">Content</h3>
        <div
          style={{ margin: '8px 0 16px', padding: 16, border: '1px solid #eee', borderRadius: 8, fontSize: 15, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: comment.body_html || comment.body_text }}
        />

        {/* Images */}
        {comment.images && comment.images.length > 0 && (
          <>
            <h3 className="section-title">Images ({comment.images.length})</h3>
            <div className="photo-grid">
              {comment.images.map(img => (
                <div key={img.id} className="photo-card">
                  <div className="photo-wrapper">
                    <img src={img.url} alt="" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Reactions */}
        <h3 className="section-title">Reactions ({reactions.length})</h3>
        {reactions.length === 0 ? (
          <div className="empty-state">No reactions</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Emoji</th>
                  <th>Member</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reactions.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 20 }}>{r.emoji}</td>
                    <td>{r.member_name}</td>
                    <td>{formatTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit History */}
        <h3 className="section-title">Edit History ({editHistory.length})</h3>
        {editHistory.length === 0 ? (
          <div className="empty-state">No edits</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Previous Content</th>
                  <th>Edited At</th>
                </tr>
              </thead>
              <tbody>
                {editHistory.map(h => (
                  <tr key={h.id}>
                    <td>{h.body_text.length > 120 ? h.body_text.slice(0, 120) + '...' : h.body_text}</td>
                    <td>{formatTime(h.edited_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Replies */}
        <h3 className="section-title">Replies ({replies.length})</h3>
        {replies.length === 0 ? (
          <div className="empty-state">No replies</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {replies.map(r => (
                  <tr key={r.id}>
                    <td>{r.member_name}</td>
                    <td>
                      <Link to={`/comments/${r.id}`} className="link">
                        {r.body_text.length > 80 ? r.body_text.slice(0, 80) + '...' : r.body_text}
                      </Link>
                    </td>
                    <td>
                      {r.is_deleted ? (
                        <span className="badge badge-hidden">Deleted</span>
                      ) : r.is_suspended ? (
                        <span className="badge badge-hidden">Suspended</span>
                      ) : (
                        <span className="badge badge-visible">Active</span>
                      )}
                    </td>
                    <td>{formatTime(r.created_at)}</td>
                    <td>
                      <Link to={`/comments/${r.id}`} className="btn btn-sm">
                        View
                      </Link>
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
