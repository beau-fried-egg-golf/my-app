import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, getWriteups, updateWriteup, deleteWriteup } from './storage';
import type { Course, Writeup } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WriteupList() {
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    Promise.all([getWriteups(), getCourses()]).then(([w, c]) => {
      setWriteups(w);
      setCourses(c);
    });
  }, []);

  function getCourseName(courseId: string) {
    return courses.find((c) => c.id === courseId)?.short_name ?? courseId;
  }

  async function toggleHidden(id: string) {
    const w = writeups.find((w) => w.id === id);
    if (!w) return;
    await updateWriteup(id, { hidden: !w.hidden });
    setWriteups(writeups.map((w) =>
      w.id === id ? { ...w, hidden: !w.hidden } : w,
    ));
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this writeup permanently?')) return;
    await deleteWriteup(id);
    setWriteups(writeups.filter((w) => w.id !== id));
  }

  const filtered = useMemo(() => {
    let result = [...writeups];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) => w.title.toLowerCase().includes(q) || w.content.toLowerCase().includes(q),
      );
    }
    if (courseFilter !== 'all') {
      result = result.filter((w) => w.course_id === courseFilter);
    }
    if (statusFilter === 'visible') result = result.filter((w) => !w.hidden);
    if (statusFilter === 'hidden') result = result.filter((w) => w.hidden);
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [writeups, search, courseFilter, statusFilter]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Writeups</h1>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search title or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.short_name}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'visible' | 'hidden')}
        >
          <option value="all">All Status</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Author</th>
              <th>Date</th>
              <th>Photos</th>
              <th>Upvotes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id}>
                <td>
                  <Link to={`/writeups/${w.id}`} className="link">
                    <span className="truncate" style={{ display: 'inline-block' }}>{w.title}</span>
                  </Link>
                </td>
                <td>{getCourseName(w.course_id)}</td>
                <td>{w.user_id.slice(0, 8)}</td>
                <td>{formatDate(w.created_at)}</td>
                <td>{w.photos?.length ?? 0}</td>
                <td>{w.upvote_count ?? 0}</td>
                <td>
                  <span className={`badge ${w.hidden ? 'badge-hidden' : 'badge-visible'}`}>
                    {w.hidden ? 'Hidden' : 'Visible'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm"
                      onClick={() => toggleHidden(w.id)}
                    >
                      {w.hidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(w.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No writeups found</div>}
      </div>
    </div>
  );
}
