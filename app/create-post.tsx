import { useState } from 'react';
import {
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { uploadPhoto } from '@/utils/photo';

interface PhotoDraft {
  uri: string;
  caption: string;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { user, addPost } = useStore();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const canSubmit = content.trim() && !submitting;

  const MAX_PHOTOS = 5;

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.slice(0, remaining).map((a) => ({ uri: a.uri, caption: '' }));
      setPhotos([...photos, ...newPhotos]);
    }
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  function updateCaption(index: number, caption: string) {
    setPhotos(photos.map((p, i) => (i === index ? { ...p, caption } : p)));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const uploadedPhotos = await Promise.all(
        photos.map(async (p) => ({
          url: await uploadPhoto(p.uri, user!.id),
          caption: p.caption.trim(),
        })),
      );

      await addPost({
        content: content.trim(),
        photos: uploadedPhotos,
      });
      router.back();
    } catch (e) {
      console.error('Failed to create post', e);
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        <View style={styles.photosSection}>
          {photos.length < MAX_PHOTOS && (
            <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
              <Text style={styles.addPhotoText}>ADD PHOTOS ({photos.length}/{MAX_PHOTOS})</Text>
            </Pressable>
          )}
          {photos.length >= MAX_PHOTOS && (
            <Text style={styles.photoLimitText}>Photo limit reached ({MAX_PHOTOS}/{MAX_PHOTOS})</Text>
          )}
          {photos.map((photo, i) => (
            <View key={i} style={styles.photoItem}>
              <View style={styles.photoRow}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <TextInput
                  style={styles.captionInput}
                  value={photo.caption}
                  onChangeText={(text) => updateCaption(i, text)}
                  placeholder="Add a description..."
                  placeholderTextColor={Colors.gray}
                  multiline
                  maxLength={200}
                />
                <Pressable style={styles.removePhoto} onPress={() => removePhoto(i)}>
                  <Text style={styles.removeText}>x</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Posting...' : 'Post'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 12 },
  contentInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.black, minHeight: 160, lineHeight: 24, fontFamily: Fonts!.sans },
  photosSection: { marginBottom: 24, gap: 12 },
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addPhotoText: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  photoItem: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 8 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoThumb: { width: 72, height: 72, borderRadius: 6 },
  captionInput: { flex: 1, fontSize: 14, color: Colors.black, paddingVertical: 4, lineHeight: 20, fontFamily: Fonts!.sans },
  removePhoto: { alignSelf: 'flex-start' },
  removeText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  photoLimitText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, paddingVertical: 8 },
  submitButton: { backgroundColor: Colors.orange, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
});
