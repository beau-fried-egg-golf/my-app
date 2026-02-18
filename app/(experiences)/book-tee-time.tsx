import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import { useStore } from '@/data/store';
import { supabase } from '@/data/supabase';
import BookingSummary from '@/components/experiences/BookingSummary';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import type { TeeTimeSlot } from '@/types/experiences';

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function BookTeeTime() {
  const params = useLocalSearchParams<{ courseId: string; slotId: string; date: string }>();
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { courses } = useStore();
  const { checkTeeTimeAvailability, createReservation } = useExperienceStore();

  const [slot, setSlot] = useState<TeeTimeSlot | null>(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [guestNames, setGuestNames] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState(false);

  const course = courses.find(c => c.id === params.courseId);

  useEffect(() => {
    if (!params.courseId || !params.date) return;
    checkTeeTimeAvailability(params.courseId, params.date).then(slots => {
      const found = slots.find(s => s.id === params.slotId);
      if (found) setSlot(found);
    });
  }, [params.courseId, params.date, params.slotId]);

  if (!slot) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <LetterSpacedHeader text="BOOK TEE TIME" size={32} variant="experiences" />
          </View>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  const available = slot.max_players - (slot.booked_players ?? 0);
  const effectivePrice = slot.price_override ?? slot.price_per_player;
  const totalCents = effectivePrice * playerCount;

  async function handleBook() {
    if (!params.courseId || !slot) return;
    setBooking(true);
    try {
      const reservation = await createReservation({
        type: 'tee_time',
        course_id: params.courseId,
        check_in_date: params.date,
        player_count: playerCount,
        guest_names: guestNames ? guestNames.split(',').map(n => n.trim()) : [],
        total_price: totalCents,
        special_requests: specialRequests || null,
        items: [{
          type: 'tee_time',
          description: `${course?.name ?? 'Golf'} – ${formatTime(slot.time)} (${playerCount} player${playerCount > 1 ? 's' : ''})`,
          date: params.date,
          unit_price: effectivePrice,
          quantity: playerCount,
          subtotal: totalCents,
          tee_time_slot_id: slot.id,
        }],
      });

      const { data, error } = await supabase.functions.invoke('create-experience-payment', {
        body: {
          reservation_id: reservation.id,
          amount_cents: totalCents,
          description: `${course?.name} Tee Time`,
        },
      });

      if (error) {
        Alert.alert('Payment Error', 'Could not create payment. Please try again.');
        return;
      }

      Alert.alert(
        'Booking Created',
        `Your tee time has been reserved. Payment integration coming soon.`,
        [{ text: 'OK', onPress: () => router.replace('/(experiences)/reservations') }],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create booking');
    } finally {
      setBooking(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <LetterSpacedHeader text="BOOK TEE TIME" size={32} variant="experiences" />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Slot info */}
          <View style={styles.slotCard}>
            <Text style={styles.courseName}>{course?.name ?? 'Course'}</Text>
            <Text style={styles.slotDate}>{params.date}</Text>
            <Text style={styles.slotTime}>{formatTime(slot.time)}</Text>
            <Text style={styles.slotAvailable}>{available} spots available</Text>
          </View>

          {/* Player count */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Number of Players</Text>
            <View style={styles.counter}>
              <Pressable onPress={() => setPlayerCount(Math.max(1, playerCount - 1))} style={styles.counterBtn}>
                <Ionicons name="remove" size={18} color={Colors.black} />
              </Pressable>
              <Text style={styles.counterValue}>{playerCount}</Text>
              <Pressable onPress={() => setPlayerCount(Math.min(available, playerCount + 1))} style={styles.counterBtn}>
                <Ionicons name="add" size={18} color={Colors.black} />
              </Pressable>
            </View>
          </View>

          {/* Guest names */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Guest Names (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={guestNames}
              onChangeText={setGuestNames}
              placeholder="John, Jane, ..."
              placeholderTextColor={Colors.gray}
            />
          </View>

          {/* Special requests */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Special Requests (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              placeholder="Any special requests..."
              placeholderTextColor={Colors.gray}
            />
          </View>

          {/* Summary */}
          <BookingSummary
            title="Tee Time"
            subtitle={`${course?.name} – ${formatTime(slot.time)}`}
            items={[{
              description: `${playerCount} player${playerCount > 1 ? 's' : ''} × $${(effectivePrice / 100).toFixed(2)}`,
              quantity: playerCount,
              unitPrice: effectivePrice,
              subtotal: totalCents,
            }]}
            totalCents={totalCents}
          />

          <Pressable
            style={[styles.bookBtn, booking && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={booking}
          >
            <Text style={styles.bookBtnText}>
              {booking ? 'Booking...' : `Book for $${(totalCents / 100).toFixed(2)}`}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  content: { padding: 20 },
  slotCard: { backgroundColor: Colors.black, borderRadius: 12, padding: 20, marginBottom: 24, alignItems: 'center' },
  courseName: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: 'rgba(255,255,255,0.7)' },
  slotDate: { fontSize: 14, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  slotTime: { fontSize: 28, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white, marginTop: 8 },
  slotAvailable: { fontSize: 13, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: Fonts!.sansBold, color: Colors.darkGray, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 15, fontFamily: Fonts!.sans, color: Colors.black },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, minWidth: 24, textAlign: 'center' },
  bookBtn: { backgroundColor: Colors.black, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
});
