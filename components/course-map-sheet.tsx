import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { Course } from '@/types';
import WordHighlight from '@/components/WordHighlight';

interface CourseMapSheetProps {
  course: Course;
  writeupCount: number;
  distance: number | null;
  onClose: () => void;
}

export default function CourseMapSheet({ course, writeupCount, distance, onClose }: CourseMapSheetProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>x</Text>
      </Pressable>

      <Pressable style={styles.body} onPress={() => router.push(`/course/${course.id}`)}>
        <View style={styles.courseHeader}>
          <View style={styles.courseInfo}>
            <WordHighlight words={course.short_name.split(' ')} size={16} />
            <Text style={styles.courseCity}>{course.city}</Text>
          </View>
          <View style={styles.courseMeta}>
            {distance !== null ? (
              <Text style={styles.distanceText}>{Math.round(distance)} mi</Text>
            ) : (
              <Text style={styles.distanceText}>--</Text>
            )}
          </View>
        </View>
        <View style={styles.courseStats}>
          <View style={styles.statItem}>
            <Text style={styles.statText}>
              {writeupCount} review{writeupCount !== 1 ? 's' : ''}
            </Text>
            {!!course.fe_profile_url && (
              <Text style={styles.feBlurb}> · Has a Fried Egg course profile</Text>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
  },
  body: {
    gap: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingRight: 20,
  },
  courseInfo: {
    flex: 1,
  },
  courseCity: {
    fontSize: 13,
    color: Colors.black,
    marginTop: 6,
    fontFamily: Fonts!.sans,
  },
  courseMeta: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  courseStats: {
    marginTop: 0,
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.black,
    fontFamily: Fonts!.sans,
  },
  feBlurb: {
    fontSize: 13,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
});
