import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { Colors, Fonts } from '@/constants/theme';

const eggSvgs = [
  require('@/assets/icons/egg-0.svg'),
  require('@/assets/icons/egg-1.svg'),
  require('@/assets/icons/egg-2.svg'),
  require('@/assets/icons/egg-3.svg'),
];

// PNG fallback for native
const eggPngs: Record<number, any> = {
  0: require('@/assets/icons/egg-0.png'),
  1: require('@/assets/icons/egg-1.png'),
  2: require('@/assets/icons/egg-2.png'),
  3: require('@/assets/icons/egg-3.png'),
};

interface EggRatingProps {
  rating: number | null; // 0-3, null = not rated
  size?: number;
}

export default function EggRating({ rating, size = 28 }: EggRatingProps) {
  const iconKey = rating === null ? 0 : rating;
  const label =
    rating === null
      ? 'Not Rated'
      : rating === 1
        ? '1 Egg'
        : `${rating} Eggs`;

  const iconWidth = size * 2.3;
  const topPad = size * 0.15;

  if (Platform.OS === 'web') {
    const [svgUri, setSvgUri] = useState<string | null>(null);

    useEffect(() => {
      const asset = Asset.fromModule(eggSvgs[iconKey]);
      asset.downloadAsync().then(() => {
        setSvgUri(asset.localUri || asset.uri);
      });
    }, [iconKey]);

    if (!svgUri) return null;

    return (
      <View style={styles.container}>
        <img
          src={svgUri}
          width={iconWidth}
          height={size}
          style={{ marginTop: topPad, objectFit: 'contain' }}
          alt={label}
        />
        <Text style={[styles.label, { fontSize: size * 0.5 }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={eggPngs[iconKey]}
        style={{ width: iconWidth, height: size, marginTop: topPad }}
        resizeMode="contain"
      />
      <Text style={[styles.label, { fontSize: size * 0.5 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginLeft: 4,
  },
});
