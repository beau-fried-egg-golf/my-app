import { useEffect, useMemo, useState } from 'react';
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
import * as Location from 'expo-location';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Course } from '@/types';
import { uploadPhoto } from '@/utils/photo';

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSortOrder, setCourseSortOrder] = useState<'alpha' | 'distance'>('alpha');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  function getCourseDistance(course: Course): number | null {
    if (!userLocation) return null;
    return getDistanceMiles(userLocation.lat, userLocation.lon, course.latitude, course.longitude);
  }

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    if (courseSearch.trim()) {
      const q = courseSearch.trim().toLowerCase();
      result = result.filter(c => c.short_name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    if (courseSortOrder === 'distance' && userLocation) {
      result.sort((a, b) => (getCourseDistance(a) ?? Infinity) - (getCourseDistance(b) ?? Infinity));
    } else {
      result.sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
    return result;
  }, [courses, courseSearch, courseSortOrder, userLocation]);

  if (!user) return null;

  const canSubmit = courseId && title.trim() && content.trim() && !submitting;
  const selectedCourse = courses.find((c) => c.id === courseId);

  const MAX_PHOTOS = 10;

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
          <Text style={styles.chevronText}>{showPicker ? '^' : 'v'}</Text>
        </Pressable>

        {showPicker && (
          <>
            <View style={styles.pickerToolbar}>
              <TextInput
                style={styles.courseSearchInput}
                value={courseSearch}
                onChangeText={setCourseSearch}
                placeholder="Search courses..."
                placeholderTextColor={Colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.pickerSortToggle}>
                <Pressable
                  style={[styles.pickerSortBtn, courseSortOrder === 'alpha' && styles.pickerSortBtnActive]}
                  onPress={() => setCourseSortOrder('alpha')}
                >
                  <Text style={[styles.pickerSortBtnText, courseSortOrder === 'alpha' && styles.pickerSortBtnTextActive]}>A-Z</Text>
                </Pressable>
                <Pressable
                  style={[styles.pickerSortBtn, courseSortOrder === 'distance' && styles.pickerSortBtnActive]}
                  onPress={() => setCourseSortOrder('distance')}
                >
                  <Text style={[styles.pickerSortBtnText, courseSortOrder === 'distance' && styles.pickerSortBtnTextActive]}>NEARBY</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView style={styles.courseList} nestedScrollEnabled>
              {filteredCourses.map((c) => {
                const dist = getCourseDistance(c);
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.courseOption, courseId === c.id && styles.courseOptionSelected]}
                    onPress={() => { setCourseId(c.id); setShowPicker(false); setCourseSearch(''); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courseOptionText, courseId === c.id && styles.courseOptionTextSelected]}>
                        {c.short_name}
                      </Text>
                      <Text style={[styles.courseOptionCity, courseId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>{c.city}</Text>
                    </View>
                    {dist != null && (
                      <Text style={[styles.courseOptionCity, courseId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>{Math.round(dist)} mi</Text>
                    )}
                  </Pressable>
                );
              })}
              {filteredCourses.length === 0 && (
                <View style={{ padding: 14, alignItems: 'center' }}>
                  <Text style={styles.courseOptionCity}>No courses found</Text>
                </View>
              )}
            </ScrollView>
          </>
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
  coursePickerText: { fontSize: 16, color: Colors.black, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium },
  placeholder: { color: Colors.gray, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular },
  pickerToolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  courseSearchInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontFamily: Fonts!.sans, color: Colors.black },
  pickerSortToggle: { flexDirection: 'row', gap: 4 },
  pickerSortBtn: { paddingHorizontal: 6, paddingVertical: 5 },
  pickerSortBtnActive: { backgroundColor: Colors.orange },
  pickerSortBtnText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, letterSpacing: 0.5 },
  pickerSortBtnTextActive: { color: Colors.black },
  courseList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 12, maxHeight: 250 },
  courseOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  courseOptionSelected: { backgroundColor: Colors.orange },
  courseOptionText: { fontSize: 15, color: Colors.black, fontFamily: Fonts!.sans },
  courseOptionTextSelected: { color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  courseOptionCity: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  field: { marginBottom: 12 },
  titleInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  contentInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.black, minHeight: 200, lineHeight: 24, fontFamily: Fonts!.sans },
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
  chevronText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.gray },
  submitButton: { backgroundColor: Colors.orange, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
});
