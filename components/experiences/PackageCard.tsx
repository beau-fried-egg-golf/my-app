import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import type { Package } from '@/types/experiences';

interface PackageCardProps {
  pkg: Package;
  onPress: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function PackageCard({ pkg, onPress }: PackageCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {pkg.hero_image ? (
        <Image source={{ uri: pkg.hero_image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="golf-outline" size={32} color={Colors.gray} />
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{pkg.name}</Text>
          {pkg.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        {pkg.location_name && (
          <Text style={styles.location} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={Colors.gray} /> {pkg.location_name}
          </Text>
        )}
        {pkg.short_description && (
          <Text style={styles.description} numberOfLines={2}>{pkg.short_description}</Text>
        )}
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(pkg.price_per_person)}</Text>
            <Text style={styles.perPerson}>per person</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {pkg.duration_nights} {pkg.duration_nights === 1 ? 'night' : 'nights'}
            </Text>
            {pkg.tags.length > 0 && (
              <Text style={styles.meta}> · {pkg.tags[0]}</Text>
            )}
          </View>
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
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 160,
  },
  imagePlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: '#FFEE54',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  featuredText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  location: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.darkGray,
    marginTop: 6,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  perPerson: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
  metaRow: {
    flexDirection: 'row',
  },
  meta: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
});
