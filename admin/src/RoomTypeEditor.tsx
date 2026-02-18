import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLocation, getRoomTypes, saveRoomType, deleteRoomType } from './experienceStorage';
import type { ExperienceLocation, RoomType } from './types';

const EMPTY_ROOM_TYPE: Omit<RoomType, 'id' | 'created_at'> = {
  location_id: '',
  name: '',
  description: null,
  images: [],
  max_occupancy: 2,
  bed_configuration: null,
  amenities: [],
  base_price_per_night: 0,
  is_active: true,
  sort_order: 0,
};

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseCents(dollars: string): number {
  return Math.round(parseFloat(dollars || '0') * 100);
}

export default function RoomTypeEditor() {
  const { id: locationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<ExperienceLocation | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ROOM_TYPE);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [amenityInput, setAmenityInput] = useState('');

  useEffect(() => {
    if (!locationId) return;
    getLocation(locationId).then(loc => setLocation(loc));
    getRoomTypes(locationId).then(setRoomTypes);
  }, [locationId]);

  function startNew() {
    setEditingId('new');
    setForm({ ...EMPTY_ROOM_TYPE, location_id: locationId! });
  }

  function startEdit(rt: RoomType) {
    setEditingId(rt.id);
    const { id, created_at, ...rest } = rt;
    setForm(rest);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_ROOM_TYPE);
  }

  function handleChange(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addAmenity() {
    const trimmed = amenityInput.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      setForm(prev => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
      setAmenityInput('');
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !locationId) return;

    const now = new Date().toISOString();
    const roomTypeId = editingId === 'new' ? crypto.randomUUID() : editingId!;

    const data: RoomType = {
      ...form,
      id: roomTypeId,
      location_id: locationId,
      created_at: editingId === 'new' ? now : '', // Ignored on update
    };

    await saveRoomType(data);
    const updated = await getRoomTypes(locationId);
    setRoomTypes(updated);
    cancelEdit();
  }

  async function handleDelete(id: string) {
    await deleteRoomType(id);
    setRoomTypes(roomTypes.filter(rt => rt.id !== id));
    setDeleteId(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Room Types</h1>
          {location && <p style={{ color: '#888', marginTop: 4 }}>{location.name}</p>}
        </div>
        <div className="btn-group">
          <button className="btn" onClick={() => navigate('/experiences/locations')}>Back to Locations</button>
          {!editingId && <button className="btn btn-primary" onClick={startNew}>+ Add Room Type</button>}
        </div>
      </div>

      {/* Edit/New form */}
      {editingId && (
        <div className="form-container" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            {editingId === 'new' ? 'New Room Type' : 'Edit Room Type'}
          </h2>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" value={form.description ?? ''} onChange={e => handleChange('description', e.target.value || null)} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Occupancy</label>
              <input className="form-input form-input-sm" type="number" min={1} value={form.max_occupancy} onChange={e => handleChange('max_occupancy', parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group">
              <label className="form-label">Base Price/Night ($)</label>
              <input className="form-input form-input-sm" type="number" step="0.01" min={0} value={formatCents(form.base_price_per_night)} onChange={e => handleChange('base_price_per_night', parseCents(e.target.value))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bed Configuration</label>
              <input className="form-input" value={form.bed_configuration ?? ''} onChange={e => handleChange('bed_configuration', e.target.value || null)} placeholder="e.g. 1 King, 2 Queen" />
            </div>
            <div className="form-group">
              <label className="form-label">Sort Order</label>
              <input className="form-input form-input-sm" type="number" value={form.sort_order} onChange={e => handleChange('sort_order', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amenities</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-input"
                placeholder="Add amenity..."
                value={amenityInput}
                onChange={e => setAmenityInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
              />
              <button type="button" className="btn" onClick={addAmenity}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.amenities.map((a, i) => (
                <span key={i} className="badge badge-public" style={{ cursor: 'pointer' }} onClick={() => setForm(prev => ({ ...prev, amenities: prev.amenities.filter((_, j) => j !== i) }))}>
                  {a} ×
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input type="checkbox" checked={form.is_active} onChange={e => handleChange('is_active', e.target.checked)} />
              Active
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
            <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      {/* Room types table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Occupancy</th>
              <th>Beds</th>
              <th>Price/Night</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map(rt => (
              <tr key={rt.id}>
                <td><strong>{rt.name}</strong></td>
                <td>{rt.max_occupancy}</td>
                <td>{rt.bed_configuration ?? '–'}</td>
                <td>${formatCents(rt.base_price_per_night)}</td>
                <td>
                  <span className={`badge ${rt.is_active ? 'badge-visible' : 'badge-hidden'}`}>
                    {rt.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={() => startEdit(rt)}>Edit</button>
                    {deleteId === rt.id ? (
                      <>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rt.id)}>Confirm</button>
                        <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(rt.id)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {roomTypes.length === 0 && <div className="empty-state">No room types yet</div>}
      </div>
    </div>
  );
}
