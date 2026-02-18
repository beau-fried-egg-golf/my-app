import { supabase } from './supabase';
import type {
  ExperienceLocation,
  RoomType,
  RoomInventory,
  TeeTimeSlot,
  ExperiencePackage,
  PackageItem,
  ExperienceReservation,
  ReservationItem,
} from './types';

// ── Locations ──

export async function getLocations(): Promise<ExperienceLocation[]> {
  const { data } = await supabase
    .from('experience_locations')
    .select('*')
    .order('name');

  if (!data) return [];

  // Get room type counts
  const locationIds = data.map(l => l.id);
  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('location_id')
    .in('location_id', locationIds);

  const countMap = new Map<string, number>();
  for (const rt of roomTypes ?? []) {
    countMap.set(rt.location_id, (countMap.get(rt.location_id) ?? 0) + 1);
  }

  return data.map(l => ({
    ...l,
    room_type_count: countMap.get(l.id) ?? 0,
  }));
}

export async function getLocation(id: string): Promise<ExperienceLocation | null> {
  const { data } = await supabase
    .from('experience_locations')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function saveLocation(location: ExperienceLocation): Promise<void> {
  const { room_type_count, created_at, ...data } = location;
  data.updated_at = new Date().toISOString();
  const { error } = await supabase.from('experience_locations').upsert(data as any);
  if (error) console.error('saveLocation failed:', error);
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from('experience_locations').delete().eq('id', id);
  if (error) console.error('deleteLocation failed:', error);
}

// ── Room Types ──

export async function getRoomTypes(locationId: string): Promise<RoomType[]> {
  const { data } = await supabase
    .from('room_types')
    .select('*')
    .eq('location_id', locationId)
    .order('sort_order');
  return data ?? [];
}

export async function saveRoomType(roomType: RoomType): Promise<void> {
  const { created_at, ...data } = roomType as any;
  const { error } = await supabase.from('room_types').upsert(data);
  if (error) console.error('saveRoomType failed:', error);
}

export async function deleteRoomType(id: string): Promise<void> {
  const { error } = await supabase.from('room_types').delete().eq('id', id);
  if (error) console.error('deleteRoomType failed:', error);
}

// ── Room Inventory ──

export async function getRoomInventory(
  roomTypeId: string,
  startDate: string,
  endDate: string,
): Promise<RoomInventory[]> {
  const { data } = await supabase
    .from('room_inventory')
    .select('*')
    .eq('room_type_id', roomTypeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  return data ?? [];
}

export async function saveRoomInventory(inventory: RoomInventory): Promise<void> {
  const { error } = await supabase.from('room_inventory').upsert(inventory);
  if (error) console.error('saveRoomInventory failed:', error);
}

export async function bulkSaveRoomInventory(items: Omit<RoomInventory, 'id'>[]): Promise<void> {
  // Use upsert with the unique constraint on (room_type_id, date)
  const withIds = items.map(item => ({
    ...item,
    id: crypto.randomUUID(),
  }));
  const { error } = await supabase.from('room_inventory').upsert(withIds, {
    onConflict: 'room_type_id,date',
  });
  if (error) console.error('bulkSaveRoomInventory failed:', error);
}

// ── Tee Time Slots ──

export async function getTeeTimeSlots(
  courseId: string,
  date: string,
): Promise<TeeTimeSlot[]> {
  const { data: slots } = await supabase
    .from('tee_time_slots')
    .select('*')
    .eq('course_id', courseId)
    .eq('date', date)
    .order('time');

  if (!slots?.length) return [];

  // Get booked player counts
  const slotIds = slots.map(s => s.id);
  const { data: booked } = await supabase
    .from('reservation_tee_times')
    .select('tee_time_slot_id, player_count')
    .in('tee_time_slot_id', slotIds);

  const bookedMap = new Map<string, number>();
  for (const b of booked ?? []) {
    bookedMap.set(b.tee_time_slot_id, (bookedMap.get(b.tee_time_slot_id) ?? 0) + b.player_count);
  }

  return slots.map(s => ({
    ...s,
    booked_players: bookedMap.get(s.id) ?? 0,
  }));
}

export async function saveTeeTimeSlot(slot: TeeTimeSlot): Promise<void> {
  const { booked_players, ...data } = slot;
  const { error } = await supabase.from('tee_time_slots').upsert(data);
  if (error) console.error('saveTeeTimeSlot failed:', error);
}

export async function deleteTeeTimeSlot(id: string): Promise<void> {
  const { error } = await supabase.from('tee_time_slots').delete().eq('id', id);
  if (error) console.error('deleteTeeTimeSlot failed:', error);
}

export async function bulkCreateTeeTimeSlots(
  courseId: string,
  date: string,
  startTime: string,
  endTime: string,
  intervalMinutes: number,
  maxPlayers: number,
  pricePerPlayer: number,
): Promise<void> {
  const slots: Omit<TeeTimeSlot, 'id' | 'created_at' | 'booked_players'>[] = [];
  const now = new Date().toISOString();

  let [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  while (startH * 60 + startM <= endMinutes) {
    const time = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`;
    slots.push({
      course_id: courseId,
      date,
      time,
      max_players: maxPlayers,
      price_per_player: pricePerPlayer,
      price_override: null,
      is_blocked: false,
      notes: null,
    });
    startM += intervalMinutes;
    while (startM >= 60) {
      startM -= 60;
      startH += 1;
    }
  }

  if (slots.length === 0) return;

  const withIds = slots.map(s => ({
    ...s,
    id: crypto.randomUUID(),
    created_at: now,
  }));

  const { error } = await supabase.from('tee_time_slots').insert(withIds);
  if (error) console.error('bulkCreateTeeTimeSlots failed:', error);
}

export async function getTeeTimeSlotsForRange(
  courseId: string,
  startDate: string,
  endDate: string,
): Promise<TeeTimeSlot[]> {
  const { data: slots } = await supabase
    .from('tee_time_slots')
    .select('*')
    .eq('course_id', courseId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('time');

  if (!slots?.length) return [];

  const slotIds = slots.map(s => s.id);
  const { data: booked } = await supabase
    .from('reservation_tee_times')
    .select('tee_time_slot_id, player_count')
    .in('tee_time_slot_id', slotIds);

  const bookedMap = new Map<string, number>();
  for (const b of booked ?? []) {
    bookedMap.set(b.tee_time_slot_id, (bookedMap.get(b.tee_time_slot_id) ?? 0) + b.player_count);
  }

  return slots.map(s => ({
    ...s,
    booked_players: bookedMap.get(s.id) ?? 0,
  }));
}

export interface SlotBooking {
  reservation_id: string;
  user_name: string;
  player_count: number;
  status: string;
  guest_names: string | null;
}

export async function getSlotBookings(slotId: string): Promise<SlotBooking[]> {
  const { data: rows } = await supabase
    .from('reservation_tee_times')
    .select('reservation_id, player_count')
    .eq('tee_time_slot_id', slotId);

  if (!rows?.length) return [];

  const resIds = rows.map(r => r.reservation_id);
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, user_id, status, guest_names')
    .in('id', resIds);

  if (!reservations?.length) return [];

  const userIds = [...new Set(reservations.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));
  const resMap = new Map(reservations.map(r => [r.id, r]));

  return rows.map(row => {
    const res = resMap.get(row.reservation_id);
    return {
      reservation_id: row.reservation_id,
      user_name: res ? (profileMap.get(res.user_id) ?? 'Member') : 'Unknown',
      player_count: row.player_count,
      status: res?.status ?? 'unknown',
      guest_names: res?.guest_names ?? null,
    };
  });
}

export async function adminBookTeeTime(
  slotId: string,
  courseId: string,
  userId: string,
  playerCount: number,
  guestNames: string | null,
  adminNotes: string | null,
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const reservationId = crypto.randomUUID();
  const itemId = crypto.randomUUID();

  // 1. Create reservation
  const { error: resError } = await supabase.from('reservations').insert({
    id: reservationId,
    user_id: userId,
    course_id: courseId,
    type: 'tee_time',
    status: 'confirmed',
    total_price: 0,
    admin_notes: adminNotes,
    guest_names: guestNames,
    created_at: now,
    updated_at: now,
  });
  if (resError) return { error: resError.message };

  // 2. Create reservation item
  const { error: itemError } = await supabase.from('reservation_items').insert({
    id: itemId,
    reservation_id: reservationId,
    type: 'tee_time',
    tee_time_slot_id: slotId,
    created_at: now,
  });
  if (itemError) return { error: itemError.message };

  // 3. Create reservation_tee_times junction
  const { error: junctionError } = await supabase.from('reservation_tee_times').insert({
    id: crypto.randomUUID(),
    reservation_id: reservationId,
    tee_time_slot_id: slotId,
    player_count: playerCount,
    created_at: now,
  });
  if (junctionError) return { error: junctionError.message };

  return {};
}

// ── Packages ──

export async function getPackages(): Promise<ExperiencePackage[]> {
  const { data } = await supabase
    .from('packages')
    .select('*, experience_locations(name)')
    .order('name');

  return (data ?? []).map((p: any) => ({
    ...p,
    location_name: p.experience_locations?.name,
    experience_locations: undefined,
  }));
}

export async function getPackage(id: string): Promise<{
  pkg: ExperiencePackage;
  items: PackageItem[];
} | null> {
  const { data: pkg } = await supabase
    .from('packages')
    .select('*, experience_locations(name)')
    .eq('id', id)
    .single();

  if (!pkg) return null;

  const { data: items } = await supabase
    .from('package_items')
    .select('*')
    .eq('package_id', id)
    .order('day_number')
    .order('sort_order');

  return {
    pkg: {
      ...pkg,
      location_name: (pkg as any).experience_locations?.name,
      experience_locations: undefined,
    } as ExperiencePackage,
    items: (items ?? []) as PackageItem[],
  };
}

export async function savePackage(pkg: ExperiencePackage): Promise<void> {
  const { location_name, created_at, ...data } = pkg;
  data.updated_at = new Date().toISOString();
  const { error } = await supabase.from('packages').upsert(data as any);
  if (error) console.error('savePackage failed:', error);
}

export async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) console.error('deletePackage failed:', error);
}

export async function savePackageItems(
  packageId: string,
  items: PackageItem[],
): Promise<void> {
  // Delete existing items then re-insert
  await supabase.from('package_items').delete().eq('package_id', packageId);

  if (items.length > 0) {
    const { error } = await supabase.from('package_items').insert(items);
    if (error) console.error('savePackageItems failed:', error);
  }
}

// ── Reservations ──

export async function getReservations(filters?: {
  status?: string;
  type?: string;
  search?: string;
}): Promise<ExperienceReservation[]> {
  let query = supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data: reservations } = await query;
  if (!reservations?.length) return [];

  // Enrich with names
  const userIds = [...new Set(reservations.map(r => r.user_id))];
  const locationIds = [...new Set(reservations.map(r => r.location_id).filter(Boolean))];
  const roomTypeIds = [...new Set(reservations.map(r => r.room_type_id).filter(Boolean))];
  const courseIds = [...new Set(reservations.map(r => r.course_id).filter(Boolean))];
  const packageIds = [...new Set(reservations.map(r => r.package_id).filter(Boolean))];

  const [profilesRes, locationsRes, roomTypesRes, coursesRes, packagesRes] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', userIds),
    locationIds.length ? supabase.from('experience_locations').select('id, name').in('id', locationIds) : { data: [] },
    roomTypeIds.length ? supabase.from('room_types').select('id, name').in('id', roomTypeIds) : { data: [] },
    courseIds.length ? supabase.from('courses').select('id, name').in('id', courseIds) : { data: [] },
    packageIds.length ? supabase.from('packages').select('id, name').in('id', packageIds) : { data: [] },
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p.name]));
  const locationMap = new Map((locationsRes.data ?? []).map(l => [l.id, l.name]));
  const roomTypeMap = new Map((roomTypesRes.data ?? []).map(r => [r.id, r.name]));
  const courseMap = new Map((coursesRes.data ?? []).map(c => [c.id, c.name]));
  const packageMap = new Map((packagesRes.data ?? []).map(p => [p.id, p.name]));

  let results = reservations.map(r => ({
    ...r,
    user_name: profileMap.get(r.user_id) ?? 'Member',
    location_name: r.location_id ? locationMap.get(r.location_id) ?? undefined : undefined,
    room_type_name: r.room_type_id ? roomTypeMap.get(r.room_type_id) ?? undefined : undefined,
    course_name: r.course_id ? courseMap.get(r.course_id) ?? undefined : undefined,
    package_name: r.package_id ? packageMap.get(r.package_id) ?? undefined : undefined,
  })) as ExperienceReservation[];

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(r =>
      r.user_name?.toLowerCase().includes(term) ||
      r.location_name?.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term),
    );
  }

  return results;
}

export async function getReservation(id: string): Promise<{
  reservation: ExperienceReservation;
  items: ReservationItem[];
} | null> {
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (!reservation) return null;

  const { data: items } = await supabase
    .from('reservation_items')
    .select('*')
    .eq('reservation_id', id)
    .order('date');

  // Enrich
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', reservation.user_id)
    .single();

  return {
    reservation: {
      ...reservation,
      user_name: profile?.name ?? 'Member',
    } as ExperienceReservation,
    items: (items ?? []) as ReservationItem[],
  };
}

export async function updateReservationStatus(
  id: string,
  status: string,
  adminNotes?: string,
): Promise<void> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) {
    updates.admin_notes = adminNotes;
  }
  if (status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString();
  }
  const { error } = await supabase.from('reservations').update(updates).eq('id', id);
  if (error) console.error('updateReservationStatus failed:', error);
}

// ── Experience Courses ──

export async function enableExperienceCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ is_experience_course: true })
    .eq('id', courseId);
  if (error) console.error('enableExperienceCourse failed:', error);
}

export async function disableExperienceCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ is_experience_course: false })
    .eq('id', courseId);
  if (error) console.error('disableExperienceCourse failed:', error);
}

export async function getExperienceCourses(locationId?: string): Promise<any[]> {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('is_experience_course', true)
    .order('name');

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data } = await query;
  return data ?? [];
}
