import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import type { TeeTimeSlot } from '@/types/experiences';
import TeeTimeRow from '@/components/experiences/TeeTimeRow';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function TeeTimesBrowse() {
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { experienceCourses, loadExperienceCourses, checkTeeTimeAvailability } = useExperienceStore();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<TeeTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadExperienceCourses();
  }, []);

  // Auto-select first course when courses load
  useEffect(() => {
    if (experienceCourses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(experienceCourses[0].id);
    }
  }, [experienceCourses]);

  // Load tee times when course or date changes
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) return;
    setLoadingSlots(true);
    checkTeeTimeAvailability(selectedCourseId, selectedDate)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [selectedCourseId, selectedDate]);

  const selectedCourse = experienceCourses.find(c => c.id === selectedCourseId);

  // Generate next 7 days for date picker
  const dates: { label: string; value: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = d.getDate();
    dates.push({ label: `${dayName}\n${dateNum}`, value });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <LetterSpacedHeader text="TEE TIMES" size={32} variant="experiences" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Course selector */}
        {experienceCourses.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseScroll}>
            {experienceCourses.map(course => (
              <Pressable
                key={course.id}
                style={[styles.courseCard, selectedCourseId === course.id && styles.courseCardActive]}
                onPress={() => setSelectedCourseId(course.id)}
              >
                {course.fe_hero_image ? (
                  <Image source={{ uri: course.fe_hero_image }} style={styles.courseImage} />
                ) : (
                  <View style={[styles.courseImage, styles.courseImagePlaceholder]}>
                    <Ionicons name="golf-outline" size={20} color={Colors.gray} />
                  </View>
                )}
                <View style={styles.courseCardInfo}>
                  <Text style={[styles.courseCardName, selectedCourseId === course.id && styles.courseCardNameActive]} numberOfLines={1}>
                    {course.name}
                  </Text>
                  {course.city && course.state && (
                    <Text style={styles.courseCardLocation} numberOfLines={1}>{course.city}, {course.state}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Selected course info */}
        {selectedCourse && experienceCourses.length === 1 && (
          <View style={styles.singleCourseHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseName}>{selectedCourse.name}</Text>
              {selectedCourse.city && selectedCourse.state && (
                <Text style={styles.courseLocation}>{selectedCourse.city}, {selectedCourse.state}</Text>
              )}
            </View>
            {selectedCourse.location_name && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>{selectedCourse.location_name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Date picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {dates.map(d => (
            <Pressable
              key={d.value}
              style={[styles.dateChip, selectedDate === d.value && styles.dateChipActive]}
              onPress={() => setSelectedDate(d.value)}
            >
              <Text style={[styles.dateChipText, selectedDate === d.value && styles.dateChipTextActive]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tee time slots */}
        <View style={styles.slotsSection}>
          {loadingSlots ? (
            <Text style={styles.emptyText}>Loading tee times...</Text>
          ) : slots.length > 0 ? (
            slots.map(slot => (
              <TeeTimeRow
                key={slot.id}
                slot={slot}
                onSelect={() => router.push({
                  pathname: '/(experiences)/book-tee-time',
                  params: { courseId: selectedCourseId, slotId: slot.id, date: selectedDate },
                })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="golf-outline" size={40} color={Colors.lightGray} />
              <Text style={styles.emptyTitle}>No tee times available</Text>
              <Text style={styles.emptySubtitle}>Try selecting a different date or course</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 100 },

  // Course selector
  courseScroll: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  courseCard: {
    width: 160, borderRadius: 10, backgroundColor: Colors.lightGray, overflow: 'hidden',
  },
  courseCardActive: {
    borderWidth: 2, borderColor: Colors.black,
  },
  courseImage: { width: '100%', height: 80 },
  courseImagePlaceholder: { backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  courseCardInfo: { padding: 10 },
  courseCardName: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  courseCardNameActive: { color: Colors.black },
  courseCardLocation: { fontSize: 11, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },

  // Single course header
  singleCourseHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, gap: 12,
  },
  courseName: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  courseLocation: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  locationBadge: {
    backgroundColor: Colors.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  locationBadgeText: { fontSize: 12, fontFamily: Fonts!.sansMedium, color: Colors.darkGray },

  // Date picker
  dateScroll: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  dateChip: {
    width: 64, height: 64, borderRadius: 12, backgroundColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  dateChipActive: { backgroundColor: Colors.black },
  dateChipText: {
    fontSize: 12, fontFamily: Fonts!.sansMedium, color: Colors.darkGray, textAlign: 'center', lineHeight: 16,
  },
  dateChipTextActive: { color: Colors.white },

  // Slots
  slotsSection: { marginTop: 16 },
  emptyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, textAlign: 'center', paddingVertical: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  emptySubtitle: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
});
