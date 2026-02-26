import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import PlatformPressable from '@/components/PlatformPressable';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Meetup } from '@/types';
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

function formatMeetupDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MeetupRow({ item, onPress, distance, isDesktop }: { item: Meetup; onPress: () => void; distance?: number | null; isDesktop?: boolean }) {
  const slotsRemaining = item.total_slots - (item.member_count ?? 0);
  return (
    <View style={isDesktop ? styles.desktopCard : undefined}>
      <PlatformPressable style={[styles.row, isDesktop && styles.rowDesktop]} onPress={onPress}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.meetupImage} />
        ) : (
          <View style={styles.meetupImagePlaceholder}>
            <Ionicons name="calendar" size={22} color={Colors.gray} />
          </View>
        )}
        <View style={styles.rowInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.meetupName}>{item.name}</Text>
            {item.is_fe_coordinated && (
              <Image source={require('@/assets/images/fe-icon.png')} style={styles.feIcon} />
            )}
          </View>
          <Text style={styles.meetupMeta}>
            {formatMeetupDate(item.meetup_date)}
          </Text>
          <Text style={styles.meetupMeta}>
            {item.location_name} · {slotsRemaining} spot{slotsRemaining !== 1 ? 's' : ''} left · {item.cost}
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

type MeetupSortOrder = 'date' | 'distance';

export default function MeetupsScreen() {
  const { meetups, courses, loadMeetups, isPaidMember } = useStore();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = useIsDesktop();
  const { openActionPane } = useActionPane();
  const desktopScrollProps = useDesktopScrollProps();
  const fabRight = 20;
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortOrder, setSortOrder] = useState<MeetupSortOrder>('distance');
  const [desktopSearch, setDesktopSearch] = useState('');

  useEffect(() => {
    loadMeetups();
  }, [loadMeetups]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  function getMeetupCoords(meetup: Meetup): { lat: number; lon: number } | null {
    if (!meetup.course_id) return null;
    const course = courses.find(c => c.id === meetup.course_id);
    if (!course) return null;
    return { lat: course.latitude, lon: course.longitude };
  }

  function getMeetupDistance(meetup: Meetup): number | null {
    if (!userLocation) return null;
    const coords = getMeetupCoords(meetup);
    if (!coords) return null;
    return getDistanceMiles(userLocation.lat, userLocation.lon, coords.lat, coords.lon);
  }

  const now = new Date();
  const myMeetups = meetups.filter(m => m.is_member);

  const upcomingMeetups = useMemo(() => {
    const upcoming = meetups.filter(m => !m.is_member && new Date(m.meetup_date) > now);
    if (sortOrder === 'distance' && userLocation) {
      return [...upcoming].sort((a, b) => {
        const da = getMeetupDistance(a) ?? Infinity;
        const db = getMeetupDistance(b) ?? Infinity;
        return da - db;
      });
    }
    return upcoming;
  }, [meetups, sortOrder, userLocation, courses]);

  return (
    <ResponsiveContainer>
    <View style={styles.container}>
      {isDesktop && (
        <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 18 }}>
          <View style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.black, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black, letterSpacing: 0.5, textTransform: 'uppercase' }}>MEETUPS</Text>
          </View>
        </View>
      )}
      {isDesktop && (
        <DesktopPageToolbar
          searchQuery={desktopSearch}
          onSearchChange={setDesktopSearch}
          searchPlaceholder="SEARCH MEETUPS"
          ctaLabel={isPaidMember ? "CREATE A MEETUP" : undefined}
          onCtaPress={isPaidMember ? () => openActionPane('meetup') : undefined}
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
                  <HoverToggleBtn label="DATE" active={sortOrder === 'date'} onPress={() => setSortOrder('date')} />
                  <HoverToggleBtn label="NEARBY" active={sortOrder === 'distance'} onPress={() => setSortOrder('distance')} />
                </View>
              </View>
            ) : (
              <View style={styles.sortToggle}>
                <PlatformPressable
                  style={[styles.sortBtn, sortOrder === 'date' && styles.sortBtnActive]}
                  onPress={() => setSortOrder('date')}
                >
                  <Text style={[styles.sortBtnText, sortOrder === 'date' && styles.sortBtnTextActive]}>DATE</Text>
                </PlatformPressable>
                <PlatformPressable
                  style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
                  onPress={() => setSortOrder('distance')}
                >
                  <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>NEARBY</Text>
                </PlatformPressable>
              </View>
            )}

            {myMeetups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>MY MEETUPS</Text>
                {myMeetups.map(m => (
                  <MeetupRow key={m.id} item={m} onPress={() => router.push(`/meetup/${m.id}`)} distance={getMeetupDistance(m)} isDesktop={isDesktop} />
                ))}
                <View style={styles.sectionSpacer} />
              </>
            )}

            {upcomingMeetups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>UPCOMING</Text>
                {upcomingMeetups.map(m => (
                  <MeetupRow key={m.id} item={m} onPress={() => router.push(`/meetup/${m.id}`)} distance={getMeetupDistance(m)} isDesktop={isDesktop} />
                ))}
              </>
            )}

            {meetups.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={48} color={Colors.lightGray} />
                <Text style={styles.emptyTitle}>No meetups yet</Text>
                <Text style={styles.emptyText}>
                  Create a meetup to get together with other golfers
                </Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.list}
      />
      {!isDesktop && isPaidMember && (
        <PlatformPressable style={[styles.fab, { right: fabRight, bottom: 97 }]} onPress={() => router.push('/create-meetup')}>
          <Ionicons name="add" size={28} color={Colors.black} />
        </PlatformPressable>
      )}

      {isPaidMember ? (
        <TutorialPopup
          storageKey="tutorial_meetups"
          title="Meetups"
          paragraphs={[
            'Meetups let you organize play with other FEGC members.',
            'Creating a meetup does NOT book a tee time — you still need to handle that separately.',
            'Reselling tee times at a premium through meetups is strictly prohibited and is grounds for removal from the club.',
            'Creating meetups in bad faith is also grounds for removal. Keep it fun and fair for everyone.',
          ]}
        />
      ) : (
        <TutorialPopup
          storageKey="tutorial_meetups_guest"
          title="Meetups"
          paragraphs={[
            'Meetups let FEGC members organize rounds and events together.',
            'As a guest, you can view upcoming meetups but creating or joining a meetup requires a FEGC membership.',
            'Your access: Restricted (view only)',
          ]}
        />
      )}
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
  meetupImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  meetupImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feIcon: { width: 18, height: 18, borderRadius: 9 },
  meetupName: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  meetupMeta: {
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
