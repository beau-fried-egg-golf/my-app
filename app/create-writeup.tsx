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
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';
import { uploadPhoto } from '@/utils/photo';

interface PhotoDraft {
  uri: string;
  caption: string;
}

export default function CreateWriteupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const { user, courses, addWriteup } = useStore();
  const [courseId, setCourseId] = useState<string | null>(params.courseId ?? null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const canSubmit = courseId && title.trim() && content.trim() && !submitting;
  const selectedCourse = courses.find((c) => c.id === courseId);

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.map((a) => ({ uri: a.uri, caption: '' }));
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
      // Upload photos to Supabase Storage
      const uploadedPhotos = await Promise.all(
        photos.map(async (p) => ({
          url: await uploadPhoto(p.uri, user!.id),
          caption: p.caption.trim(),
        })),
      );

      await addWriteup({
        courseId: courseId!,
        title: title.trim(),
        content: content.trim(),
        photos: uploadedPhotos,
      });
      router.back();
    } catch (e) {
      console.error('Failed to create writeup', e);
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.coursePicker} onPress={() => setShowPicker(!showPicker)}>
          <Text style={[styles.coursePickerText, !selectedCourse && styles.placeholder]}>
            {selectedCourse ? selectedCourse.short_name : 'Select a course'}
          </Text>
          <Ionicons
            name={showPicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.gray}
          />
        </Pressable>

        {showPicker && (
          <ScrollView style={styles.courseList} nestedScrollEnabled>
            {courses.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.courseOption, courseId === c.id && styles.courseOptionSelected]}
                onPress={() => {
                  setCourseId(c.id);
                  setShowPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.courseOptionText,
                    courseId === c.id && styles.courseOptionTextSelected,
                  ]}
                >
                  {c.short_name}
                </Text>
                <Text style={styles.courseOptionCity}>{c.city}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.field}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <View style={styles.field}>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write about your experience..."
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.photosSection}>
          <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
            <Ionicons name="camera-outline" size={20} color={Colors.black} />
            <Text style={styles.addPhotoText}>Add Photos</Text>
          </Pressable>
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
                />
                <Pressable style={styles.removePhoto} onPress={() => removePhoto(i)}>
                  <Ionicons name="close-circle" size={22} color={Colors.black} />
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
          <Text style={styles.submitButtonText}>{submitting ? 'Publishing...' : 'Publish'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 40 },
  coursePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12 },
  coursePickerText: { fontSize: 16, color: Colors.black, fontWeight: '500' },
  placeholder: { color: Colors.gray, fontWeight: '400' },
  courseList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 12, maxHeight: 250 },
  courseOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  courseOptionSelected: { backgroundColor: Colors.black },
  courseOptionText: { fontSize: 15, color: Colors.black },
  courseOptionTextSelected: { color: Colors.white, fontWeight: '600' },
  courseOptionCity: { fontSize: 12, color: Colors.gray },
  field: { marginBottom: 12 },
  titleInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '600', color: Colors.black },
  contentInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.black, minHeight: 200, lineHeight: 24 },
  photosSection: { marginBottom: 24, gap: 12 },
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addPhotoText: { fontSize: 15, fontWeight: '500', color: Colors.black },
  photoItem: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 8 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoThumb: { width: 72, height: 72, borderRadius: 6 },
  captionInput: { flex: 1, fontSize: 14, color: Colors.black, paddingVertical: 4, lineHeight: 20 },
  removePhoto: { alignSelf: 'flex-start' },
  submitButton: { backgroundColor: Colors.black, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
