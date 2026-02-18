import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import type { RoomType } from '@/types/experiences';

interface RoomCardProps {
  roomType: RoomType;
  nightlyRate: number; // cents, effective rate for the selected dates
  availableUnits: number;
  onSelect: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function RoomCard({ roomType, nightlyRate, availableUnits, onSelect }: RoomCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 32; // 16px padding on each side
  const isSoldOut = availableUnits <= 0;

  return (
    <Pressable style={[styles.card, isSoldOut && styles.cardSoldOut]} onPress={onSelect} disabled={isSoldOut}>
      {/* Photo gallery */}
      {roomType.images.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
        >
          {roomType.images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={[styles.galleryImage, { width: cardWidth }]} />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.gallery, styles.galleryPlaceholder]}>
          <Ionicons name="bed-outline" size={32} color={Colors.gray} />
        </View>
      )}
      {roomType.images.length > 1 && (
        <View style={styles.imageCount}>
          <Ionicons name="images-outline" size={12} color={Colors.white} />
          <Text style={styles.imageCountText}>{roomType.images.length}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoRow}>
        <View style={styles.info}>
          <Text style={styles.name}>{roomType.name}</Text>
          {roomType.bed_configuration && (
            <Text style={styles.beds}>{roomType.bed_configuration}</Text>
          )}
          <View style={styles.details}>
            <Text style={styles.detail}>
              <Ionicons name="people-outline" size={13} color={Colors.gray} /> Up to {roomType.max_occupancy}
            </Text>
          </View>
          {roomType.amenities.length > 0 && (
            <Text style={styles.amenities} numberOfLines={1}>
              {roomType.amenities.slice(0, 4).join(' · ')}
            </Text>
          )}
        </View>
        <View style={styles.pricing}>
          <Text style={styles.price}>{formatPrice(nightlyRate)}</Text>
          <Text style={styles.perNight}>per night</Text>
          {isSoldOut ? (
            <Text style={styles.soldOut}>Sold Out</Text>
          ) : (
            <Text style={styles.available}>
              {availableUnits} {availableUnits === 1 ? 'room' : 'rooms'} left
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardSoldOut: {
    opacity: 0.5,
  },

  // Gallery
  gallery: {
    height: 180,
  },
  galleryImage: {
    height: 180,
    resizeMode: 'cover',
  } as any,
  galleryPlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCount: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    color: Colors.white,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    padding: 14,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  beds: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 3,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  detail: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
  amenities: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.darkGray,
    marginTop: 6,
  },
  pricing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  price: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  perNight: {
    fontSize: 11,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
  available: {
    fontSize: 11,
    fontFamily: Fonts!.sansMedium,
    color: '#D97706',
    marginTop: 6,
  },
  soldOut: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: '#DC2626',
    marginTop: 6,
  },
});
