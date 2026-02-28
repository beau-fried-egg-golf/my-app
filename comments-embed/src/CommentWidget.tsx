import { useEffect, useState, useRef, useCallback } from 'react';
import { FUNCTIONS_URL, REST_URL, restHeaders } from './supabase';
import CommentEditor from './CommentEditor';
import type { Comment, CommentReaction, MemberstackMember } from './types';

/* ── Lightbox ── */

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: { url: string }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const total = images.length;

  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  return (
    <div className="fegc-comments-lightbox" onClick={onClose}>
      <div className="fegc-comments-lightbox-inner" onClick={e => e.stopPropagation()}>
        {total > 1 && (
          <span className="fegc-comments-lightbox-counter">{index + 1} / {total}</span>
        )}
        <button className="fegc-comments-lightbox-close" onClick={onClose}>&times;</button>
        {total > 1 && (
          <button className="fegc-comments-lightbox-prev" onClick={prev}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        <img src={images[index].url} alt="" className="fegc-comments-lightbox-img" />
        {total > 1 && (
          <button className="fegc-comments-lightbox-next" onClick={next}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  articleSlug: string;
  collection: string;
  member: MemberstackMember | null;
  getToken: () => Promise<string | null>;
}

interface PendingImage {
  url: string;
  storage_path: string;
}

const PAGE_SIZE = 20;

/* ── SVG Icons ── */

const REACTION_EMOJIS = ['\u2764\uFE0F', '\uD83D\uDD25', '\uD83D\uDC4D', '\uD83D\uDE02']; // ❤️ 🔥 👍 😂

const ReplyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M8 5L4 9l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 9h8a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function ReactionBadge({
  emoji,
  reactions,
  userReacted,
  onToggle,
  disabled,
}: {
  emoji: string;
  reactions: CommentReaction[];
  userReacted: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const count = reactions.length;
  if (count === 0 && disabled) return null;

  const names = reactions.map(r => r.member_name).filter(Boolean);
  let tooltipText = '';
  if (names.length <= 3) {
    tooltipText = names.join(', ');
  } else {
    tooltipText = `${names.slice(0, 3).join(', ')}, and ${names.length - 3} other${names.length - 3 > 1 ? 's' : ''}`;
  }

  return (
    <span
      className="fegc-comments-reaction-badge-wrap"
      onMouseEnter={() => count > 0 && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && tooltipText && (
        <span className="fegc-comments-reaction-tooltip">
          {tooltipText}
          <span className="fegc-comments-reaction-tooltip-arrow" />
        </span>
      )}
      <button
        className={`fegc-comments-reaction-badge ${userReacted ? 'fegc-comments-reaction-badge-active' : ''} ${count === 0 ? 'fegc-comments-reaction-badge-empty' : ''}`}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className="fegc-comments-reaction-badge-emoji">{emoji}</span>
        {count > 0 && <span className="fegc-comments-reaction-badge-count">{count}</span>}
      </button>
    </span>
  );
}

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
    <circle cx="10" cy="7" r="3.5"/>
    <path d="M3.5 17.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/>
  </svg>
);

/* ── Helpers ── */

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ── Comment Item ── */

function CommentItem({
  comment,
  member,
  getToken,
  onUpdate,
  onReply,
  isReply,
  replyToName,
}: {
  comment: Comment;
  member: MemberstackMember | null;
  getToken: () => Promise<string | null>;
  onUpdate: () => void;
  onReply?: (parentId: string) => void;
  isReply?: boolean;
  replyToName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reactionToggling, setReactionToggling] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOwner = member && comment.member_id === member.id;

  // Group reactions by emoji
  const reactionsByEmoji = new Map<string, CommentReaction[]>();
  for (const r of comment.reactions) {
    const list = reactionsByEmoji.get(r.emoji) ?? [];
    list.push(r);
    reactionsByEmoji.set(r.emoji, list);
  }

  async function handleReactionToggle(emoji: string) {
    if (!member || reactionToggling) return;
    const tkn = await getToken();
    if (!tkn) return;
    setReactionToggling(true);
    await fetch(`${FUNCTIONS_URL}/comments-reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tkn}`,
      },
      body: JSON.stringify({ comment_id: comment.id, emoji, member_id: member.id }),
    });
    setReactionToggling(false);
    onUpdate();
  }

  async function handleEdit(data: { html: string; json: unknown; text: string }) {
    const tkn = await getToken();
    if (!tkn) return;
    setSaving(true);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/comments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tkn}`,
        },
        body: JSON.stringify({
          comment_id: comment.id,
          body_text: data.text,
          body_html: data.html,
          body_json: data.json,
          member_id: member?.id,
        }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdate();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this comment?')) return;
    const tkn = await getToken();
    if (!tkn) return;
    const params = new URLSearchParams({ comment_id: comment.id, member_id: member?.id ?? '' });
    await fetch(`${FUNCTIONS_URL}/comments?${params}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tkn}`,
      },
    });
    onUpdate();
  }

  if (comment.is_deleted) {
    return (
      <div className={`fegc-comments-item ${isReply ? 'fegc-comments-reply' : ''}`}>
        <div className="fegc-comments-deleted">[This comment has been removed]</div>
      </div>
    );
  }

  if (comment.is_suspended) {
    return (
      <div className={`fegc-comments-item ${isReply ? 'fegc-comments-reply' : ''}`}>
        <div className="fegc-comments-deleted">[This comment has been suspended]</div>
      </div>
    );
  }

  return (
    <div className={`fegc-comments-item ${isReply ? 'fegc-comments-reply' : ''}`}>
      <div className="fegc-comments-item-header">
        {comment.member_avatar_url ? (
          <img
            src={comment.member_avatar_url}
            alt={comment.member_name}
            className="fegc-comments-avatar"
          />
        ) : (
          <div className="fegc-comments-avatar-placeholder">
            <PersonIcon />
          </div>
        )}
        <div className="fegc-comments-meta">
          <span className="fegc-comments-author">{comment.member_name}</span>
          {replyToName && (
            <span className="fegc-comments-reply-context">
              <ReplyIcon /> {replyToName}
            </span>
          )}
          <span className="fegc-comments-time">{formatTime(comment.created_at)}</span>
          {comment.is_edited && (
            <span className="fegc-comments-edited">(edited)</span>
          )}
        </div>
      </div>

      {editing ? (
        <CommentEditor
          initialContent={comment.body_json}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          submitLabel="Save"
          submitting={saving}
          autoFocus
        />
      ) : (
        <div
          className="fegc-comments-body"
          dangerouslySetInnerHTML={{ __html: comment.body_html || comment.body_text }}
        />
      )}

      {/* Images */}
      {comment.images && comment.images.length > 0 && (
        <>
          <div className="fegc-comments-images">
            {comment.images.map((img, i) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                className="fegc-comments-image-thumb"
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
          {lightboxIndex !== null && (
            <Lightbox
              images={comment.images}
              startIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </>
      )}

      {/* Reactions row */}
      <div className="fegc-comments-reactions-row">
        {REACTION_EMOJIS.map((emoji) => (
          <ReactionBadge
            key={emoji}
            emoji={emoji}
            reactions={reactionsByEmoji.get(emoji) ?? []}
            userReacted={member ? (reactionsByEmoji.get(emoji) ?? []).some(r => r.member_id === member.id) : false}
            onToggle={() => handleReactionToggle(emoji)}
            disabled={!member}
          />
        ))}
      </div>

      {/* Actions: reply + owner actions */}
      <div className="fegc-comments-actions">
        {onReply && member && (
          <button
            className="fegc-comments-action-btn"
            onClick={() => onReply(comment.id)}
          >
            <ReplyIcon />
            Reply
          </button>
        )}

        {isOwner && !editing && (
          <>
            <button
              className="fegc-comments-action-btn"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="fegc-comments-action-btn fegc-comments-action-delete"
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Widget ── */

export default function CommentWidget({ articleSlug, collection, member, getToken }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadComments() {
    try {
      const collRes = await fetch(
        `${REST_URL}/comment_collections?collection_slug=eq.${encodeURIComponent(collection)}&select=is_enabled&limit=1`,
        { headers: restHeaders },
      );
      const collData = await collRes.json();
      if (!collData?.[0]?.is_enabled) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      const commentsRes = await fetch(
        `${REST_URL}/comments?article_slug=eq.${encodeURIComponent(articleSlug)}&collection_slug=eq.${encodeURIComponent(collection)}&is_deleted=eq.false&order=created_at.asc`,
        { headers: restHeaders },
      );
      const commentsData = await commentsRes.json();
      const commentIds = (commentsData ?? []).map((c: { id: string }) => c.id);

      if (commentIds.length === 0) {
        setComments([]);
        setEnabled(true);
        setLoading(false);
        return;
      }

      const idsParam = `(${commentIds.join(',')})`;
      const [reactionsRes, imagesRes] = await Promise.all([
        fetch(`${REST_URL}/comment_reactions?comment_id=in.${idsParam}&select=*`, { headers: restHeaders }),
        fetch(`${REST_URL}/comment_images?comment_id=in.${idsParam}&order=position.asc&select=*`, { headers: restHeaders }),
      ]);

      const reactionsData = await reactionsRes.json();
      const imagesData = await imagesRes.json();

      const reactionsByComment = new Map<string, unknown[]>();
      for (const r of reactionsData ?? []) {
        const list = reactionsByComment.get(r.comment_id) ?? [];
        list.push(r);
        reactionsByComment.set(r.comment_id, list);
      }

      const imagesByComment = new Map<string, unknown[]>();
      for (const img of imagesData ?? []) {
        const list = imagesByComment.get(img.comment_id) ?? [];
        list.push(img);
        imagesByComment.set(img.comment_id, list);
      }

      const enriched = (commentsData ?? []).map((c: Record<string, unknown>) => ({
        ...c,
        reactions: reactionsByComment.get(c.id as string) ?? [],
        images: imagesByComment.get(c.id as string) ?? [],
      }));

      setComments(enriched as Comment[]);
      setEnabled(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [articleSlug, collection]);

  async function handleSubmit(data: { html: string; json: unknown; text: string }, parentId?: string) {
    setSubmitting(true);
    setError(null);

    const token = await getToken();
    if (!token) {
      setError('Please sign in again to post a comment.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${FUNCTIONS_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_slug: articleSlug,
          collection,
          body_text: data.text,
          body_html: data.html,
          body_json: data.json,
          parent_id: parentId ?? null,
          images: parentId ? [] : pendingImages,
          member_id: member?.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Failed to post comment (${res.status})`);
        return;
      }

      if (!parentId) {
        setEditorKey(k => k + 1);
        setPendingImages([]);
      }
      setReplyingTo(null);
      await loadComments();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageUpload(files: FileList) {
    if (!member) return;
    const token = await getToken();
    if (!token) return;
    const remaining = 5 - pendingImages.length;
    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('member_id', member.id);

      try {
        const res = await fetch(`${FUNCTIONS_URL}/comments-images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setPendingImages(prev => [...prev, { url: data.url, storage_path: data.storage_path }]);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Failed to upload image');
        }
      } catch {
        setError('Failed to upload image');
      }
      setUploadingImage(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  }

  function handleLogin() {
    const ms = (window as unknown as Record<string, unknown>).$memberstackDom;
    if (ms && typeof (ms as { openModal: (t: string) => void }).openModal === 'function') {
      (ms as { openModal: (t: string) => void }).openModal('LOGIN');
    }
  }

  if (loading) {
    return <div className="fegc-comments-loading">Loading comments...</div>;
  }

  if (!enabled) {
    return null;
  }

  // Build lookup maps for threading
  const commentById = new Map<string, Comment>();
  for (const c of comments) commentById.set(c.id, c);

  // Walk up the parent chain to find the root ancestor
  function getRootId(c: Comment): string {
    let current = c;
    while (current.parent_id && commentById.has(current.parent_id)) {
      current = commentById.get(current.parent_id)!;
    }
    return current.id;
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  // Group ALL descendants under their root ancestor
  const repliesByRoot = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!c.parent_id) continue;
    const rootId = getRootId(c);
    const list = repliesByRoot.get(rootId) ?? [];
    list.push(c);
    repliesByRoot.set(rootId, list);
  }

  const visibleTopLevel = topLevel.slice(0, visibleCount);
  const hasMore = topLevel.length > visibleCount;

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      multiple
      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
      style={{ display: 'none' }}
    />
  );

  const pendingImagesSlot = (pendingImages.length > 0 || uploadingImage) ? (
    <div className="fegc-comments-pending-images-wrap">
      {pendingImages.map((img, i) => (
        <div key={i} className="fegc-comments-pending-image">
          <img src={img.url} alt="" />
          <button
            className="fegc-comments-pending-image-remove"
            onClick={() => removeImage(i)}
            title="Remove image"
          >
            &times;
          </button>
        </div>
      ))}
      {uploadingImage && (
        <div className="fegc-comments-pending-image fegc-comments-pending-image-loading">
          <span>...</span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="fegc-comments-container">
      {!member ? (
        <div className="fegc-comments-login-prompt">
          {/* Static preview of editor — non-interactive */}
          <div className="fegc-comments-login-preview">
            <div className="fegc-comments-login-preview-content">
              <div className="fegc-comments-login-preview-box">
                <span className="fegc-comments-login-preview-placeholder">GIVE US YOUR THOUGHTS...</span>
              </div>
            </div>
            <div className="fegc-comments-login-preview-gradient" />
          </div>

          {/* CTA */}
          <div className="fegc-comments-login-cta">
            <h2 className="fegc-comments-login-heading">
              Engage in our content with thousands of other Fried Egg Golf Members
            </h2>
            <div className="fegc-comments-login-actions">
              <a href="https://www.thefriedegg.com/fried-egg-golf-club" className="fegc-comments-login-btn">
                <span className="fegc-comments-btn-text-clip">
                  <span className="fegc-comments-btn-roll">
                    <span>Join the Club</span>
                    <span>Join the Club</span>
                  </span>
                </span>
              </a>
              <a href="https://www.thefriedegg.com/login" className="fegc-comments-login-link">
                <span className="fegc-comments-btn-text-clip">
                  <span className="fegc-comments-btn-roll">
                    <span>Log In</span>
                    <span>Log In</span>
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          {fileInput}


          {/* Compose */}
          <div className="fegc-comments-compose">
            <CommentEditor
              key={editorKey}
              onSubmit={(data) => handleSubmit(data)}
              submitting={submitting}
              onAttach={() => fileInputRef.current?.click()}
              attachCount={pendingImages.length || undefined}
              attachSlot={pendingImagesSlot}
            />

            {error && (
              <div className="fegc-comments-error">
                {error}
                <button
                  className="fegc-comments-error-dismiss"
                  onClick={() => setError(null)}
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          {/* Comments */}
          {topLevel.length === 0 ? null : (
            <div className="fegc-comments-list">
              {visibleTopLevel.map((comment) => {
                const threadReplies = repliesByRoot.get(comment.id) ?? [];
                // Show reply form at thread bottom if replying to any comment in this thread
                const replyTarget = replyingTo ? commentById.get(replyingTo) : null;
                const replyInThisThread = replyingTo === comment.id ||
                  (replyTarget && getRootId(replyTarget) === comment.id);

                return (
                  <div key={comment.id}>
                    <hr className="fegc-comments-divider" />

                    <CommentItem
                      comment={comment}
                      member={member}
                      getToken={getToken}
                      onUpdate={loadComments}
                      onReply={(parentId) => setReplyingTo(parentId)}
                    />

                    {/* Replies — all displayed at one indent level under root */}
                    {threadReplies.map((reply) => {
                      // If this reply's parent is another reply (not root), show who they're responding to
                      const replyParent = reply.parent_id && reply.parent_id !== comment.id
                        ? commentById.get(reply.parent_id)
                        : null;

                      return (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          member={member}
                          getToken={getToken}
                          onUpdate={loadComments}
                          onReply={(parentId) => setReplyingTo(parentId)}
                          isReply
                          replyToName={replyParent?.member_name}
                        />
                      );
                    })}

                    {/* Inline reply form — always at thread bottom */}
                    {replyInThisThread && replyingTo && (
                      <div className="fegc-comments-reply-form">
                        {replyingTo !== comment.id && replyTarget && (
                          <div className="fegc-comments-replying-to">
                            Replying to {replyTarget.member_name}
                          </div>
                        )}
                        <CommentEditor
                          placeholder="Write a reply..."
                          onSubmit={(data) => handleSubmit(data, replyingTo)}
                          onCancel={() => setReplyingTo(null)}
                          submitLabel="Reply"
                          submitting={submitting}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <div className="fegc-comments-load-more">
                  <button
                    className="fegc-comments-load-more-btn"
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  >
                    <span className="fegc-comments-btn-text-clip">
                      <span className="fegc-comments-btn-roll">
                        <span>Load More Comments</span>
                        <span>Load More Comments</span>
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
