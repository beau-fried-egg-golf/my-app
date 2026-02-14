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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
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

export default function CreateGroupScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const { user, courses, groups, createGroup, updateGroup } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [homeCourseId, setHomeCourseId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSortOrder, setCourseSortOrder] = useState<'alpha' | 'distance'>('alpha');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const isEditing = !!groupId;

  // Load existing group data when editing
  useEffect(() => {
    if (!groupId) return;
    const existing = groups.find(g => g.id === groupId);
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description ?? '');
    setHomeCourseId(existing.home_course_id);
    setLocationName(existing.location_name ?? '');
    setExistingImageUrl(existing.image);
  }, [groupId]);

  // Dynamic header title
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{ fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, letterSpacing: 3 }}>
          {isEditing ? 'EDIT GROUP' : 'NEW GROUP'}
        </Text>
      ),
    });
  }, [isEditing, navigation]);

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

  const canSubmit = name.trim() && !submitting;
  const selectedCourse = homeCourseId ? courses.find(c => c.id === homeCourseId) : null;
  const displayImage = imageUri ?? existingImageUrl;

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
      let imageUrl: string | null = existingImageUrl;
      if (imageUri) {
        imageUrl = await uploadPhoto(imageUri, user!.id);
      }

      const groupPayload = {
        name: name.trim(),
        description: description.trim(),
        home_course_id: homeCourseId,
        location_name: locationName.trim(),
        image: imageUrl,
      };

      if (isEditing) {
        await updateGroup(groupId!, groupPayload);
      } else {
        await createGroup(groupPayload);
      }
      router.back();
    } catch (e) {
      console.error(isEditing ? 'Failed to update group' : 'Failed to create group', e);
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
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.imagePreview} />
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
              <Pressable
                style={[styles.courseOption, homeCourseId === null && styles.courseOptionSelected]}
                onPress={() => { setHomeCourseId(null); setShowPicker(false); setCourseSearch(''); }}
              >
                <Text style={[styles.courseOptionText, homeCourseId === null && styles.courseOptionTextSelected]}>None</Text>
              </Pressable>
              {filteredCourses.map((c) => {
                const dist = getCourseDistance(c);
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.courseOption, homeCourseId === c.id && styles.courseOptionSelected]}
                    onPress={() => { setHomeCourseId(c.id); setShowPicker(false); setCourseSearch(''); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courseOptionText, homeCourseId === c.id && styles.courseOptionTextSelected]}>
                        {c.short_name}
                      </Text>
                      <Text style={[styles.courseOptionCity, homeCourseId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>{c.city}</Text>
                    </View>
                    {dist != null && (
                      <Text style={[styles.courseOptionCity, homeCourseId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>{Math.round(dist)} mi</Text>
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
          <Text style={styles.submitButtonText}>
            {submitting
              ? (isEditing ? 'Saving...' : 'Creating...')
              : (isEditing ? 'Save Changes' : 'Create Group')}
          </Text>
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
  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  courseSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  pickerSortToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  pickerSortBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  pickerSortBtnActive: {
    backgroundColor: Colors.orange,
  },
  pickerSortBtnText: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  pickerSortBtnTextActive: {
    color: Colors.black,
  },
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
