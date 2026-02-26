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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { uploadPhoto } from '@/utils/photo';
import { useStore } from '@/data/store';
import { supabase } from '@/data/supabase';
import { Course } from '@/types';

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

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, saveUser, courses } = useStore();
  const [image, setImage] = useState<string | null>(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [handicap, setHandicap] = useState('');
  const [homeCourseId, setHomeCourseId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
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

  const selectedCourse = homeCourseId ? courses.find(c => c.id === homeCourseId) : null;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0] && user) {
      const url = await uploadPhoto(result.assets[0].uri, user.id);
      setImage(url);
    }
  }

  async function handleCreate() {
    if (!user) return;
    await saveUser({
      ...user,
      image,
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      handicap: handicap ? parseFloat(handicap) : null,
      homeCourseId,
    });
    supabase.functions.invoke('send-welcome-email', { body: { user_id: user.id } }).catch(() => {});
    router.replace('/welcome');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Just a few more details to set up your account</Text>
        </View>

        <Pressable style={styles.avatarSection} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={Colors.gray} />
            </View>
          )}
          <Text style={styles.changePhotoText}>Add Photo</Text>
        </Pressable>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="e.g. 123 Main St"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. San Francisco"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="e.g. CA"
                placeholderTextColor={Colors.gray}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Zip</Text>
              <TextInput
                style={styles.input}
                value={zip}
                onChangeText={setZip}
                placeholder="e.g. 94102"
                placeholderTextColor={Colors.gray}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Handicap</Text>
            <TextInput
              style={styles.input}
              value={handicap}
              onChangeText={setHandicap}
              placeholder="e.g. 12.4"
              placeholderTextColor={Colors.gray}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Home Course</Text>
            <Pressable style={styles.coursePicker} onPress={() => setShowPicker(!showPicker)}>
              <Text style={[styles.coursePickerText, !selectedCourse && styles.placeholder]}>
                {selectedCourse ? selectedCourse.short_name : 'Select Home Course'}
              </Text>
              <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.gray} />
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
          </View>

        </View>

        <Pressable
          style={[styles.button, !homeCourseId && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!homeCourseId}
        >
          <Text style={styles.buttonText}>Save Profile</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.black,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 4,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 8,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  field: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
  },
  button: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
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
  coursePickerText: { fontSize: 16, color: Colors.black },
  placeholder: { color: Colors.gray },

  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  courseSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: Colors.black,
    outlineStyle: 'none',
  } as any,
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
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: 0.5,
  },
  pickerSortBtnTextActive: {
    color: Colors.black,
  },
  courseList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginTop: 6, maxHeight: 250 },
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
  courseOptionText: { fontSize: 15, color: Colors.black },
  courseOptionTextSelected: { color: Colors.white, fontWeight: '700' },
  courseOptionCity: { fontSize: 12, color: Colors.gray },
});
