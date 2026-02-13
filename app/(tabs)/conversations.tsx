import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { ConversationListItem } from '@/types';

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function ConversationRow({ item, onPress }: { item: ConversationListItem; onPress: () => void }) {
  const iconName = item.type === 'group' ? 'people' : item.type === 'meetup' ? 'calendar' : 'person';

  return (
    <Pressable style={styles.item} onPress={onPress}>
      {item.unread && <View style={styles.unreadDot} />}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name={iconName} size={20} color={Colors.gray} />
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.unread && styles.itemNameUnread]}>
          {item.name}
          {(item.type === 'group' || item.type === 'meetup') && item.member_count ? ` (${item.member_count})` : ''}
        </Text>
        {item.last_message ? (
          <Text style={[styles.itemPreview, item.unread && styles.itemPreviewUnread]} numberOfLines={1}>{item.last_message}</Text>
        ) : (
          <Text style={styles.itemPreview}>No messages yet</Text>
        )}
      </View>
      {item.last_message_at && (
        <Text style={[styles.itemTime, item.unread && styles.itemTimeUnread]}>{formatTime(item.last_message_at)}</Text>
      )}
    </Pressable>
  );
}

type TabType = 'dms' | 'groups' | 'meetups';

export default function ConversationsScreen() {
  const { conversationListItems, loadConversations, loadGroups, loadMeetups } = useStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dms');

  const hasUnreadDms = conversationListItems.some(i => i.type === 'dm' && i.unread);
  const hasUnreadGroups = conversationListItems.some(i => i.type === 'group' && i.unread);
  const hasUnreadMeetups = conversationListItems.some(i => i.type === 'meetup' && i.unread);
  const tabUnread: Record<TabType, boolean> = { dms: hasUnreadDms, groups: hasUnreadGroups, meetups: hasUnreadMeetups };

  useEffect(() => {
    loadConversations();
    loadGroups();
    loadMeetups();
    const interval = setInterval(() => {
      loadConversations();
      loadGroups();
      loadMeetups();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadConversations, loadGroups, loadMeetups]);

  const filteredItems = conversationListItems.filter(item => {
    if (activeTab === 'dms') return item.type === 'dm';
    if (activeTab === 'groups') return item.type === 'group';
    return item.type === 'meetup';
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {(['dms', 'groups', 'meetups'] as TabType[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.toUpperCase()}
              </Text>
              {tabUnread[tab] && <View style={styles.tabUnreadDot} />}
            </View>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
          <ConversationRow
            item={item}
            onPress={() => {
              if (item.type === 'group') {
                router.push(`/group-chat/${item.group_id ?? item.id}`);
              } else if (item.type === 'meetup') {
                router.push(`/meetup-chat/${item.meetup_id ?? item.id}`);
              } else {
                router.push(`/conversation/${item.id}`);
              }
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.lightGray} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'dms'
                ? "Visit a member's profile and tap Message to start chatting"
                : activeTab === 'groups'
                  ? 'Join a group to start chatting'
                  : 'Join a meetup to start chatting'}
            </Text>
          </View>
        }
        contentContainerStyle={filteredItems.length === 0 ? styles.emptyContainer : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.black,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },
  tabText: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.black,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1 },
  itemName: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  itemPreview: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  itemNameUnread: {
    color: Colors.black,
  },
  itemPreviewUnread: {
    color: Colors.black,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
  },
  itemTime: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginLeft: 8,
  },
  itemTimeUnread: {
    color: Colors.orange,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 72,
  },
  empty: { alignItems: 'center', gap: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
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
