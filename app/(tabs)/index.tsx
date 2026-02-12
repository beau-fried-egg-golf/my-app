import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Activity, Profile, Writeup } from '@/types';
import WordHighlight from '@/components/WordHighlight';

function ActivityItem({ item, onPress, writeups, profiles }: { item: Activity; onPress: () => void; writeups: Writeup[]; profiles: Profile[] }) {
  const userProfile = profiles.find(p => p.id === item.user_id);
  const thumbnail = item.type === 'writeup' && item.writeup_id
    ? writeups.find(w => w.id === item.writeup_id)?.photos[0]?.url
    : undefined;

  if (item.type === 'writeup') {
    const name = item.user_name ?? '';
    return (
      <Pressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            <Text style={styles.activityText}> posted a writeup on{' '}</Text>
          </View>
          <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
        {thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        )}
      </Pressable>
    );
  }

  if (item.type === 'played') {
    const name = item.user_name ?? '';
    return (
      <Pressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            <Text style={styles.activityText}> played{' '}</Text>
          </View>
          <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </Pressable>
    );
  }

  const name = item.user_name ?? '';
  const targetName = item.target_user_name ?? '';

  return (
    <Pressable style={styles.activityItem} onPress={onPress}>
      {userProfile?.image ? (
        <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
      ) : (
        <View style={styles.activityIcon}>
          <Text style={styles.arrowText}>^</Text>
        </View>
      )}
      <View style={styles.activityContent}>
        <View style={styles.activityRow}>
          <Text style={styles.activityTextBold}>{name}</Text>
          <Text style={styles.activityText}> upvoted </Text>
          <Text style={styles.activityTextBold}>{targetName}</Text>
          <Text style={styles.activityText}>{'\'s writeup on'}</Text>
        </View>
        <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
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
  const { activities, writeups, profiles, session } = useStore();
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
            profiles={profiles}
            onPress={() => {
              if (item.writeup_id) router.push(`/writeup/${item.writeup_id}`);
              else if (item.type === 'played' && item.course_id) router.push(`/course/${item.course_id}`);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
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
        <Text style={{ fontSize: 28, color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, lineHeight: 30 }}>+</Text>
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
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
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
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 21,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
  },
  activityTextBold: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 21,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
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
    fontFamily: Fonts!.sans,
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
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  arrowText: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
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
