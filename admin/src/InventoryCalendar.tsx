import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLocation, getRoomTypes, getRoomInventory, bulkSaveRoomInventory } from './experienceStorage';
import type { ExperienceLocation, RoomType, RoomInventory } from './types';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  let current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}

export default function InventoryCalendar() {
  const { id: locationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<ExperienceLocation | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [inventory, setInventory] = useState<Map<string, RoomInventory>>(new Map());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysToShow] = useState(14);
  const [saving, setSaving] = useState(false);

  // Bulk set form
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState('');
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkUnits, setBulkUnits] = useState(1);
  const [bulkPrice, setBulkPrice] = useState('');

  const endDate = addDays(startDate, daysToShow - 1);
  const days = getDaysInRange(startDate, endDate);

  useEffect(() => {
    if (!locationId) return;
    getLocation(locationId).then(loc => setLocation(loc));
    getRoomTypes(locationId).then(rts => {
      setRoomTypes(rts);
      if (rts.length > 0 && !bulkRoomTypeId) {
        setBulkRoomTypeId(rts[0].id);
      }
    });
  }, [locationId]);

  useEffect(() => {
    if (!roomTypes.length) return;
    loadInventory();
  }, [roomTypes, startDate]);

  async function loadInventory() {
    const map = new Map<string, RoomInventory>();
    for (const rt of roomTypes) {
      const inv = await getRoomInventory(rt.id, startDate, endDate);
      for (const item of inv) {
        map.set(`${item.room_type_id}:${item.date}`, item);
      }
    }
    setInventory(map);
  }

  function getCell(roomTypeId: string, date: string): RoomInventory | undefined {
    return inventory.get(`${roomTypeId}:${date}`);
  }

  async function handleBulkSet(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkRoomTypeId || !bulkStart || !bulkEnd) return;

    setSaving(true);
    const dates = getDaysInRange(bulkStart, bulkEnd);
    const items = dates.map(date => ({
      room_type_id: bulkRoomTypeId,
      date,
      total_units: bulkUnits,
      blocked_units: 0,
      price_override: bulkPrice ? Math.round(parseFloat(bulkPrice) * 100) : null,
      notes: null,
    }));

    await bulkSaveRoomInventory(items);
    await loadInventory();
    setSaving(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Room Inventory</h1>
          {location && <p style={{ color: '#888', marginTop: 4 }}>{location.name}</p>}
        </div>
        <div className="btn-group">
          <button className="btn" onClick={() => navigate('/experiences/locations')}>Back to Locations</button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="filters-bar">
        <button className="btn btn-sm" onClick={() => setStartDate(addDays(startDate, -14))}>← Prev 2 Weeks</button>
        <input type="date" className="filter-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <button className="btn btn-sm" onClick={() => setStartDate(addDays(startDate, 14))}>Next 2 Weeks →</button>
      </div>

      {/* Bulk set form */}
      <div className="form-container" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Bulk Set Inventory</h3>
        <form onSubmit={handleBulkSet} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Room Type</label>
            <select className="form-input" value={bulkRoomTypeId} onChange={e => setBulkRoomTypeId(e.target.value)}>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={bulkStart} onChange={e => setBulkStart(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Total Units</label>
            <input type="number" className="form-input form-input-sm" min={0} value={bulkUnits} onChange={e => setBulkUnits(parseInt(e.target.value) || 0)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Price Override ($)</label>
            <input type="number" step="0.01" className="form-input form-input-sm" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} placeholder="Base price" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Apply'}
          </button>
        </form>
      </div>

      {/* Calendar grid */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>Room Type</th>
              {days.map(d => (
                <th key={d} style={{ textAlign: 'center', minWidth: 80, fontSize: 11 }}>
                  {formatShortDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomTypes.map(rt => (
              <tr key={rt.id}>
                <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontWeight: 600 }}>
                  {rt.name}
                </td>
                {days.map(d => {
                  const cell = getCell(rt.id, d);
                  const available = cell ? cell.total_units - cell.blocked_units : 0;
                  const hasData = !!cell;
                  return (
                    <td key={d} style={{
                      textAlign: 'center',
                      background: !hasData ? '#f9fafb' : available === 0 ? '#fee2e2' : available <= 2 ? '#fef3c7' : '#dcfce7',
                      fontSize: 13,
                    }}>
                      {hasData ? (
                        <div>
                          <strong>{available}</strong>
                          <span style={{ fontSize: 11, color: '#888' }}>/{cell!.total_units}</span>
                          {cell!.price_override && (
                            <div style={{ fontSize: 10, color: '#666' }}>
                              ${(cell!.price_override / 100).toFixed(0)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#ccc' }}>–</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {roomTypes.length === 0 && <div className="empty-state">No room types. Add room types first.</div>}
      </div>
    </div>
  );
}
