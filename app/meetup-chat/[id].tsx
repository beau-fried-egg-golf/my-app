import { useEffect, useState, useCallback, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { MeetupMessage } from '@/types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function MeetupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    session, meetups, getMeetupMessages, sendMeetupMessage, markMeetupRead, loadMeetups,
  } = useStore();
  const router = useRouter();

  const [messages, setMessages] = useState<MeetupMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const meetup = meetups.find(m => m.id === id);
  const currentUserId = session?.user?.id;

  const loadMessages = useCallback(async () => {
    if (!id) return;
    const msgs = await getMeetupMessages(id);
    setMessages(msgs);
  }, [id, getMeetupMessages]);

  useEffect(() => {
    loadMeetups();
    loadMessages();
    if (id) markMeetupRead(id);
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMeetups, loadMessages, id, markMeetupRead]);

  const handleSend = async () => {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    try {
      const msg = await sendMeetupMessage(id, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch (e) {
      console.error('Failed to send meetup message', e);
    } finally {
      setSending(false);
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
            <Text style={styles.backArrowText}>{'<'}</Text>
          </Pressable>
          <Pressable
            style={styles.headerTitleArea}
            onPress={() => router.push(`/meetup/${id}`)}
          >
            <Ionicons name="calendar" size={18} color={Colors.black} style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle} numberOfLines={1}>{meetup?.name ?? 'Meetup'}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/meetup/${id}`)} style={styles.headerMenu}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.black} />
          </Pressable>
        </View>
      </View>

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
            <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther]}>
              {showSenderName && (
                <Text style={styles.senderName}>{item.sender_name ?? 'Member'}</Text>
              )}
              <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
                  {item.content}
                </Text>
                <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
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

      {/* Input */}
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
  backArrow: { paddingRight: 12 },
  backArrowText: {
    fontSize: 24,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  headerTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  messagesList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    marginBottom: 8,
  },
  bubbleWrapperOwn: {
    alignItems: 'flex-end',
  },
  bubbleWrapperOther: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: Colors.black,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, fontFamily: Fonts!.sans },
  bubbleTextOwn: { color: Colors.white },
  bubbleTextOther: { color: Colors.black },
  bubbleTime: { fontSize: 11, marginTop: 4, fontFamily: Fonts!.sans },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' as const },
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
});
