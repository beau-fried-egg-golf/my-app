import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { EditIcon, SignOutIcon } from '@/components/icons/CustomIcons';
import PassportBook from '@/components/PassportBook';

export default function ProfileScreen() {
  const { user, writeups, posts, signOut, coursesPlayed, courses, getFollowerCount, getFollowingCount, dmsDisabled, toggleDms, pushDmEnabled, pushNotificationsEnabled, pushNearbyEnabled, pushNearbyRadiusMiles, emailNotificationsEnabled, updatePushPreferences } = useStore();
  const router = useRouter();
  const goBack = useGoBack();

  if (!user) return null;

  const userWriteups = writeups.filter((w) => w.user_id === user.id);
  const userPosts = posts.filter((p) => p.user_id === user.id);
  const totalUpvotes = userWriteups.reduce((sum, w) => sum + (w.upvote_count ?? 0), 0);

  const playedCourseIds = coursesPlayed
    .filter(cp => cp.user_id === user.id)
    .map(cp => cp.course_id);
  const writeupCourseIds = new Set(userWriteups.map(w => w.course_id));
  const coursesPlayedCount = new Set([...playedCourseIds, ...writeupCourseIds]).size;

  async function handleSignOut() {
    router.dismissAll();
    await signOut();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} style={styles.backArrow}>
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={styles.headerCenter}>
          <LetterSpacedHeader text="PROFILE" size={32} />
        </View>
        <View style={styles.headerPill}>
          <Pressable onPress={() => router.push('/edit-profile')} style={styles.headerPillBtn}>
            <EditIcon size={28} color={Colors.black} />
          </Pressable>
          <Pressable onPress={handleSignOut} style={styles.headerPillBtn}>
            <SignOutIcon size={28} color={Colors.gray} />
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
        {(user.city || user.state) ? <Text style={styles.location}>{[user.city, user.state].filter(Boolean).join(', ')}</Text> : null}
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
        {user.homeCourseId ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Home Course</Text>
            <Text style={styles.detailValue}>{courses.find(c => c.id === user.homeCourseId)?.short_name ?? ''}</Text>
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

      <View style={styles.notificationsSection}>
        <Text style={styles.notificationsTitle}>Notifications</Text>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Push: Direct Messages</Text>
            <Pressable
              style={[styles.toggleTrack, pushDmEnabled && styles.toggleTrackOn]}
              onPress={() => updatePushPreferences({ push_dm_enabled: !pushDmEnabled })}
            >
              <View style={[styles.toggleThumb, pushDmEnabled && styles.toggleThumbOn]} />
            </Pressable>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Push: Activity</Text>
            <Pressable
              style={[styles.toggleTrack, pushNotificationsEnabled && styles.toggleTrackOn]}
              onPress={() => updatePushPreferences({ push_notifications_enabled: !pushNotificationsEnabled })}
            >
              <View style={[styles.toggleThumb, pushNotificationsEnabled && styles.toggleThumbOn]} />
            </Pressable>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Push: Nearby Meetups</Text>
            <Pressable
              style={[styles.toggleTrack, pushNearbyEnabled && styles.toggleTrackOn]}
              onPress={() => updatePushPreferences({ push_nearby_enabled: !pushNearbyEnabled })}
            >
              <View style={[styles.toggleThumb, pushNearbyEnabled && styles.toggleThumbOn]} />
            </Pressable>
          </View>
          {pushNearbyEnabled && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nearby Radius</Text>
              <View style={styles.radiusChips}>
                {[25, 50, 100].map(miles => (
                  <Pressable
                    key={miles}
                    style={[styles.radiusChip, pushNearbyRadiusMiles === miles && styles.radiusChipActive]}
                    onPress={() => updatePushPreferences({ push_nearby_radius_miles: miles })}
                  >
                    <Text style={[styles.radiusChipText, pushNearbyRadiusMiles === miles && styles.radiusChipTextActive]}>
                      {miles} mi
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email: Unread Messages</Text>
            <Pressable
              style={[styles.toggleTrack, emailNotificationsEnabled && styles.toggleTrackOn]}
              onPress={() => updatePushPreferences({ email_notifications_enabled: !emailNotificationsEnabled })}
            >
              <View style={[styles.toggleThumb, emailNotificationsEnabled && styles.toggleThumbOn]} />
            </Pressable>
          </View>
        </View>
      </View>

      {coursesPlayedCount > 0 && (
        <View style={styles.passportSection}>
          <Text style={styles.passportTitle}>Course Passport</Text>
          <PassportBook
            userId={user.id}
            coursesPlayed={coursesPlayed}
            courses={courses}
            writeups={writeups}
            onStampPress={(courseId) => router.push(`/course/${courseId}`)}
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  headerPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  notificationsSection: {
    marginBottom: 32,
  },
  notificationsTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 12,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
  },
  radiusChipActive: {
    backgroundColor: Colors.orange,
  },
  radiusChipText: {
    fontSize: 13,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
  },
  radiusChipTextActive: {
    color: Colors.white,
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
});
