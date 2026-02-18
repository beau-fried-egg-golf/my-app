import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import type { Package, PackageItem } from '@/types/experiences';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const TYPE_ICONS: Record<string, string> = {
  lodging: 'bed-outline',
  tee_time: 'golf-outline',
  meal: 'restaurant-outline',
  transport: 'car-outline',
  other: 'ellipsis-horizontal',
};

export default function PackageDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { getPackage } = useExperienceStore();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [items, setItems] = useState<PackageItem[]>([]);

  useEffect(() => {
    if (!id) return;
    getPackage(id).then(result => {
      if (result) {
        setPkg(result.pkg);
        setItems(result.items);
      }
    });
  }, [id]);

  if (!pkg) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  // Group items by day
  const dayMap = new Map<number, PackageItem[]>();
  for (const item of items) {
    const list = dayMap.get(item.day_number) ?? [];
    list.push(item);
    dayMap.set(item.day_number, list);
  }
  const days = [...dayMap.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{pkg.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        {pkg.hero_image ? (
          <Image source={{ uri: pkg.hero_image }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Ionicons name="golf-outline" size={48} color={Colors.gray} />
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{pkg.name}</Text>
          {pkg.location_name && (
            <Text style={styles.location}>
              <Ionicons name="location-outline" size={14} color={Colors.gray} /> {pkg.location_name}
            </Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{formatPrice(pkg.price_per_person)}</Text>
              <Text style={styles.metaLabel}>per person</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{pkg.duration_nights}</Text>
              <Text style={styles.metaLabel}>{pkg.duration_nights === 1 ? 'night' : 'nights'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{pkg.min_group_size}–{pkg.max_group_size}</Text>
              <Text style={styles.metaLabel}>group size</Text>
            </View>
          </View>

          {pkg.description && (
            <Text style={styles.description}>{pkg.description}</Text>
          )}

          {/* Tags */}
          {pkg.tags.length > 0 && (
            <View style={styles.tagRow}>
              {pkg.tags.map((t, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Inclusions & Exclusions */}
        {pkg.inclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {pkg.inclusions.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {pkg.exclusions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not Included</Text>
            {pkg.exclusions.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Day-by-day itinerary */}
        {days.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {days.map(([dayNum, dayItems]) => (
              <View key={dayNum} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>Day {dayNum}</Text>
                {dayItems.map(item => (
                  <View key={item.id} style={styles.itineraryItem}>
                    <View style={styles.itineraryIcon}>
                      <Ionicons name={TYPE_ICONS[item.type] as any ?? 'ellipsis-horizontal'} size={16} color={Colors.black} />
                    </View>
                    <View style={styles.itineraryInfo}>
                      <Text style={styles.itineraryTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.itineraryDesc}>{item.description}</Text>
                      )}
                      {item.start_time && (
                        <Text style={styles.itineraryTime}>
                          {formatTime(item.start_time)}
                          {item.end_time ? ` – ${formatTime(item.end_time)}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Cancellation policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>
            {pkg.cancellation_policy.charAt(0).toUpperCase() + pkg.cancellation_policy.slice(1)}
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <View>
          <Text style={styles.ctaPrice}>{formatPrice(pkg.price_per_person)}</Text>
          <Text style={styles.ctaPer}>per person</Text>
        </View>
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push({
            pathname: '/(experiences)/book-package',
            params: { packageId: id },
          })}
        >
          <Text style={styles.ctaButtonText}>Book This Package</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.black, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white, flex: 1 },
  scrollContent: { paddingBottom: 120 },
  hero: { width: '100%', height: 240 },
  heroPlaceholder: { backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  infoSection: { padding: 16 },
  name: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  location: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 24, marginTop: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.lightGray },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  metaLabel: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  description: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray, marginTop: 16, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { backgroundColor: Colors.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, fontFamily: Fonts!.sansMedium, color: Colors.darkGray },

  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 17, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  listItemText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray },

  dayBlock: { marginBottom: 20 },
  dayTitle: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 8 },
  itineraryItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  itineraryIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  itineraryInfo: { flex: 1 },
  itineraryTitle: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  itineraryDesc: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  itineraryTime: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },

  policyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, paddingTop: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: Colors.lightGray,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  ctaPrice: { fontSize: 20, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  ctaPer: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray },
  ctaButton: {
    backgroundColor: Colors.black, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10,
  },
  ctaButtonText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
});
