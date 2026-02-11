import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Activity, Writeup } from '@/types';

function ActivityItem({ item, onPress, writeups }: { item: Activity; onPress: () => void; writeups: Writeup[] }) {
  const thumbnail = item.type === 'writeup' && item.writeup_id
    ? writeups.find(w => w.id === item.writeup_id)?.photos[0]?.url
    : undefined;

  if (item.type === 'writeup') {
    return (
      <Pressable style={styles.activityItem} onPress={onPress}>
        <View style={styles.activityIcon}>
          <Ionicons name="document-text-outline" size={20} color={Colors.black} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>
            <Text style={styles.bold}>{item.user_name}</Text> posted a writeup on{' '}
            <Text style={styles.bold}>{item.course_name}</Text>
          </Text>
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
        {thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.activityItem} onPress={onPress}>
      <View style={styles.activityIcon}>
        <Ionicons name="arrow-up" size={20} color={Colors.black} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.bold}>{item.user_name}</Text> upvoted{' '}
          <Text style={styles.bold}>{item.target_user_name}</Text>'s writeup on{' '}
          <Text style={styles.bold}>{item.course_name}</Text>
        </Text>
        <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
      </View>
    </Pressable>
  );
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

export default function FeedScreen() {
  const { activities, writeups, session } = useStore();
  const router = useRouter();

  if (!session) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityItem
            item={item}
            writeups={writeups}
            onPress={() => item.writeup_id ? router.push(`/writeup/${item.writeup_id}`) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.lightGray} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Write your first course review to get started
            </Text>
          </View>
        }
        contentContainerStyle={activities.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/create-writeup')}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  list: {
    paddingVertical: 8,
  },
  activityItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 21,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  bold: {
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 64,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
