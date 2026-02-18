import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface LineItem {
  description: string;
  quantity?: number;
  unitPrice: number; // cents
  subtotal: number;  // cents
}

interface BookingSummaryProps {
  title: string;
  subtitle?: string;
  items: LineItem[];
  totalCents: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BookingSummary({ title, subtitle, items, totalCents }: BookingSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.divider} />

      {items.map((item, idx) => (
        <View key={idx} style={styles.lineItem}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemDesc}>{item.description}</Text>
            {item.quantity && item.quantity > 1 && (
              <Text style={styles.itemQty}>
                {item.quantity} × {formatPrice(item.unitPrice)}
              </Text>
            )}
          </View>
          <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>{formatPrice(totalCents)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 12,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemDesc: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  itemQty: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
});
