import { useEffect, useState, useCallback, useRef } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Message } from '@/types';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageContextMenu from '@/components/chat/MessageContextMenu';
import { ReplyPreviewBar } from '@/components/chat/ReplyPreview';
import EmojiPicker from '@/components/chat/EmojiPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    session, getMessages, sendMessage, conversations,
    profiles, blockUser, unblockUser, isBlocked, isBlockedBy,
    markConversationRead, loadConversations, toggleMessageReaction,
  } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Chat feature state
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; messageId: string; position: { x: number; y: number } }>({ visible: false, messageId: '', position: { x: 0, y: 0 } });
  const inputRef = useRef<TextInput>(null);

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
    const interval = setInterval(() => {
      loadMessages();
      if (id) markConversationRead(id);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadConversations, loadMessages, id, markConversationRead]);

  const handleSend = async () => {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    try {
      const msg = await sendMessage(id, text.trim(), replyTo?.id);
      setMessages(prev => [...prev, { ...msg, reactions: {}, reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, user_id: replyTo.user_id } : null }]);
      setText('');
      setReplyTo(null);
      setShowEmojiPicker(false);
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

  const handleContextMenuOpen = (messageId: string, position: { x: number; y: number }) => {
    setContextMenu({ visible: true, messageId, position });
  };

  const handleReaction = async (emoji: string) => {
    if (!id || !contextMenu.messageId) return;
    const messageId = contextMenu.messageId;

    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions ?? {}) };
      const users = reactions[emoji] ?? [];
      if (currentUserId && users.includes(currentUserId)) {
        reactions[emoji] = users.filter(u => u !== currentUserId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else if (currentUserId) {
        reactions[emoji] = [...users, currentUserId];
      }
      return { ...m, reactions };
    }));

    await toggleMessageReaction(messageId, id, emoji);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!id) return;

    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions ?? {}) };
      const users = reactions[emoji] ?? [];
      if (currentUserId && users.includes(currentUserId)) {
        reactions[emoji] = users.filter(u => u !== currentUserId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else if (currentUserId) {
        reactions[emoji] = [...users, currentUserId];
      }
      return { ...m, reactions };
    }));

    await toggleMessageReaction(messageId, id, emoji);
  };

  const handleReply = () => {
    const msg = messages.find(m => m.id === contextMenu.messageId);
    if (msg) {
      setReplyTo(msg);
      inputRef.current?.focus();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const contextMenuMessage = messages.find(m => m.id === contextMenu.messageId);
  const currentUserReactions = contextMenuMessage?.reactions
    ? Object.entries(contextMenuMessage.reactions)
        .filter(([, users]) => currentUserId && users.includes(currentUserId))
        .map(([emoji]) => emoji)
    : [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push('/conversations')} style={styles.backArrow}>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
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
            <MessageBubble
              message={item}
              isOwn={isOwn}
              showSenderName={false}
              currentUserId={currentUserId}
              onLongPress={handleContextMenuOpen}
              onToggleReaction={handleToggleReaction}
            />
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

      {/* Reply preview bar */}
      {replyTo && (
        <ReplyPreviewBar
          senderName={otherName}
          content={replyTo.content}
          onCancel={() => setReplyTo(null)}
        />
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
      )}

      {/* Input or blocked state */}
      {blocked ? (
        <View style={[styles.blockedBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <Text style={styles.blockedText}>You have blocked this user</Text>
        </View>
      ) : !canSend ? (
        <View style={[styles.blockedBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <Text style={styles.blockedText}>This user is not accepting messages</Text>
        </View>
      ) : (
        <View style={[styles.inputBar, { paddingBottom: Math.max(10, insets.bottom) }]}>
          <Pressable style={styles.emojiBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Ionicons name={showEmojiPicker ? 'close' : 'happy-outline'} size={22} color={Colors.gray} />
          </Pressable>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
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

      {/* Context menu modal */}
      <MessageContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        currentReactions={currentUserReactions}
        onReaction={handleReaction}
        onReply={handleReply}
        onClose={() => setContextMenu({ visible: false, messageId: '', position: { x: 0, y: 0 } })}
      />
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
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
    gap: 8,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  inputWrapper: {
    flex: 1,
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
    fontSize: 16,
    outlineStyle: 'none',
    fontFamily: Fonts!.sans,
    color: Colors.black,
  } as any,
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
