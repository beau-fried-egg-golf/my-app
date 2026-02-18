import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import type { TeeTimeSlot } from '@/types/experiences';

interface TeeTimeRowProps {
  slot: TeeTimeSlot;
  onSelect: () => void;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function TeeTimeRow({ slot, onSelect }: TeeTimeRowProps) {
  const booked = slot.booked_players ?? 0;
  const available = slot.max_players - booked;
  const isFull = available <= 0;
  const effectivePrice = slot.price_override ?? slot.price_per_player;

  return (
    <Pressable style={[styles.row, isFull && styles.rowFull]} onPress={onSelect} disabled={isFull}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(slot.time)}</Text>
      </View>
      <View style={styles.infoCol}>
        <View style={styles.playerDots}>
          {Array.from({ length: slot.max_players }).map((_, i) => (
            <View key={i} style={[styles.dot, i < booked && styles.dotFilled]} />
          ))}
        </View>
        <Text style={styles.availability}>
          {isFull ? 'Full' : `${available} ${available === 1 ? 'spot' : 'spots'} open`}
        </Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatPrice(effectivePrice)}</Text>
        <Text style={styles.perPlayer}>per player</Text>
      </View>
      {!isFull && (
        <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 12,
  },
  rowFull: {
    opacity: 0.4,
  },
  timeCol: {
    width: 80,
  },
  time: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  infoCol: {
    flex: 1,
  },
  playerDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
  },
  dotFilled: {
    backgroundColor: Colors.black,
  },
  availability: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  perPlayer: {
    fontSize: 11,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
});
