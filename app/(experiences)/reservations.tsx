import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import type { Reservation } from '@/types/experiences';

type Tab = 'upcoming' | 'past' | 'cancelled';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF3CD', color: '#92400E' },
  confirmed: { bg: '#D4EDDA', color: '#166534' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
  completed: { bg: '#DBEAFE', color: '#1E40AF' },
  no_show: { bg: '#F3F4F6', color: '#4B5563' },
};

export default function Reservations() {
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { myReservations, loadMyReservations } = useExperienceStore();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  useEffect(() => {
    loadMyReservations();
  }, []);

  const upcoming = myReservations.filter(r => r.status === 'pending' || r.status === 'confirmed');
  const past = myReservations.filter(r => r.status === 'completed' || r.status === 'no_show');
  const cancelled = myReservations.filter(r => r.status === 'cancelled');

  const filtered = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled;

  function renderReservation(res: Reservation) {
    const statusStyle = STATUS_COLORS[res.status] ?? STATUS_COLORS.pending;
    return (
      <Pressable
        key={res.id}
        style={styles.card}
        onPress={() => router.push(`/(experiences)/reservation/${res.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{res.status}</Text>
          </View>
          <Text style={styles.cardPrice}>{formatPrice(res.total_price)}</Text>
        </View>
        <Text style={styles.cardType}>{res.type.replace('_', ' ')}</Text>
        {res.check_in_date && (
          <Text style={styles.cardDate}>
            {formatDate(res.check_in_date)}
            {res.check_out_date ? ` → ${formatDate(res.check_out_date)}` : ''}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardId}>#{res.id.slice(0, 8)}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <LetterSpacedHeader text="RESERVATIONS" size={32} variant="experiences" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['upcoming', 'past', 'cancelled'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'upcoming' && upcoming.length > 0 ? ` (${upcoming.length})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {filtered.length > 0 ? (
          filtered.map(renderReservation)
        ) : (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={Colors.lightGray} />
            <Text style={styles.emptyTitle}>No {activeTab} reservations</Text>
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
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.lightGray, paddingHorizontal: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.black },
  tabText: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: Colors.gray },
  tabTextActive: { color: Colors.black, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, textTransform: 'uppercase' },
  cardPrice: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  cardType: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, textTransform: 'capitalize' },
  cardDate: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  cardId: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontFamily: Fonts!.sansMedium, color: Colors.gray, marginTop: 12 },
});
