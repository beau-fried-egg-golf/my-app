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
  { to: '/email-templates', label: 'Emails' },
  { to: '/hole-annotations', label: 'Annotations' },
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="3" width="12" height="14" rx="1" />
                <line x1="3" y1="21" x2="5" y2="13" />
                <line x1="1" y1="21" x2="5" y2="21" />
                <path d="M5 13L2.5 11.5" />
                <path d="M5 13L5.5 10" />
                <line x1="21" y1="21" x2="19" y2="13" />
                <line x1="23" y1="21" x2="19" y2="21" />
                <path d="M19 13c1.5-1.5 2.5-2 2.5-3.5a2.5 2.5 0 0 0-5 0c0 1.5 1 2 2.5 3.5z" />
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
