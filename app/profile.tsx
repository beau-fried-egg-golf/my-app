import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import PassportStamp from '@/components/PassportStamp';

export default function ProfileScreen() {
  const { user, writeups, posts, signOut, coursesPlayed, courses, getFollowerCount, getFollowingCount, dmsDisabled, toggleDms } = useStore();
  const router = useRouter();

  if (!user) return null;

  const userWriteups = writeups.filter((w) => w.user_id === user.id);
  const userPosts = posts.filter((p) => p.user_id === user.id);
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
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/edit-profile')}>
            <Text style={styles.headerActionText}>Edit</Text>
          </Pressable>
          <Text style={styles.headerActionDivider}>|</Text>
          <Pressable onPress={handleSignOut}>
            <Text style={styles.headerActionTextMuted}>Sign Out</Text>
          </Pressable>
        </View>
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
          <Text style={styles.statValue}>{getFollowerCount(user.id)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{getFollowingCount(user.id)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userWriteups.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
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
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Allow Direct Messages</Text>
          <Pressable
            style={[styles.toggleTrack, !dmsDisabled && styles.toggleTrackOn]}
            onPress={() => toggleDms(!dmsDisabled)}
          >
            <View style={[styles.toggleThumb, !dmsDisabled && styles.toggleThumbOn]} />
          </Pressable>
        </View>
      </View>

      {passportCourses.length > 0 && (
        <View style={styles.passportSection}>
          <Text style={styles.passportTitle}>Course Passport</Text>
          <View style={styles.stampGrid}>
            {passportCourses.map(c => {
              const playedRecord = coursesPlayed.find(cp => cp.user_id === user.id && cp.course_id === c.id);
              const courseWriteups = userWriteups.filter(w => w.course_id === c.id);
              const datePlayed = playedRecord?.created_at
                ?? courseWriteups.sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at
                ?? new Date().toISOString();
              return (
                <PassportStamp
                  key={c.id}
                  courseId={c.id}
                  courseName={c.short_name}
                  state={c.state}
                  datePlayed={datePlayed}
                  onPress={() => router.push(`/course/${c.id}`)}
                />
              );
            })}
          </View>
        </View>
      )}

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
    paddingTop: 8,
  },
  headerActionText: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  headerActionTextMuted: {
    fontSize: 13,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
  },
  headerActionDivider: {
    fontSize: 13,
    color: Colors.lightGray,
    fontFamily: Fonts!.sans,
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
    paddingHorizontal: 20,
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
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
});
