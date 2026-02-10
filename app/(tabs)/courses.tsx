import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Course } from '@/types';

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

export default function CoursesScreen() {
  const { courses, writeups } = useStore();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all');
  const [writeupFilter, setWriteupFilter] = useState<WriteupFilter>('all');

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

    return result;
  }, [courses, accessFilter, distanceFilter, writeupFilter, userLocation, writeups]);

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

  return (
    <View style={styles.container}>
      <Pressable style={styles.filterBar} onPress={() => setShowFilters(!showFilters)}>
        <View style={styles.filterBarLeft}>
          <Ionicons name="options-outline" size={18} color={Colors.black} />
          <Text style={styles.filterBarText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.gray}
        />
      </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  filterBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterBarText: { fontSize: 14, fontWeight: '600', color: Colors.black },
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
});
