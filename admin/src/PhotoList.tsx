import { useEffect, useMemo, useState } from 'react';
import { getCourses, getWriteups, updatePhoto } from './storage';
import type { Course, Photo, Writeup } from './types';

interface FlatPhoto extends Photo {
  writeup_title: string;
}

export default function PhotoList() {
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    Promise.all([getWriteups(), getCourses()]).then(([w, c]) => {
      setWriteups(w);
      setCourses(c);
    });
  }, []);

  function getCourseName(courseId: string) {
    return courses.find((c) => c.id === courseId)?.short_name ?? courseId;
  }

  const allPhotos: FlatPhoto[] = useMemo(() => {
    return writeups.flatMap((w) =>
      (w.photos ?? []).map((p) => ({
        ...p,
        writeup_title: w.title,
      })),
    );
  }, [writeups]);

  const filtered = useMemo(() => {
    let result = allPhotos;
    if (statusFilter === 'visible') result = result.filter((p) => !p.hidden);
    if (statusFilter === 'hidden') result = result.filter((p) => p.hidden);
    if (courseFilter !== 'all') {
      const writeupIds = new Set(writeups.filter(w => w.course_id === courseFilter).map(w => w.id));
      result = result.filter((p) => writeupIds.has(p.writeup_id));
    }
    return result;
  }, [allPhotos, statusFilter, courseFilter, writeups]);

  async function togglePhotoHidden(photoId: string, currentHidden: boolean) {
    await updatePhoto(photoId, { hidden: !currentHidden });
    setWriteups(writeups.map((w) => ({
      ...w,
      photos: w.photos?.map((p) =>
        p.id === photoId ? { ...p, hidden: !p.hidden } : p,
      ),
    })));
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Photos ({filtered.length})</h1>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'visible' | 'hidden')}
        >
          <option value="all">All Status</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
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
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No photos found</div>
      ) : (
        <div className="photo-grid">
          {filtered.map((photo) => (
            <div key={photo.id} className="photo-card">
              <img src={photo.url} alt={photo.caption || 'Photo'} />
              <div className="photo-card-body">
                <div className="photo-card-caption">
                  {photo.caption || 'No caption'}
                </div>
                <div className="photo-card-meta">
                  {photo.writeup_title} &middot; {getCourseName(
                    writeups.find(w => w.id === photo.writeup_id)?.course_id ?? ''
                  )}
                </div>
                <div className="photo-card-actions">
                  <span className={`badge ${photo.hidden ? 'badge-hidden' : 'badge-visible'}`}>
                    {photo.hidden ? 'Hidden' : 'Visible'}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => togglePhotoHidden(photo.id, photo.hidden)}
                  >
                    {photo.hidden ? 'Unhide' : 'Hide'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
