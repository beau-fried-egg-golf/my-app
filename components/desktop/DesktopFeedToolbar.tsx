import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { SearchIcon } from '@/components/icons/CustomIcons';

const TEXT_LINE_HEIGHT = 18;
const SCROLL_GAP = 14;

interface DesktopFeedToolbarProps {
  feedFilter: 'ALL' | 'FOLLOWING';
  onFeedFilterChange: (filter: 'ALL' | 'FOLLOWING') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreatePress: () => void;
}

function HoverTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
    outputRange: [active ? Colors.black : 'transparent', Colors.white],
  });

  return (
    <Animated.View style={[styles.tab, { backgroundColor: bgColor }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={styles.tabInner}
      >
        <View style={styles.tabTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            <View style={{ height: SCROLL_GAP }} />
            <Text style={styles.tabText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function HoverCta({ onPress }: { onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    setHovered(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }

  function onHoverOut() {
    setHovered(false);
    Animated.timing(anim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
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
            <Text style={styles.ctaText}>CRACK AN EGG</Text>
            <View style={{ height: SCROLL_GAP }} />
            <Text style={[styles.ctaText, styles.ctaTextHover]}>CRACK AN EGG</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DesktopFeedToolbar({
  feedFilter,
  onFeedFilterChange,
  searchQuery,
  onSearchChange,
  onCreatePress,
}: DesktopFeedToolbarProps) {
  return (
    <View style={styles.container}>
      {/* ALL | FOLLOWING — black active, cream inactive; hover → white */}
      <View style={styles.tabGroup}>
        <HoverTab label="ALL" active={feedFilter === 'ALL'} onPress={() => onFeedFilterChange('ALL')} />
        <HoverTab label="FOLLOWING" active={feedFilter === 'FOLLOWING'} onPress={() => onFeedFilterChange('FOLLOWING')} />
      </View>

      {/* Search bar with border, icon on right */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH FOR POSTS"
          placeholderTextColor={Colors.gray}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <SearchIcon size={36} color={Colors.gray} />
      </View>

      {/* CRACK AN EGG — orange bg, black text; hover → black bg, white text */}
      <HoverCta onPress={onCreatePress} />
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
  tabGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.black,
    padding: 3,
    gap: 2,
  },
  tab: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  tabInner: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  tabTextClip: {
    height: TEXT_LINE_HEIGHT,
  },
  tabText: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    letterSpacing: 0.5,
    lineHeight: TEXT_LINE_HEIGHT,
  },
  tabTextActive: {
    color: Colors.white,
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
