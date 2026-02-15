import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Group } from '@/types';

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

function GroupRow({ item, onPress, distance }: { item: Group; onPress: () => void; distance?: number | null }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
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
    </Pressable>
  );
}

type GroupSortOrder = 'default' | 'distance';

export default function GroupsScreen() {
  const { groups, courses, loadGroups, session } = useStore();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortOrder, setSortOrder] = useState<GroupSortOrder>('distance');

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
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <View style={styles.sortToggle}>
              <Pressable
                style={[styles.sortBtn, sortOrder === 'default' && styles.sortBtnActive]}
                onPress={() => setSortOrder('default')}
              >
                <Text style={[styles.sortBtnText, sortOrder === 'default' && styles.sortBtnTextActive]}>A-Z</Text>
              </Pressable>
              <Pressable
                style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
                onPress={() => setSortOrder('distance')}
              >
                <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>NEARBY</Text>
              </Pressable>
            </View>

            {myGroups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>MY GROUPS</Text>
                {myGroups.map(g => (
                  <GroupRow key={g.id} item={g} onPress={() => router.push(`/group/${g.id}`)} distance={getGroupDistance(g)} />
                ))}
                <View style={styles.sectionSpacer} />
              </>
            )}

            {discoverGroups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>DISCOVER</Text>
                {discoverGroups.map(g => (
                  <GroupRow key={g.id} item={g} onPress={() => router.push(`/group/${g.id}`)} distance={getGroupDistance(g)} />
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
      <Pressable style={styles.fab} onPress={() => router.push('/create-group')}>
        <Ionicons name="add" size={28} color={Colors.black} />
      </Pressable>
    </View>
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
});
