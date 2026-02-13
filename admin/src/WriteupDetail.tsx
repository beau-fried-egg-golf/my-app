import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourses, getWriteups, updateWriteup, deleteWriteup, updatePhoto, getProfiles, getWriteupReplies, deleteWriteupReply } from './storage';
import type { Course, Writeup, Profile, WriteupReply } from './types';

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

export default function WriteupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [writeup, setWriteup] = useState<Writeup | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [replies, setReplies] = useState<WriteupReply[]>([]);

  useEffect(() => {
    Promise.all([getWriteups(), getCourses(), getProfiles()]).then(([ws, c, p]) => {
      setWriteup(ws.find((w) => w.id === id) ?? null);
      setCourses(c);
      setProfiles(p);
    });
    if (id) {
      getWriteupReplies(id).then(setReplies);
    }
  }, [id]);

  if (!writeup) {
    return <div className="empty-state">Review not found</div>;
  }

  const course = courses.find((c) => c.id === writeup.course_id);
  const author = profiles.find((p) => p.id === writeup.user_id);

  async function toggleHidden() {
    await updateWriteup(id!, { hidden: !writeup!.hidden });
    setWriteup({ ...writeup!, hidden: !writeup!.hidden });
  }

  async function togglePhotoHidden(photoId: string, currentHidden: boolean) {
    await updatePhoto(photoId, { hidden: !currentHidden });
    setWriteup({
      ...writeup!,
      photos: writeup!.photos?.map((p) =>
        p.id === photoId ? { ...p, hidden: !p.hidden } : p,
      ),
    });
  }

  async function handleDelete() {
    if (!window.confirm('Delete this review permanently?')) return;
    await deleteWriteup(id!);
    navigate('/writeups');
  }

  async function handleDeleteReply(replyId: string) {
    if (!window.confirm('Delete this reply permanently?')) return;
    await deleteWriteupReply(replyId);
    setReplies(replies.filter(r => r.id !== replyId));
  }

  const photos = writeup.photos ?? [];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/writeups" className="btn btn-sm">&larr; Back to Reviews</Link>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <div>
            <div className="detail-title">{writeup.title}</div>
            <div className="detail-meta">
              {course?.short_name ?? writeup.course_id} &middot; {formatDate(writeup.created_at)} &middot; by {author?.name ?? writeup.user_id.slice(0, 8)}
            </div>
          </div>
          <div className="btn-group">
            <button className="btn btn-sm" onClick={toggleHidden}>
              {writeup.hidden ? 'Unhide' : 'Hide'}
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <span className={`badge ${writeup.hidden ? 'badge-hidden' : 'badge-visible'}`}>
            {writeup.hidden ? 'Hidden' : 'Visible'}
          </span>
          {' '}
          <span style={{ fontSize: 13, color: '#888' }}>
            {writeup.upvote_count ?? 0} upvote{(writeup.upvote_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="detail-body">{writeup.content}</div>

        {photos.length > 0 && (
          <>
            <h3 className="section-title">Photos ({photos.length})</h3>
            <div className="detail-photos">
              {photos.map((photo) => (
                <div key={photo.id} className="detail-photo-item">
                  <img src={photo.url} alt={photo.caption || 'Photo'} />
                  <div className="detail-photo-overlay">
                    <span style={{ fontSize: 12, color: '#888' }}>
                      {photo.caption || 'No caption'}
                    </span>
                    <div className="btn-group">
                      <span className={`badge ${photo.hidden ? 'badge-hidden' : 'badge-visible'}`}>
                        {photo.hidden ? 'Hidden' : 'Visible'}
                      </span>
                      <button className="btn btn-sm" onClick={() => togglePhotoHidden(photo.id, photo.hidden)}>
                        {photo.hidden ? 'Unhide' : 'Hide'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="section-title" style={{ marginTop: 24 }}>
          Replies ({replies.length})
        </h3>

        {replies.length === 0 ? (
          <div className="empty-state">No replies on this review</div>
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
