import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Profile } from '@/types';

export default function MembersScreen() {
  const { profiles, writeups, session, coursesPlayed } = useStore();
  const router = useRouter();

  if (!session) return null;

  function getWriteupCount(userId: string) {
    return writeups.filter((w) => w.user_id === userId).length;
  }

  function getCoursesPlayedCount(userId: string) {
    const playedIds = new Set(coursesPlayed.filter(cp => cp.user_id === userId).map(cp => cp.course_id));
    const writeupIds = writeups.filter(w => w.user_id === userId).map(w => w.course_id);
    for (const id of writeupIds) playedIds.add(id);
    return playedIds.size;
  }

  function renderMember({ item }: { item: Profile }) {
    const count = getWriteupCount(item.id);
    const played = getCoursesPlayedCount(item.id);
    const isMe = item.id === session?.user?.id;

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
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
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
