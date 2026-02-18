import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeeTimeSlots, saveTeeTimeSlot, deleteTeeTimeSlot, bulkCreateTeeTimeSlots } from './experienceStorage';
import { getCourses } from './storage';
import type { TeeTimeSlot, Course } from './types';

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function TeeTimeManager() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<TeeTimeSlot[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk generation form
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStart, setBulkStart] = useState('07:00');
  const [bulkEnd, setBulkEnd] = useState('15:00');
  const [bulkInterval, setBulkInterval] = useState(10);
  const [bulkMaxPlayers, setBulkMaxPlayers] = useState(4);
  const [bulkPrice, setBulkPrice] = useState('75.00');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    getCourses().then(courses => {
      setCourse(courses.find(c => c.id === courseId) ?? null);
    });
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;
    loadSlots();
  }, [courseId, date]);

  async function loadSlots() {
    if (!courseId) return;
    const data = await getTeeTimeSlots(courseId, date);
    setSlots(data);
  }

  async function handleBulkGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setGenerating(true);
    await bulkCreateTeeTimeSlots(
      courseId,
      date,
      bulkStart,
      bulkEnd,
      bulkInterval,
      bulkMaxPlayers,
      Math.round(parseFloat(bulkPrice) * 100),
    );
    await loadSlots();
    setGenerating(false);
    setShowBulk(false);
  }

  async function toggleBlock(slot: TeeTimeSlot) {
    await saveTeeTimeSlot({ ...slot, is_blocked: !slot.is_blocked });
    await loadSlots();
  }

  async function handleDelete(id: string) {
    await deleteTeeTimeSlot(id);
    setSlots(slots.filter(s => s.id !== id));
    setDeleteId(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tee Times</h1>
          {course && <p style={{ color: '#888', marginTop: 4 }}>{course.name}</p>}
        </div>
        <div className="btn-group">
          <button className="btn" onClick={() => navigate('/experiences/locations')}>Back</button>
          <button className="btn btn-primary" onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? 'Hide Generator' : 'Bulk Generate'}
          </button>
        </div>
      </div>

      {/* Date picker */}
      <div className="filters-bar">
        <label style={{ fontSize: 14, fontWeight: 500 }}>Date:</label>
        <input type="date" className="filter-input" value={date} onChange={e => setDate(e.target.value)} />
        <span style={{ color: '#888', fontSize: 14 }}>{slots.length} slots</span>
      </div>

      {/* Bulk generation dialog */}
      {showBulk && (
        <div className="form-container" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Generate Tee Times for {date}</h3>
          <form onSubmit={handleBulkGenerate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Tee</label>
              <input type="time" className="form-input" value={bulkStart} onChange={e => setBulkStart(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Tee</label>
              <input type="time" className="form-input" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Interval (min)</label>
              <input type="number" className="form-input form-input-sm" min={5} value={bulkInterval} onChange={e => setBulkInterval(parseInt(e.target.value) || 10)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max Players</label>
              <input type="number" className="form-input form-input-sm" min={1} max={6} value={bulkMaxPlayers} onChange={e => setBulkMaxPlayers(parseInt(e.target.value) || 4)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Price/Player ($)</label>
              <input type="number" step="0.01" className="form-input form-input-sm" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={generating}>
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </form>
        </div>
      )}

      {/* Slots table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Max Players</th>
              <th>Booked</th>
              <th>Available</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const booked = slot.booked_players ?? 0;
              const available = slot.max_players - booked;
              return (
                <tr key={slot.id} style={slot.is_blocked ? { opacity: 0.5 } : undefined}>
                  <td><strong>{formatTime(slot.time)}</strong></td>
                  <td>{slot.max_players}</td>
                  <td>{booked}</td>
                  <td>
                    <span style={{
                      color: available === 0 ? '#dc2626' : available <= 1 ? '#d97706' : '#16a34a',
                      fontWeight: 600,
                    }}>
                      {slot.is_blocked ? 'Blocked' : available}
                    </span>
                  </td>
                  <td>${formatCents(slot.price_override ?? slot.price_per_player)}</td>
                  <td>
                    <span className={`badge ${slot.is_blocked ? 'badge-hidden' : 'badge-visible'}`}>
                      {slot.is_blocked ? 'Blocked' : 'Open'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm" onClick={() => toggleBlock(slot)}>
                        {slot.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      {deleteId === slot.id ? (
                        <>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(slot.id)}>Confirm</button>
                          <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(slot.id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {slots.length === 0 && <div className="empty-state">No tee times for this date</div>}
      </div>
    </div>
  );
}
