import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import PlatformPressable from '@/components/PlatformPressable';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Profile } from '@/types';
import { SearchIcon } from '@/components/icons/CustomIcons';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { DesktopPageToolbar } from '@/components/desktop';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

const TOGGLE_TEXT_HEIGHT = 18;
const TOGGLE_SCROLL_GAP = 6;

function HoverToggleBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(TOGGLE_TEXT_HEIGHT + TOGGLE_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [active ? Colors.black : 'transparent', Colors.white] });
  return (
    <Animated.View style={[styles.dtToggle, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtToggleInner}>
        <View style={styles.dtToggleTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={[styles.dtToggleText, active && styles.dtToggleTextActive]}>{label}</Text>
            <View style={{ height: TOGGLE_SCROLL_GAP }} />
            <Text style={styles.dtToggleText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type MemberSortOrder = 'distance' | 'alpha';

export default function MembersScreen() {
  const { profiles, writeups, session, coursesPlayed, courses } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortOrder, setSortOrder] = useState<MemberSortOrder>('distance');
  const [search, setSearch] = useState('');

  // Tab bar bottom = Math.max(16, insets.bottom), height = 56, gap = 12
  const defaultBottom = Math.max(16, insets.bottom) + 56 + 12;
  const searchBarBottom = keyboardHeight > 0 ? keyboardHeight + 12 : defaultBottom;

  const fabRight = (screenWidth - 340) / 2;
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  function expandSearch() {
    setIsSearchExpanded(true);
    Animated.timing(expandAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  }

  function collapseSearch() {
    Keyboard.dismiss();
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsSearchExpanded(false);
    });
  }

  const animatedWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, screenWidth - 32],
  });
  const animatedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 44],
  });
  const animatedBorderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 22],
  });
  const animatedRight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [fabRight, 16],
  });
  const contentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  function getMemberDistance(member: Profile): number | null {
    if (!userLocation || !member.home_course_id) return null;
    const course = courses.find(c => c.id === member.home_course_id);
    if (!course) return null;
    return getDistanceMiles(userLocation.lat, userLocation.lon, course.latitude, course.longitude);
  }

  function getWriteupCount(userId: string) {
    return writeups.filter((w) => w.user_id === userId).length;
  }

  function getCoursesPlayedCount(userId: string) {
    const playedIds = new Set(coursesPlayed.filter(cp => cp.user_id === userId).map(cp => cp.course_id));
    const writeupIds = writeups.filter(w => w.user_id === userId).map(w => w.course_id);
    for (const id of writeupIds) playedIds.add(id);
    return playedIds.size;
  }

  const sortedProfiles = useMemo(() => {
    let result = [...profiles];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    if (sortOrder === 'distance' && userLocation) {
      result.sort((a, b) => {
        const da = getMemberDistance(a) ?? Infinity;
        const db = getMemberDistance(b) ?? Infinity;
        return da - db;
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [profiles, sortOrder, userLocation, courses, search]);

  if (!session) return null;

  function renderMember({ item }: { item: Profile }) {
    const count = getWriteupCount(item.id);
    const played = getCoursesPlayedCount(item.id);
    const isMe = item.id === session?.user?.id;
    const distance = getMemberDistance(item);

    return (
      <PlatformPressable
        style={styles.row}
        onPress={() => isMe ? router.push('/profile') : router.push(`/member/${item.id}`)}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={22} color={Colors.gray} />
          </View>
        )}
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.name}>{item.name}</Text>
            {item.is_verified && <VerifiedBadge size={14} />}
          </View>
          <Text style={styles.meta}>
            {(item.city || item.state) ? `${[item.city, item.state].filter(Boolean).join(', ')} · ` : ''}
            {count} review{count !== 1 ? 's' : ''} · {played} course{played !== 1 ? 's' : ''}
            {distance != null ? ` · ${Math.round(distance)} mi` : ''}
          </Text>
        </View>
      </PlatformPressable>
    );
  }

  return (
    <ResponsiveContainer>
    <View style={styles.container}>
      {isDesktop && (
        <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 18 }}>
          <View style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.black, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black, letterSpacing: 0.5, textTransform: 'uppercase' }}>MEMBERS</Text>
          </View>
        </View>
      )}
      {isDesktop && (
        <DesktopPageToolbar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="SEARCH MEMBERS"
        />
      )}
      <View style={styles.toolbar}>
        {isDesktop ? (
          <View style={styles.dtToggleGroup}>
            <HoverToggleBtn label="NEARBY" active={sortOrder === 'distance'} onPress={() => setSortOrder('distance')} />
            <HoverToggleBtn label="A-Z" active={sortOrder === 'alpha'} onPress={() => setSortOrder('alpha')} />
          </View>
        ) : (
          <View style={styles.sortToggle}>
            <PlatformPressable
              style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
              onPress={() => setSortOrder('distance')}
            >
              <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>NEARBY</Text>
            </PlatformPressable>
            <PlatformPressable
              style={[styles.sortBtn, sortOrder === 'alpha' && styles.sortBtnActive]}
              onPress={() => setSortOrder('alpha')}
            >
              <Text style={[styles.sortBtnText, sortOrder === 'alpha' && styles.sortBtnTextActive]}>A-Z</Text>
            </PlatformPressable>
          </View>
        )}
      </View>
      <FlatList
        {...desktopScrollProps}
        data={sortedProfiles}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[styles.list, { paddingBottom: isSearchExpanded ? searchBarBottom + 56 : 160 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        }
      />
      {!isDesktop && (
        <Animated.View style={[styles.searchFab, {
          width: animatedWidth,
          height: animatedHeight,
          borderRadius: animatedBorderRadius,
          right: animatedRight,
          bottom: isSearchExpanded ? searchBarBottom : 97,
        }]}>
          {!isSearchExpanded ? (
            <PlatformPressable style={styles.searchFabButton} onPress={expandSearch}>
              <SearchIcon size={28} color={Colors.black} />
            </PlatformPressable>
          ) : (
            <Animated.View style={[styles.searchBarContent, { opacity: contentOpacity }]}>
              <SearchIcon size={28} color={Colors.gray} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchBarInput}
                placeholder="Search members..."
                placeholderTextColor={Colors.gray}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => {
                  if (!search.trim()) collapseSearch();
                }}
              />
              <PlatformPressable onPress={() => { setSearch(''); collapseSearch(); }} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={Colors.gray} />
              </PlatformPressable>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  list: { paddingVertical: 8 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchFab: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  searchFabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '300',
    fontFamily: Fonts!.sans,
    color: Colors.black,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as any,
  sortToggle: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 'auto',
  },
  sortBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sortBtnActive: {
    backgroundColor: Colors.orange,
  },
  sortBtnText: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  sortBtnTextActive: {
    color: Colors.black,
  },
  dtToggleGroup: { flexDirection: 'row', borderRadius: 8, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.black, padding: 3, gap: 2, marginLeft: 'auto' },
  dtToggle: { borderRadius: 6, overflow: 'hidden' },
  dtToggleInner: { paddingHorizontal: 12, paddingVertical: 6 },
  dtToggleTextClip: { height: TOGGLE_TEXT_HEIGHT },
  dtToggleText: { fontSize: 13, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: TOGGLE_TEXT_HEIGHT },
  dtToggleTextActive: { color: Colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 4 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  meta: { fontSize: 13, color: Colors.gray, marginTop: 2, fontFamily: Fonts!.sans },
  separator: { height: 1, backgroundColor: Colors.lightGray, marginLeft: 72 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: Colors.gray, marginTop: 8, fontFamily: Fonts!.sans },
});
