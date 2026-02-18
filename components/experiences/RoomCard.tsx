import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const isSoldOut = availableUnits <= 0;

  return (
    <Pressable style={[styles.card, isSoldOut && styles.cardSoldOut]} onPress={onSelect} disabled={isSoldOut}>
      {roomType.images.length > 0 ? (
        <Image source={{ uri: roomType.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="bed-outline" size={24} color={Colors.gray} />
        </View>
      )}
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
            {roomType.amenities.slice(0, 3).join(' · ')}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardSoldOut: {
    opacity: 0.5,
  },
  image: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  beds: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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
    marginTop: 4,
  },
  pricing: {
    padding: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  price: {
    fontSize: 16,
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
    marginTop: 4,
  },
  soldOut: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: '#DC2626',
    marginTop: 4,
  },
});
