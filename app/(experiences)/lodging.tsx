import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function LodgingBrowse() {
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { locations, loadLocations, isLoading } = useExperienceStore();

  useEffect(() => {
    loadLocations();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <LetterSpacedHeader text="LODGING" size={32} variant="experiences" />
        </View>
        {locations.length > 0 ? (
          locations.map(loc => (
            <Pressable
              key={loc.id}
              style={styles.locationCard}
              onPress={() => router.push(`/(experiences)/location/${loc.id}?tab=lodging`)}
            >
              {loc.hero_image ? (
                <Image source={{ uri: loc.hero_image }} style={styles.locationImage} />
              ) : (
                <View style={[styles.locationImage, styles.locationImagePlaceholder]}>
                  <Ionicons name="bed-outline" size={36} color={Colors.gray} />
                </View>
              )}
              <View style={styles.locationOverlay} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{loc.name}</Text>
                {loc.city && loc.state && (
                  <Text style={styles.locationMeta}>{loc.city}, {loc.state}</Text>
                )}
                {loc.short_description && (
                  <Text style={styles.locationDesc} numberOfLines={2}>{loc.short_description}</Text>
                )}
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{loc.type.replace('_', ' ')}</Text>
                </View>
              </View>
            </Pressable>
          ))
        ) : isLoading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={40} color={Colors.lightGray} />
            <Text style={styles.emptyTitle}>No lodging available</Text>
            <Text style={styles.emptySubtitle}>Check back soon for new destinations</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  topRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 100 },

  locationCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    height: 200,
  },
  locationImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as any,
  locationImagePlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  locationInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  locationName: {
    fontSize: 20, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white,
  },
  locationMeta: {
    fontSize: 13, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.8)', marginTop: 2,
  },
  locationDesc: {
    fontSize: 13, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 18,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8,
  },
  typeBadgeText: {
    fontSize: 12, fontFamily: Fonts!.sansBold, color: Colors.white, textTransform: 'capitalize',
  },

  emptyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, textAlign: 'center', paddingVertical: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  emptySubtitle: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
});
