import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from './supabase';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/courses', label: 'Courses' },
  { to: '/writeups', label: 'Writeups' },
  { to: '/photos', label: 'Photos' },
  { to: '/users', label: 'Users' },
];

export default function Layout() {
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Golf Admin</h2>
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
        <button className="btn btn-sm" style={{ margin: 16 }} onClick={handleSignOut}>
          Sign Out
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
