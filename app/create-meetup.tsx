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
import { useRouter } from 'expo-router';
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

export default function CreateMeetupScreen() {
  const router = useRouter();
  const { user, courses, createMeetup } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [meetupDate, setMeetupDate] = useState('');
  const [cost, setCost] = useState('Free');
  const [totalSlots, setTotalSlots] = useState('4');
  const [hostTakesSlot, setHostTakesSlot] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
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

  const selectedCourse = courseId ? courses.find(c => c.id === courseId) : null;
  const canSubmit = name.trim() && courseId && meetupDate && !submitting;

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
    if (!canSubmit || !selectedCourse) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadPhoto(imageUri, user!.id);
      }

      await createMeetup({
        name: name.trim(),
        description: description.trim(),
        course_id: courseId,
        location_name: selectedCourse.short_name,
        meetup_date: new Date(meetupDate).toISOString(),
        cost: cost.trim() || 'Free',
        total_slots: parseInt(totalSlots, 10) || 4,
        host_takes_slot: hostTakesSlot,
        image: imageUrl,
      });
      router.back();
    } catch (e) {
      console.error('Failed to create meetup', e);
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
              <Text style={styles.imagePlaceholderText}>ADD IMAGE</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Meetup Name *</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Saturday Morning Round"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What's the plan? (optional)"
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Course *</Text>
          <Pressable style={styles.coursePicker} onPress={() => setShowPicker(!showPicker)}>
            <Text style={[styles.coursePickerText, !selectedCourse && styles.placeholder]}>
              {selectedCourse ? selectedCourse.short_name : 'Select a course'}
            </Text>
            <Text style={styles.chevronText}>{showPicker ? '^' : 'v'}</Text>
          </Pressable>
        </View>

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
                  <Text style={[styles.pickerSortBtnText, courseSortOrder === 'distance' && styles.pickerSortBtnTextActive]}>NEAR</Text>
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
          <Text style={styles.fieldLabel}>Date & Time *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={meetupDate}
              onChange={(e: any) => setMeetupDate(e.target.value)}
              style={{
                border: `1px solid ${Colors.border}`,
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 16,
                fontFamily: Fonts!.sans,
                color: Colors.black,
                width: '100%',
                boxSizing: 'border-box' as const,
              }}
            />
          ) : (
            <TextInput
              style={styles.textInput}
              value={meetupDate}
              onChangeText={setMeetupDate}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={Colors.gray}
            />
          )}
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.fieldLabel}>Cost</Text>
            <TextInput
              style={styles.textInput}
              value={cost}
              onChangeText={setCost}
              placeholder="e.g. Free, $25"
              placeholderTextColor={Colors.gray}
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.fieldLabel}>Total Spots</Text>
            <TextInput
              style={styles.textInput}
              value={totalSlots}
              onChangeText={setTotalSlots}
              placeholder="4"
              placeholderTextColor={Colors.gray}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Host takes a spot</Text>
          <Pressable
            style={[styles.toggleTrack, hostTakesSlot && styles.toggleTrackOn]}
            onPress={() => setHostTakesSlot(!hostTakesSlot)}
          >
            <View style={[styles.toggleThumb, hostTakesSlot && styles.toggleThumbOn]} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Creating...' : 'Create Meetup'}</Text>
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
  fieldLabel: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
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
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts!.sans,
    color: Colors.black,
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
  fieldRow: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: Colors.orange,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  submitButton: { backgroundColor: Colors.orange, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
});
