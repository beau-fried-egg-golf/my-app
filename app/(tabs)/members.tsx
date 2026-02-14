import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Profile } from '@/types';

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [sortOrder, setSortOrder] = useState<MemberSortOrder>('distance');
  const [search, setSearch] = useState('');

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
      <Pressable
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
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {(item.city || item.state) ? `${[item.city, item.state].filter(Boolean).join(', ')} · ` : ''}
            {count} review{count !== 1 ? 's' : ''} · {played} course{played !== 1 ? 's' : ''}
            {distance != null ? ` · ${Math.round(distance)} mi` : ''}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search members..."
          placeholderTextColor={Colors.gray}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.sortToggle}>
        <Pressable
          style={[styles.sortBtn, sortOrder === 'distance' && styles.sortBtnActive]}
          onPress={() => setSortOrder('distance')}
        >
          <Text style={[styles.sortBtnText, sortOrder === 'distance' && styles.sortBtnTextActive]}>NEARBY</Text>
        </Pressable>
        <Pressable
          style={[styles.sortBtn, sortOrder === 'alpha' && styles.sortBtnActive]}
          onPress={() => setSortOrder('alpha')}
        >
          <Text style={[styles.sortBtnText, sortOrder === 'alpha' && styles.sortBtnTextActive]}>A-Z</Text>
        </Pressable>
        </View>
      </View>
      <FlatList
        data={sortedProfiles}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        }
      />
    </View>
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
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  sortToggle: {
    flexDirection: 'row',
    gap: 4,
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
