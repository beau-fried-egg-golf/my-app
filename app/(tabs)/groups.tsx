import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import PlatformPressable from '@/components/PlatformPressable';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Group } from '@/types';
import TutorialPopup from '@/components/TutorialPopup';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { DesktopPageToolbar } from '@/components/desktop';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { useActionPane } from '@/hooks/useActionPane';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';

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

function GroupRow({ item, onPress, distance, isDesktop }: { item: Group; onPress: () => void; distance?: number | null; isDesktop?: boolean }) {
  return (
    <View style={isDesktop ? styles.desktopCard : undefined}>
      <PlatformPressable style={[styles.row, isDesktop && styles.rowDesktop]} onPress={onPress}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.groupImage} />
        ) : (
          <View style={styles.groupImagePlaceholder}>
            <Ionicons name="people" size={22} color={Colors.gray} />
          </View>
        )}
        <View style={styles.rowInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            {item.member_count ?? 0} member{(item.member_count ?? 0) !== 1 ? 's' : ''}
            {item.home_course_name ? ` · ${item.home_course_name}` : ''}
            {item.location_name ? ` · ${item.location_name}` : ''}
            {distance != null ? ` · ${Math.round(distance)} mi` : ''}
          </Text>
        </View>
      </PlatformPressable>
    </View>
  );
}

const TOGGLE_TEXT_HEIGHT = 18;
const TOGGLE_SCROLL_GAP = 6;

function HoverToggleBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(TOGGLE_TEXT_HEIGHT + TOGGLE_SCROLL_GAP)],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [active ? Colors.black : 'transparent', Colors.white],
  });

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

type GroupSortOrder = 'default' | 'distance';

export default function GroupsScreen() {
  const { groups, courses, loadGroups, session, isPaidMember, setShowUpgradeModal } = useStore();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = useIsDesktop();
  const { openActionPane } = useActionPane();
  const desktopScrollProps = useDesktopScrollProps();
  const fabRight = (screenWidth - 340) / 2;
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortOrder, setSortOrder] = useState<GroupSortOrder>('distance');
  const [desktopSearch, setDesktopSearch] = useState('');

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  function getGroupCoords(group: Group): { lat: number; lon: number } | null {
    if (group.home_course_id) {
      const course = courses.find(c => c.id === group.home_course_id);
      if (course) return { lat: course.latitude, lon: course.longitude };
    }
    if (group.latitude != null && group.longitude != null) {
      return { lat: group.latitude, lon: group.longitude };
    }
    return null;
  }

  function getGroupDistance(group: Group): number | null {
    if (!userLocation) return null;
    const coords = getGroupCoords(group);
    if (!coords) return null;
    return getDistanceMiles(userLocation.lat, userLocation.lon, coords.lat, coords.lon);
  }

  const myGroups = groups.filter(g => g.is_member);

  const discoverGroups = useMemo(() => {
    const discover = groups.filter(g => !g.is_member);
    if (sortOrder === 'distance' && userLocation) {
      return [...discover].sort((a, b) => {
        const da = getGroupDistance(a) ?? Infinity;
        const db = getGroupDistance(b) ?? Infinity;
        return da - db;
      });
    }
    return discover;
  }, [groups, sortOrder, userLocation, courses]);

  return (
    <ResponsiveContainer>
    <View style={styles.container}>
      {isDesktop && (
        <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 18 }}>
          <View style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.black, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black, letterSpacing: 0.5, textTransform: 'uppercase' }}>GROUPS</Text>
          </View>
        </View>
      )}
      {isDesktop && (
        <DesktopPageToolbar
          searchQuery={desktopSearch}
          onSearchChange={setDesktopSearch}
          searchPlaceholder="SEARCH GROUPS"
          ctaLabel="CREATE A GROUP"
          onCtaPress={() => { if (!isPaidMember) { setShowUpgradeModal(true); return; } openActionPane('group'); }}
        />
      )}
      <FlatList
        {...desktopScrollProps}
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {isDesktop ? (
              <View style={styles.sortToggle}>
                <View style={styles.dtToggleGroup}>
                  <HoverToggleBtn label="A-Z" active={sortOrder === 'default'} onPress={() => setSortOrder('default')} />
                  <HoverToggleBtn label="NEARBY" active={sortOrder === 'distance'} onPress={() => setSortOrder('distance')} />
                </View>
              </View>
            ) : (
              <View style={styles.sortToggle}>
                <PlatformPressable
                  style={[styles.sortBtn, sortOrder === 'default' && styles.sortBtnActive]}
                  onPress={() => setSortOrder('default')}
                >
                  <Text style={[styles.sortBtnText, sortOrder === 'default' && styles.sortBtnTextActive]}>A-Z</Text>
                </PlatformPressable>
                <PlatformPressable
                  style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
                  onPress={() => setSortOrder('distance')}
                >
                  <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>NEARBY</Text>
                </PlatformPressable>
              </View>
            )}

            {myGroups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>MY GROUPS</Text>
                {myGroups.map(g => (
                  <GroupRow key={g.id} item={g} onPress={() => router.push(`/group/${g.id}`)} distance={getGroupDistance(g)} isDesktop={isDesktop} />
                ))}
                <View style={styles.sectionSpacer} />
              </>
            )}

            {discoverGroups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>DISCOVER</Text>
                {discoverGroups.map(g => (
                  <GroupRow key={g.id} item={g} onPress={() => router.push(`/group/${g.id}`)} distance={getGroupDistance(g)} isDesktop={isDesktop} />
                ))}
              </>
            )}

            {groups.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={Colors.lightGray} />
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Create a group to connect with other golfers
                </Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.list}
      />
      {!isDesktop && (
        <PlatformPressable style={[styles.fab, { right: fabRight, bottom: 97 }]} onPress={() => { if (!isPaidMember) { setShowUpgradeModal(true); return; } router.push('/create-group'); }}>
          <Ionicons name="add" size={28} color={Colors.black} />
        </PlatformPressable>
      )}

      <TutorialPopup
        storageKey="tutorial_groups"
        title="Groups"
        paragraphs={[
          'Groups let you organize around shared interests, home courses, or regions.',
          'Join an existing group or create your own. Each group has its own chat so members can stay connected.',
        ]}
      />
    </View>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  list: { paddingBottom: 160 },
  fab: {
    position: 'absolute',
    bottom: 92,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sortToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
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
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionSpacer: { height: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  rowDesktop: {
    borderBottomWidth: 0,
  },
  desktopCard: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  groupImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  groupImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  groupName: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  groupMeta: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
  },
  dtToggleGroup: { flexDirection: 'row', borderRadius: 8, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.black, padding: 3, gap: 2 },
  dtToggle: { borderRadius: 6, overflow: 'hidden' },
  dtToggleInner: { paddingHorizontal: 12, paddingVertical: 6 },
  dtToggleTextClip: { height: TOGGLE_TEXT_HEIGHT },
  dtToggleText: { fontSize: 13, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: TOGGLE_TEXT_HEIGHT },
  dtToggleTextActive: { color: Colors.white },
});
