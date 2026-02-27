import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useStore } from './store';
import type {
  ExperienceLocation,
  RoomType,
  RoomInventory,
  TeeTimeSlot,
  Package,
  PackageItem,
  Reservation,
  ReservationItem,
  Event,
  EventTicketType,
  EventAddOnGroup,
  EventAddOn,
  EventFormField,
} from '@/types/experiences';

interface ExperienceStoreContextType {
  // Locations
  locations: ExperienceLocation[];
  loadLocations: () => Promise<void>;
  getLocation: (id: string) => Promise<{
    location: ExperienceLocation;
    roomTypes: RoomType[];
    courses: any[];
  } | null>;

  // Courses
  experienceCourses: any[];
  loadExperienceCourses: () => Promise<void>;

  // Availability
  checkLodgingAvailability: (
    locationId: string,
    checkIn: string,
    checkOut: string,
  ) => Promise<(RoomType & { nights: RoomInventory[][] })[]>;
  checkTeeTimeAvailability: (
    courseId: string,
    date: string,
  ) => Promise<TeeTimeSlot[]>;

  // Packages
  packages: Package[];
  featuredPackages: Package[];
  loadPackages: () => Promise<void>;
  getPackage: (id: string) => Promise<{
    pkg: Package;
    items: PackageItem[];
  } | null>;
  checkPackageAvailability: (
    packageId: string,
    startDate: string,
    groupSize: number,
  ) => Promise<{ available: boolean; unavailableItems: string[] }>;

  // Events
  events: Event[];
  loadEvents: () => Promise<void>;
  getEvent: (slug: string) => Promise<{
    event: Event;
    ticket_types: EventTicketType[];
    add_on_groups: EventAddOnGroup[];
    add_ons: EventAddOn[];
    form_fields: EventFormField[];
  } | null>;

  // Reservations
  createPackageReservation: (data: {
    packageId: string;
    startDate: string;
    groupSize: number;
    guestNames: string[];
    specialRequests: string | null;
  }) => Promise<Reservation>;
  createReservation: (data: Partial<Reservation> & { items?: Partial<ReservationItem>[] }) => Promise<Reservation>;
  confirmReservation: (id: string, paymentIntentId: string) => Promise<void>;
  cancelReservation: (id: string, reason: string) => Promise<void>;
  myReservations: Reservation[];
  loadMyReservations: () => Promise<void>;
  getReservation: (id: string) => Promise<{
    reservation: Reservation;
    items: ReservationItem[];
  } | null>;

  isLoading: boolean;
}

const ExperienceStoreContext = createContext<ExperienceStoreContextType | null>(null);

export function useExperienceStore() {
  const ctx = useContext(ExperienceStoreContext);
  if (!ctx) throw new Error('useExperienceStore must be used within ExperienceStoreProvider');
  return ctx;
}

export function ExperienceStoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  const [locations, setLocations] = useState<ExperienceLocation[]>([]);
  const [experienceCourses, setExperienceCourses] = useState<any[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const featuredPackages = packages.filter(p => p.is_featured);

  // ── Locations ──

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('experience_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setLocations((data as ExperienceLocation[]) || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLocation = useCallback(async (id: string) => {
    const { data: location, error } = await supabase
      .from('experience_locations')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !location) return null;

    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('*')
      .eq('location_id', id)
      .eq('is_active', true)
      .order('sort_order');

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .eq('location_id', id)
      .eq('is_experience_course', true);

    return {
      location: location as ExperienceLocation,
      roomTypes: (roomTypes as RoomType[]) || [],
      courses: courses || [],
    };
  }, []);

  // ── Experience Courses ──

  const loadExperienceCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, experience_locations(name, hero_image)')
      .eq('is_experience_course', true)
      .order('name');
    if (error) throw error;
    setExperienceCourses(
      (data || []).map((c: any) => ({
        ...c,
        location_name: c.experience_locations?.name,
        location_hero_image: c.experience_locations?.hero_image,
        experience_locations: undefined,
      })),
    );
  }, []);

  // ── Availability ──

  const checkLodgingAvailability = useCallback(async (
    locationId: string,
    checkIn: string,
    checkOut: string,
  ) => {
    // Get room types for this location
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('sort_order');

    if (!roomTypes?.length) return [];

    // Get inventory for date range
    const { data: inventory } = await supabase
      .from('room_inventory')
      .select('*')
      .in('room_type_id', roomTypes.map(rt => rt.id))
      .gte('date', checkIn)
      .lt('date', checkOut);

    // Get existing confirmed reservations to compute booked units
    // (We fetch all and compute in JS since PostgREST can't do complex aggregations)
    const { data: reservations } = await supabase
      .from('reservations')
      .select('room_type_id, room_count, check_in_date, check_out_date')
      .eq('location_id', locationId)
      .in('status', ['confirmed', 'pending'])
      .or(`check_in_date.lt.${checkOut},check_out_date.gt.${checkIn}`);

    // Build availability per room type
    return (roomTypes as RoomType[]).map(rt => {
      const rtInventory = (inventory || []).filter(
        (inv: any) => inv.room_type_id === rt.id,
      );

      // For each night, compute available units
      const nights: RoomInventory[][] = [];
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const inv = rtInventory.find((i: any) => i.date === dateStr);
        if (inv) {
          // Count reservations overlapping this date for this room type
          const booked = (reservations || [])
            .filter((r: any) =>
              r.room_type_id === rt.id &&
              r.check_in_date <= dateStr &&
              r.check_out_date > dateStr,
            )
            .reduce((sum: number, r: any) => sum + (r.room_count || 1), 0);
          nights.push([{
            ...inv,
            available_units: Math.max(0, inv.total_units - inv.blocked_units - booked),
          } as RoomInventory]);
        } else {
          nights.push([]);
        }
      }

      return { ...rt, nights };
    });
  }, []);

  const checkTeeTimeAvailability = useCallback(async (
    courseId: string,
    date: string,
  ) => {
    const { data: slots, error } = await supabase
      .from('tee_time_slots')
      .select('*')
      .eq('course_id', courseId)
      .eq('date', date)
      .eq('is_blocked', false)
      .order('time');

    if (error || !slots) return [];

    // Get booked player counts
    const { data: booked } = await supabase
      .from('reservation_tee_times')
      .select('tee_time_slot_id, player_count')
      .in('tee_time_slot_id', slots.map(s => s.id));

    const bookedMap: Record<string, number> = {};
    (booked || []).forEach((b: any) => {
      bookedMap[b.tee_time_slot_id] = (bookedMap[b.tee_time_slot_id] || 0) + b.player_count;
    });

    return (slots as TeeTimeSlot[]).map(s => ({
      ...s,
      booked_players: bookedMap[s.id] || 0,
    }));
  }, []);

  // ── Packages ──

  const loadPackages = useCallback(async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*, experience_locations(name)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name');
    if (error) throw error;
    setPackages(
      (data || []).map((p: any) => ({
        ...p,
        location_name: p.experience_locations?.name,
        experience_locations: undefined,
      })) as Package[],
    );
  }, []);

  const getPackage = useCallback(async (id: string) => {
    const { data: pkg, error } = await supabase
      .from('packages')
      .select('*, experience_locations(name)')
      .eq('id', id)
      .single();
    if (error || !pkg) return null;

    const { data: items } = await supabase
      .from('package_items')
      .select('*')
      .eq('package_id', id)
      .order('day_number')
      .order('sort_order');

    return {
      pkg: {
        ...pkg,
        location_name: pkg.experience_locations?.name,
        experience_locations: undefined,
      } as Package,
      items: (items as PackageItem[]) || [],
    };
  }, []);

  const checkPackageAvailability = useCallback(async (
    packageId: string,
    startDate: string,
    groupSize: number,
  ) => {
    const result = await getPackage(packageId);
    if (!result) return { available: false, unavailableItems: ['Package not found'] };

    const { pkg, items } = result;
    const unavailableItems: string[] = [];

    for (const item of items) {
      // Resolve the date for this item: startDate + (day_number - 1)
      const itemDate = new Date(startDate + 'T00:00:00');
      itemDate.setDate(itemDate.getDate() + (item.day_number - 1));
      const dateStr = itemDate.toISOString().split('T')[0];

      if (item.type === 'lodging' && item.room_type_id) {
        // Check one night of lodging availability
        const nextDate = new Date(itemDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const checkOut = nextDate.toISOString().split('T')[0];

        const availability = await checkLodgingAvailability(pkg.location_id, dateStr, checkOut);
        const roomType = availability.find(rt => rt.id === item.room_type_id);
        if (!roomType || !roomType.nights[0]?.length || (roomType.nights[0][0].available_units ?? 0) < 1) {
          unavailableItems.push(`${item.title} (Day ${item.day_number}): no rooms available on ${dateStr}`);
        }
      }

      if (item.type === 'tee_time' && item.course_id) {
        const slots = await checkTeeTimeAvailability(item.course_id, dateStr);
        // Find a slot that fits the group; prefer matching start_time if set
        let matchingSlot = null;
        if (item.start_time) {
          matchingSlot = slots.find(s =>
            s.time.startsWith(item.start_time!.slice(0, 5)) &&
            s.max_players - (s.booked_players ?? 0) >= groupSize,
          );
        }
        if (!matchingSlot) {
          matchingSlot = slots.find(s =>
            s.max_players - (s.booked_players ?? 0) >= groupSize,
          );
        }
        if (!matchingSlot) {
          unavailableItems.push(`${item.title} (Day ${item.day_number}): no tee time slots with ${groupSize} spots on ${dateStr}`);
        }
      }
    }

    return { available: unavailableItems.length === 0, unavailableItems };
  }, [getPackage, checkLodgingAvailability, checkTeeTimeAvailability]);

  // ── Events ──

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('date', today)
        .order('date');
      if (error) throw error;

      // Enrich with booking counts
      const eventList = (data || []) as Event[];
      if (eventList.length > 0) {
        const { data: bookings } = await supabase
          .from('event_bookings')
          .select('event_id, quantity')
          .in('event_id', eventList.map(e => e.id))
          .in('status', ['pending', 'confirmed']);

        const countMap = new Map<string, number>();
        for (const b of bookings || []) {
          const qty = (b as any).quantity ?? 1;
          countMap.set((b as any).event_id, (countMap.get((b as any).event_id) ?? 0) + qty);
        }

        for (const ev of eventList) {
          ev.total_booked = countMap.get(ev.id) ?? 0;
          ev.spots_remaining = ev.total_capacity - (ev.total_booked ?? 0);
        }
      }

      setEvents(eventList);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEvent = useCallback(async (slug: string) => {
    const { data, error } = await supabase.functions.invoke('get-event', {
      body: { slug },
    });
    if (error || !data?.event) return null;
    return data as {
      event: Event;
      ticket_types: EventTicketType[];
      add_on_groups: EventAddOnGroup[];
      add_ons: EventAddOn[];
      form_fields: EventFormField[];
    };
  }, []);

  // ── Reservations ──

  const createPackageReservation = useCallback(async (data: {
    packageId: string;
    startDate: string;
    groupSize: number;
    guestNames: string[];
    specialRequests: string | null;
  }) => {
    const userId = session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    // 1. Check availability
    const availability = await checkPackageAvailability(data.packageId, data.startDate, data.groupSize);
    if (!availability.available) {
      throw new Error(`Package unavailable:\n${availability.unavailableItems.join('\n')}`);
    }

    // 2. Load package + items
    const result = await getPackage(data.packageId);
    if (!result) throw new Error('Package not found');
    const { pkg, items } = result;

    const totalCents = pkg.price_per_person * data.groupSize;
    const endDate = new Date(data.startDate + 'T00:00:00');
    endDate.setDate(endDate.getDate() + pkg.duration_nights);
    const checkOutDate = endDate.toISOString().split('T')[0];

    // Find first lodging item room_type_id and first tee_time course_id for reservation header
    const firstLodging = items.find(i => i.type === 'lodging' && i.room_type_id);
    const firstTeeTime = items.find(i => i.type === 'tee_time' && i.course_id);

    const holdExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 3. Insert reservation
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        type: 'package',
        status: 'pending',
        package_id: data.packageId,
        location_id: pkg.location_id,
        check_in_date: data.startDate,
        check_out_date: checkOutDate,
        room_type_id: firstLodging?.room_type_id ?? null,
        course_id: firstTeeTime?.course_id ?? null,
        player_count: data.groupSize,
        guest_names: data.guestNames,
        total_price: totalCents,
        special_requests: data.specialRequests,
        hold_expires_at: holdExpiry,
      })
      .select()
      .single();

    if (resError) throw resError;

    // 4. Build reservation_items and collect tee time junction rows
    const reservationItems: any[] = [];
    const teeTimeJunctions: any[] = [];

    for (const item of items) {
      const itemDate = new Date(data.startDate + 'T00:00:00');
      itemDate.setDate(itemDate.getDate() + (item.day_number - 1));
      const dateStr = itemDate.toISOString().split('T')[0];

      if (item.type === 'lodging') {
        reservationItems.push({
          reservation_id: reservation.id,
          type: 'room_night',
          description: item.title,
          date: dateStr,
          unit_price: 0, // included in package price
          quantity: 1,
          subtotal: 0,
          metadata: item.room_type_id ? { room_type_id: item.room_type_id } : {},
        });
      } else if (item.type === 'tee_time' && item.course_id) {
        // Find best available slot
        const slots = await checkTeeTimeAvailability(item.course_id, dateStr);
        let bestSlot = null;
        if (item.start_time) {
          bestSlot = slots.find(s =>
            s.time.startsWith(item.start_time!.slice(0, 5)) &&
            s.max_players - (s.booked_players ?? 0) >= data.groupSize,
          );
        }
        if (!bestSlot) {
          bestSlot = slots.find(s =>
            s.max_players - (s.booked_players ?? 0) >= data.groupSize,
          );
        }

        reservationItems.push({
          reservation_id: reservation.id,
          type: 'tee_time',
          description: item.title,
          date: dateStr,
          unit_price: 0,
          quantity: data.groupSize,
          subtotal: 0,
          tee_time_slot_id: bestSlot?.id ?? null,
          metadata: { course_id: item.course_id },
        });

        if (bestSlot) {
          teeTimeJunctions.push({
            reservation_id: reservation.id,
            tee_time_slot_id: bestSlot.id,
            player_count: data.groupSize,
          });
        }
      } else {
        // meal, transport, other
        reservationItems.push({
          reservation_id: reservation.id,
          type: 'other',
          description: item.title,
          date: dateStr,
          unit_price: 0,
          quantity: 1,
          subtotal: 0,
          metadata: {},
        });
      }
    }

    // 5. Insert reservation items
    if (reservationItems.length) {
      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(reservationItems);
      if (itemsError) console.error('Failed to insert reservation items:', itemsError);
    }

    // 6. Insert tee time junctions
    if (teeTimeJunctions.length) {
      const { error: junctionError } = await supabase
        .from('reservation_tee_times')
        .insert(teeTimeJunctions);
      if (junctionError) console.error('Failed to insert reservation_tee_times:', junctionError);
    }

    return reservation as Reservation;
  }, [session, checkPackageAvailability, getPackage, checkTeeTimeAvailability]);

  const createReservation = useCallback(async (
    data: Partial<Reservation> & { items?: Partial<ReservationItem>[] },
  ) => {
    const userId = session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { items, ...reservationData } = data;
    const holdExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        ...reservationData,
        user_id: userId,
        status: 'pending',
        hold_expires_at: holdExpiry,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert line items
    if (items?.length) {
      await supabase.from('reservation_items').insert(
        items.map(item => ({
          ...item,
          reservation_id: reservation.id,
        })),
      );
    }

    return reservation as Reservation;
  }, [session]);

  const confirmReservation = useCallback(async (
    id: string,
    paymentIntentId: string,
  ) => {
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        stripe_payment_intent_id: paymentIntentId,
        hold_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;

    // Refresh reservations
    await loadMyReservations();
  }, []);

  const cancelReservation = useCallback(async (
    id: string,
    reason: string,
  ) => {
    const { error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;

    // TODO: Trigger refund via edge function

    await loadMyReservations();
  }, []);

  const loadMyReservations = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    setMyReservations((data as Reservation[]) || []);
  }, [session]);

  const getReservation = useCallback(async (id: string) => {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !reservation) return null;

    const { data: items } = await supabase
      .from('reservation_items')
      .select('*')
      .eq('reservation_id', id)
      .order('date');

    return {
      reservation: reservation as Reservation,
      items: (items as ReservationItem[]) || [],
    };
  }, []);

  // ── Context value ──

  const value: ExperienceStoreContextType = {
    locations,
    loadLocations,
    getLocation,
    experienceCourses,
    loadExperienceCourses,
    checkLodgingAvailability,
    checkTeeTimeAvailability,
    events,
    loadEvents,
    getEvent,
    packages,
    featuredPackages,
    loadPackages,
    getPackage,
    checkPackageAvailability,
    createPackageReservation,
    createReservation,
    confirmReservation,
    cancelReservation,
    myReservations,
    loadMyReservations,
    getReservation,
    isLoading,
  };

  return (
    <ExperienceStoreContext.Provider value={value}>
      {children}
    </ExperienceStoreContext.Provider>
  );
}
