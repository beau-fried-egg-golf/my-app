import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { supabase } from '@/data/supabase';
import PassportStamp from '@/components/PassportStamp';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, writeups, coursesPlayed, courses, groups, session, isFollowing, toggleFollow, getFollowerCount, getFollowingCount, getOrCreateConversation, isBlockedBy } = useStore();
  const router = useRouter();
  const isOwnProfile = session?.user?.id === id;

  const profile = profiles.find((p) => p.id === id);

  const [memberGroupIds, setMemberGroupIds] = useState<string[]>([]);
  useEffect(() => {
    if (!id) return;
    supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', id)
      .then(({ data }) => {
        if (data) setMemberGroupIds(data.map((r: any) => r.group_id));
      });
  }, [id]);

  const memberGroups = groups.filter(g => memberGroupIds.includes(g.id));

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
          </Pressable>
          <View style={styles.topBarCenter}>
            <LetterSpacedHeader text="MEMBER" size={32} />
          </View>
        </View>
        <Text style={styles.emptyText}>Member not found</Text>
      </View>
    );
  }

  const memberWriteups = writeups.filter((w) => w.user_id === profile.id);
  const totalUpvotes = memberWriteups.reduce((sum, w) => sum + (w.upvote_count ?? 0), 0);

  const playedCourseIds = coursesPlayed
    .filter(cp => cp.user_id === profile.id)
    .map(cp => cp.course_id);
  const writeupCourseIds = new Set(memberWriteups.map(w => w.course_id));
  const passportCourses = courses
    .filter(c => playedCourseIds.includes(c.id) || writeupCourseIds.has(c.id))
    .sort((a, b) => a.short_name.localeCompare(b.short_name));
  const coursesPlayedCount = passportCourses.length;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backArrow}>
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <LetterSpacedHeader text="MEMBER" size={32} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={Colors.gray} />
          </View>
        )}
        <Text style={styles.name}>{profile.name}</Text>
        {(profile.city || profile.state) ? <Text style={styles.location}>{[profile.city, profile.state].filter(Boolean).join(', ')}</Text> : null}
        {!isOwnProfile && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, isFollowing(profile.id) && styles.actionBtnActive]}
              onPress={() => toggleFollow(profile.id)}
            >
              <Text style={[styles.actionBtnText, isFollowing(profile.id) && styles.actionBtnTextActive]}>
                {isFollowing(profile.id) ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
            {!isBlockedBy(profile.id) && !profile.dms_disabled && (
              <Pressable
                style={styles.actionBtn}
                onPress={async () => {
                  const convoId = await getOrCreateConversation(profile.id);
                  router.push(`/conversation/${convoId}`);
                }}
              >
                <Text style={styles.actionBtnText}>Message</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{getFollowerCount(profile.id)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{getFollowingCount(profile.id)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{memberWriteups.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{coursesPlayedCount}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>

      <View style={styles.details}>
        {profile.handicap !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Handicap</Text>
            <Text style={styles.detailValue}>{profile.handicap}</Text>
          </View>
        )}
        {profile.home_course_id ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Home Course</Text>
            <Text style={styles.detailValue}>{courses.find(c => c.id === profile.home_course_id)?.short_name ?? ''}</Text>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member Since</Text>
          <Text style={styles.detailValue}>
            {new Date(profile.member_since).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      {memberGroups.length > 0 && (
        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Groups</Text>
          {memberGroups.map(g => (
            <Pressable
              key={g.id}
              style={styles.groupRow}
              onPress={() => router.push(`/group/${g.id}`)}
            >
              {g.image ? (
                <Image source={{ uri: g.image }} style={styles.groupImage} />
              ) : (
                <View style={styles.groupImagePlaceholder}>
                  <Ionicons name="people" size={16} color={Colors.gray} />
                </View>
              )}
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{g.name}</Text>
                {g.member_count ? (
                  <Text style={styles.groupMemberCount}>{g.member_count} {g.member_count === 1 ? 'member' : 'members'}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
            </Pressable>
          ))}
        </View>
      )}

      {passportCourses.length > 0 && (
        <View style={styles.passportSection}>
          <Text style={styles.passportTitle}>Course Passport</Text>
          <View style={styles.stampGrid}>
            {passportCourses.map(c => {
              const playedRecord = coursesPlayed.find(cp => cp.user_id === profile.id && cp.course_id === c.id);
              const courseWriteups = memberWriteups.filter(w => w.course_id === c.id);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  backArrow: {
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: { marginLeft: 12 },
  content: { padding: 24, paddingBottom: 40 },
  emptyText: { fontSize: 15, color: Colors.gray, textAlign: 'center', marginTop: 40, fontFamily: Fonts!.sans },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 4 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 4,
    backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginTop: 12 },
  location: { fontSize: 14, color: Colors.gray, marginTop: 2, fontFamily: Fonts!.sans },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    backgroundColor: Colors.black, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  actionBtnActive: { backgroundColor: Colors.black },
  actionBtnText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  actionBtnTextActive: { color: Colors.white },
  stats: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.lightGray,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 16 },
  statValue: { fontSize: 20, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  statLabel: { fontSize: 12, color: Colors.gray, marginTop: 2, fontFamily: Fonts!.sans },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.lightGray },
  details: { gap: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 15, color: Colors.gray, fontFamily: Fonts!.sans },
  detailValue: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  groupsSection: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  groupImage: { width: 40, height: 40, borderRadius: 6 },
  groupImagePlaceholder: { width: 40, height: 40, borderRadius: 6, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  groupMemberCount: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 1 },
  passportSection: { marginTop: 24 },
  passportTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },
  stampGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
});
