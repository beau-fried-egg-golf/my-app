import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getWriteups, getActivities, getProfiles, getPosts, getConversations } from './storage';
import type { Course, Writeup, Activity, Profile, Post, Conversation } from './types';

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    Promise.all([
      getCourses(),
      getWriteups(),
      getActivities(),
      getProfiles(),
      getPosts(),
      getConversations(),
    ]).then(([c, w, a, p, po, co]) => {
      setCourses(c);
      setWriteups(w);
      setActivities(a);
      setProfiles(p);
      setPosts(po);
      setConversations(co);
    });
  }, []);

  const profileMap = new Map(profiles.map(p => [p.id, p.name]));
  const courseMap = new Map(courses.map(c => [c.id, c.short_name]));

  const visibleWriteups = writeups.filter((w) => !w.hidden).length;
  const hiddenWriteups = writeups.filter((w) => w.hidden).length;
  const allPhotos = writeups.flatMap((w) => w.photos ?? []);
  const visiblePhotos = allPhotos.filter((p) => !p.hidden).length;
  const hiddenPhotos = allPhotos.filter((p) => p.hidden).length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.message_count, 0);

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Courses</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Writeups</div>
          <div className="stat-value">{writeups.length}</div>
          <div className="stat-detail">
            {visibleWriteups} visible, {hiddenWriteups} hidden
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Photos</div>
          <div className="stat-value">{allPhotos.length}</div>
          <div className="stat-detail">
            {visiblePhotos} visible, {hiddenPhotos} hidden
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Posts</div>
          <div className="stat-value">{posts.length}</div>
          <div className="stat-detail">
            {posts.reduce((sum, p) => sum + p.reply_count, 0)} replies
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Users</div>
          <div className="stat-value">{profiles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Conversations</div>
          <div className="stat-value">{conversations.length}</div>
          <div className="stat-detail">
            {totalMessages} messages
          </div>
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 0 }}>Recent Activity</h2>
      <div className="activity-list">
        {activities.slice(0, 15).map((a) => (
          <div key={a.id} className="activity-item">
            <div style={{ flex: 1 }}>
              <strong>{profileMap.get(a.user_id) ?? 'Member'}</strong>{' '}
              {a.type === 'writeup' ? (
                <>
                  posted a writeup
                  {a.writeup_id && (
                    <> — <Link to={`/writeups/${a.writeup_id}`} className="link">View</Link></>
                  )}
                </>
              ) : a.type === 'upvote' ? (
                <>
                  upvoted a writeup
                  {a.writeup_id && (
                    <> — <Link to={`/writeups/${a.writeup_id}`} className="link">View</Link></>
                  )}
                </>
              ) : a.type === 'post' ? (
                <>
                  shared a post
                  {a.post_id && (
                    <> — <Link to={`/posts/${a.post_id}`} className="link">View</Link></>
                  )}
                </>
              ) : a.type === 'played' ? (
                <>
                  played {a.course_id ? courseMap.get(a.course_id) ?? 'a course' : 'a course'}
                </>
              ) : (
                <>{a.type}</>
              )}
            </div>
            <span className="activity-time">{formatTime(a.created_at)}</span>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="empty-state">No activity yet</div>
        )}
      </div>
    </div>
  );
}
