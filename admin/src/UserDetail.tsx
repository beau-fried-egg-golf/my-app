import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProfile, getWriteups, getCourses, getPosts, updateProfile } from './storage';
import type { Profile, Writeup, Course, Post } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    Promise.all([
      getProfile(id!),
      getWriteups(),
      getCourses(),
      getPosts(),
    ]).then(([p, ws, c, ps]) => {
      setProfile(p);
      setWriteups(ws.filter((w) => w.user_id === id));
      setCourses(c);
      setPosts(ps.filter((p) => p.user_id === id));
    });
  }, [id]);

  function getCourseName(courseId: string) {
    return courses.find((c) => c.id === courseId)?.short_name ?? courseId;
  }

  async function handleToggleSuspend() {
    if (!profile || !id) return;
    setSuspending(true);
    const newValue = !profile.suspended;
    await updateProfile(id, { suspended: newValue });
    setProfile({ ...profile, suspended: newValue });
    setSuspending(false);
  }

  const userName = profile?.name || `Member ${id?.slice(0, 6)}`;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/users" className="btn btn-sm">&larr; Back to Users</Link>
      </div>

      <div className="detail-container">
        <div className="detail-header">
          <div>
            <div className="detail-title">
              {userName}
              {profile?.suspended && (
                <span className="badge badge-hidden" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                  Suspended
                </span>
              )}
            </div>
            {profile && (
              <div className="detail-meta">
                {profile.location} &middot; Handicap: {profile.handicap ?? 'N/A'} &middot; Member since {formatDate(profile.member_since)}
                {profile.dms_disabled && (
                  <> &middot; <span style={{ color: '#999' }}>DMs disabled</span></>
                )}
              </div>
            )}
          </div>
          {profile && (
            <button
              className={`btn btn-sm ${profile.suspended ? '' : 'btn-danger'}`}
              onClick={handleToggleSuspend}
              disabled={suspending}
              style={{ marginLeft: 'auto' }}
            >
              {suspending
                ? 'Updating...'
                : profile.suspended
                  ? 'Unsuspend Account'
                  : 'Suspend Account'}
            </button>
          )}
        </div>

        <h3 className="section-title" style={{ marginTop: 0 }}>
          Reviews ({writeups.length})
        </h3>

        {writeups.length === 0 ? (
          <div className="empty-state">No reviews from this user</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Photos</th>
                  <th>Upvotes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {writeups
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link to={`/writeups/${w.id}`} className="link">{w.title}</Link>
                      </td>
                      <td>{getCourseName(w.course_id)}</td>
                      <td>{formatDate(w.created_at)}</td>
                      <td>{w.photos?.length ?? 0}</td>
                      <td>{w.upvote_count ?? 0}</td>
                      <td>
                        <span className={`badge ${w.hidden ? 'badge-hidden' : 'badge-visible'}`}>
                          {w.hidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="section-title">
          Posts ({posts.length})
        </h3>

        {posts.length === 0 ? (
          <div className="empty-state">No posts from this user</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Date</th>
                  <th>Photos</th>
                  <th>Reactions</th>
                  <th>Replies</th>
                </tr>
              </thead>
              <tbody>
                {posts
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/posts/${p.id}`} className="link">
                          <span className="truncate" style={{ display: 'inline-block', maxWidth: 300 }}>
                            {p.content.length > 80 ? p.content.slice(0, 80) + '...' : p.content}
                          </span>
                        </Link>
                      </td>
                      <td>{formatDate(p.created_at)}</td>
                      <td>{p.photos.length}</td>
                      <td>{p.reaction_count}</td>
                      <td>{p.reply_count}</td>
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
