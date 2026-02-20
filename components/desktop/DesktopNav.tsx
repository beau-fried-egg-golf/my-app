import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

const TEXT_LINE_HEIGHT = 18;
const SCROLL_GAP = 6;

const NAV_ITEMS = [
  { label: 'HOME', path: '/' },
  { label: 'COURSES', path: '/courses' },
  { label: 'MEETUPS', path: '/meetups' },
  { label: 'GROUPS', path: '/groups' },
  { label: 'MEMBERS', path: '/members' },
] as const;

function HoverPill({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(TEXT_LINE_HEIGHT + SCROLL_GAP)],
  });

  return (
    <View style={styles.pill}>
      <Pressable
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={styles.pillInner}
      >
        <View style={styles.pillTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.pillText}>{label}</Text>
            <View style={{ height: SCROLL_GAP }} />
            <Text style={styles.pillText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

export default function DesktopNav() {
  const router = useRouter();

  function handleNav(path: string) {
    if (path === '/') {
      router.navigate('/(tabs)' as any);
    } else {
      router.push(path as any);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.pillRow}>
        {NAV_ITEMS.map((item) => (
          <HoverPill
            key={item.path}
            label={item.label}
            onPress={() => handleNav(item.path)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    borderRadius: 20,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
  },
  pillInner: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillTextClip: {
    height: TEXT_LINE_HEIGHT,
  },
  pillText: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: TEXT_LINE_HEIGHT,
  },
});
