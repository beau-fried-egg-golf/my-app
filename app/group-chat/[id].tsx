import { useEffect, useState, useCallback, useRef } from 'react';
import { Animated, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { GroupMessage, GroupMember } from '@/types';
import { GroupsIcon } from '@/components/icons/CustomIcons';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageContextMenu from '@/components/chat/MessageContextMenu';
import { ReplyPreviewBar } from '@/components/chat/ReplyPreview';
import EmojiPicker from '@/components/chat/EmojiPicker';
import MentionAutocomplete from '@/components/chat/MentionAutocomplete';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const DT_TEXT_HEIGHT = 18;
const DT_SCROLL_GAP = 14;

function DesktopBackButton({ onPress }: { onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackInner}>
        <Ionicons name="chevron-back" size={18} color={Colors.black} />
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>BACK</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>BACK</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    session, groups, getGroupMessages, sendGroupMessage, markGroupRead, loadGroups,
    toggleGroupMessageReaction, getGroupMembers, getUserName,
  } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // New state for chat features
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; messageId: string; position: { x: number; y: number } }>({ visible: false, messageId: '', position: { x: 0, y: 0 } });
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const group = groups.find(g => g.id === id);
  const currentUserId = session?.user?.id;
  const isDesktop = useIsDesktop();

  const loadMessages = useCallback(async () => {
    if (!id) return;
    const msgs = await getGroupMessages(id);
    setMessages(msgs);
  }, [id, getGroupMessages]);

  useEffect(() => {
    loadGroups();
    loadMessages();
    if (id) {
      markGroupRead(id);
      getGroupMembers(id).then(setMembers);
    }
    const interval = setInterval(() => {
      loadMessages();
      if (id) markGroupRead(id);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadGroups, loadMessages, id, markGroupRead, getGroupMembers]);

  const handleSend = async () => {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    try {
      const msg = await sendGroupMessage(id, text.trim(), replyTo?.id);
      setMessages(prev => [...prev, { ...msg, reactions: {}, reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, user_id: replyTo.user_id, sender_name: replyTo.sender_name } : null }]);
      setText('');
      setReplyTo(null);
      setShowEmojiPicker(false);
    } catch (e) {
      console.error('Failed to send group message', e);
    } finally {
      setSending(false);
    }
  };

  const handleContextMenuOpen = (messageId: string, position: { x: number; y: number }) => {
    setContextMenu({ visible: true, messageId, position });
  };

  const handleReaction = async (emoji: string) => {
    if (!id || !contextMenu.messageId) return;
    const messageId = contextMenu.messageId;

    // Optimistic update
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

    await toggleGroupMessageReaction(messageId, id, emoji);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!id) return;

    // Optimistic update
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

    await toggleGroupMessageReaction(messageId, id, emoji);
  };

  const handleReply = () => {
    const msg = messages.find(m => m.id === contextMenu.messageId);
    if (msg) {
      setReplyTo(msg);
      inputRef.current?.focus();
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Detect @mentions
    const cursorText = newText;
    const atMatch = cursorText.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (name: string) => {
    const atMatch = text.match(/@(\w*)$/);
    if (atMatch) {
      const before = text.slice(0, text.length - atMatch[0].length);
      setText(before + '@' + name + ' ');
    }
    setMentionQuery('');
    inputRef.current?.focus();
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
      keyboardVerticalOffset={0}
    >
      <ResponsiveContainer>
      {/* Header */}
      {isDesktop ? (
        <View style={styles.desktopHeader}>
          <DesktopBackButton onPress={() => router.push('/conversations')} />
          <Pressable style={styles.desktopHeaderCenter} onPress={() => router.push(`/group/${id}`)}>
            {group?.image ? (
              <Image source={{ uri: group.image }} style={styles.headerThumbnail} />
            ) : (
              <GroupsIcon size={34} color={Colors.black} />
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>{group?.name ?? 'Group'}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/group/${id}`)} style={styles.desktopMenuBtn}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.black} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.push('/conversations')} style={styles.backArrow}>
              <Ionicons name="chevron-back" size={20} color={Colors.black} />
            </Pressable>
            <Pressable
              style={styles.headerTitleArea}
              onPress={() => router.push(`/group/${id}`)}
            >
              {group?.image ? (
                <Image source={{ uri: group.image }} style={styles.headerThumbnail} />
              ) : (
                <GroupsIcon size={34} color={Colors.black} />
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>{group?.name ?? 'Group'}</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/group/${id}`)} style={styles.headerMenu}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.black} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isOwn = item.user_id === currentUserId;
          const showSenderName = !isOwn && (
            index === 0 || messages[index - 1].user_id !== item.user_id
          );
          return (
            <MessageBubble
              message={item}
              isOwn={isOwn}
              showSenderName={showSenderName}
              currentUserId={currentUserId}
              onLongPress={handleContextMenuOpen}
              onToggleReaction={handleToggleReaction}
              getUserName={getUserName}
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

      {/* Mention autocomplete */}
      {mentionQuery !== '' && (
        <MentionAutocomplete
          query={mentionQuery}
          members={members}
          onSelect={handleMentionSelect}
        />
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <ReplyPreviewBar
          senderName={replyTo.sender_name ?? 'Member'}
          content={replyTo.content}
          onCancel={() => setReplyTo(null)}
        />
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: keyboardHeight > 0 ? 10 : Math.max(10, insets.bottom) }]}>
        <Pressable style={styles.emojiBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
          <Ionicons name={showEmojiPicker ? 'close' : 'happy-outline'} size={22} color={Colors.gray} />
        </Pressable>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
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

      {/* Context menu modal */}
      <MessageContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        currentReactions={currentUserReactions}
        onReaction={handleReaction}
        onReply={handleReply}
        onClose={() => setContextMenu({ visible: false, messageId: '', position: { x: 0, y: 0 } })}
      />
      </ResponsiveContainer>
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
  headerTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerThumbnail: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  desktopHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  desktopMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopBackBtn: { borderRadius: 8, overflow: 'hidden' },
  desktopBackInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  desktopBackText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
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
});
