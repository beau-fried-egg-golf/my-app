import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLocation, saveLocation } from './experienceStorage';
import type { ExperienceLocation } from './types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

const EMPTY_LOCATION: Omit<ExperienceLocation, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  slug: '',
  type: 'lodge',
  description: null,
  short_description: null,
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  zip: null,
  latitude: null,
  longitude: null,
  hero_image: null,
  images: [],
  amenities: [],
  check_in_time: '15:00',
  check_out_time: '11:00',
  cancellation_policy: 'moderate',
  timezone: 'America/New_York',
  is_active: true,
  metadata: {},
};

export default function LocationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState(EMPTY_LOCATION);
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      getLocation(id).then(loc => {
        if (loc) {
          const { id: _, created_at, updated_at, room_type_count, ...rest } = loc;
          setForm(rest as typeof form);
        }
      });
    }
  }, [id, isEditing]);

  function handleChange(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && !isEditing) {
      setForm(prev => ({ ...prev, [field]: value, slug: generateSlug(value) }));
    }
  }

  function addAmenity() {
    const trimmed = amenityInput.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      setForm(prev => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
      setAmenityInput('');
    }
  }

  function removeAmenity(idx: number) {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    const now = new Date().toISOString();
    const locationId = isEditing ? id! : crypto.randomUUID();

    await saveLocation({
      ...form,
      id: locationId,
      created_at: isEditing ? '' : now, // Will be ignored on update
      updated_at: now,
    } as ExperienceLocation);

    navigate('/experiences/locations');
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        {isEditing ? 'Edit Location' : 'Add Location'}
      </h1>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-input" value={form.slug} onChange={e => handleChange('slug', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={e => handleChange('type', e.target.value)}>
              <option value="lodge">Lodge</option>
              <option value="course">Course</option>
              <option value="resort">Resort</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Short Description</label>
          <input className="form-input" value={form.short_description ?? ''} onChange={e => handleChange('short_description', e.target.value || null)} />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea" value={form.description ?? ''} onChange={e => handleChange('description', e.target.value || null)} />
        </div>

        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Address</h2>

        <div className="form-group">
          <label className="form-label">Address Line 1</label>
          <input className="form-input" value={form.address_line1 ?? ''} onChange={e => handleChange('address_line1', e.target.value || null)} />
        </div>

        <div className="form-group">
          <label className="form-label">Address Line 2</label>
          <input className="form-input" value={form.address_line2 ?? ''} onChange={e => handleChange('address_line2', e.target.value || null)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.city ?? ''} onChange={e => handleChange('city', e.target.value || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" value={form.state ?? ''} onChange={e => handleChange('state', e.target.value || null)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">ZIP</label>
            <input className="form-input" value={form.zip ?? ''} onChange={e => handleChange('zip', e.target.value || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Timezone</label>
            <input className="form-input" value={form.timezone} onChange={e => handleChange('timezone', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input className="form-input" type="number" step="0.000001" value={form.latitude ?? ''} onChange={e => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input className="form-input" type="number" step="0.000001" value={form.longitude ?? ''} onChange={e => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
        </div>

        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Images</h2>

        <div className="form-group">
          <label className="form-label">Hero Image URL</label>
          <input className="form-input" value={form.hero_image ?? ''} onChange={e => handleChange('hero_image', e.target.value || null)} />
        </div>

        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Policies & Times</h2>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Check-in Time</label>
            <input className="form-input" type="time" value={form.check_in_time ?? ''} onChange={e => handleChange('check_in_time', e.target.value || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Check-out Time</label>
            <input className="form-input" type="time" value={form.check_out_time ?? ''} onChange={e => handleChange('check_out_time', e.target.value || null)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cancellation Policy</label>
            <select className="form-input" value={form.cancellation_policy} onChange={e => handleChange('cancellation_policy', e.target.value)}>
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <label className="form-checkbox-label" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => handleChange('is_active', e.target.checked)} />
              Active
            </label>
          </div>
        </div>

        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Amenities</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="form-input"
            placeholder="Add amenity..."
            value={amenityInput}
            onChange={e => setAmenityInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
          />
          <button type="button" className="btn" onClick={addAmenity}>Add</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {form.amenities.map((a, i) => (
            <span key={i} className="badge badge-public" style={{ cursor: 'pointer' }} onClick={() => removeAmenity(i)}>
              {a} ×
            </span>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Location'}</button>
          <button type="button" className="btn" onClick={() => navigate('/experiences/locations')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
