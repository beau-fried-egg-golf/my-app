import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLocations, getPackage, savePackage, savePackageItems, getRoomTypes, getExperienceCourses } from './experienceStorage';
import type { ExperienceLocation, ExperiencePackage, PackageItem, RoomType } from './types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

type FormData = Omit<ExperiencePackage, 'id' | 'created_at' | 'updated_at' | 'location_name'>;

const EMPTY_PACKAGE: FormData = {
  name: '',
  slug: '',
  description: null,
  short_description: null,
  hero_image: null,
  images: [],
  location_id: '',
  price_per_person: 0,
  max_group_size: 8,
  min_group_size: 1,
  duration_nights: 1,
  is_active: true,
  is_featured: false,
  tags: [],
  inclusions: [],
  exclusions: [],
  cancellation_policy: 'moderate',
};

const EMPTY_ITEM: Omit<PackageItem, 'id' | 'package_id'> = {
  day_number: 1,
  type: 'lodging',
  title: '',
  description: null,
  room_type_id: null,
  course_id: null,
  start_time: null,
  end_time: null,
  sort_order: 0,
};

export default function PackageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState<FormData>(EMPTY_PACKAGE);
  const [items, setItems] = useState<(Omit<PackageItem, 'package_id'> & { _key: string })[]>([]);
  const [locations, setLocations] = useState<ExperienceLocation[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [experienceCourses, setExperienceCourses] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [inclusionInput, setInclusionInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');

  useEffect(() => {
    getLocations().then(setLocations);

    if (isEditing && id) {
      getPackage(id).then(result => {
        if (result) {
          const { id: _, created_at, updated_at, location_name, ...rest } = result.pkg;
          setForm(rest);
          setItems(result.items.map(item => ({
            ...item,
            _key: crypto.randomUUID(),
          })));
        }
      });
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (form.location_id) {
      getRoomTypes(form.location_id).then(setRoomTypes);
      getExperienceCourses(form.location_id).then(setExperienceCourses);
    } else {
      setRoomTypes([]);
      setExperienceCourses([]);
    }
  }, [form.location_id]);

  function handleChange(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && !isEditing) {
      setForm(prev => ({ ...prev, [field]: value, slug: generateSlug(value) }));
    }
  }

  function addListItem(field: 'tags' | 'inclusions' | 'exclusions', value: string, setter: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !form[field].includes(trimmed)) {
      setForm(prev => ({ ...prev, [field]: [...prev[field], trimmed] }));
      setter('');
    }
  }

  function removeListItem(field: 'tags' | 'inclusions' | 'exclusions', idx: number) {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  }

  function addItem() {
    setItems(prev => [...prev, {
      ...EMPTY_ITEM,
      id: crypto.randomUUID(),
      day_number: Math.max(1, ...prev.map(i => i.day_number)),
      sort_order: prev.length,
      _key: crypto.randomUUID(),
    }]);
  }

  function updateItem(key: string, field: string, value: any) {
    setItems(prev => prev.map(item => {
      if (item._key !== key) return item;
      const updated = { ...item, [field]: value };
      if (field === 'type') {
        updated.room_type_id = null;
        updated.course_id = null;
      }
      return updated;
    }));
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(item => item._key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.location_id) return;

    const now = new Date().toISOString();
    const packageId = isEditing ? id! : crypto.randomUUID();

    await savePackage({
      ...form,
      id: packageId,
      created_at: isEditing ? '' : now,
      updated_at: now,
    } as ExperiencePackage);

    // Save items
    const packageItems: PackageItem[] = items.map(({ _key, ...item }) => ({
      ...item,
      package_id: packageId,
    }));
    await savePackageItems(packageId, packageItems);

    navigate('/experiences/packages');
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        {isEditing ? 'Edit Package' : 'Create Package'}
      </h1>

      <form className="form-container" onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
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
            <label className="form-label">Location</label>
            <select className="form-input" value={form.location_id} onChange={e => handleChange('location_id', e.target.value)} required>
              <option value="">Select location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
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

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price per Person ($)</label>
            <input className="form-input" type="number" step="0.01" min={0} value={(form.price_per_person / 100).toFixed(2)} onChange={e => handleChange('price_per_person', Math.round(parseFloat(e.target.value || '0') * 100))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (nights)</label>
            <input className="form-input form-input-sm" type="number" min={1} value={form.duration_nights} onChange={e => handleChange('duration_nights', parseInt(e.target.value) || 1)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Min Group Size</label>
            <input className="form-input form-input-sm" type="number" min={1} value={form.min_group_size} onChange={e => handleChange('min_group_size', parseInt(e.target.value) || 1)} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Group Size</label>
            <input className="form-input form-input-sm" type="number" min={1} value={form.max_group_size} onChange={e => handleChange('max_group_size', parseInt(e.target.value) || 8)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Hero Image URL</label>
          <input className="form-input" value={form.hero_image ?? ''} onChange={e => handleChange('hero_image', e.target.value || null)} />
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
          <div className="form-group" style={{ display: 'flex', gap: 24, alignItems: 'flex-end', paddingBottom: 16 }}>
            <label className="form-checkbox-label">
              <input type="checkbox" checked={form.is_active} onChange={e => handleChange('is_active', e.target.checked)} />
              Active
            </label>
            <label className="form-checkbox-label">
              <input type="checkbox" checked={form.is_featured} onChange={e => handleChange('is_featured', e.target.checked)} />
              Featured
            </label>
          </div>
        </div>

        {/* Tags */}
        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Tags</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="form-input" placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addListItem('tags', tagInput, setTagInput); } }} />
          <button type="button" className="btn" onClick={() => addListItem('tags', tagInput, setTagInput)}>Add</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {form.tags.map((t, i) => (
            <span key={i} className="badge badge-public" style={{ cursor: 'pointer' }} onClick={() => removeListItem('tags', i)}>{t} ×</span>
          ))}
        </div>

        {/* Inclusions */}
        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Inclusions</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="form-input" placeholder="What's included..." value={inclusionInput} onChange={e => setInclusionInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addListItem('inclusions', inclusionInput, setInclusionInput); } }} />
          <button type="button" className="btn" onClick={() => addListItem('inclusions', inclusionInput, setInclusionInput)}>Add</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {form.inclusions.map((item, i) => (
            <span key={i} className="badge badge-visible" style={{ cursor: 'pointer' }} onClick={() => removeListItem('inclusions', i)}>{item} ×</span>
          ))}
        </div>

        {/* Exclusions */}
        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Exclusions</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input className="form-input" placeholder="What's not included..." value={exclusionInput} onChange={e => setExclusionInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addListItem('exclusions', exclusionInput, setExclusionInput); } }} />
          <button type="button" className="btn" onClick={() => addListItem('exclusions', exclusionInput, setExclusionInput)}>Add</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {form.exclusions.map((item, i) => (
            <span key={i} className="badge badge-hidden" style={{ cursor: 'pointer' }} onClick={() => removeListItem('exclusions', i)}>{item} ×</span>
          ))}
        </div>

        {/* Itinerary items */}
        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18 }}>Itinerary</h2>
        {items.map((item, idx) => (
          <div key={item._key} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Item {idx + 1}</strong>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(item._key)}>Remove</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Day</label>
                <input className="form-input form-input-sm" type="number" min={1} value={item.day_number} onChange={e => updateItem(item._key, 'day_number', parseInt(e.target.value) || 1)} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={item.type} onChange={e => updateItem(item._key, 'type', e.target.value)}>
                  <option value="lodging">Lodging</option>
                  <option value="tee_time">Tee Time</option>
                  <option value="meal">Meal</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={item.title} onChange={e => updateItem(item._key, 'title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={item.description ?? ''} onChange={e => updateItem(item._key, 'description', e.target.value || null)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input className="form-input" type="time" value={item.start_time ?? ''} onChange={e => updateItem(item._key, 'start_time', e.target.value || null)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input className="form-input" type="time" value={item.end_time ?? ''} onChange={e => updateItem(item._key, 'end_time', e.target.value || null)} />
              </div>
            </div>
            {item.type === 'lodging' && (
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-input" value={item.room_type_id ?? ''} onChange={e => updateItem(item._key, 'room_type_id', e.target.value || null)}>
                  <option value="">Select room type...</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
            )}
            {item.type === 'tee_time' && (
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-input" value={item.course_id ?? ''} onChange={e => updateItem(item._key, 'course_id', e.target.value || null)}>
                  <option value="">Select course...</option>
                  {experienceCourses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
        <button type="button" className="btn" onClick={addItem} style={{ marginBottom: 24 }}>+ Add Itinerary Item</button>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Create Package'}</button>
          <button type="button" className="btn" onClick={() => navigate('/experiences/packages')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
