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
  ) => Promise<boolean>;

  // Reservations
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
  const [packages, setPackages] = useState<Package[]>([]);
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
    _packageId: string,
    _startDate: string,
  ) => {
    // TODO: Check room + tee time availability for all package items
    return true;
  }, []);

  // ── Reservations ──

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
    checkLodgingAvailability,
    checkTeeTimeAvailability,
    packages,
    featuredPackages,
    loadPackages,
    getPackage,
    checkPackageAvailability,
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
