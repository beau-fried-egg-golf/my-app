import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import PlatformPressable from '@/components/PlatformPressable';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Course, Meetup } from '@/types';
import CourseMapSheet from '@/components/course-map-sheet';
import CourseMap from '@/components/course-map';
import { SearchIcon } from '@/components/icons/CustomIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { DesktopPageToolbar } from '@/components/desktop';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { useActionPane } from '@/hooks/useActionPane';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';
import TutorialPopup from '@/components/TutorialPopup';

const LM_TEXT_HEIGHT = 18;
const LM_SCROLL_GAP = 14;

function HoverLoadMore({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(LM_TEXT_HEIGHT + LM_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.black, Colors.orange] });
  return (
    <View style={styles.loadMoreDesktop}>
      <Animated.View style={[styles.loadMoreDesktopBtn, { backgroundColor: bgColor }]}>
        <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.loadMoreDesktopInner}>
          <View style={{ height: LM_TEXT_HEIGHT, overflow: 'hidden' }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Text style={styles.loadMoreDesktopText}>{label}</Text>
              <View style={{ height: LM_SCROLL_GAP }} />
              <Text style={[styles.loadMoreDesktopText, { color: Colors.black }]}>{label}</Text>
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function hasFEContent(course: Course): boolean {
  return !!(course.fe_hero_image || course.fe_profile_url || course.fe_profile_author || course.fe_egg_rating !== null || course.fe_bang_for_buck || course.fe_profile_date);
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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

type AccessFilter = 'all' | 'public' | 'private';
type DistanceFilter = 'all' | '25' | '50' | '100';
type WriteupFilter = 'all' | 'has_writeups';
type FEFilter = 'all' | 'has_fe';
type SortOrder = 'alpha' | 'distance';

const TOGGLE_TEXT_HEIGHT = 18;
const TOGGLE_SCROLL_GAP = 6;

function HoverFilterBtn({ label, onPress }: { label: string; onPress: () => void }) {
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
    outputRange: [Colors.black, Colors.orange],
  });

  return (
    <Animated.View style={[styles.dtFilterBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtFilterBtnInner}>
        <View style={styles.dtToggleTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.dtFilterText}>{label}</Text>
            <View style={{ height: TOGGLE_SCROLL_GAP }} />
            <Text style={[styles.dtFilterText, { color: Colors.black }]}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

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

export default function CoursesScreen() {
  const { courses, writeups, meetups, isPaidMember } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = useIsDesktop();
  const { openActionPane } = useActionPane();
  const desktopScrollProps = useDesktopScrollProps();

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [writeupFilter, setWriteupFilter] = useState<WriteupFilter>('all');
  const [feFilter, setFEFilter] = useState<FEFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('distance');
  const [displayCount, setDisplayCount] = useState(15);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  function getDistance(course: Course): number | null {
    if (!userLocation) return null;
    return getDistanceMiles(
      userLocation.lat,
      userLocation.lon,
      course.latitude,
      course.longitude,
    );
  }

  function getWriteupCount(courseId: string) {
    return writeups.filter((w) => w.course_id === courseId).length;
  }

  function getUpcomingMeetup(courseId: string) {
    const now = Date.now();
    return meetups
      .filter((m) => m.course_id === courseId && new Date(m.meetup_date).getTime() > now)
      .sort((a, b) => new Date(a.meetup_date).getTime() - new Date(b.meetup_date).getTime())[0] ?? null;
  }

  function getMostRecentWriteup(courseId: string) {
    const courseWriteups = writeups
      .filter((w) => w.course_id === courseId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return courseWriteups[0] ?? null;
  }

  const activeFilterCount = [
    accessFilter !== 'all' ? 1 : 0,
    distanceFilter !== 'all' ? 1 : 0,
    writeupFilter !== 'all' ? 1 : 0,
    feFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.short_name.toLowerCase().includes(q)
      );
    }

    if (accessFilter === 'public') result = result.filter((c) => !c.is_private);
    if (accessFilter === 'private') result = result.filter((c) => c.is_private);

    if (distanceFilter !== 'all' && userLocation) {
      const maxMiles = parseInt(distanceFilter, 10);
      result = result.filter((c) => {
        const d = getDistance(c);
        return d !== null && d <= maxMiles;
      });
    }

    if (writeupFilter === 'has_writeups') {
      result = result.filter((c) => getWriteupCount(c.id) > 0);
    }

    if (feFilter === 'has_fe') {
      result = result.filter((c) => hasFEContent(c));
    }

    if (sortOrder === 'alpha') {
      result.sort((a, b) => a.short_name.localeCompare(b.short_name));
    } else if (sortOrder === 'distance' && userLocation) {
      result.sort((a, b) => {
        const da = getDistance(a) ?? Infinity;
        const db = getDistance(b) ?? Infinity;
        return da - db;
      });
    }

    return result;
  }, [courses, searchQuery, accessFilter, distanceFilter, writeupFilter, feFilter, sortOrder, userLocation, writeups]);

  // Reset pagination when filters/sort/search change
  useEffect(() => {
    setDisplayCount(15);
  }, [searchQuery, accessFilter, distanceFilter, writeupFilter, feFilter, sortOrder]);

  function renderMeetupCallout(meetup: Meetup) {
    const spots = meetup.total_slots - (meetup.member_count ?? 0);
    return (
      <PlatformPressable
        style={styles.meetupCallout}
        onPress={() => router.push(`/meetup/${meetup.id}`)}
      >
        <Ionicons name="calendar" size={14} color={Colors.black} />
        <View style={styles.meetupCalloutText}>
          <Text style={styles.meetupName} numberOfLines={1}>{meetup.name}</Text>
          <Text style={styles.meetupDate}>
            {new Date(meetup.meetup_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {new Date(meetup.meetup_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {' · '}
            {spots} spot{spots !== 1 ? 's' : ''} left
          </Text>
        </View>
      </PlatformPressable>
    );
  }

  function renderCourse({ item }: { item: Course }) {
    const count = getWriteupCount(item.id);
    const recent = getMostRecentWriteup(item.id);
    const distance = getDistance(item);
    const upcoming = getUpcomingMeetup(item.id);

    return (
      <View style={isDesktop ? styles.desktopCard : undefined}>
        <PlatformPressable
          style={styles.courseItem}
          onPress={() => router.push(`/course/${item.id}`)}
        >
          <View style={styles.courseHeader}>
            <View style={styles.courseInfo}>
              <Text style={styles.courseNameText}>{item.short_name}</Text>
              <Text style={styles.courseCity}>{item.city}{item.state ? `, ${item.state}` : ''}</Text>
            </View>
            <View style={styles.courseMeta}>
              {distance !== null ? (
                <Text style={styles.distanceText}>{Math.round(distance)} mi</Text>
              ) : (
                <Text style={styles.distanceText}>--</Text>
              )}
            </View>
          </View>
          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Text style={styles.statText}>
                {count} review{count !== 1 ? 's' : ''}
              </Text>
              {!!item.fe_profile_url && (
                <Text style={styles.feBlurb}> · Has a Fried Egg course profile</Text>
              )}
            </View>
            {recent && (
              <Text style={styles.recentText}>
                Latest: "{recent.title}" · {formatTime(recent.created_at)}
              </Text>
            )}
          </View>
          {upcoming && renderMeetupCallout(upcoming)}
        </PlatformPressable>
      </View>
    );
  }


  return (
    <ResponsiveContainer>
    <View style={styles.container}>
      {isDesktop && (
        <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 18 }}>
          <View style={{ backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.black, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontSize: 14, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black, letterSpacing: 0.5, textTransform: 'uppercase' }}>COURSES</Text>
          </View>
        </View>
      )}
      {isDesktop && (
        <DesktopPageToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="SEARCH COURSES"
          ctaLabel="CREATE A REVIEW"
          onCtaPress={() => openActionPane('review-only')}
        />
      )}
      <View style={styles.toolBar}>
        {isDesktop ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <HoverFilterBtn
              label={showFilters ? 'CLOSE FILTERS' : 'OPEN FILTERS'}
              onPress={() => setShowFilters(!showFilters)}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </View>
        ) : (
          <PlatformPressable style={styles.filterBarLeft} onPress={() => setShowFilters(!showFilters)}>
            <Text style={styles.filterBarText}>{showFilters ? 'CLOSE FILTERS' : 'OPEN FILTERS'}</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </PlatformPressable>
        )}
        <View style={styles.toolBarRight}>
          {viewMode === 'list' && (
            isDesktop ? (
              <View style={styles.dtToggleGroup}>
                <HoverToggleBtn label="A-Z" active={sortOrder === 'alpha'} onPress={() => setSortOrder('alpha')} />
                <HoverToggleBtn label="NEARBY" active={sortOrder === 'distance'} onPress={() => setSortOrder('distance')} />
              </View>
            ) : (
              <View style={styles.sortToggle}>
                <PlatformPressable
                  style={[styles.sortBtn, sortOrder === 'alpha' && styles.sortBtnActive]}
                  onPress={() => setSortOrder('alpha')}
                >
                  <Text style={[styles.sortBtnText, sortOrder === 'alpha' && styles.sortBtnTextActive]}>A-Z</Text>
                </PlatformPressable>
                <PlatformPressable
                  style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
                  onPress={() => setSortOrder('distance')}
                >
                  <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>NEARBY</Text>
                </PlatformPressable>
              </View>
            )
          )}
          {isDesktop ? (
            <View style={styles.dtToggleGroup}>
              <HoverToggleBtn label="LIST" active={viewMode === 'list'} onPress={() => { setViewMode('list'); setSelectedCourse(null); }} />
              <HoverToggleBtn label="MAP" active={viewMode === 'map'} onPress={() => setViewMode('map')} />
            </View>
          ) : (
            <View style={styles.viewToggle}>
              <PlatformPressable
                style={[styles.sortBtn, viewMode === 'list' && styles.sortBtnActive]}
                onPress={() => { setViewMode('list'); setSelectedCourse(null); }}
              >
                <Text style={[styles.sortBtnText, viewMode === 'list' && styles.sortBtnTextActive]}>LIST</Text>
              </PlatformPressable>
              <PlatformPressable
                style={[styles.sortBtn, viewMode === 'map' && styles.sortBtnActive]}
                onPress={() => setViewMode('map')}
              >
                <Text style={[styles.sortBtnText, viewMode === 'map' && styles.sortBtnTextActive]}>MAP</Text>
              </PlatformPressable>
            </View>
          )}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>ACCESS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'public', 'private'] as AccessFilter[]).map((val) => (
                  <PlatformPressable
                    key={val}
                    style={[styles.chip, accessFilter === val && styles.chipActive]}
                    onPress={() => setAccessFilter(val)}
                  >
                    <Text style={[styles.chipText, accessFilter === val && styles.chipTextActive]}>
                      {val === 'all' ? 'ALL' : val.toUpperCase()}
                    </Text>
                  </PlatformPressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>DISTANCE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {([
                  ['all', 'ANY'],
                  ['25', '< 25 MI'],
                  ['50', '< 50 MI'],
                  ['100', '< 100 MI'],
                ] as [DistanceFilter, string][]).map(([val, label]) => (
                  <PlatformPressable
                    key={val}
                    style={[styles.chip, distanceFilter === val && styles.chipActive]}
                    onPress={() => setDistanceFilter(val)}
                  >
                    <Text style={[styles.chipText, distanceFilter === val && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </PlatformPressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>REVIEWS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {([
                  ['all', 'ALL'],
                  ['has_writeups', 'HAS REVIEWS'],
                ] as [WriteupFilter, string][]).map(([val, label]) => (
                  <PlatformPressable
                    key={val}
                    style={[styles.chip, writeupFilter === val && styles.chipActive]}
                    onPress={() => setWriteupFilter(val)}
                  >
                    <Text style={[styles.chipText, writeupFilter === val && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </PlatformPressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>FE COURSE PROFILE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {([
                  ['all', 'ALL'],
                  ['has_fe', 'HAS FE PROFILE'],
                ] as [FEFilter, string][]).map(([val, label]) => (
                  <PlatformPressable
                    key={val}
                    style={[styles.chip, feFilter === val && styles.chipActive]}
                    onPress={() => setFEFilter(val)}
                  >
                    <Text style={[styles.chipText, feFilter === val && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </PlatformPressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {activeFilterCount > 0 && (
            <PlatformPressable
              style={styles.clearFilters}
              onPress={() => {
                setAccessFilter('all');
                setDistanceFilter('all');
                setWriteupFilter('all');
                setFEFilter('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </PlatformPressable>
          )}
        </View>
      )}

      {viewMode === 'list' ? (
        <>
          <FlatList
            {...desktopScrollProps}
            data={filteredCourses.slice(0, displayCount)}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
            ItemSeparatorComponent={isDesktop ? null : () => <View style={styles.separator} />}
            contentContainerStyle={[styles.list, { paddingBottom: isSearchExpanded ? searchBarBottom + 56 : 160 }]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No courses match your filters</Text>
              </View>
            }
            ListFooterComponent={
              displayCount < filteredCourses.length ? (
                isDesktop ? (
                  <HoverLoadMore
                    label={`LOAD MORE (${filteredCourses.length - displayCount} remaining)`}
                    onPress={() => setDisplayCount(displayCount + 15)}
                  />
                ) : (
                  <PlatformPressable
                    style={styles.loadMoreButton}
                    onPress={() => setDisplayCount(displayCount + 15)}
                  >
                    <Text style={styles.loadMoreText}>LOAD MORE ({filteredCourses.length - displayCount} remaining)</Text>
                  </PlatformPressable>
                )
              ) : null
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
                    placeholder="Search courses..."
                    placeholderTextColor={Colors.gray}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={() => {
                      if (!searchQuery.trim()) collapseSearch();
                    }}
                  />
                  <PlatformPressable onPress={() => { setSearchQuery(''); collapseSearch(); }} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={18} color={Colors.gray} />
                  </PlatformPressable>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </>
      ) : (
        <View style={styles.mapContainer}>
          <CourseMap
            courses={filteredCourses}
            userLocation={userLocation}
            selectedCourse={selectedCourse}
            onCourseSelect={setSelectedCourse}
          />
          {selectedCourse && (
            <CourseMapSheet
              course={selectedCourse}
              writeupCount={getWriteupCount(selectedCourse.id)}
              distance={getDistance(selectedCourse)}
              upcomingMeetup={getUpcomingMeetup(selectedCourse.id)}
              onClose={() => setSelectedCourse(null)}
            />
          )}
        </View>
      )}
      {!isPaidMember && (
        <TutorialPopup
          storageKey="tutorial_courses_guest"
          title="Courses"
          paragraphs={[
            'Browse the FEGC course directory — search courses, view photos, and see what other members have to say.',
            'As a guest, you can browse and view courses. Egg ratings, Fried Egg profiles, and posting reviews require a FEGC membership.',
            'Your access: Limited (browse only)',
          ]}
        />
      )}
    </View>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  toolBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  filterBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterBarText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  toolBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewToggle: { flexDirection: 'row', gap: 4 },
  sortToggle: { flexDirection: 'row', gap: 4 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3 },
  sortBtnActive: { backgroundColor: Colors.orange },
  sortBtnText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, textTransform: 'uppercase', letterSpacing: 0.5 },
  sortBtnTextActive: { color: Colors.black },
  filterCount: { backgroundColor: Colors.orange, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { color: Colors.white, fontSize: 11, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  filterPanel: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, gap: 12 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.gray, letterSpacing: 0.5 },
  filterChips: { flexDirection: 'row', gap: 4 },
  chip: { paddingHorizontal: 6, paddingVertical: 3 },
  chipActive: { backgroundColor: Colors.orange },
  chipText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipTextActive: { color: Colors.black },
  clearFilters: { alignSelf: 'flex-start' },
  clearFiltersText: { fontSize: 13, color: Colors.gray, textDecorationLine: 'underline', fontFamily: Fonts!.sans },
  searchFab: { position: 'absolute', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, zIndex: 10 },
  searchFabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBarContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  searchBarInput: { flex: 1, fontSize: 16, color: Colors.black, fontWeight: '300', paddingVertical: 0, fontFamily: Fonts!.sans, outlineStyle: 'none' } as any,
  list: { paddingVertical: 8 },
  courseItem: { paddingHorizontal: 16, paddingVertical: 14 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseInfo: { flex: 1 },
  courseNameText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  courseCity: { fontSize: 13, color: Colors.black, marginTop: 6, fontFamily: Fonts!.sans },
  courseMeta: { marginLeft: 12, alignItems: 'flex-end' },
  distanceText: { fontSize: 14, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  courseStats: { marginTop: 8, gap: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: Colors.black, fontFamily: Fonts!.sans },
  recentText: { fontSize: 12, color: Colors.black, fontFamily: Fonts!.sans },
  separator: { height: 1, backgroundColor: Colors.lightGray, marginHorizontal: 16 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.gray, fontFamily: Fonts!.sans },
  loadMoreButton: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray, marginHorizontal: 16 },
  loadMoreText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.orange, letterSpacing: 0.5 },
  mapContainer: { flex: 1, position: 'relative', minHeight: 600 },
  desktopCard: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, marginHorizontal: 16, marginVertical: 8, backgroundColor: Colors.white, overflow: 'hidden' },
  feBlurb: { fontSize: 13, color: Colors.gray, fontFamily: Fonts!.sans },
  meetupCallout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  meetupCalloutText: { flex: 1 },
  meetupName: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  meetupDate: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  dtFilterBtn: { borderRadius: 8, overflow: 'hidden' },
  dtFilterBtnInner: { paddingHorizontal: 16, paddingVertical: 6 },
  dtFilterText: { fontSize: 13, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.white, letterSpacing: 0.5, lineHeight: TOGGLE_TEXT_HEIGHT },
  dtToggleGroup: { flexDirection: 'row', borderRadius: 8, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.black, padding: 3, gap: 2 },
  dtToggle: { borderRadius: 6, overflow: 'hidden' },
  dtToggleInner: { paddingHorizontal: 12, paddingVertical: 6 },
  dtToggleTextClip: { height: TOGGLE_TEXT_HEIGHT },
  dtToggleText: { fontSize: 13, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: TOGGLE_TEXT_HEIGHT },
  dtToggleTextActive: { color: Colors.white },
  loadMoreDesktop: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  loadMoreDesktopBtn: { borderRadius: 8, overflow: 'hidden' },
  loadMoreDesktopInner: { paddingHorizontal: 24, paddingVertical: LM_SCROLL_GAP, alignItems: 'center' },
  loadMoreDesktopText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.white, letterSpacing: 0.5, lineHeight: LM_TEXT_HEIGHT },
});
