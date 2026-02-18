import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabaseAuth } from './supabase';

const BUCKETS = [
  {
    key: 'community',
    label: 'Community',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    firstRoute: '/',
    items: [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/courses', label: 'Courses' },
      { to: '/writeups', label: 'Reviews' },
      { to: '/photos', label: 'Photos' },
      { to: '/posts', label: 'Posts' },
      { to: '/users', label: 'Users' },
      { to: '/messages', label: 'Messages' },
      { to: '/meetups', label: 'Meetups' },
      { to: '/groups', label: 'Groups' },
      { to: '/flags', label: 'Flagged' },
      { to: '/cancellations', label: 'Cancellations' },
      { to: '/email-templates', label: 'Emails' },
    ],
  },
  {
    key: 'content',
    label: 'Content',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    firstRoute: '/hole-annotations',
    items: [
      { to: '/hole-annotations', label: 'Annotations' },
    ],
  },
  {
    key: 'experiences',
    label: 'Experiences',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    firstRoute: '/experiences',
    items: [
      { to: '/experiences', label: 'Overview', end: true },
      { to: '/experiences/locations', label: 'Locations' },
      { to: '/experiences/packages', label: 'Packages' },
      { to: '/experiences/tee-times', label: 'Tee Times' },
      { to: '/experiences/reservations', label: 'Reservations' },
    ],
  },
] satisfies readonly { key: string; label: string; icon: ReactNode; firstRoute: string; items: { to: string; label: string; end?: boolean }[] }[];

function getActiveBucket(pathname: string) {
  if (pathname.startsWith('/hole-annotations')) return 'content';
  if (pathname.startsWith('/experiences')) return 'experiences';
  return 'community';
}

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeBucketKey = getActiveBucket(pathname);
  const activeBucket = BUCKETS.find((b) => b.key === activeBucketKey)!;

  async function handleSignOut() {
    await supabaseAuth.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/favicon.png" alt="FEGC" className="sidebar-logo" />
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          {BUCKETS.map((bucket) => (
            <button
              key={bucket.key}
              className={`sidebar-bucket${bucket.key === activeBucketKey ? ' active' : ''}`}
              onClick={() => navigate(bucket.firstRoute)}
            >
              {bucket.icon}
              {bucket.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <nav className="subnav">
            {activeBucket.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-right">
            <button
              className="topbar-icon-btn"
              title="Team"
              onClick={() => navigate('/team')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            <button
              className="topbar-icon-btn"
              title="Sign Out"
              onClick={handleSignOut}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
