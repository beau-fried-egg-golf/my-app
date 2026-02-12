import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

const stampImages = [
  require('@/assets/passport stamps/rectangle stamp.png'),
  require('@/assets/passport stamps/circle stamp.png'),
  require('@/assets/passport stamps/pentagon stamp.png'),
  require('@/assets/passport stamps/triangle stamp.png'),
];

const cluckersSvg = require('@/assets/passport stamps/Group 13375.svg');

type StampShape = 'rectangle' | 'circle' | 'pentagon' | 'triangle';
const SHAPES: StampShape[] = ['rectangle', 'circle', 'pentagon', 'triangle'];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface PassportStampProps {
  courseId: string;
  courseName: string;
  city: string;
  datePlayed: string;
  onPress: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}.${dd}.${yyyy}`;
}

function CluckersIcon({ size }: { size: number }) {
  if (Platform.OS === 'web') {
    const [uri, setUri] = useState<string | null>(null);
    useEffect(() => {
      const asset = Asset.fromModule(cluckersSvg);
      asset.downloadAsync().then(() => setUri(asset.localUri || asset.uri));
    }, []);
    if (!uri) return null;
    return <img src={uri} width={size * 0.55} height={size} style={{ objectFit: 'contain' }} alt="" />;
  }
  return null;
}

// White mask that covers the entire interior of each stamp shape
// Percentages tuned per shape to cover all placeholder text/icons
const MASK: Record<StampShape, { top: string; left: string; width: string; height: string }> = {
  rectangle: { top: '8%',  left: '8%',  width: '84%', height: '84%' },
  circle:    { top: '14%', left: '14%', width: '72%', height: '72%' },
  pentagon:  { top: '18%', left: '14%', width: '72%', height: '72%' },
  triangle:  { top: '28%', left: '20%', width: '60%', height: '60%' },
};

export default function PassportStamp({ courseId, courseName, city, datePlayed, onPress }: PassportStampProps) {
  const h = hashCode(courseId);
  const shapeIndex = h % 4;
  const shape = SHAPES[shapeIndex];
  const stampImage = stampImages[shapeIndex];
  const rotation = ((h % 1000) / 1000) * 10 - 5;
  const dateStr = formatDate(datePlayed);
  const mask = MASK[shape];

  return (
    <Pressable
      style={[styles.wrapper, { transform: [{ rotate: `${rotation.toFixed(1)}deg` }] }]}
      onPress={onPress}
    >
      <View style={styles.stampContainer}>
        {/* Stamp frame image */}
        <Image source={stampImage} style={styles.stampImage} resizeMode="contain" />

        {/* White mask covering all placeholder text */}
        <View style={[styles.mask, { top: mask.top, left: mask.left, width: mask.width, height: mask.height } as any]} />

        {/* Real text content */}
        {shape === 'rectangle' && (
          <View style={[styles.content, styles.rectContent]}>
            <Text style={styles.rectName} numberOfLines={2}>{courseName.toUpperCase()}</Text>
            <Text style={styles.smallText}>({city})</Text>
            <Text style={styles.rectDate}>{'\u2605'}  {dateStr}  {'\u2605'}</Text>
            <View style={styles.brandRow}>
              <CluckersIcon size={14} />
              <Text style={styles.brandText}>Fried Egg Golf Club</Text>
            </View>
          </View>
        )}
        {shape === 'circle' && (
          <View style={[styles.content, styles.circleContent]}>
            <CluckersIcon size={16} />
            <Text style={styles.smallText}>{dateStr}</Text>
            <Text style={styles.circleName} numberOfLines={2}>{courseName}</Text>
            <Text style={styles.smallText}>({city})</Text>
          </View>
        )}
        {shape === 'pentagon' && (
          <View style={[styles.content, styles.pentContent]}>
            <Text style={styles.pentName} numberOfLines={2}>{courseName}</Text>
            <Text style={styles.smallText}>({city})</Text>
            <Text style={styles.smallText}>{dateStr}</Text>
            <Text style={styles.brandText}>Fried Egg Golf Club</Text>
            <CluckersIcon size={14} />
          </View>
        )}
        {shape === 'triangle' && (
          <View style={[styles.content, styles.triContent]}>
            <CluckersIcon size={14} />
            <Text style={styles.smallText}>{dateStr}</Text>
            <Text style={styles.triName} numberOfLines={2}>{courseName}</Text>
            <Text style={styles.smallText}>({city})</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '34%',
  },
  stampContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  stampImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mask: {
    position: 'absolute',
    backgroundColor: Colors.white,
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rectangle
  rectContent: {
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
  },
  rectName: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 15,
  },
  rectDate: {
    fontSize: 8,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 3,
  },

  // Circle
  circleContent: {
    top: '16%',
    left: '16%',
    right: '16%',
    bottom: '16%',
  },
  circleName: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 15,
  },

  // Pentagon
  pentContent: {
    top: '20%',
    left: '16%',
    right: '16%',
    bottom: '10%',
  },
  pentName: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Triangle
  triContent: {
    top: '30%',
    left: '22%',
    right: '22%',
    bottom: '8%',
  },
  triName: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 14,
  },

  // Shared
  smallText: {
    fontSize: 8,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    marginTop: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 2,
  },
  brandText: {
    fontSize: 7,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 2,
  },
});
