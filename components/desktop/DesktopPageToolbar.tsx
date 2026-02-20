import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { SearchIcon } from '@/components/icons/CustomIcons';

const TEXT_LINE_HEIGHT = 18;
const SCROLL_GAP = 14;

interface DesktopPageToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

function HoverCta({ label, onPress }: { label: string; onPress: () => void }) {
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

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.orange, Colors.black],
  });

  return (
    <Animated.View style={[styles.ctaBtn, { backgroundColor: bgColor }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={styles.ctaInner}
      >
        <View style={styles.ctaTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.ctaText}>{label}</Text>
            <View style={{ height: SCROLL_GAP }} />
            <Text style={[styles.ctaText, styles.ctaTextHover]}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DesktopPageToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'SEARCH...',
  ctaLabel,
  onCtaPress,
}: DesktopPageToolbarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={Colors.gray}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <SearchIcon size={36} color={Colors.gray} />
      </View>

      {ctaLabel && onCtaPress && (
        <HoverCta label={ctaLabel} onPress={onCtaPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.black,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    letterSpacing: 0.3,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as any,
  ctaBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  ctaInner: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextClip: {
    height: TEXT_LINE_HEIGHT,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    letterSpacing: 0.5,
    lineHeight: TEXT_LINE_HEIGHT,
    textAlign: 'center',
  },
  ctaTextHover: {
    color: Colors.white,
  },
});
