import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getEvent, saveEvent,
  getTicketTypes, saveTicketType, deleteTicketType,
  getAddOnGroups, saveAddOnGroup, deleteAddOnGroup,
  getAddOns, saveAddOn, deleteAddOn,
  getFormFields, saveFormField, deleteFormField,
} from './eventStorage';
import type { Event, TicketType, AddOnGroup, AddOn, EventFormField } from './eventTypes';
import { generateEventEmbedHTML } from './generateEventEmbedHTML';
import AnnotationPreview from './AnnotationPreview';
import AnnotationExport from './AnnotationExport';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

type EventForm = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'total_booked' | 'total_revenue'>;

const EMPTY_EVENT: EventForm = {
  name: '',
  slug: '',
  description: null,
  date: '',
  time: null,
  location: null,
  total_capacity: 100,
  status: 'draft',
  registration_opens_at: null,
  registration_closes_at: null,
  waitlist_enabled: false,
  image_url: null,
  policy_url: null,
  faq_url: null,
};

export default function EventEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState<EventForm>(EMPTY_EVENT);
  const [ticketTypes, setTicketTypes] = useState<(TicketType & { _key: string; _new?: boolean })[]>([]);
  const [addOnGroups, setAddOnGroups] = useState<(AddOnGroup & { _key: string; _new?: boolean })[]>([]);
  const [addOns, setAddOns] = useState<(AddOn & { _key: string; _new?: boolean })[]>([]);
  const [formFields, setFormFields] = useState<(EventFormField & { _key: string; _new?: boolean })[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [exportHtml, setExportHtml] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      getEvent(id).then(event => {
        if (event) {
          const { id: _, created_at, updated_at, total_booked, total_revenue, ...rest } = event as any;
          setForm(rest);
        }
      });
      getTicketTypes(id).then(data => setTicketTypes(data.map(t => ({ ...t, _key: t.id }))));
      getAddOnGroups(id).then(data => setAddOnGroups(data.map(g => ({ ...g, _key: g.id }))));
      getAddOns(id).then(data => setAddOns(data.map(a => ({ ...a, _key: a.id }))));
      getFormFields(id).then(data => setFormFields(data.map(f => ({ ...f, _key: f.id }))));
    }
  }, [id, isEditing]);

  function handleChange(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name' && !isEditing) {
      setForm(prev => ({ ...prev, [field]: value, slug: generateSlug(value) }));
    }
  }

  // ── Ticket Types ──

  function addTicketType() {
    const key = crypto.randomUUID();
    setTicketTypes(prev => [...prev, {
      id: key,
      event_id: id ?? '',
      name: '',
      description: null,
      price: 0,
      capacity: null,
      sort_order: prev.length,
      visibility: 'public',
      sale_starts_at: null,
      sale_ends_at: null,
      waitlist_enabled: false,
      min_per_order: 1,
      max_per_order: 1,
      created_at: '',
      updated_at: '',
      _key: key,
      _new: true,
    }]);
  }

  function updateTicketType(key: string, field: string, value: any) {
    setTicketTypes(prev => prev.map(t => t._key === key ? { ...t, [field]: value } : t));
  }

  async function removeTicketType(key: string, isNew?: boolean) {
    if (!isNew) await deleteTicketType(key);
    setTicketTypes(prev => prev.filter(t => t._key !== key));
  }

  // ── Add-On Groups ──

  function addGroup() {
    const key = crypto.randomUUID();
    setAddOnGroups(prev => [...prev, {
      id: key,
      event_id: id ?? '',
      name: '',
      description: null,
      sort_order: prev.length,
      selection_type: 'any',
      collapsed_by_default: false,
      created_at: '',
      updated_at: '',
      _key: key,
      _new: true,
    }]);
  }

  function updateGroup(key: string, field: string, value: any) {
    setAddOnGroups(prev => prev.map(g => g._key === key ? { ...g, [field]: value } : g));
  }

  async function removeGroup(key: string, isNew?: boolean) {
    if (!isNew) await deleteAddOnGroup(key);
    setAddOnGroups(prev => prev.filter(g => g._key !== key));
    // Remove add-ons in this group
    setAddOns(prev => prev.filter(a => a.add_on_group_id !== key));
  }

  // ── Add-Ons ──

  function addAddOn(groupId?: string) {
    const key = crypto.randomUUID();
    setAddOns(prev => [...prev, {
      id: key,
      event_id: id ?? '',
      add_on_group_id: groupId ?? null,
      name: '',
      description: null,
      price: 0,
      capacity: null,
      sort_order: prev.filter(a => a.add_on_group_id === (groupId ?? null)).length,
      required: false,
      visibility: 'public',
      sale_starts_at: null,
      sale_ends_at: null,
      created_at: '',
      updated_at: '',
      _key: key,
      _new: true,
    }]);
  }

  function updateAddOn(key: string, field: string, value: any) {
    setAddOns(prev => prev.map(a => a._key === key ? { ...a, [field]: value } : a));
  }

  async function removeAddOn(key: string, isNew?: boolean) {
    if (!isNew) await deleteAddOn(key);
    setAddOns(prev => prev.filter(a => a._key !== key));
  }

  // ── Form Fields ──

  function addFormField() {
    const key = crypto.randomUUID();
    setFormFields(prev => [...prev, {
      id: key,
      event_id: id ?? '',
      label: '',
      field_type: 'text',
      options: null,
      required: false,
      sort_order: prev.length,
      placeholder: null,
      created_at: '',
      updated_at: '',
      _key: key,
      _new: true,
    }]);
  }

  function updateFormField(key: string, field: string, value: any) {
    setFormFields(prev => prev.map(f => f._key === key ? { ...f, [field]: value } : f));
  }

  async function removeFormField(key: string, isNew?: boolean) {
    if (!isNew) await deleteFormField(key);
    setFormFields(prev => prev.filter(f => f._key !== key));
  }

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    setSaving(true);

    const now = new Date().toISOString();
    const eventId = isEditing ? id! : crypto.randomUUID();

    await saveEvent({
      ...form,
      id: eventId,
      created_at: isEditing ? '' : now,
      updated_at: now,
    } as Event);

    // Save ticket types
    for (const tt of ticketTypes) {
      const { _key, _new, sold_count, ...data } = tt as any;
      await saveTicketType({ ...data, event_id: eventId } as TicketType);
    }

    // Save add-on groups
    for (const g of addOnGroups) {
      const { _key, _new, ...data } = g as any;
      await saveAddOnGroup({ ...data, event_id: eventId } as AddOnGroup);
    }

    // Save add-ons
    for (const a of addOns) {
      const { _key, _new, sold_count, ...data } = a as any;
      await saveAddOn({ ...data, event_id: eventId } as AddOn);
    }

    // Save form fields
    for (const f of formFields) {
      const { _key, _new, ...data } = f as any;
      await saveFormField({ ...data, event_id: eventId } as EventFormField);
    }

    setSaving(false);
    navigate('/events/list');
  }

  // Get ungrouped add-ons
  const ungroupedAddOns = addOns.filter(a => !a.add_on_group_id);

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        {isEditing ? 'Edit Event' : 'Create Event'}
      </h1>

      <form className="form-container" onSubmit={handleSubmit} style={{ maxWidth: 860 }}>
        {/* Basic Info */}
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Basic Info</h2>

        <div className="form-group">
          <label className="form-label">Event Name</label>
          <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input className="form-input" value={form.slug} onChange={e => handleChange('slug', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={e => handleChange('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="sold_out">Sold Out</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea" value={form.description ?? ''} onChange={e => handleChange('description', e.target.value || null)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-input" type="time" value={form.time ?? ''} onChange={e => handleChange('time', e.target.value || null)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location ?? ''} onChange={e => handleChange('location', e.target.value || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Total Capacity</label>
            <input className="form-input form-input-sm" type="number" min={1} value={form.total_capacity} onChange={e => handleChange('total_capacity', parseInt(e.target.value) || 1)} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Image URL</label>
          <input className="form-input" value={form.image_url ?? ''} onChange={e => handleChange('image_url', e.target.value || null)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Policy URL</label>
            <input className="form-input" value={form.policy_url ?? ''} onChange={e => handleChange('policy_url', e.target.value || null)} />
          </div>
          <div className="form-group">
            <label className="form-label">FAQ URL</label>
            <input className="form-input" value={form.faq_url ?? ''} onChange={e => handleChange('faq_url', e.target.value || null)} />
          </div>
        </div>

        {/* Registration Window */}
        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Registration Window</h2>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Opens At</label>
            <input className="form-input" type="datetime-local" value={form.registration_opens_at?.slice(0, 16) ?? ''} onChange={e => handleChange('registration_opens_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
          <div className="form-group">
            <label className="form-label">Closes At</label>
            <input className="form-input" type="datetime-local" value={form.registration_closes_at?.slice(0, 16) ?? ''} onChange={e => handleChange('registration_closes_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-checkbox-label">
            <input type="checkbox" checked={form.waitlist_enabled} onChange={e => handleChange('waitlist_enabled', e.target.checked)} />
            Enable waitlist when sold out
          </label>
        </div>

        {/* Ticket Types */}
        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Ticket Types</h2>

        {ticketTypes.map((tt, idx) => (
          <div key={tt._key} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Ticket {idx + 1}</strong>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeTicketType(tt._key, tt._new)}>Remove</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={tt.name} onChange={e => updateTicketType(tt._key, 'name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input className="form-input" type="number" step="0.01" min={0} value={(tt.price / 100).toFixed(2)} onChange={e => updateTicketType(tt._key, 'price', Math.round(parseFloat(e.target.value || '0') * 100))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={tt.description ?? ''} onChange={e => updateTicketType(tt._key, 'description', e.target.value || null)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Capacity (blank = unlimited)</label>
                <input className="form-input form-input-sm" type="number" min={0} value={tt.capacity ?? ''} onChange={e => updateTicketType(tt._key, 'capacity', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <select className="form-input" value={tt.visibility} onChange={e => updateTicketType(tt._key, 'visibility', e.target.value)}>
                  <option value="public">Public</option>
                  <option value="hidden">Hidden</option>
                  <option value="invite_only">Invite Only</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max per Order</label>
                <input className="form-input form-input-sm" type="number" min={1} value={tt.max_per_order} onChange={e => updateTicketType(tt._key, 'max_per_order', parseInt(e.target.value) || 1)} />
              </div>
              <div className="form-group">
                <label className="form-checkbox-label" style={{ paddingTop: 20 }}>
                  <input type="checkbox" checked={tt.waitlist_enabled} onChange={e => updateTicketType(tt._key, 'waitlist_enabled', e.target.checked)} />
                  Waitlist enabled
                </label>
              </div>
            </div>
            {tt.sold_count !== undefined && tt.sold_count > 0 && (
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                {tt.sold_count} sold{tt.capacity ? ` / ${tt.capacity} capacity` : ''}
              </div>
            )}
          </div>
        ))}
        <button type="button" className="btn" onClick={addTicketType} style={{ marginBottom: 8 }}>+ Add Ticket Type</button>

        {/* Add-On Groups + Add-Ons */}
        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Add-Ons</h2>

        {addOnGroups.map((g, gIdx) => {
          const groupAddOns = addOns.filter(a => a.add_on_group_id === g.id);
          return (
            <div key={g._key} className="add-on-group-card" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 16, marginBottom: 16, background: '#faf9f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <strong>Group: {g.name || `Group ${gIdx + 1}`}</strong>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeGroup(g._key, g._new)}>Remove Group</button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Group Name</label>
                  <input className="form-input" value={g.name} onChange={e => updateGroup(g._key, 'name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selection Type</label>
                  <select className="form-input" value={g.selection_type} onChange={e => updateGroup(g._key, 'selection_type', e.target.value)}>
                    <option value="any">Any (multi-select)</option>
                    <option value="one_only">One Only (radio)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={g.description ?? ''} onChange={e => updateGroup(g._key, 'description', e.target.value || null)} />
              </div>

              {/* Add-ons within this group */}
              {groupAddOns.map((a, aIdx) => (
                <div key={a._key} style={{ border: '1px solid #e5e5e5', borderRadius: 6, padding: 12, marginBottom: 8, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Add-on {aIdx + 1}</span>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAddOn(a._key, a._new)}>Remove</button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input className="form-input" value={a.name} onChange={e => updateAddOn(a._key, 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price ($)</label>
                      <input className="form-input" type="number" step="0.01" min={0} value={(a.price / 100).toFixed(2)} onChange={e => updateAddOn(a._key, 'price', Math.round(parseFloat(e.target.value || '0') * 100))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Capacity (blank = unlimited)</label>
                      <input className="form-input form-input-sm" type="number" min={0} value={a.capacity ?? ''} onChange={e => updateAddOn(a._key, 'capacity', e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                    <div className="form-group">
                      <label className="form-checkbox-label" style={{ paddingTop: 20 }}>
                        <input type="checkbox" checked={a.required} onChange={e => updateAddOn(a._key, 'required', e.target.checked)} />
                        Required
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm" onClick={() => addAddOn(g.id)}>+ Add Add-on to Group</button>
            </div>
          );
        })}
        <button type="button" className="btn" onClick={addGroup} style={{ marginBottom: 16 }}>+ Add Group</button>

        {/* Ungrouped add-ons */}
        {ungroupedAddOns.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Ungrouped Add-Ons</h3>
            {ungroupedAddOns.map((a, aIdx) => (
              <div key={a._key} style={{ border: '1px solid #e5e5e5', borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#888' }}>Add-on {aIdx + 1}</span>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAddOn(a._key, a._new)}>Remove</button>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={a.name} onChange={e => updateAddOn(a._key, 'name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input className="form-input" type="number" step="0.01" min={0} value={(a.price / 100).toFixed(2)} onChange={e => updateAddOn(a._key, 'price', Math.round(parseFloat(e.target.value || '0') * 100))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn-sm" onClick={() => addAddOn()} style={{ marginBottom: 8 }}>+ Add Standalone Add-on</button>

        {/* Custom Form Fields */}
        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 16 }}>Custom Form Fields</h2>

        {formFields.map((f, idx) => (
          <div key={f._key} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Field {idx + 1}</strong>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeFormField(f._key, f._new)}>Remove</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Label</label>
                <input className="form-input" value={f.label} onChange={e => updateFormField(f._key, 'label', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={f.field_type} onChange={e => updateFormField(f._key, 'field_type', e.target.value)}>
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="radio">Radio</option>
                  <option value="number">Number</option>
                </select>
              </div>
            </div>
            {(f.field_type === 'select' || f.field_type === 'radio') && (
              <div className="form-group">
                <label className="form-label">Options (comma separated)</label>
                <input className="form-input" value={(f.options ?? []).join(', ')} onChange={e => updateFormField(f._key, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Placeholder</label>
                <input className="form-input" value={f.placeholder ?? ''} onChange={e => updateFormField(f._key, 'placeholder', e.target.value || null)} />
              </div>
              <div className="form-group">
                <label className="form-checkbox-label" style={{ paddingTop: 20 }}>
                  <input type="checkbox" checked={f.required} onChange={e => updateFormField(f._key, 'required', e.target.checked)} />
                  Required
                </label>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn" onClick={addFormField} style={{ marginBottom: 8 }}>+ Add Form Field</button>

        {/* Submit */}
        <div className="form-actions" style={{ marginTop: 32 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/events/list')}>Cancel</button>
        </div>
      </form>

      {/* Embed Preview / Export */}
      {isEditing && form.slug && (
        <div style={{ maxWidth: 860, marginTop: 32, display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={() => setPreviewHtml(generateEventEmbedHTML(form.slug))}
          >
            Preview
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setExportHtml(generateEventEmbedHTML(form.slug))}
          >
            Export
          </button>
        </div>
      )}

      {previewHtml && <AnnotationPreview html={previewHtml} onClose={() => setPreviewHtml(null)} />}
      {exportHtml && <AnnotationExport html={exportHtml} onClose={() => setExportHtml(null)} />}
    </div>
  );
}
