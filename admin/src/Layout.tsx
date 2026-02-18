import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

const NAV_ITEMS = [
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
];

export default function Layout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
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
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-right">
            <button
              className="topbar-icon-btn"
              title="Hole Annotations"
              onClick={() => navigate('/hole-annotations')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
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
