import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExperienceCourses, enableExperienceCourse, disableExperienceCourse } from './experienceStorage';
import { getCourses } from './storage';
import type { Course } from './types';

export default function TeeTimeList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    const data = await getExperienceCourses();
    setCourses(data);
  }

  async function openPicker() {
    const all = await getCourses();
    const experienceIds = new Set(courses.map(c => c.id));
    setAllCourses(all.filter(c => !experienceIds.has(c.id)));
    setSelectedCourseId('');
    setShowPicker(true);
  }

  async function handleAdd() {
    if (!selectedCourseId) return;
    setAdding(true);
    await enableExperienceCourse(selectedCourseId);
    await loadCourses();
    setShowPicker(false);
    setAdding(false);
  }

  async function handleRemove(courseId: string) {
    await disableExperienceCourse(courseId);
    setRemoveId(null);
    await loadCourses();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tee Times</h1>
        <button className="btn btn-primary" onClick={openPicker}>+ Add Course</button>
      </div>

      {showPicker && (
        <div className="form-container" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Enable a course for tee times</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Course</label>
              <select
                className="form-input"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                <option value="">Select a course...</option>
                {allCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.city}{c.state ? `, ${c.state}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              disabled={!selectedCourseId || adding}
              onClick={handleAdd}
            >
              {adding ? 'Adding...' : 'Enable'}
            </button>
            <button className="btn" onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
          {allCourses.length === 0 && (
            <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>All courses are already enabled.</p>
          )}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Location</th>
              <th>City / State</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id}>
                <td><strong>{course.name}</strong></td>
                <td>{course.address}</td>
                <td>{course.city}{course.state ? `, ${course.state}` : ''}</td>
                <td>
                  <div className="btn-group">
                    <Link to={`/experiences/tee-times/${course.id}`} className="btn btn-sm">
                      Manage Tee Times
                    </Link>
                    {removeId === course.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemove(course.id)}>Confirm</button>
                        <button className="btn btn-sm" onClick={() => setRemoveId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-danger" onClick={() => setRemoveId(course.id)}>Remove</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && <div className="empty-state">No experience courses yet</div>}
      </div>
    </div>
  );
}
