import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { PostReply } from '@/types';
import LinkPreview from '@/components/LinkPreview';
import ReactionTooltip from '@/components/ReactionTooltip';
import DetailHeader from '@/components/DetailHeader';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import VerifiedBadge from '@/components/VerifiedBadge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';

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

function DesktopBackStyleButton({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackBtnInner}>
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>{label}</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const REACTION_EMOJI: Record<string, string> = {
  like: '\uD83D\uDC4D',
  love: '\u2764\uFE0F',
  fire: '\uD83D\uDD25',
  laugh: '\uD83D\uDE02',
};

const REACTION_KEYS = ['like', 'love', 'fire', 'laugh'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts, user, togglePostReaction, getPostReplies, addPostReply, deletePost, flagContent, getUserName } = useStore();

  const [replies, setReplies] = useState<PostReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<PostReply | null>(null);

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
  const post = posts.find(p => p.id === id);

  useEffect(() => {
    if (id) {
      getPostReplies(id).then(setReplies);
    }
  }, [id]);

  if (!post) return null;

  const isOwner = user?.id === post.user_id;

  function buildReplyTree(flat: PostReply[]) {
    const byId = new Map<string, PostReply>();
    for (const r of flat) byId.set(r.id, r);

    function getRootId(r: PostReply): string {
      let current = r;
      while (current.parent_id && byId.has(current.parent_id)) {
        current = byId.get(current.parent_id)!;
      }
      return current.id;
    }

    const topLevel = flat.filter(r => !r.parent_id);
    const childrenByRoot = new Map<string, PostReply[]>();
    for (const r of flat) {
      if (!r.parent_id) continue;
      const rootId = getRootId(r);
      const arr = childrenByRoot.get(rootId) || [];
      arr.push(r);
      childrenByRoot.set(rootId, arr);
    }

    const result: { reply: PostReply; depth: number }[] = [];
    for (const r of topLevel) {
      result.push({ reply: r, depth: 0 });
      for (const child of childrenByRoot.get(r.id) || []) {
        result.push({ reply: child, depth: 1 });
      }
    }
    return result;
  }

  async function handleSendReply() {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const reply = await addPostReply(post!.id, replyText.trim(), replyingTo?.id);
      setReplies(prev => [...prev, reply]);
      setReplyText('');
      setReplyingTo(null);
    } catch (e) {
      console.error('Failed to add reply', e);
    } finally {
      setSendingReply(false);
    }
  }

  async function handleDelete() {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to delete this post?')) return;
      await deletePost(post!.id);
      router.back();
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePost(post!.id);
            router.back();
          },
        },
      ]);
    }
  }

  function handleFlag() {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to flag this post as inappropriate?')) return;
      flagContent('post', post!.id);
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Flag Post', 'Are you sure you want to flag this post as inappropriate?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag',
          style: 'destructive',
          onPress: () => flagContent('post', post!.id),
        },
      ]);
    }
  }

  const headerContent = (
    <>
      <View style={styles.authorRow}>
        <Pressable onPress={() => router.push(`/member/${post.user_id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.authorName}>{post.author_name ?? 'Member'}</Text>
          {post.author_verified && <VerifiedBadge size={14} />}
        </Pressable>
        <Text style={styles.date}> · {formatDate(post.created_at)}</Text>
      </View>

      <Text style={styles.body}>{post.content}</Text>

      {post.link_url ? (
        <LinkPreview
          url={post.link_url}
          title={post.link_title}
          description={post.link_description}
          image={post.link_image}
        />
      ) : null}

      {post.photos.filter(p => !brokenPhotoIds.has(p.id)).length > 0 && (
        <View style={styles.photos}>
          {post.photos.filter(p => !brokenPhotoIds.has(p.id)).map((photo) => (
            <View key={photo.id} style={styles.photoContainer}>
              <Image
                source={{ uri: photo.url }}
                style={styles.photo}
                onError={() => setBrokenPhotoIds(prev => new Set(prev).add(photo.id))}
              />
              {photo.caption ? (
                <Text style={styles.photoCaption}>{photo.caption}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Reactions bar */}
      <View style={styles.reactionsBar}>
        {REACTION_KEYS.map(key => {
          const active = post.user_reactions.includes(key);
          const reactorIds = post.reactions[key] ?? [];
          const count = reactorIds.length;
          return (
            <ReactionTooltip
              key={key}
              userIds={reactorIds}
              getUserName={getUserName}
              onPress={() => togglePostReaction(post.id, key)}
              style={[styles.reactionButton, active && styles.reactionButtonActive]}
            >
              <Text style={styles.reactionEmoji}>{REACTION_EMOJI[key]}</Text>
              {count > 0 && (
                <Text style={[styles.reactionCount, active && styles.reactionCountActive]}>{count}</Text>
              )}
            </ReactionTooltip>
          );
        })}
        <View style={styles.commentBadge}>
          <Ionicons name="chatbubble-outline" size={14} color={Colors.gray} />
          <Text style={styles.commentBadgeText}>{post.reply_count} {post.reply_count === 1 ? 'comment' : 'comments'}</Text>
        </View>
      </View>

      <View style={styles.postActions}>
        {!isOwner && (
          <Pressable style={styles.flagButton} onPress={handleFlag}>
            <Ionicons name="flag-outline" size={14} color={Colors.gray} />
            <Text style={styles.flagText}>Flag</Text>
          </Pressable>
        )}

        {isOwner && !isDesktop && (
          <View style={styles.ownerActions}>
            <Pressable style={styles.ownerButton} onPress={handleDelete}>
              <Text style={styles.ownerButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.repliesHeader}>
        <Text style={styles.repliesTitle}>Replies ({replies.length})</Text>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ResponsiveContainer>
      {isDesktop ? (
        <View style={styles.desktopTopBar}>
          <DesktopBackButton onPress={() => router.back()} />
          {isOwner && (
            <View style={styles.desktopManageRight}>
              <DesktopBackStyleButton label="DELETE" onPress={handleDelete} />
            </View>
          )}
        </View>
      ) : (
        <DetailHeader title="POST" />
      )}
      <FlatList
        data={buildReplyTree(replies)}
        keyExtractor={item => item.reply.id}
        ListHeaderComponent={headerContent}
        contentContainerStyle={styles.content}
        {...desktopScrollProps}
        renderItem={({ item }) => {
          const { reply, depth } = item;
          return (
            <View style={[styles.replyItem, depth === 1 && { marginLeft: 32 }]}>
              {depth === 1 && reply.parent_id && (
                <Text style={styles.replyingToLabel}>
                  Replying to {replies.find(r => r.id === reply.parent_id)?.author_name ?? 'Member'}
                </Text>
              )}
              <View style={styles.replyAuthorRow}>
                <Pressable onPress={() => router.push(`/member/${reply.user_id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.replyAuthorName}>{reply.author_name ?? 'Member'}</Text>
                  {reply.author_verified && <VerifiedBadge size={12} />}
                </Pressable>
                <Text style={styles.replyTime}> · {formatTime(reply.created_at)}</Text>
              </View>
              <Text style={styles.replyContent}>{reply.content}</Text>
              <Pressable style={styles.replyButton} onPress={() => setReplyingTo(reply)}>
                <Ionicons name="arrow-undo-outline" size={14} color={Colors.gray} />
                <Text style={styles.replyButtonText}>Reply</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.noReplies}>No replies yet. Be the first!</Text>
        }
        ListFooterComponent={isDesktop ? (
          <View style={styles.desktopReplyInputBar}>
            {replyingTo && (
              <View style={styles.replyingToBanner}>
                <Text style={styles.replyingToBannerText}>Replying to {replyingTo.author_name ?? 'Member'}</Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close" size={16} color={Colors.gray} />
                </Pressable>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply..."
                placeholderTextColor={Colors.gray}
                multiline
                maxLength={2000}
                onKeyPress={(e: any) => {
                  if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              {!!replyText.trim() && (
                <Pressable
                  style={styles.sendBtn}
                  onPress={handleSendReply}
                  disabled={sendingReply}
                >
                  <Ionicons name="arrow-up" size={18} color={Colors.white} />
                </Pressable>
              )}
            </View>
          </View>
        ) : undefined}
      />
      {!isDesktop && (
        <>
          {replyingTo && (
            <View style={styles.replyingToBanner}>
              <Text style={styles.replyingToBannerText}>Replying to {replyingTo.author_name ?? 'Member'}</Text>
              <Pressable onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color={Colors.gray} />
              </Pressable>
            </View>
          )}
          <View style={[styles.replyInputBar, { paddingBottom: keyboardHeight > 0 ? 10 : Math.max(10, insets.bottom) }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply..."
                placeholderTextColor={Colors.gray}
                multiline
                maxLength={2000}
                onKeyPress={(e: any) => {
                  if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              {!!replyText.trim() && (
                <Pressable
                  style={styles.sendBtn}
                  onPress={handleSendReply}
                  disabled={sendingReply}
                >
                  <Ionicons name="arrow-up" size={18} color={Colors.white} />
                </Pressable>
              )}
            </View>
          </View>
        </>
      )}
      </ResponsiveContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, flexWrap: 'wrap' },
  authorName: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  date: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans },
  body: { fontSize: 16, color: Colors.black, lineHeight: 26, fontFamily: Fonts!.sans },
  photos: { marginTop: 16, gap: 12 },
  photoContainer: { gap: 6 },
  photo: { width: '100%', height: 240, borderRadius: 8 },
  photoCaption: { fontSize: 14, color: Colors.darkGray, lineHeight: 20, fontFamily: Fonts!.sans },
  reactionsBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray, alignItems: 'center' },
  reactionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  reactionButtonActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  reactionCountActive: { color: Colors.white },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  commentBadgeText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  flagButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  flagText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
  ownerActions: { flexDirection: 'row', gap: 12 },
  ownerButton: { backgroundColor: Colors.black, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  ownerButtonText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  repliesHeader: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray, marginBottom: 12 },
  repliesTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  replyItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  replyAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  replyAuthorName: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  replyTime: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  replyContent: { fontSize: 15, color: Colors.black, lineHeight: 22, fontFamily: Fonts!.sans },
  replyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  replyButtonText: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray },
  replyingToLabel: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginBottom: 4 },
  replyingToBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: Colors.cream ?? '#f5f5f0', borderTopWidth: 1, borderTopColor: Colors.lightGray },
  replyingToBannerText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.darkGray },
  noReplies: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans, textAlign: 'center', paddingVertical: 20 },
  replyInputBar: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.lightGray, backgroundColor: Colors.white },
  desktopReplyInputBar: { paddingTop: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  replyInput: { flex: 1, minHeight: 32, maxHeight: 100, paddingVertical: 6, fontSize: 16, outlineStyle: 'none', fontFamily: Fonts!.sans, color: Colors.black } as any,
  sendBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginBottom: 2 },
  desktopTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  desktopManageRight: { flexDirection: 'row', gap: 8 },
  desktopBackBtn: { borderRadius: 8, overflow: 'hidden' },
  desktopBackInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  desktopBackBtnInner: { paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  desktopBackText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
});
