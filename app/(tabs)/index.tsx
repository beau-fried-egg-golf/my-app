import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Activity, Profile, Writeup, Post } from '@/types';
import WordHighlight from '@/components/WordHighlight';

const REACTION_EMOJI: Record<string, string> = {
  like: '\uD83D\uDC4D',
  love: '\u2764\uFE0F',
  fire: '\uD83D\uDD25',
  laugh: '\uD83D\uDE02',
};

function ActivityItem({ item, onPress, writeups, profiles, posts }: { item: Activity; onPress: () => void; writeups: Writeup[]; profiles: Profile[]; posts: Post[] }) {
  const userProfile = profiles.find(p => p.id === item.user_id);
  const thumbnail = item.type === 'writeup' && item.writeup_id
    ? writeups.find(w => w.id === item.writeup_id)?.photos[0]?.url
    : item.type === 'post' && item.post_id
      ? posts.find(p => p.id === item.post_id)?.photos[0]?.url
      : undefined;

  if (item.type === 'post') {
    const name = item.user_name ?? '';
    const post = item.post_id ? posts.find(p => p.id === item.post_id) : null;
    const contentPreview = (item.post_content ?? '').length > 80
      ? (item.post_content ?? '').slice(0, 80) + '...'
      : item.post_content ?? '';
    const reactionSummary = post
      ? Object.entries(post.reactions)
          .filter(([, count]) => count > 0)
          .map(([key, count]) => `${REACTION_EMOJI[key] ?? key} ${count}`)
          .join('  ')
      : '';

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
            <Text style={styles.activityText}> posted</Text>
          </View>
          {contentPreview ? (
            <Text style={styles.postPreview} numberOfLines={2}>{contentPreview}</Text>
          ) : null}
          {reactionSummary ? (
            <Text style={styles.reactionSummary}>{reactionSummary}</Text>
          ) : null}
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
        {thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        )}
      </Pressable>
    );
  }

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
            <Text style={styles.activityText}> posted a review on{' '}</Text>
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
          <Ionicons name="thumbs-up-outline" size={16} color={Colors.black} />
        </View>
      )}
      <View style={styles.activityContent}>
        <View style={styles.activityRow}>
          <Text style={styles.activityTextBold}>{name}</Text>
          <Text style={styles.activityText}> liked </Text>
          <Text style={styles.activityTextBold}>{targetName}</Text>
          <Text style={styles.activityText}>{'\'s review on'}</Text>
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
  const { activities, writeups, profiles, posts, session, followingIds } = useStore();
  const router = useRouter();
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'FOLLOWING'>('ALL');

  if (!session) return null;

  const filteredActivities = feedFilter === 'FOLLOWING'
    ? activities.filter(a => followingIds.has(a.user_id))
    : activities;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterTab, feedFilter === 'ALL' && styles.filterTabActive]}
          onPress={() => setFeedFilter('ALL')}
        >
          <Text style={[styles.filterTabText, feedFilter === 'ALL' && styles.filterTabTextActive]}>ALL</Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, feedFilter === 'FOLLOWING' && styles.filterTabActive]}
          onPress={() => setFeedFilter('FOLLOWING')}
        >
          <Text style={[styles.filterTabText, feedFilter === 'FOLLOWING' && styles.filterTabTextActive]}>FOLLOWING</Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityItem
            item={item}
            writeups={writeups}
            profiles={profiles}
            posts={posts}
            onPress={() => {
              if (item.type === 'post' && item.post_id) router.push(`/post/${item.post_id}`);
              else if (item.writeup_id) router.push(`/writeup/${item.writeup_id}`);
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
        contentContainerStyle={filteredActivities.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <Pressable
        style={styles.fab}
        onPress={() => setShowFabMenu(true)}
      >
        <Text style={{ fontSize: 28, color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, lineHeight: 30 }}>+</Text>
      </Pressable>

      <Modal
        visible={showFabMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFabMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFabMenu(false)}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/create-writeup');
              }}
            >
              <Ionicons name="document-text-outline" size={22} color={Colors.black} />
              <Text style={styles.modalOptionText}>Review</Text>
            </Pressable>
            <View style={styles.modalSeparator} />
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/create-post');
              }}
            >
              <Ionicons name="chatbubble-outline" size={22} color={Colors.black} />
              <Text style={styles.modalOptionText}>Post</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.black,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1,
  },
  filterTabTextActive: {
    color: Colors.black,
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
  postPreview: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 20,
    marginTop: 4,
    fontFamily: Fonts!.sans,
  },
  reactionSummary: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
    fontFamily: Fonts!.sans,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: 240,
    overflow: 'hidden',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalOptionText: {
    fontSize: 17,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
});
