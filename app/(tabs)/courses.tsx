import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Course } from '@/types';
import CourseMapSheet from '@/components/course-map-sheet';

// Lazy-load map component only on web
const CourseMap = Platform.OS === 'web'
  ? require('@/components/course-map').default
  : () => null;

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
type SortOrder = 'alpha' | 'distance';

export default function CoursesScreen() {
  const { courses, writeups } = useStore();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [writeupFilter, setWriteupFilter] = useState<WriteupFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('alpha');
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
  }, [courses, searchQuery, accessFilter, distanceFilter, writeupFilter, sortOrder, userLocation, writeups]);

  function renderCourse({ item }: { item: Course }) {
    const count = getWriteupCount(item.id);
    const recent = getMostRecentWriteup(item.id);
    const distance = getDistance(item);

    return (
      <Pressable
        style={styles.courseItem}
        onPress={() => router.push(`/course/${item.id}`)}
      >
        <View style={styles.courseHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{item.short_name}</Text>
            <Text style={styles.courseCity}>{item.city}</Text>
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
            <Ionicons name="document-text-outline" size={14} color={Colors.gray} />
            <Text style={styles.statText}>
              {count} writeup{count !== 1 ? 's' : ''}
            </Text>
          </View>
          {recent && (
            <Text style={styles.recentText}>
              Latest: "{recent.title}" · {formatTime(recent.created_at)}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={styles.toolBar}>
        <Pressable style={styles.filterBarLeft} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options-outline" size={18} color={Colors.black} />
          <Text style={styles.filterBarText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.gray}
          />
        </Pressable>
        <View style={styles.toolBarRight}>
          {isWeb && (
            <View style={styles.viewToggle}>
              <Pressable
                style={[styles.sortBtn, viewMode === 'list' && styles.sortBtnActive]}
                onPress={() => { setViewMode('list'); setSelectedCourse(null); }}
              >
                <Ionicons
                  name="list-outline"
                  size={14}
                  color={viewMode === 'list' ? Colors.white : Colors.darkGray}
                />
              </Pressable>
              <Pressable
                style={[styles.sortBtn, viewMode === 'map' && styles.sortBtnActive]}
                onPress={() => setViewMode('map')}
              >
                <Ionicons
                  name="map-outline"
                  size={14}
                  color={viewMode === 'map' ? Colors.white : Colors.darkGray}
                />
              </Pressable>
            </View>
          )}
          {viewMode === 'list' && (
            <View style={styles.sortToggle}>
              <Pressable
                style={[styles.sortBtn, sortOrder === 'alpha' && styles.sortBtnActive]}
                onPress={() => setSortOrder('alpha')}
              >
                <Text style={[styles.sortBtnText, sortOrder === 'alpha' && styles.sortBtnTextActive]}>A-Z</Text>
              </Pressable>
              <Pressable
                style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
                onPress={() => setSortOrder('distance')}
              >
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={sortOrder === 'distance' ? Colors.white : Colors.darkGray}
                />
                <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>Near</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Access</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'public', 'private'] as AccessFilter[]).map((val) => (
                  <Pressable
                    key={val}
                    style={[styles.chip, accessFilter === val && styles.chipActive]}
                    onPress={() => setAccessFilter(val)}
                  >
                    <Text style={[styles.chipText, accessFilter === val && styles.chipTextActive]}>
                      {val === 'all' ? 'All' : val.charAt(0).toUpperCase() + val.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Distance</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {([
                  ['all', 'Any'],
                  ['25', '< 25 mi'],
                  ['50', '< 50 mi'],
                  ['100', '< 100 mi'],
                ] as [DistanceFilter, string][]).map(([val, label]) => (
                  <Pressable
                    key={val}
                    style={[styles.chip, distanceFilter === val && styles.chipActive]}
                    onPress={() => setDistanceFilter(val)}
                  >
                    <Text style={[styles.chipText, distanceFilter === val && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Writeups</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {([
                  ['all', 'All'],
                  ['has_writeups', 'Has writeups'],
                ] as [WriteupFilter, string][]).map(([val, label]) => (
                  <Pressable
                    key={val}
                    style={[styles.chip, writeupFilter === val && styles.chipActive]}
                    onPress={() => setWriteupFilter(val)}
                  >
                    <Text style={[styles.chipText, writeupFilter === val && styles.chipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {activeFilterCount > 0 && (
            <Pressable
              style={styles.clearFilters}
              onPress={() => {
                setAccessFilter('all');
                setDistanceFilter('all');
                setWriteupFilter('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {viewMode === 'list' ? (
        <>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              placeholderTextColor={Colors.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.searchClear}>
                <Ionicons name="close-circle" size={16} color={Colors.gray} />
              </Pressable>
            )}
          </View>
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={renderCourse}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No courses match your filters</Text>
              </View>
            }
          />
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
              onClose={() => setSelectedCourse(null)}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  toolBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  filterBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterBarText: { fontSize: 14, fontWeight: '600', color: Colors.black },
  toolBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewToggle: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, overflow: 'hidden' },
  sortToggle: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, overflow: 'hidden' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 5 },
  sortBtnActive: { backgroundColor: Colors.black },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: Colors.darkGray },
  sortBtnTextActive: { color: Colors.white },
  filterCount: { backgroundColor: Colors.black, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  filterPanel: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, gap: 12 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { fontSize: 13, color: Colors.darkGray },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  clearFilters: { alignSelf: 'flex-start' },
  clearFiltersText: { fontSize: 13, color: Colors.gray, textDecorationLine: 'underline' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, marginBottom: 2, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, height: 38 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.black, paddingVertical: 0, outlineStyle: 'none' } as any,
  searchClear: { marginLeft: 4, padding: 2 },
  list: { paddingVertical: 8 },
  courseItem: { paddingHorizontal: 16, paddingVertical: 14 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 17, fontWeight: '600', color: Colors.black },
  courseCity: { fontSize: 13, color: Colors.gray, marginTop: 2 },
  courseMeta: { marginLeft: 12, alignItems: 'flex-end' },
  distanceText: { fontSize: 14, fontWeight: '500', color: Colors.darkGray },
  courseStats: { marginTop: 8, gap: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: Colors.gray },
  recentText: { fontSize: 12, color: Colors.gray, fontStyle: 'italic' },
  separator: { height: 1, backgroundColor: Colors.lightGray, marginHorizontal: 16 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.gray },
  mapContainer: { flex: 1, position: 'relative' },
});
