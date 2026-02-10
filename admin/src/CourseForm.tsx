import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourses, saveCourse } from './storage';
import type { Course } from './types';

const EMPTY_COURSE: Omit<Course, 'id'> = {
  name: '',
  short_name: '',
  address: '',
  city: '',
  is_private: false,
  holes: 18,
  par: 72,
  year_established: new Date().getFullYear(),
  description: '',
  latitude: 0,
  longitude: 0,
};

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

export default function CourseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState<Omit<Course, 'id'>>(EMPTY_COURSE);
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    if (isEditing) {
      getCourses().then((courses) => {
        const existing = courses.find((c) => c.id === id);
        if (existing) {
          const { id: existingId, ...rest } = existing;
          setForm(rest);
          setCourseId(existingId);
        }
      });
    }
  }, [id, isEditing]);

  function handleChange(field: keyof typeof form, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name' && !isEditing) {
      setCourseId(generateId(value as string));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const finalId = isEditing ? id! : courseId || generateId(form.name);

    if (!isEditing) {
      const courses = await getCourses();
      if (courses.some((c) => c.id === finalId)) {
        alert('A course with this ID already exists.');
        return;
      }
    }

    await saveCourse({ ...form, id: finalId });
    navigate('/courses');
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        {isEditing ? 'Edit Course' : 'Add Course'}
      </h1>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Short Name</label>
            <input className="form-input" value={form.short_name} onChange={(e) => handleChange('short_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">ID {isEditing && '(read-only)'}</label>
            <input className="form-input" value={isEditing ? id : courseId} onChange={(e) => !isEditing && setCourseId(e.target.value)} readOnly={isEditing} style={isEditing ? { background: '#f5f5f5' } : undefined} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Access</label>
            <label className="form-checkbox-label" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={form.is_private} onChange={(e) => handleChange('is_private', e.target.checked)} />
              Private Club
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Holes</label>
            <input className="form-input form-input-sm" type="number" value={form.holes} onChange={(e) => handleChange('holes', parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Par</label>
            <input className="form-input form-input-sm" type="number" value={form.par} onChange={(e) => handleChange('par', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Year Established</label>
            <input className="form-input form-input-sm" type="number" value={form.year_established} onChange={(e) => handleChange('year_established', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input className="form-input" type="number" step="0.0001" value={form.latitude} onChange={(e) => handleChange('latitude', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input className="form-input" type="number" step="0.0001" value={form.longitude} onChange={(e) => handleChange('longitude', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Course'}</button>
          <button type="button" className="btn" onClick={() => navigate('/courses')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
