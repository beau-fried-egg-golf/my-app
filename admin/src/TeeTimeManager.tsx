import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTeeTimeSlotsForRange,
  getSlotBookings,
  adminBookTeeTime,
  saveTeeTimeSlot,
  deleteTeeTimeSlot,
  bulkCreateTeeTimeSlots,
} from './experienceStorage';
import { getCourses, getProfiles } from './storage';
import type { TeeTimeSlot, Course, Profile } from './types';
import type { SlotBooking } from './experienceStorage';

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Get Monday of the week containing `date` */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${monthNames[monday.getMonth()]} ${monday.getDate()} – ${monthNames[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

export default function TeeTimeManager() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [slots, setSlots] = useState<TeeTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedSlot, setSelectedSlot] = useState<TeeTimeSlot | null>(null);
  const [bookings, setBookings] = useState<SlotBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Admin book form
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [playerCount, setPlayerCount] = useState(1);
  const [guestNames, setGuestNames] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk generation form
  const [showBulk, setShowBulk] = useState(false);
  const [bulkStart, setBulkStart] = useState('07:00');
  const [bulkEnd, setBulkEnd] = useState('15:00');
  const [bulkInterval, setBulkInterval] = useState(10);
  const [bulkMaxPlayers, setBulkMaxPlayers] = useState(4);
  const [bulkPrice, setBulkPrice] = useState('75.00');
  const [bulkStartDate, setBulkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkEndDate, setBulkEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkDays, setBulkDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState('');

  // Load course info
  useEffect(() => {
    if (!courseId) return;
    getCourses().then(courses => {
      setCourse(courses.find(c => c.id === courseId) ?? null);
    });
  }, [courseId]);

  // Load profiles for user picker
  useEffect(() => {
    getProfiles().then(setProfiles);
  }, []);

  // Load slots for the week
  useEffect(() => {
    if (!courseId) return;
    loadWeek();
  }, [courseId, weekStart]);

  async function loadWeek() {
    if (!courseId) return;
    setLoading(true);
    const start = toDateStr(weekStart);
    const end = toDateStr(addDays(weekStart, 6));
    const data = await getTeeTimeSlotsForRange(courseId, start, end);
    setSlots(data);
    setLoading(false);
  }

  // Build grid data: Map<dateStr, Map<timeStr, TeeTimeSlot>>
  const { gridMap, allTimes, weekDates } = useMemo(() => {
    const gridMap = new Map<string, Map<string, TeeTimeSlot>>();
    const timeSet = new Set<string>();
    const weekDates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      weekDates.push(d);
      gridMap.set(toDateStr(d), new Map());
    }

    for (const slot of slots) {
      const dateMap = gridMap.get(slot.date);
      if (dateMap) {
        dateMap.set(slot.time, slot);
        timeSet.add(slot.time);
      }
    }

    const allTimes = [...timeSet].sort();
    return { gridMap, allTimes, weekDates };
  }, [slots, weekStart]);

  // Open slot detail modal
  async function openSlot(slot: TeeTimeSlot) {
    setSelectedSlot(slot);
    setBookings([]);
    setLoadingBookings(true);
    setUserSearch('');
    setSelectedUserId('');
    setPlayerCount(1);
    setGuestNames('');
    setAdminNotes('');
    setBookError('');
    const data = await getSlotBookings(slot.id);
    setBookings(data);
    setLoadingBookings(false);
  }

  function closeModal() {
    setSelectedSlot(null);
    setBookings([]);
  }

  // Admin book
  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !selectedUserId || !courseId) return;
    setBooking(true);
    setBookError('');
    const result = await adminBookTeeTime(
      selectedSlot.id,
      courseId,
      selectedUserId,
      playerCount,
      guestNames || null,
      adminNotes || null,
    );
    if (result.error) {
      setBookError(result.error);
      setBooking(false);
      return;
    }
    setBooking(false);
    // Refresh
    await loadWeek();
    // Reload bookings for this slot
    const updated = await getSlotBookings(selectedSlot.id);
    setBookings(updated);
    // Update selected slot's booked count
    const newBooked = updated.reduce((sum, b) => sum + b.player_count, 0);
    setSelectedSlot(prev => prev ? { ...prev, booked_players: newBooked } : null);
    // Reset form
    setUserSearch('');
    setSelectedUserId('');
    setPlayerCount(1);
    setGuestNames('');
    setAdminNotes('');
  }

  // Filtered profiles for user picker
  const filteredProfiles = userSearch.length >= 2
    ? profiles.filter(p =>
        p.name?.toLowerCase().includes(userSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  // Block/unblock
  async function toggleBlock(slot: TeeTimeSlot) {
    await saveTeeTimeSlot({ ...slot, is_blocked: !slot.is_blocked });
    await loadWeek();
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot({ ...slot, is_blocked: !slot.is_blocked });
    }
  }

  // Delete slot
  async function handleDelete(id: string) {
    await deleteTeeTimeSlot(id);
    setDeleteId(null);
    if (selectedSlot?.id === id) closeModal();
    await loadWeek();
  }

  // Bulk generate
  function getMatchingDates(): string[] {
    const dates: string[] = [];
    const start = new Date(bulkStartDate + 'T00:00:00');
    const end = new Date(bulkEndDate + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    const current = new Date(start);
    while (current <= end) {
      if (bulkDays.includes(current.getDay())) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function toggleDay(day: number) {
    setBulkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort(),
    );
  }

  async function handleBulkGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    const dates = getMatchingDates();
    if (dates.length === 0) return;
    setGenerating(true);
    const priceCents = Math.round(parseFloat(bulkPrice) * 100);
    for (let i = 0; i < dates.length; i++) {
      setGenerateProgress(`${i + 1} / ${dates.length} days`);
      await bulkCreateTeeTimeSlots(
        courseId,
        dates[i],
        bulkStart,
        bulkEnd,
        bulkInterval,
        bulkMaxPlayers,
        priceCents,
      );
    }
    await loadWeek();
    setGenerating(false);
    setGenerateProgress('');
    setShowBulk(false);
  }

  // Cell color
  function cellClass(slot: TeeTimeSlot): string {
    if (slot.is_blocked) return 'tee-cell tee-cell-blocked';
    const booked = slot.booked_players ?? 0;
    const avail = slot.max_players - booked;
    if (avail <= 0) return 'tee-cell tee-cell-full';
    if (booked > 0) return 'tee-cell tee-cell-partial';
    return 'tee-cell tee-cell-open';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tee Times</h1>
          {course && <p style={{ color: '#888', marginTop: 4 }}>{course.name}</p>}
        </div>
        <div className="btn-group">
          <button className="btn" onClick={() => navigate('/experiences/tee-times')}>Back</button>
          <button className="btn btn-primary" onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? 'Hide Generator' : 'Bulk Generate'}
          </button>
        </div>
      </div>

      {/* Bulk generation dialog */}
      {showBulk && (
        <div className="form-container" style={{ marginBottom: 24, maxWidth: '100%' }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Bulk Generate Tee Times</h3>
          <form onSubmit={handleBulkGenerate}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Days of Week</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 13,
                      borderRadius: 4,
                      border: '1px solid #d1d5db',
                      background: bulkDays.includes(i) ? '#1a1a1a' : 'transparent',
                      color: bulkDays.includes(i) ? '#fff' : '#888',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
              <button type="submit" className="btn btn-primary" disabled={generating || getMatchingDates().length === 0}>
                {generating ? `Generating ${generateProgress}` : `Generate (${getMatchingDates().length} day${getMatchingDates().length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Week navigation */}
      <div className="filters-bar">
        <button className="btn btn-sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>&larr; Prev Week</button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{formatWeekRange(weekStart)}</span>
        <button className="btn btn-sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next Week &rarr;</button>
        <button className="btn btn-sm" onClick={() => setWeekStart(getMonday(new Date()))}>Today</button>
        {loading && <span style={{ color: '#888', fontSize: 13 }}>Loading...</span>}
      </div>

      {/* Weekly grid */}
      <div className="table-container">
        <table className="tee-grid">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Time</th>
              {weekDates.map((d, i) => (
                <th key={i} style={{ textAlign: 'center', minWidth: 80 }}>
                  {DAY_LABELS[i]}<br />{formatShortDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTimes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#888' }}>
                  No tee times this week
                </td>
              </tr>
            )}
            {allTimes.map(time => (
              <tr key={time}>
                <td style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                  {formatTime(time)}
                </td>
                {weekDates.map((d, i) => {
                  const dateStr = toDateStr(d);
                  const slot = gridMap.get(dateStr)?.get(time);
                  if (!slot) {
                    return <td key={i} className="tee-cell tee-cell-empty">&mdash;</td>;
                  }
                  const booked = slot.booked_players ?? 0;
                  return (
                    <td
                      key={i}
                      className={cellClass(slot)}
                      onClick={() => openSlot(slot)}
                    >
                      {slot.is_blocked ? 'X' : `${booked}/${slot.max_players}`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slot detail modal */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {formatTime(selectedSlot.time)} &mdash; {selectedSlot.date}
                </h3>
                <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                  {(selectedSlot.booked_players ?? 0)}/{selectedSlot.max_players} booked
                  &nbsp;&middot;&nbsp;
                  ${formatCents(selectedSlot.price_override ?? selectedSlot.price_per_player)}/player
                  {selectedSlot.is_blocked && <span className="badge badge-hidden" style={{ marginLeft: 8 }}>Blocked</span>}
                </p>
              </div>
              <button className="btn btn-sm" onClick={closeModal}>&times;</button>
            </div>

            {/* Current bookings */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Bookings</h4>
              {loadingBookings ? (
                <p style={{ color: '#888', fontSize: 13 }}>Loading...</p>
              ) : bookings.length === 0 ? (
                <p style={{ color: '#888', fontSize: 13 }}>No bookings yet</p>
              ) : (
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 8px' }}>Player</th>
                      <th style={{ padding: '4px 8px' }}>Count</th>
                      <th style={{ padding: '4px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.reservation_id}>
                        <td style={{ padding: '4px 8px' }}>{b.user_name}</td>
                        <td style={{ padding: '4px 8px' }}>{b.player_count}</td>
                        <td style={{ padding: '4px 8px' }}>
                          <span className={`badge ${b.status === 'confirmed' ? 'badge-visible' : b.status === 'cancelled' ? 'badge-hidden' : 'badge-public'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Admin book form */}
            {(() => {
              const booked = selectedSlot.booked_players ?? 0;
              const available = selectedSlot.max_players - booked;
              if (available <= 0 || selectedSlot.is_blocked) return null;

              return (
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Book a Player</h4>
                  <form onSubmit={handleBook}>
                    {/* User search */}
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label">Member</label>
                      <input
                        className="form-input"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={e => { setUserSearch(e.target.value); setSelectedUserId(''); }}
                      />
                      {filteredProfiles.length > 0 && !selectedUserId && (
                        <div className="user-dropdown">
                          {filteredProfiles.map(p => (
                            <div
                              key={p.id}
                              className="user-dropdown-item"
                              onClick={() => {
                                setSelectedUserId(p.id);
                                setUserSearch(p.name || p.id);
                              }}
                            >
                              <strong>{p.name || 'No name'}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Players</label>
                        <input
                          type="number"
                          className="form-input form-input-sm"
                          min={1}
                          max={available}
                          value={playerCount}
                          onChange={e => setPlayerCount(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Guest Names</label>
                        <input
                          className="form-input"
                          placeholder="Comma-separated"
                          value={guestNames}
                          onChange={e => setGuestNames(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Admin Notes</label>
                      <input
                        className="form-input"
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                      />
                    </div>
                    {bookError && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 8 }}>{bookError}</p>}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!selectedUserId || booking}
                    >
                      {booking ? 'Booking...' : 'Book'}
                    </button>
                  </form>
                </div>
              );
            })()}

            {/* Slot actions */}
            <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => toggleBlock(selectedSlot)}>
                {selectedSlot.is_blocked ? 'Unblock' : 'Block'}
              </button>
              {deleteId === selectedSlot.id ? (
                <>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(selectedSlot.id)}>Confirm Delete</button>
                  <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(selectedSlot.id)}>Delete Slot</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
