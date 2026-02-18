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
import type { Package, PackageItem } from '@/types/experiences';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function BookPackage() {
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { getPackage, createPackageReservation, checkPackageAvailability } = useExperienceStore();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [items, setItems] = useState<PackageItem[]>([]);
  const [startDate, setStartDate] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [guestNames, setGuestNames] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; unavailableItems: string[] } | null>(null);

  // Reset availability when inputs change
  function updateStartDate(val: string) { setStartDate(val); setAvailabilityResult(null); }
  function updateGroupSize(val: number) { setGroupSize(val); setAvailabilityResult(null); }

  useEffect(() => {
    if (!packageId) return;
    getPackage(packageId).then(result => {
      if (result) {
        setPkg(result.pkg);
        setItems(result.items);
      }
    });
  }, [packageId]);

  if (!pkg) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <LetterSpacedHeader text="BOOK PACKAGE" size={32} variant="experiences" />
          </View>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  const totalCents = pkg.price_per_person * groupSize;

  // Compute end date
  let endDate = '';
  if (startDate) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + pkg.duration_nights);
    endDate = d.toISOString().split('T')[0];
  }

  async function handleCheckAvailability() {
    if (!packageId || !startDate) return;
    setChecking(true);
    setAvailabilityResult(null);
    try {
      const result = await checkPackageAvailability(packageId, startDate, groupSize);
      setAvailabilityResult(result);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not check availability');
    } finally {
      setChecking(false);
    }
  }

  async function handleBook() {
    if (!packageId || !pkg || !startDate || !availabilityResult?.available) return;
    setBooking(true);
    try {
      const reservation = await createPackageReservation({
        packageId,
        startDate,
        groupSize,
        guestNames: guestNames ? guestNames.split(',').map(n => n.trim()) : [],
        specialRequests: specialRequests || null,
      });

      const { error } = await supabase.functions.invoke('create-experience-payment', {
        body: {
          reservation_id: reservation.id,
          amount_cents: totalCents,
          description: pkg.name,
        },
      });

      if (error) {
        Alert.alert('Payment Error', 'Could not create payment. Please try again.');
        return;
      }

      Alert.alert(
        'Booking Created',
        `Your ${pkg.name} package has been reserved. Payment integration coming soon.`,
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
          <LetterSpacedHeader text="BOOK PACKAGE" size={32} variant="experiences" />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.packageName}>{pkg.name}</Text>
          {pkg.location_name && <Text style={styles.locationName}>{pkg.location_name}</Text>}
          <Text style={styles.meta}>
            {pkg.duration_nights} nights · {formatPrice(pkg.price_per_person)}/person
          </Text>

          {/* Start date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={updateStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray}
            />
            {endDate && (
              <Text style={styles.endDateHint}>
                Package ends: {endDate}
              </Text>
            )}
          </View>

          {/* Group size */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Group Size</Text>
            <View style={styles.counter}>
              <Pressable onPress={() => updateGroupSize(Math.max(pkg.min_group_size, groupSize - 1))} style={styles.counterBtn}>
                <Ionicons name="remove" size={18} color={Colors.black} />
              </Pressable>
              <Text style={styles.counterValue}>{groupSize}</Text>
              <Pressable onPress={() => updateGroupSize(Math.min(pkg.max_group_size, groupSize + 1))} style={styles.counterBtn}>
                <Ionicons name="add" size={18} color={Colors.black} />
              </Pressable>
            </View>
            <Text style={styles.sizeHint}>{pkg.min_group_size}–{pkg.max_group_size} people</Text>
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

          {/* Check Availability */}
          {startDate ? (
            <Pressable
              style={[styles.checkBtn, checking && styles.bookBtnDisabled]}
              onPress={handleCheckAvailability}
              disabled={checking}
            >
              <Text style={styles.checkBtnText}>
                {checking ? 'Checking...' : 'Check Availability'}
              </Text>
            </Pressable>
          ) : null}

          {availabilityResult && (
            <View style={[styles.availabilityResult, availabilityResult.available ? styles.availabilityOk : styles.availabilityBad]}>
              <Text style={[styles.availabilityText, availabilityResult.available ? styles.availabilityTextOk : styles.availabilityTextBad]}>
                {availabilityResult.available
                  ? 'All items available for your dates!'
                  : 'Some items are unavailable:'}
              </Text>
              {availabilityResult.unavailableItems.map((item, i) => (
                <Text key={i} style={styles.unavailableItem}>{item}</Text>
              ))}
            </View>
          )}

          <BookingSummary
            title={pkg.name}
            subtitle={startDate ? `${startDate} – ${endDate}` : undefined}
            items={[{
              description: `${groupSize} person${groupSize > 1 ? 's' : ''} × ${formatPrice(pkg.price_per_person)}`,
              quantity: groupSize,
              unitPrice: pkg.price_per_person,
              subtotal: totalCents,
            }]}
            totalCents={totalCents}
          />

          <Pressable
            style={[styles.bookBtn, (booking || !startDate || !availabilityResult?.available) && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={booking || !startDate || !availabilityResult?.available}
          >
            <Text style={styles.bookBtnText}>
              {booking ? 'Booking...' : `Book for ${formatPrice(totalCents)}`}
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
  packageName: { fontSize: 22, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  locationName: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  meta: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: Colors.darkGray, marginTop: 4, marginBottom: 24 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: Fonts!.sansBold, color: Colors.darkGray, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 15, fontFamily: Fonts!.sans, color: Colors.black },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  endDateHint: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, minWidth: 24, textAlign: 'center' },
  sizeHint: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  checkBtn: { borderWidth: 2, borderColor: Colors.black, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  checkBtnText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  availabilityResult: { borderRadius: 10, padding: 14, marginBottom: 16 },
  availabilityOk: { backgroundColor: '#e8f5e9' },
  availabilityBad: { backgroundColor: '#fce4ec' },
  availabilityText: { fontSize: 14, fontFamily: Fonts!.sansMedium },
  availabilityTextOk: { color: '#2e7d32' },
  availabilityTextBad: { color: '#c62828' },
  unavailableItem: { fontSize: 13, fontFamily: Fonts!.sans, color: '#c62828', marginTop: 4 },
  bookBtn: { backgroundColor: Colors.black, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
});
