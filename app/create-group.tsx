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

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user, courses, createGroup } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [homeCourseId, setHomeCourseId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const canSubmit = name.trim() && !submitting;
  const selectedCourse = homeCourseId ? courses.find(c => c.id === homeCourseId) : null;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadPhoto(imageUri, user!.id);
      }

      await createGroup({
        name: name.trim(),
        description: description.trim(),
        home_course_id: homeCourseId,
        location_name: locationName.trim(),
        image: imageUrl,
      });
      router.back();
    } catch (e) {
      console.error('Failed to create group', e);
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.imageSection} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>ADD GROUP IMAGE</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Group Name"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <View style={styles.field}>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable style={styles.coursePicker} onPress={() => setShowPicker(!showPicker)}>
          <Text style={[styles.coursePickerText, !selectedCourse && styles.placeholder]}>
            {selectedCourse ? selectedCourse.short_name : 'Home Course (optional)'}
          </Text>
          <Text style={styles.chevronText}>{showPicker ? '^' : 'v'}</Text>
        </Pressable>

        {showPicker && (
          <ScrollView style={styles.courseList} nestedScrollEnabled>
            <Pressable
              style={[styles.courseOption, homeCourseId === null && styles.courseOptionSelected]}
              onPress={() => { setHomeCourseId(null); setShowPicker(false); }}
            >
              <Text style={[styles.courseOptionText, homeCourseId === null && styles.courseOptionTextSelected]}>None</Text>
            </Pressable>
            {courses.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.courseOption, homeCourseId === c.id && styles.courseOptionSelected]}
                onPress={() => { setHomeCourseId(c.id); setShowPicker(false); }}
              >
                <Text style={[styles.courseOptionText, homeCourseId === c.id && styles.courseOptionTextSelected]}>
                  {c.short_name}
                </Text>
                <Text style={styles.courseOptionCity}>{c.city}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.field}>
          <TextInput
            style={styles.locationInput}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Location (e.g. San Francisco, CA)"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Creating...' : 'Create Group'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 40 },
  imageSection: { alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: 120, height: 120, borderRadius: 12 },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    textAlign: 'center',
  },
  field: { marginBottom: 12 },
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    minHeight: 100,
    lineHeight: 24,
    fontFamily: Fonts!.sans,
  },
  coursePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  coursePickerText: { fontSize: 16, color: Colors.black, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium },
  placeholder: { color: Colors.gray, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular },
  chevronText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.gray },
  courseList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 12, maxHeight: 250 },
  courseOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  courseOptionSelected: { backgroundColor: Colors.orange },
  courseOptionText: { fontSize: 15, color: Colors.black, fontFamily: Fonts!.sans },
  courseOptionTextSelected: { color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  courseOptionCity: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  locationInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  submitButton: { backgroundColor: Colors.orange, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
});
