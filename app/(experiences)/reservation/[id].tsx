import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useExperienceStore } from '@/data/experienceStore';
import type { Reservation, ReservationItem } from '@/types/experiences';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF3CD', color: '#92400E' },
  confirmed: { bg: '#D4EDDA', color: '#166534' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
  completed: { bg: '#DBEAFE', color: '#1E40AF' },
  no_show: { bg: '#F3F4F6', color: '#4B5563' },
};

export default function ReservationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getReservation, cancelReservation } = useExperienceStore();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!id) return;
    getReservation(id).then(result => {
      if (result) {
        setReservation(result.reservation);
        setItems(result.items);
      }
    });
  }, [id]);

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    try {
      await cancelReservation(id, cancelReason);
      // Reload
      const result = await getReservation(id);
      if (result) {
        setReservation(result.reservation);
        setItems(result.items);
      }
      setShowCancel(false);
      Alert.alert('Cancelled', 'Your reservation has been cancelled.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not cancel reservation');
    } finally {
      setCancelling(false);
    }
  }

  if (!reservation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Reservation</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  const statusStyle = STATUS_COLORS[reservation.status] ?? STATUS_COLORS.pending;
  const canCancel = reservation.status === 'pending' || reservation.status === 'confirmed';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Reservation</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Status + Price hero */}
        <View style={styles.heroSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{reservation.status}</Text>
          </View>
          <Text style={styles.totalPrice}>{formatPrice(reservation.total_price)}</Text>
          <Text style={styles.type}>{reservation.type.replace('_', ' ')}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          {reservation.check_in_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {reservation.type === 'tee_time' ? 'Date' : 'Check-in'}
              </Text>
              <Text style={styles.detailValue}>{formatDate(reservation.check_in_date)}</Text>
            </View>
          )}
          {reservation.check_out_date && reservation.type !== 'tee_time' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Check-out</Text>
              <Text style={styles.detailValue}>{formatDate(reservation.check_out_date)}</Text>
            </View>
          )}
          {reservation.player_count && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Players</Text>
              <Text style={styles.detailValue}>{reservation.player_count}</Text>
            </View>
          )}
          {reservation.room_count > 1 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rooms</Text>
              <Text style={styles.detailValue}>{reservation.room_count}</Text>
            </View>
          )}
          {reservation.guest_names.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>{reservation.guest_names.join(', ')}</Text>
            </View>
          )}
          {reservation.special_requests && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Requests</Text>
              <Text style={styles.detailValue}>{reservation.special_requests}</Text>
            </View>
          )}
        </View>

        {/* Line items */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Breakdown</Text>
            {items.map(item => (
              <View key={item.id} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineDesc}>{item.description}</Text>
                  {item.quantity > 1 && (
                    <Text style={styles.lineQty}>{item.quantity} × {formatPrice(item.unit_price)}</Text>
                  )}
                </View>
                <Text style={styles.linePrice}>{formatPrice(item.subtotal)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(reservation.total_price)}</Text>
            </View>
          </View>
        )}

        {/* Cancelled info */}
        {reservation.cancelled_at && (
          <View style={[styles.section, styles.cancelledSection]}>
            <Text style={styles.cancelledTitle}>Cancelled</Text>
            <Text style={styles.cancelledDate}>{formatDate(reservation.cancelled_at.split('T')[0])}</Text>
            {reservation.cancellation_reason && (
              <Text style={styles.cancelledReason}>{reservation.cancellation_reason}</Text>
            )}
          </View>
        )}

        {/* Cancel action */}
        {canCancel && !showCancel && (
          <Pressable style={styles.cancelBtn} onPress={() => setShowCancel(true)}>
            <Text style={styles.cancelBtnText}>Cancel Reservation</Text>
          </Pressable>
        )}

        {showCancel && (
          <View style={styles.cancelForm}>
            <Text style={styles.cancelFormTitle}>Cancel this reservation?</Text>
            <TextInput
              style={styles.cancelInput}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation..."
              placeholderTextColor={Colors.gray}
              multiline
            />
            <View style={styles.cancelActions}>
              <Pressable style={styles.cancelConfirmBtn} onPress={handleCancel} disabled={cancelling}>
                <Text style={styles.cancelConfirmBtnText}>
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelDismissBtn} onPress={() => setShowCancel(false)}>
                <Text style={styles.cancelDismissBtnText}>Keep Reservation</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.idRow}>
          <Text style={styles.idLabel}>Reservation ID</Text>
          <Text style={styles.idValue}>{reservation.id}</Text>
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

  heroSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: Colors.black },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, textTransform: 'uppercase' },
  totalPrice: { fontSize: 32, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white, marginTop: 12 },
  type: { fontSize: 14, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.6)', marginTop: 4, textTransform: 'capitalize' },

  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  sectionTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  detailLabel: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
  detailValue: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: Colors.black, flex: 1, textAlign: 'right', marginLeft: 16 },

  lineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
  lineDesc: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.black },
  lineQty: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  linePrice: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: Colors.black },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  totalLabel: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  totalValue: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },

  cancelledSection: { backgroundColor: '#FEF2F2' },
  cancelledTitle: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: '#991B1B' },
  cancelledDate: { fontSize: 13, fontFamily: Fonts!.sans, color: '#991B1B', marginTop: 4 },
  cancelledReason: { fontSize: 13, fontFamily: Fonts!.sans, color: '#666', marginTop: 4 },

  cancelBtn: { margin: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#DC2626', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: '#DC2626' },

  cancelForm: { margin: 16, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.lightGray },
  cancelFormTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },
  cancelInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 14, fontFamily: Fonts!.sans, color: Colors.black, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  cancelActions: { gap: 8 },
  cancelConfirmBtn: { backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelConfirmBtnText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  cancelDismissBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelDismissBtnText: { fontSize: 15, fontFamily: Fonts!.sansMedium, color: Colors.gray },

  idRow: { padding: 16, alignItems: 'center' },
  idLabel: { fontSize: 11, fontFamily: Fonts!.sans, color: Colors.gray, textTransform: 'uppercase' },
  idValue: { fontSize: 11, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
});
