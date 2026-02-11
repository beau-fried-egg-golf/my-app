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
        <View style={styles.header}>
          <WordHighlight words={course.short_name.split(' ')} size={16} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{course.is_private ? 'PRIVATE' : 'PUBLIC'}</Text>
          </View>
        </View>

        <Text style={styles.city}>{course.city}</Text>

        <View style={styles.stats}>
          <Text style={styles.statText}>{course.holes} holes · Par {course.par}</Text>
          <Text style={styles.statText}>
            {writeupCount} writeup{writeupCount !== 1 ? 's' : ''}
          </Text>
          {distance !== null && (
            <Text style={styles.statText}>{Math.round(distance)} mi away</Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 28,
  },
  badge: {
    backgroundColor: Colors.orange,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  city: {
    fontSize: 13,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.darkGray,
    fontFamily: Fonts!.sans,
  },
});
