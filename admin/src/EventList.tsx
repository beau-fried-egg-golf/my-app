import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent, duplicateEvent, getAddOns } from './eventStorage';
import type { Event, AddOn } from './eventTypes';
import { generateEventEmbedHTML } from './generateEventEmbedHTML';
import AnnotationPreview from './AnnotationPreview';
import AnnotationExport from './AnnotationExport';

function formatCents(cents: number): string {
  return '$' + (cents / 100).toLocaleString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f3f4f6', color: '#4b5563' },
  published: { bg: '#dcfce7', color: '#166534' },
  sold_out: { bg: '#fef3c7', color: '#92400e' },
  closed: { bg: '#dbeafe', color: '#1e40af' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function EventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [exportHtml, setExportHtml] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOnCache, setAddOnCache] = useState<Record<string, AddOn[]>>({});

  useEffect(() => {
    loadEvents();
  }, [statusFilter, search]);

  async function loadEvents() {
    const data = await getEvents({
      status: statusFilter || undefined,
      search: search || undefined,
    });
    setEvents(data);
  }

  async function handleDelete(id: string) {
    await deleteEvent(id);
    setConfirmDelete(null);
    loadEvents();
  }

  async function handleDuplicate(id: string) {
    const newId = await duplicateEvent(id);
    if (newId) {
      navigate(`/events/${newId}/edit`);
    }
  }

  async function toggleExpand(eventId: string) {
    if (expandedId === eventId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(eventId);
    if (!addOnCache[eventId]) {
      const addOns = await getAddOns(eventId);
      setAddOnCache(prev => ({ ...prev, [eventId]: addOns }));
    }
  }

  function handlePreview(slug: string) {
    setPreviewHtml(generateEventEmbedHTML(slug));
  }

  function handleExport(slug: string) {
    setExportHtml(generateEventEmbedHTML(slug));
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">All Events</h1>
        <Link to="/events/new" className="btn btn-primary">+ Create Event</Link>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="sold_out">Sold Out</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span style={{ color: '#888', fontSize: 14 }}>{events.length} events</span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => {
              const statusStyle = STATUS_COLORS[e.status] ?? STATUS_COLORS.draft;
              const booked = e.total_booked ?? 0;
              const pct = Math.min(100, Math.round((booked / e.total_capacity) * 100));
              const isExpanded = expandedId === e.id;
              const addOns = addOnCache[e.id];
              const addOnsWithCap = addOns?.filter(a => a.capacity != null) ?? [];
              return (
                <Fragment key={e.id}>
                  <tr onClick={() => toggleExpand(e.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 16, fontSize: 12, color: '#888', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
                        <div>
                          <strong>{e.name}</strong>
                          <div style={{ fontSize: 12, color: '#888' }}>{e.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(e.date)}</td>
                    <td>{e.location ?? '–'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="capacity-bar">
                          <div className="capacity-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{booked}/{e.total_capacity}</span>
                      </div>
                    </td>
                    <td>{formatCents(e.total_revenue ?? 0)}</td>
                    <td>
                      <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" onClick={ev => ev.stopPropagation()}>
                        <Link to={`/events/${e.id}/edit`} className="btn btn-sm">Edit</Link>
                        <Link to={`/events/${e.id}/bookings`} className="btn btn-sm">Bookings</Link>
                        <button className="btn btn-sm" onClick={() => handlePreview(e.slug)}>Preview</button>
                        <button className="btn btn-sm" onClick={() => handleExport(e.slug)}>Export</button>
                        <button className="btn btn-sm" onClick={() => handleDuplicate(e.id)}>Dup</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(e.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: '12px 16px 16px 38px', background: '#fafafa' }}>
                        {!addOns ? (
                          <span style={{ color: '#888', fontSize: 13 }}>Loading add-ons...</span>
                        ) : addOnsWithCap.length === 0 ? (
                          <span style={{ color: '#888', fontSize: 13 }}>No capacity-tracked add-ons</span>
                        ) : (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Add-on Capacity</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {addOnsWithCap.map(a => {
                                const sold = a.sold_count ?? 0;
                                const cap = a.capacity!;
                                const remaining = cap - sold;
                                const aPct = Math.min(100, Math.round((sold / cap) * 100));
                                const barColor = aPct >= 90 ? '#ef4444' : aPct >= 70 ? '#f59e0b' : '#22c55e';
                                return (
                                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 13, minWidth: 140 }}>{a.name}</span>
                                    <div className="capacity-bar" style={{ flex: 1, maxWidth: 200 }}>
                                      <div className="capacity-bar-fill" style={{ width: `${aPct}%`, background: barColor }} />
                                    </div>
                                    <span style={{ fontSize: 13, whiteSpace: 'nowrap', minWidth: 80 }}>
                                      {sold}/{cap} sold
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: remaining <= 5 ? '#ef4444' : '#166534' }}>
                                      {remaining} left
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {events.length === 0 && <div className="empty-state">No events found</div>}
      </div>

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Delete Event?</div>
            <div className="confirm-text">This will permanently delete this event and all its bookings, ticket types, and add-ons.</div>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewHtml && <AnnotationPreview html={previewHtml} onClose={() => setPreviewHtml(null)} />}
      {exportHtml && <AnnotationExport html={exportHtml} onClose={() => setExportHtml(null)} />}
    </div>
  );
}
