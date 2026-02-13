import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses, getWriteups, deleteCourse } from './storage';
import type { Course, Writeup } from './types';

function hasFEContent(course: Course): boolean {
  return !!(course.fe_hero_image || course.fe_profile_url || course.fe_profile_author || course.fe_egg_rating !== null || course.fe_bang_for_buck || course.fe_profile_date);
}

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCourses(), getWriteups()]).then(([c, w]) => {
      setCourses(c);
      setWriteups(w);
    });
  }, []);

  function getWriteupCount(courseId: string) {
    return writeups.filter((w) => w.course_id === courseId).length;
  }

  async function handleDelete(id: string) {
    const count = getWriteupCount(id);
    if (count > 0 && !window.confirm(`This course has ${count} writeup(s). Delete anyway?`)) {
      return;
    }
    await deleteCourse(id);
    setCourses(courses.filter((c) => c.id !== id));
    setDeleteId(null);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>
          + Add Course
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Access</th>
              <th>Holes</th>
              <th>Par</th>
              <th>Year</th>
              <th>FE</th>
              <th>Writeups</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.city}{c.state ? `, ${c.state}` : ''}</td>
                <td>
                  <span className={`badge ${c.is_private ? 'badge-private' : 'badge-public'}`}>
                    {c.is_private ? 'Private' : 'Public'}
                  </span>
                </td>
                <td>{c.holes}</td>
                <td>{c.par}</td>
                <td>{c.year_established}</td>
                <td>
                  {hasFEContent(c) ? (
                    <span style={{ backgroundColor: '#FFEE54', color: '#000', fontWeight: 'bold', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>FE</span>
                  ) : '–'}
                </td>
                <td>{getWriteupCount(c.id)}</td>
                <td>
                  <div className="btn-group">
                    <Link to={`/courses/${c.id}/edit`} className="btn btn-sm">Edit</Link>
                    {deleteId === c.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>
                          Confirm
                        </button>
                        <button className="btn btn-sm" onClick={() => setDeleteId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(c.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <div className="empty-state">No courses</div>}
      </div>
    </div>
  );
}
