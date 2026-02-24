import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfiles, getWriteups, getCourses } from './storage';
import type { Profile, Writeup, Course } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface UserRow {
  id: string;
  name: string;
  location: string;
  handicap: number | null;
  home_course: string;
  member_since: string;
  writeup_count: number;
  photo_count: number;
  is_verified: boolean;
  is_member: boolean;
}

export default function UserList() {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    Promise.all([getProfiles(), getWriteups(), getCourses()]).then(([profiles, writeups, courses]) => {
      const rows: UserRow[] = profiles.map((p) => {
        const userWriteups = writeups.filter((w) => w.user_id === p.id);
        const photoCount = userWriteups.reduce((sum, w) => sum + (w.photos?.length ?? 0), 0);
        const homeCourse = courses.find((c) => c.id === p.home_course)?.short_name ?? p.home_course;

        return {
          id: p.id,
          name: p.name || `Member ${p.id.slice(0, 6)}`,
          location: p.location,
          handicap: p.handicap,
          home_course: homeCourse,
          member_since: p.member_since,
          writeup_count: userWriteups.length,
          photo_count: photoCount,
          is_verified: !!p.is_verified,
          is_member: p.subscription_tier === 'standard' && (p.subscription_status === 'active' || p.subscription_status === 'trialing'),
        };
      });

      setUsers(rows);
    });
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Handicap</th>
              <th>Home Course</th>
              <th>Member Since</th>
              <th>Writeups</th>
              <th>Photos</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/users/${u.id}`} className="link">
                    <strong>{u.name}</strong>
                  </Link>
                  {u.is_member ? (
                    <span className="badge badge-verified" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                      Member
                    </span>
                  ) : (
                    <span className="badge" style={{ marginLeft: 6, verticalAlign: 'middle', background: '#eee', color: '#999' }}>
                      Guest
                    </span>
                  )}
                  {u.is_verified && (
                    <span className="badge badge-verified" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                      Verified
                    </span>
                  )}
                </td>
                <td>{u.location || '-'}</td>
                <td>{u.handicap !== null ? u.handicap : '-'}</td>
                <td>{u.home_course || '-'}</td>
                <td>{u.member_since ? formatDate(u.member_since) : '-'}</td>
                <td>{u.writeup_count}</td>
                <td>{u.photo_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="empty-state">No users found</div>}
      </div>
    </div>
  );
}
