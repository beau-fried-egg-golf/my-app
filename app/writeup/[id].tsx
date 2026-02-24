import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Photo, WriteupReply } from '@/types';
import { uploadPhoto } from '@/utils/photo';
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

function DesktopShareButton({ onPress }: { onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackInner}>
        <Ionicons name="share-outline" size={16} color={Colors.black} />
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>SHARE</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>SHARE</Text>
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

interface EditPhoto {
  id?: string;
  url: string;
  caption: string;
}

export default function WriteupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    writeups,
    courses,
    user,
    getUserName,
    toggleWriteupReaction,
    togglePhotoUpvote,
    updateWriteup,
    deleteWriteup,
    flagContent,
    getWriteupReplies,
    addWriteupReply,
    isPaidMember,
    setShowUpgradeModal,
  } = useStore();

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
  const writeup = writeups.find((w) => w.id === id);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPhotos, setEditPhotos] = useState<EditPhoto[]>([]);

  const [replies, setReplies] = useState<WriteupReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<WriteupReply | null>(null);

  useEffect(() => {
    if (id) {
      getWriteupReplies(id).then(setReplies);
    }
  }, [id]);

  if (!writeup) return null;

  const course = courses.find((c) => c.id === writeup.course_id);
  const isOwner = user?.id === writeup.user_id;
  const authorName = writeup.author_name ?? getUserName(writeup.user_id);

  function startEditing() {
    setEditTitle(writeup!.title);
    setEditContent(writeup!.content);
    setEditPhotos(writeup!.photos.map(p => ({ id: p.id, url: p.url, caption: p.caption })));
    setEditing(true);
  }

  async function saveEdit() {
    if (!editTitle.trim() || !editContent.trim()) return;
    await updateWriteup(writeup!.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      photos: editPhotos,
    });
    setEditing(false);
  }

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos: EditPhoto[] = await Promise.all(
        result.assets.map(async (a) => ({
          url: await uploadPhoto(a.uri, user!.id),
          caption: '',
        })),
      );
      setEditPhotos([...editPhotos, ...newPhotos]);
    }
  }

  async function handleDelete() {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to delete this review?')) return;
      await deleteWriteup(writeup!.id);
      router.back();
    } else {
      Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWriteup(writeup!.id);
            router.back();
          },
        },
      ]);
    }
  }

  function handleShare() {
    if (!isPaidMember) { setShowUpgradeModal(true); return; }
    const description = course?.short_name
      ? `${writeup!.title} - ${course.short_name}`
      : writeup!.title;
    const image = visiblePhotos.length > 0 ? visiblePhotos[0].url : '';
    router.push({
      pathname: '/create-post',
      params: {
        shareType: 'writeup',
        shareId: writeup!.id,
        shareTitle: writeup!.title,
        shareDescription: description,
        shareImage: image,
      },
    });
  }

  function handleFlag() {
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to flag this review as inappropriate?')) return;
      flagContent('writeup', writeup!.id);
    } else {
      Alert.alert('Flag Review', 'Are you sure you want to flag this review as inappropriate?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag',
          style: 'destructive',
          onPress: async () => {
            await flagContent('writeup', writeup!.id);
          },
        },
      ]);
    }
  }

  function buildReplyTree(flat: WriteupReply[]) {
    const topLevel = flat.filter(r => !r.parent_id);
    const children = new Map<string, WriteupReply[]>();
    for (const r of flat) {
      if (r.parent_id) {
        const arr = children.get(r.parent_id) || [];
        arr.push(r);
        children.set(r.parent_id, arr);
      }
    }
    const result: { reply: WriteupReply; depth: number }[] = [];
    for (const r of topLevel) {
      result.push({ reply: r, depth: 0 });
      for (const child of children.get(r.id) || []) {
        result.push({ reply: child, depth: 1 });
      }
    }
    return result;
  }

  async function handleSendReply() {
    if (!isPaidMember) { setShowUpgradeModal(true); return; }
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const reply = await addWriteupReply(writeup!.id, replyText.trim(), replyingTo?.id);
      setReplies(prev => [...prev, reply]);
      setReplyText('');
      setReplyingTo(null);
    } catch (e) {
      console.error('Failed to add reply', e);
    } finally {
      setSendingReply(false);
    }
  }

  if (editing) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.editHeader}>
            <Pressable onPress={() => setEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdit}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.editTitleInput}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Title"
            placeholderTextColor={Colors.gray}
          />

          <TextInput
            style={styles.editContentInput}
            value={editContent}
            onChangeText={setEditContent}
            placeholder="Content"
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.editPhotosSection}>
            <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
              <Text style={styles.addPhotoText}>ADD PHOTOS</Text>
            </Pressable>
            {editPhotos.map((photo, i) => (
              <View key={i} style={styles.editPhotoItem}>
                <View style={styles.editPhotoRow}>
                  <Image source={{ uri: photo.url }} style={styles.editPhotoThumb} />
                  <TextInput
                    style={styles.editCaptionInput}
                    value={photo.caption}
                    onChangeText={(text) =>
                      setEditPhotos(editPhotos.map((p, idx) => (idx === i ? { ...p, caption: text } : p)))
                    }
                    placeholder="Description..."
                    placeholderTextColor={Colors.gray}
                    multiline
                  />
                  <Pressable
                    style={styles.editRemovePhoto}
                    onPress={() => setEditPhotos(editPhotos.filter((_, idx) => idx !== i))}
                  >
                    <Text style={styles.removeText}>x</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Set<string>>(new Set());
  const visiblePhotos = writeup.photos.filter((p) => !p.hidden && !brokenPhotoIds.has(p.id));

  const headerContent = (
    <>
      <Pressable onPress={() => router.push(`/course/${writeup.course_id}`)}>
        <Text style={styles.courseName}>{course?.short_name?.toUpperCase()}</Text>
      </Pressable>

      <Text style={styles.title}>{writeup.title}</Text>

      <View style={styles.authorRow}>
        <Pressable onPress={() => router.push(`/member/${writeup.user_id}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.authorName}>{authorName}</Text>
          {writeup.author_verified && <VerifiedBadge size={14} />}
        </Pressable>
        <Text style={styles.date}> · {formatDate(writeup.created_at)}</Text>
      </View>

      <Text style={styles.body}>{writeup.content}</Text>

      {visiblePhotos.length > 0 && (
        <View style={styles.photos}>
          {visiblePhotos.map((photo) => {
            const photoUpvoted = photo.user_has_upvoted ?? false;
            return (
              <View key={photo.id} style={styles.photoContainer}>
                <AutoImage
                  uri={photo.url}
                  onError={() => setBrokenPhotoIds(prev => new Set(prev).add(photo.id))}
                />
                {photo.caption ? (
                  <Text style={styles.photoCaption}>{photo.caption}</Text>
                ) : null}
                <View style={styles.photoActions}>
                  <Pressable
                    style={[styles.photoUpvote, photoUpvoted && styles.photoUpvoteActive]}
                    onPress={() => { if (!isPaidMember) { setShowUpgradeModal(true); return; } togglePhotoUpvote(photo.id); }}
                  >
                    <Text style={styles.reactionEmoji}>{'\uD83D\uDC4D'}</Text>
                    <Text style={[styles.photoUpvoteText, photoUpvoted && styles.photoUpvoteTextActive]}>
                      {photo.upvote_count ?? 0}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.reactionsBar}>
        {REACTION_KEYS.map(key => {
          const active = writeup.user_reactions.includes(key);
          const reactorIds = writeup.reactions[key] ?? [];
          const count = reactorIds.length;
          return (
            <ReactionTooltip
              key={key}
              userIds={reactorIds}
              getUserName={getUserName}
              onPress={() => { if (!isPaidMember) { setShowUpgradeModal(true); return; } toggleWriteupReaction(writeup.id, key); }}
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
          <Text style={styles.commentBadgeText}>{writeup.reply_count} {writeup.reply_count === 1 ? 'comment' : 'comments'}</Text>
        </View>
      </View>

      {isDesktop ? (
        <View style={styles.desktopActionsRow}>
          <DesktopShareButton onPress={handleShare} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.flagButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={14} color={Colors.gray} />
            <Text style={styles.flagText}>Share</Text>
          </Pressable>

          {!isOwner && (
            <Pressable style={styles.flagButton} onPress={handleFlag}>
              <Ionicons name="flag-outline" size={14} color={Colors.gray} />
              <Text style={styles.flagText}>Flag</Text>
            </Pressable>
          )}

          {isOwner && (
            <View style={styles.ownerActions}>
              <Pressable style={styles.ownerButton} onPress={startEditing}>
                <Text style={styles.ownerButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.ownerButton} onPress={handleDelete}>
                <Text style={styles.ownerButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

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
              <DesktopBackStyleButton label="EDIT" onPress={startEditing} />
              <DesktopBackStyleButton label="DELETE" onPress={handleDelete} />
            </View>
          )}
        </View>
      ) : (
        <DetailHeader title="REVIEW" />
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
              {depth === 0 && (
                <Pressable style={styles.replyButton} onPress={() => setReplyingTo(reply)}>
                  <Ionicons name="arrow-undo-outline" size={14} color={Colors.gray} />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </Pressable>
              )}
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
                placeholder={isPaidMember ? "Write a reply..." : "Join FEGC to reply"}
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
                placeholder={isPaidMember ? "Write a reply..." : "Join FEGC to reply"}
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

function AutoImage({ uri, onError }: { uri: string; onError?: () => void }) {
  const [ratio, setRatio] = useState(16 / 10);
  useEffect(() => {
    Image.getSize(uri, (w, h) => { if (w && h) setRatio(w / h); });
  }, [uri]);
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', aspectRatio: ratio, borderRadius: 8 }}
      onError={onError}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 16 },
  courseName: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.gray, letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, lineHeight: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 20, flexWrap: 'wrap' },
  authorName: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  date: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans },
  body: { fontSize: 16, color: Colors.black, lineHeight: 26, fontFamily: Fonts!.sans },
  photos: { marginTop: 20, gap: 16 },
  photoContainer: { gap: 6 },
  photo: { width: '100%', borderRadius: 8 },
  photoCaption: { fontSize: 14, color: Colors.darkGray, lineHeight: 20, fontFamily: Fonts!.sans },
  photoActions: { flexDirection: 'row' },
  photoUpvote: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  photoUpvoteActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  photoUpvoteText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  photoUpvoteTextActive: { color: Colors.white },
  reactionsBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray, alignItems: 'center' },
  reactionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  reactionButtonActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  reactionCountActive: { color: Colors.white },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  commentBadgeText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
  actions: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cancelText: { fontSize: 16, color: Colors.gray, fontFamily: Fonts!.sans },
  saveText: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  editTitleInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },
  editContentInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.black, minHeight: 200, lineHeight: 24, marginBottom: 12, fontFamily: Fonts!.sans },
  editPhotosSection: { marginBottom: 24, gap: 12 },
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addPhotoText: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  editPhotoItem: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 8 },
  editPhotoRow: { flexDirection: 'row', gap: 10 },
  editPhotoThumb: { width: 72, height: 72, borderRadius: 6 },
  editCaptionInput: { flex: 1, fontSize: 16, color: Colors.black, paddingVertical: 4, lineHeight: 20, fontFamily: Fonts!.sans, outlineStyle: 'none' } as any,
  editRemovePhoto: { alignSelf: 'flex-start' },
  removeText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  desktopTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  desktopManageRight: { flexDirection: 'row', gap: 8 },
  desktopActionsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  desktopBackBtn: { borderRadius: 8, overflow: 'hidden' },
  desktopBackInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  desktopBackBtnInner: { paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  desktopBackText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
});
