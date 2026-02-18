import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useExperienceStore } from '@/data/experienceStore';
import { supabase } from '@/data/supabase';
import BookingSummary from '@/components/experiences/BookingSummary';
import type { Package, PackageItem } from '@/types/experiences';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function BookPackage() {
  const { packageId } = useLocalSearchParams<{ packageId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getPackage, createReservation } = useExperienceStore();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [items, setItems] = useState<PackageItem[]>([]);
  const [startDate, setStartDate] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [guestNames, setGuestNames] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState(false);

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
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Book Package</Text>
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

  async function handleBook() {
    if (!packageId || !pkg || !startDate) return;
    setBooking(true);
    try {
      const reservation = await createReservation({
        type: 'package',
        package_id: packageId,
        location_id: pkg.location_id,
        check_in_date: startDate,
        check_out_date: endDate,
        player_count: groupSize,
        guest_names: guestNames ? guestNames.split(',').map(n => n.trim()) : [],
        total_price: totalCents,
        special_requests: specialRequests || null,
        items: [{
          type: 'other',
          description: `${pkg.name} – ${groupSize} person${groupSize > 1 ? 's' : ''}`,
          date: startDate,
          unit_price: pkg.price_per_person,
          quantity: groupSize,
          subtotal: totalCents,
        }],
      });

      const { data, error } = await supabase.functions.invoke('create-experience-payment', {
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Package</Text>
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
              onChangeText={setStartDate}
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
              <Pressable onPress={() => setGroupSize(Math.max(pkg.min_group_size, groupSize - 1))} style={styles.counterBtn}>
                <Ionicons name="remove" size={18} color={Colors.black} />
              </Pressable>
              <Text style={styles.counterValue}>{groupSize}</Text>
              <Pressable onPress={() => setGroupSize(Math.min(pkg.max_group_size, groupSize + 1))} style={styles.counterBtn}>
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
            style={[styles.bookBtn, (booking || !startDate) && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={booking || !startDate}
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
  header: { backgroundColor: Colors.black, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
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
  bookBtn: { backgroundColor: Colors.black, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
});
