import { useEffect, useState } from 'react';
import {
  Alert,
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
import WordHighlight from '@/components/WordHighlight';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

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
  } = useStore();

  const writeup = writeups.find((w) => w.id === id);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPhotos, setEditPhotos] = useState<EditPhoto[]>([]);

  const [replies, setReplies] = useState<WriteupReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (id) {
      getWriteupReplies(id).then(setReplies);
    }
  }, [id]);

  if (!writeup) return null;

  const course = courses.find((c) => c.id === writeup.course_id);
  const isOwner = user?.id === writeup.user_id;
  const authorName = writeup.author_name ?? getUserName(writeup.user_id);
  const authorParts = authorName.split(' ').filter(Boolean);

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

  function handleDelete() {
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

  function handleFlag() {
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

  async function handleSendReply() {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const reply = await addWriteupReply(writeup!.id, replyText.trim());
      setReplies(prev => [...prev, reply]);
      setReplyText('');
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

  const visiblePhotos = writeup.photos.filter((p) => !p.hidden);

  const headerContent = (
    <>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>{'<'}</Text>
        </Pressable>
        <LetterSpacedHeader text="REVIEW" size={32} />
      </View>
      <Pressable onPress={() => router.push(`/course/${writeup.course_id}`)}>
        <Text style={styles.courseName}>{course?.short_name?.toUpperCase()}</Text>
      </Pressable>

      <Text style={styles.title}>{writeup.title}</Text>

      <View style={styles.authorRow}>
        <WordHighlight words={authorParts} size={12} />
        <Text style={styles.date}> · {formatDate(writeup.created_at)}</Text>
      </View>

      <Text style={styles.body}>{writeup.content}</Text>

      {visiblePhotos.length > 0 && (
        <View style={styles.photos}>
          {visiblePhotos.map((photo) => {
            const photoUpvoted = photo.user_has_upvoted ?? false;
            return (
              <View key={photo.id} style={styles.photoContainer}>
                <Image source={{ uri: photo.url }} style={styles.photo} />
                {photo.caption ? (
                  <Text style={styles.photoCaption}>{photo.caption}</Text>
                ) : null}
                <View style={styles.photoActions}>
                  <Pressable
                    style={[styles.photoUpvote, photoUpvoted && styles.photoUpvoteActive]}
                    onPress={() => togglePhotoUpvote(photo.id)}
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
          const count = writeup.reactions[key] ?? 0;
          return (
            <Pressable
              key={key}
              style={[styles.reactionButton, active && styles.reactionButtonActive]}
              onPress={() => toggleWriteupReaction(writeup.id, key)}
            >
              <Text style={styles.reactionEmoji}>{REACTION_EMOJI[key]}</Text>
              {count > 0 && (
                <Text style={[styles.reactionCount, active && styles.reactionCountActive]}>{count}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
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
      <FlatList
        data={replies}
        keyExtractor={item => item.id}
        ListHeaderComponent={headerContent}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const replyAuthorParts = (item.author_name ?? 'Member').split(' ').filter(Boolean);
          return (
            <View style={styles.replyItem}>
              <View style={styles.replyAuthorRow}>
                <WordHighlight words={replyAuthorParts} size={11} />
                <Text style={styles.replyTime}> · {formatTime(item.created_at)}</Text>
              </View>
              <Text style={styles.replyContent}>{item.content}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.noReplies}>No replies yet. Be the first!</Text>
        }
      />
      <View style={styles.replyInputBar}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  backArrow: { paddingRight: 12, paddingTop: 4 },
  backArrowText: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  courseName: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.gray, letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, lineHeight: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 20, flexWrap: 'wrap' },
  date: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans },
  body: { fontSize: 16, color: Colors.black, lineHeight: 26, fontFamily: Fonts!.sans },
  photos: { marginTop: 20, gap: 16 },
  photoContainer: { gap: 6 },
  photo: { width: '100%', height: 240, borderRadius: 8 },
  photoCaption: { fontSize: 14, color: Colors.darkGray, lineHeight: 20, fontFamily: Fonts!.sans },
  photoActions: { flexDirection: 'row' },
  photoUpvote: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  photoUpvoteActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  photoUpvoteText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  photoUpvoteTextActive: { color: Colors.white },
  reactionsBar: { flexDirection: 'row', gap: 8, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  reactionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  reactionButtonActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  reactionCountActive: { color: Colors.white },
  actions: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flagButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  flagText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
  ownerActions: { flexDirection: 'row', gap: 12 },
  ownerButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, borderRadius: 6 },
  ownerButtonText: { fontSize: 13, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  repliesHeader: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.lightGray, marginBottom: 12 },
  repliesTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  replyItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  replyAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  replyTime: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  replyContent: { fontSize: 15, color: Colors.black, lineHeight: 22, fontFamily: Fonts!.sans },
  noReplies: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans, textAlign: 'center', paddingVertical: 20 },
  replyInputBar: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.lightGray, backgroundColor: Colors.white },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  replyInput: { flex: 1, minHeight: 32, maxHeight: 100, paddingVertical: 6, fontSize: 15, outlineColor: 'transparent', fontFamily: Fonts!.sans, color: Colors.black },
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
  editCaptionInput: { flex: 1, fontSize: 14, color: Colors.black, paddingVertical: 4, lineHeight: 20, fontFamily: Fonts!.sans },
  editRemovePhoto: { alignSelf: 'flex-start' },
  removeText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
});
