import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { supabase } from '@/data/supabase';
import type { RoomType } from '@/types/experiences';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function RoomDetail() {
  const { id, locationId } = useLocalSearchParams<{ id: string; locationId: string }>();
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [room, setRoom] = useState<RoomType | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('room_types')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setRoom(data as RoomType);
      });
  }, [id]);

  if (!room) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo gallery */}
        {room.images.length > 0 ? (
          <View>
            {/* Back button inside gallery */}
            <View style={styles.headerOverlay}>
              <Pressable onPress={goBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={Colors.white} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setActiveImageIndex(idx);
              }}
            >
              {room.images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.galleryImage, { width: screenWidth }]}
                />
              ))}
            </ScrollView>
            {room.images.length > 1 && (
              <View style={styles.dots}>
                {room.images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeImageIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.galleryPlaceholder}>
            <View style={styles.headerOverlay}>
              <Pressable onPress={goBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={Colors.white} />
              </Pressable>
            </View>
            <Ionicons name="bed-outline" size={48} color={Colors.gray} />
          </View>
        )}

        {/* Room info */}
        <View style={styles.infoSection}>
          <Text style={styles.roomName}>{room.name}</Text>

          <View style={styles.quickStats}>
            {room.bed_configuration && (
              <View style={styles.stat}>
                <Ionicons name="bed-outline" size={16} color={Colors.darkGray} />
                <Text style={styles.statText}>{room.bed_configuration}</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={16} color={Colors.darkGray} />
              <Text style={styles.statText}>Sleeps {room.max_occupancy}</Text>
            </View>
          </View>

          {room.description && (
            <Text style={styles.description}>{room.description}</Text>
          )}
        </View>

        {/* Amenities */}
        {room.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenityGrid}>
              {room.amenities.map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons name="checkmark" size={14} color={Colors.black} />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Nightly rate</Text>
            <Text style={styles.priceValue}>{formatPrice(room.base_price_per_night)}</Text>
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <View>
          <Text style={styles.bottomPrice}>{formatPrice(room.base_price_per_night)}</Text>
          <Text style={styles.bottomPriceLabel}>per night</Text>
        </View>
        <Pressable
          style={styles.bookBtn}
          onPress={() => router.push({
            pathname: '/(experiences)/book-lodging',
            params: { locationId: locationId || room.location_id, roomTypeId: id },
          })}
        >
          <Text style={styles.bookBtnText}>Check Availability</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // Header overlay
  headerOverlay: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Gallery
  galleryImage: {
    height: 280,
    resizeMode: 'cover',
  } as any,
  galleryPlaceholder: {
    height: 280,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
  },
  dotActive: {
    backgroundColor: Colors.black,
  },

  // Info
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  roomName: {
    fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray,
  },
  description: {
    fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray, marginTop: 14, lineHeight: 21,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12,
  },

  // Amenities
  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 13, fontFamily: Fonts!.sans, color: Colors.darkGray,
  },

  // Pricing
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  priceLabel: {
    fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray,
  },
  priceValue: {
    fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomPrice: {
    fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black,
  },
  bottomPriceLabel: {
    fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray,
  },
  bookBtn: {
    backgroundColor: Colors.black,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookBtnText: {
    fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white,
  },
});
