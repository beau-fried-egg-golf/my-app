import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Notification } from '@/types';

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

function getNotificationText(n: Notification): { parts: { text: string; bold: boolean }[] } {
  switch (n.type) {
    case 'upvote':
      return {
        parts: [
          { text: n.actor_name ?? 'Someone', bold: true },
          { text: ' liked your review on ', bold: false },
          { text: n.course_name ?? 'a course', bold: true },
        ],
      };
    case 'meetup_signup':
      return {
        parts: [
          { text: n.actor_name ?? 'Someone', bold: true },
          { text: ' signed up for ', bold: false },
          { text: n.meetup_name ?? 'your meetup', bold: true },
        ],
      };
    case 'group_join':
      return {
        parts: [
          { text: n.actor_name ?? 'Someone', bold: true },
          { text: ' joined your group ', bold: false },
          { text: n.group_name ?? 'a group', bold: true },
        ],
      };
    case 'meetup_reminder_7d':
      return {
        parts: [
          { text: 'Your meetup ', bold: false },
          { text: n.meetup_name ?? 'a meetup', bold: true },
          { text: ' is in 7 days', bold: false },
        ],
      };
    case 'meetup_reminder_1d':
      return {
        parts: [
          { text: 'Your meetup ', bold: false },
          { text: n.meetup_name ?? 'a meetup', bold: true },
          { text: ' is tomorrow', bold: false },
        ],
      };
    case 'post_reply':
      return {
        parts: [
          { text: n.actor_name ?? 'Someone', bold: true },
          { text: ' replied to your post', bold: false },
        ],
      };
    case 'writeup_reply':
      return {
        parts: [
          { text: n.actor_name ?? 'Someone', bold: true },
          { text: ' replied to your review on ', bold: false },
          { text: n.course_name ?? 'a course', bold: true },
        ],
      };
    default:
      return { parts: [{ text: 'New notification', bold: false }] };
  }
}

function getNavTarget(n: Notification): string | null {
  switch (n.type) {
    case 'upvote':
      return n.writeup_id ? `/writeup/${n.writeup_id}` : null;
    case 'meetup_signup':
    case 'meetup_reminder_7d':
    case 'meetup_reminder_1d':
      return n.meetup_id ? `/meetup/${n.meetup_id}` : null;
    case 'group_join':
      return n.group_id ? `/group/${n.group_id}` : null;
    case 'post_reply':
      return n.post_id ? `/post/${n.post_id}` : null;
    case 'writeup_reply':
      return n.writeup_id ? `/writeup/${n.writeup_id}` : null;
    default:
      return null;
  }
}

function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: () => void;
}) {
  const isReminder = item.type === 'meetup_reminder_7d' || item.type === 'meetup_reminder_1d';
  const { parts } = getNotificationText(item);

  return (
    <Pressable
      style={[styles.notifItem, !item.is_read && styles.notifItemUnread]}
      onPress={onPress}
    >
      {isReminder ? (
        <View style={styles.iconCircle}>
          <Ionicons name="calendar" size={16} color={Colors.black} />
        </View>
      ) : item.actor_image ? (
        <Image source={{ uri: item.actor_image }} style={styles.avatar} />
      ) : (
        <View style={styles.iconCircle}>
          <Ionicons name="person" size={16} color={Colors.black} />
        </View>
      )}
      <View style={styles.notifContent}>
        <Text style={styles.notifText}>
          {parts.map((p, i) => (
            <Text key={i} style={p.bold ? styles.textBold : undefined}>
              {p.text}
            </Text>
          ))}
        </Text>
        <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, hasUnreadNotifications, markNotificationRead, markAllNotificationsRead } = useStore();

  const handlePress = async (item: Notification) => {
    if (!item.is_read) {
      await markNotificationRead(item.id);
    }
    const target = getNavTarget(item);
    if (target) {
      router.push(target as any);
    }
  };

  return (
    <View style={styles.container}>
      {hasUnreadNotifications && (
        <View style={styles.markAllRow}>
          <Pressable onPress={markAllNotificationsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>MARK ALL READ</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  markAllRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  markAllText: {
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    fontSize: 11,
    color: Colors.orange,
    letterSpacing: 0.5,
  },
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notifItemUnread: {
    backgroundColor: '#FFF8F5',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    fontSize: 15,
    color: Colors.black,
    lineHeight: 21,
  },
  textBold: {
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
  notifTime: {
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    fontSize: 16,
    color: Colors.gray,
  },
});
