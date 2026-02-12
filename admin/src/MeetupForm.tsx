import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMeetups, saveMeetup, getCourses, getProfiles } from './storage';
import type { Course, Profile, Meetup } from './types';
import { supabase } from './supabase';

interface MeetupFormData {
  name: string;
  description: string;
  host_id: string;
  course_id: string | null;
  location_name: string;
  meetup_date: string;
  cost: string;
  total_slots: number;
  host_takes_slot: boolean;
  image: string | null;
  is_fe_coordinated: boolean;
  stripe_payment_url: string | null;
}

const EMPTY_FORM: MeetupFormData = {
  name: '',
  description: '',
  host_id: '',
  course_id: null,
  location_name: '',
  meetup_date: '',
  cost: '',
  total_slots: 4,
  host_takes_slot: true,
  image: null,
  is_fe_coordinated: false,
  stripe_payment_url: null,
};

export default function MeetupForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState<MeetupFormData>(EMPTY_FORM);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    Promise.all([getCourses(), getProfiles()]).then(([c, p]) => {
      setCourses(c);
      setProfiles(p);
    });

    if (isEditing) {
      getMeetups().then((meetups) => {
        const existing = meetups.find((m) => m.id === id);
        if (existing) {
          setForm({
            name: existing.name,
            description: existing.description,
            host_id: existing.host_id,
            course_id: existing.course_id,
            location_name: existing.location_name,
            meetup_date: existing.meetup_date ? existing.meetup_date.slice(0, 16) : '',
            cost: existing.cost,
            total_slots: existing.total_slots,
            host_takes_slot: existing.host_takes_slot,
            image: existing.image,
            is_fe_coordinated: existing.is_fe_coordinated,
            stripe_payment_url: existing.stripe_payment_url,
          });
        }
      });
    }
  }, [id, isEditing]);

  function handleChange(field: keyof MeetupFormData, value: string | number | boolean | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // When course is selected, auto-fill location_name
  function handleCourseChange(courseId: string) {
    if (courseId) {
      const course = courses.find(c => c.id === courseId);
      handleChange('course_id', courseId);
      if (course) {
        handleChange('location_name', course.name);
      }
    } else {
      handleChange('course_id', null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.host_id) return;

    const now = new Date().toISOString();
    const meetupId = isEditing ? id! : crypto.randomUUID();

    const meetup: Meetup = {
      id: meetupId,
      name: form.name,
      description: form.description,
      host_id: form.host_id,
      course_id: form.course_id || null,
      location_name: form.location_name,
      meetup_date: form.meetup_date ? new Date(form.meetup_date).toISOString() : now,
      cost: form.cost,
      total_slots: form.total_slots,
      host_takes_slot: form.host_takes_slot,
      image: form.image || null,
      is_fe_coordinated: form.is_fe_coordinated,
      stripe_payment_url: form.is_fe_coordinated ? (form.stripe_payment_url || null) : null,
      created_at: isEditing ? '' : now,
      updated_at: now,
    };

    await saveMeetup(meetup);

    // If creating and host_takes_slot, add host as member
    if (!isEditing && form.host_takes_slot) {
      await supabase.from('meetup_members').upsert({
        id: crypto.randomUUID(),
        meetup_id: meetupId,
        user_id: form.host_id,
        joined_at: now,
      });
    }

    navigate('/meetups');
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        {isEditing ? 'Edit Meetup' : 'Create Meetup'}
      </h1>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Host</label>
            <select className="form-input" value={form.host_id} onChange={(e) => handleChange('host_id', e.target.value)} required>
              <option value="">Select host...</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Course</label>
            <select className="form-input" value={form.course_id ?? ''} onChange={(e) => handleCourseChange(e.target.value)}>
              <option value="">No course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.short_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location Name</label>
          <input className="form-input" value={form.location_name} onChange={(e) => handleChange('location_name', e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input className="form-input" type="datetime-local" value={form.meetup_date} onChange={(e) => handleChange('meetup_date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Cost</label>
            <input className="form-input" value={form.cost} onChange={(e) => handleChange('cost', e.target.value)} placeholder="e.g. $50" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Total Slots</label>
            <input className="form-input form-input-sm" type="number" min="1" value={form.total_slots} onChange={(e) => handleChange('total_slots', parseInt(e.target.value) || 1)} />
          </div>
          <div className="form-group">
            <label className="form-label">Host Takes Slot</label>
            <label className="form-checkbox-label" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={form.host_takes_slot} onChange={(e) => handleChange('host_takes_slot', e.target.checked)} />
              Host occupies a spot
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Image URL</label>
          <input className="form-input" value={form.image ?? ''} onChange={(e) => handleChange('image', e.target.value || null)} />
        </div>

        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Fried Egg Coordination</h2>

        <div className="form-group">
          <label className="form-checkbox-label">
            <input type="checkbox" checked={form.is_fe_coordinated} onChange={(e) => handleChange('is_fe_coordinated', e.target.checked)} />
            FE Coordinated Meetup
          </label>
        </div>

        {form.is_fe_coordinated && (
          <div className="form-group">
            <label className="form-label">Stripe Payment URL</label>
            <input className="form-input" value={form.stripe_payment_url ?? ''} onChange={(e) => handleChange('stripe_payment_url', e.target.value || null)} placeholder="https://buy.stripe.com/..." />
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Meetup'}</button>
          <button type="button" className="btn" onClick={() => navigate('/meetups')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
