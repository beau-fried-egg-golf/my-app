import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function ProfileScreen() {
  const { user, writeups, signOut, coursesPlayed, courses } = useStore();
  const router = useRouter();

  if (!user) return null;

  const userWriteups = writeups.filter((w) => w.user_id === user.id);
  const totalUpvotes = userWriteups.reduce((sum, w) => sum + (w.upvote_count ?? 0), 0);

  const playedCourseIds = coursesPlayed
    .filter(cp => cp.user_id === user.id)
    .map(cp => cp.course_id);
  const writeupCourseIds = new Set(userWriteups.map(w => w.course_id));
  const passportCourses = courses
    .filter(c => playedCourseIds.includes(c.id) || writeupCourseIds.has(c.id))
    .sort((a, b) => a.short_name.localeCompare(b.short_name));
  const coursesPlayedCount = passportCourses.length;

  async function handleSignOut() {
    router.dismissAll();
    await signOut();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>{'<'}</Text>
        </Pressable>
        <LetterSpacedHeader text="PROFILE" size={32} />
      </View>
      <View style={styles.avatarSection}>
        {user.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={Colors.gray} />
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        {user.location ? <Text style={styles.location}>{user.location}</Text> : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userWriteups.length}</Text>
          <Text style={styles.statLabel}>Writeups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalUpvotes}</Text>
          <Text style={styles.statLabel}>Upvotes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{coursesPlayedCount}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>

      <View style={styles.details}>
        {user.handicap !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Handicap</Text>
            <Text style={styles.detailValue}>{user.handicap}</Text>
          </View>
        )}
        {user.homeCourse ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Home Course</Text>
            <Text style={styles.detailValue}>{user.homeCourse}</Text>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member Since</Text>
          <Text style={styles.detailValue}>
            {new Date(user.memberSince).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {passportCourses.length > 0 && (
        <View style={styles.passportSection}>
          <Text style={styles.passportTitle}>Course Passport</Text>
          {passportCourses.map(c => (
            <Pressable key={c.id} style={styles.passportItem} onPress={() => router.push(`/course/${c.id}`)}>
              <Text style={styles.passportCourseName}>{c.short_name}</Text>
              {writeupCourseIds.has(c.id) && (
                <Ionicons name="pencil" size={14} color={Colors.gray} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      <Pressable style={styles.editButton} onPress={() => router.push('/edit-profile')}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  backArrow: {
    paddingRight: 12,
    paddingTop: 4,
  },
  backArrowText: {
    fontSize: 24,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 12,
  },
  location: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
    fontFamily: Fonts!.sans,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.lightGray,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
    fontFamily: Fonts!.sans,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.lightGray,
  },
  details: {
    gap: 16,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  passportSection: {
    marginBottom: 32,
  },
  passportTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 12,
  },
  passportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  passportCourseName: {
    fontSize: 15,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  editButton: {
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
  },
});
