import { useEffect, useState, useCallback, useRef } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Message } from '@/types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    session, getMessages, sendMessage, conversations,
    profiles, blockUser, unblockUser, isBlocked, isBlockedBy,
    markConversationRead, loadConversations,
  } = useStore();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find(c => c.id === id);
  const currentUserId = session?.user?.id;

  const otherUserId = conversation
    ? (conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id)
    : null;

  const otherProfile = otherUserId ? profiles.find(p => p.id === otherUserId) : null;
  const otherName = conversation?.other_user_name ?? otherProfile?.name ?? 'Member';

  const blocked = otherUserId ? isBlocked(otherUserId) : false;
  const blockedBy = otherUserId ? isBlockedBy(otherUserId) : false;
  const otherDmsDisabled = otherProfile?.dms_disabled ?? false;
  const canSend = !blocked && !blockedBy && !otherDmsDisabled;

  const loadMessages = useCallback(async () => {
    if (!id) return;
    const msgs = await getMessages(id);
    setMessages(msgs);
  }, [id, getMessages]);

  useEffect(() => {
    loadConversations();
    loadMessages();
    if (id) markConversationRead(id);
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadConversations, loadMessages, id, markConversationRead]);

  const handleSend = async () => {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    try {
      const msg = await sendMessage(id, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async () => {
    if (!otherUserId) return;
    setShowMenu(false);
    if (blocked) {
      await unblockUser(otherUserId);
    } else {
      await blockUser(otherUserId);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push('/conversations')} style={styles.backArrow}>
            <Ionicons name="chevron-back" size={28} color={Colors.black} />
          </Pressable>
          {otherProfile?.image ? (
            <Image source={{ uri: otherProfile.image }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={16} color={Colors.gray} />
            </View>
          )}
          <Text style={styles.headerTitle}>{otherName}</Text>
          <Pressable onPress={() => setShowMenu(!showMenu)} style={styles.headerMenu}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.black} />
          </Pressable>
        </View>
      </View>

      {showMenu && (
        <View style={styles.menuDropdown}>
          <Pressable style={styles.menuItem} onPress={handleBlock}>
            <Text style={styles.menuItemText}>{blocked ? 'Unblock User' : 'Block User'}</Text>
          </Pressable>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isOwn = item.user_id === currentUserId;
          return (
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
                {item.content}
              </Text>
              <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />

      {/* Input or blocked state */}
      {blocked ? (
        <View style={styles.blockedBar}>
          <Text style={styles.blockedText}>You have blocked this user</Text>
        </View>
      ) : !canSend ? (
        <View style={styles.blockedBar}>
          <Text style={styles.blockedText}>This user is not accepting messages</Text>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.gray}
              multiline
              maxLength={2000}
              onKeyPress={(e: any) => {
                if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {!!text.trim() && (
              <Pressable
                style={styles.sendBtn}
                onPress={handleSend}
                disabled={sending}
              >
                <Ionicons name="arrow-up" size={18} color={Colors.white} />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    paddingRight: 12,
  },
  backArrowText: {
    fontSize: 24,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  headerMenu: {
    marginLeft: 'auto',
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 52 : 92,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  menuItem: { paddingHorizontal: 20, paddingVertical: 14 },
  menuItemText: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.black,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, fontFamily: Fonts!.sans },
  bubbleTextOwn: { color: Colors.white },
  bubbleTextOther: { color: Colors.black },
  bubbleTime: { fontSize: 11, marginTop: 4, fontFamily: Fonts!.sans },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeOther: { color: Colors.gray },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    minHeight: 32,
    maxHeight: 100,
    paddingVertical: 6,
    fontSize: 15,
    outlineColor: 'transparent',
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  blockedBar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    alignItems: 'center',
  },
  blockedText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
});
