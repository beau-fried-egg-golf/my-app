import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import { supabase } from '@/data/supabase';
import BookingSummary from '@/components/experiences/BookingSummary';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import type { ExperienceLocation, RoomType } from '@/types/experiences';

type Step = 'dates' | 'rooms' | 'summary';

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export default function BookLodging() {
  const params = useLocalSearchParams<{ locationId: string; roomTypeId?: string }>();
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { getLocation, createReservation, checkLodgingAvailability } = useExperienceStore();

  const [step, setStep] = useState<Step>('dates');
  const [location, setLocation] = useState<ExperienceLocation | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomCount, setRoomCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState(false);
  const [checkingAvail, setCheckingAvail] = useState(false);

  useEffect(() => {
    if (!params.locationId) return;
    getLocation(params.locationId).then(result => {
      if (result) {
        setLocation(result.location);
        setRoomTypes(result.roomTypes);
        if (params.roomTypeId) {
          const rt = result.roomTypes.find(r => r.id === params.roomTypeId);
          if (rt) setSelectedRoomType(rt);
        }
      }
    });
  }, [params.locationId]);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const nightlyRate = selectedRoomType?.base_price_per_night ?? 0;
  const totalCents = nightlyRate * nights * roomCount;

  const lineItems = selectedRoomType && nights > 0 ? [{
    description: `${selectedRoomType.name} × ${roomCount} room${roomCount > 1 ? 's' : ''} × ${nights} night${nights > 1 ? 's' : ''}`,
    quantity: nights * roomCount,
    unitPrice: nightlyRate,
    subtotal: totalCents,
  }] : [];

  async function handleBook() {
    if (!selectedRoomType || !checkIn || !checkOut || !params.locationId) return;

    setBooking(true);
    try {
      const reservation = await createReservation({
        type: 'lodging',
        location_id: params.locationId,
        room_type_id: selectedRoomType.id,
        room_count: roomCount,
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_price: totalCents,
        special_requests: specialRequests || null,
        items: [{
          type: 'room_night',
          description: `${selectedRoomType.name} (${nights} nights)`,
          date: checkIn,
          unit_price: nightlyRate,
          quantity: nights * roomCount,
          subtotal: totalCents,
        }],
      });

      // Create payment
      const { data, error } = await supabase.functions.invoke('create-experience-payment', {
        body: {
          reservation_id: reservation.id,
          amount_cents: totalCents,
          description: `${location?.name} - ${selectedRoomType.name}`,
        },
      });

      if (error) {
        Alert.alert('Payment Error', 'Could not create payment. Please try again.');
        return;
      }

      // TODO: Present Stripe Payment Sheet with data.client_secret
      // For now, simulate confirmation
      Alert.alert(
        'Booking Created',
        `Your reservation at ${location?.name} has been created. Payment integration coming soon.`,
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
        <Pressable onPress={() => step === 'dates' ? goBack() : setStep(step === 'summary' ? 'rooms' : 'dates')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <LetterSpacedHeader text="BOOK LODGING" size={32} variant="experiences" />
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {(['dates', 'rooms', 'summary'] as Step[]).map((s, i) => (
          <View key={s} style={[styles.progressDot, step === s && styles.progressDotActive, (['dates', 'rooms', 'summary'].indexOf(step) > i) && styles.progressDotDone]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {step === 'dates' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Dates</Text>
            <Text style={styles.stepSubtitle}>{location?.name}</Text>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <TextInput
                  style={styles.dateInput}
                  value={checkIn}
                  onChangeText={setCheckIn}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <TextInput
                  style={styles.dateInput}
                  value={checkOut}
                  onChangeText={setCheckOut}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.gray}
                />
              </View>
            </View>

            {nights > 0 && (
              <Text style={styles.nightsText}>{nights} night{nights > 1 ? 's' : ''}</Text>
            )}

            <Pressable
              style={[styles.nextBtn, (!checkIn || !checkOut) && styles.nextBtnDisabled]}
              onPress={() => setStep('rooms')}
              disabled={!checkIn || !checkOut}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === 'rooms' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Room</Text>
            <Text style={styles.stepSubtitle}>{formatDate(checkIn)} – {formatDate(checkOut)}</Text>

            {roomTypes.map(rt => (
              <Pressable
                key={rt.id}
                style={[styles.roomOption, selectedRoomType?.id === rt.id && styles.roomOptionSelected]}
                onPress={() => setSelectedRoomType(rt)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{rt.name}</Text>
                  {rt.bed_configuration && <Text style={styles.roomBeds}>{rt.bed_configuration}</Text>}
                  <Text style={styles.roomOcc}>Up to {rt.max_occupancy} guests</Text>
                </View>
                <Text style={styles.roomPrice}>${(rt.base_price_per_night / 100).toFixed(0)}/night</Text>
              </Pressable>
            ))}

            {selectedRoomType && (
              <View style={styles.countRow}>
                <Text style={styles.countLabel}>Number of rooms</Text>
                <View style={styles.counter}>
                  <Pressable onPress={() => setRoomCount(Math.max(1, roomCount - 1))} style={styles.counterBtn}>
                    <Ionicons name="remove" size={18} color={Colors.black} />
                  </Pressable>
                  <Text style={styles.counterValue}>{roomCount}</Text>
                  <Pressable onPress={() => setRoomCount(roomCount + 1)} style={styles.counterBtn}>
                    <Ionicons name="add" size={18} color={Colors.black} />
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable
              style={[styles.nextBtn, (!selectedRoomType || checkingAvail) && styles.nextBtnDisabled]}
              onPress={async () => {
                if (!selectedRoomType || !params.locationId || !checkIn || !checkOut) return;
                setCheckingAvail(true);
                try {
                  const availability = await checkLodgingAvailability(params.locationId, checkIn, checkOut);
                  const roomAvail = availability.find(rt => rt.id === selectedRoomType.id);
                  if (!roomAvail) {
                    Alert.alert('Unavailable', 'This room type has no inventory for the selected dates.');
                    return;
                  }
                  // Check that every night has enough units
                  const insufficientNight = roomAvail.nights.find(
                    night => !night.length || (night[0].available_units ?? 0) < roomCount,
                  );
                  if (insufficientNight) {
                    Alert.alert(
                      'Unavailable',
                      `Not enough ${selectedRoomType.name} rooms available for all nights. Please try fewer rooms or different dates.`,
                    );
                    return;
                  }
                  setStep('summary');
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Could not check availability');
                } finally {
                  setCheckingAvail(false);
                }
              }}
              disabled={!selectedRoomType || checkingAvail}
            >
              <Text style={styles.nextBtnText}>{checkingAvail ? 'Checking...' : 'Review Booking'}</Text>
            </Pressable>
          </View>
        )}

        {step === 'summary' && selectedRoomType && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Book</Text>

            <BookingSummary
              title={location?.name ?? 'Lodging'}
              subtitle={`${formatDate(checkIn)} – ${formatDate(checkOut)}`}
              items={lineItems}
              totalCents={totalCents}
            />

            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Special Requests (optional)</Text>
              <TextInput
                style={styles.textArea}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                placeholder="Any special requests..."
                placeholderTextColor={Colors.gray}
              />
            </View>

            <Pressable
              style={[styles.bookBtn, booking && styles.nextBtnDisabled]}
              onPress={handleBook}
              disabled={booking}
            >
              <Text style={styles.bookBtnText}>
                {booking ? 'Booking...' : `Book for $${(totalCents / 100).toFixed(2)}`}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: Colors.black },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressDotActive: { backgroundColor: Colors.white, width: 24 },
  progressDotDone: { backgroundColor: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 22, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  stepSubtitle: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4, marginBottom: 20 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 13, fontFamily: Fonts!.sansBold, color: Colors.darkGray, marginBottom: 4 },
  dateInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 15, fontFamily: Fonts!.sans, color: Colors.black },
  nightsText: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: Colors.gray, marginTop: 12, textAlign: 'center' },
  nextBtn: { backgroundColor: Colors.black, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  roomOption: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  roomOptionSelected: { borderColor: Colors.black, borderWidth: 2 },
  roomName: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  roomBeds: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  roomOcc: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  roomPrice: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  countLabel: { fontSize: 15, fontFamily: Fonts!.sansMedium, color: Colors.black },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, minWidth: 20, textAlign: 'center' },
  fieldLabel: { fontSize: 13, fontFamily: Fonts!.sansBold, color: Colors.darkGray, marginBottom: 4 },
  textArea: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 14, fontFamily: Fonts!.sans, color: Colors.black, minHeight: 80, textAlignVertical: 'top' },
  bookBtn: { backgroundColor: Colors.black, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  bookBtnText: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
});
