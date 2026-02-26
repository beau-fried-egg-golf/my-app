import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { supabase } from '@/data/supabase';
import PassportBook from '@/components/PassportBook';
import DetailHeader from '@/components/DetailHeader';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import VerifiedBadge from '@/components/VerifiedBadge';
import GuestBadge from '@/components/GuestBadge';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';

const DT_TEXT_HEIGHT = 18;
const DT_SCROLL_GAP = 14;

function DesktopBackButton({ onPress }: { onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackInner}>
        <Ionicons name="chevron-back" size={18} color={Colors.black} />
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>BACK</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>BACK</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DesktopBlackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.black, Colors.orange] });
  return (
    <Animated.View style={[styles.dtBlackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtBlackBtnInner}>
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.dtBlackBtnText}>{label}</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.dtBlackBtnText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DesktopOutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.dtOutlineBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtBlackBtnInner}>
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.dtOutlineBtnText}>{label}</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.dtOutlineBtnText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, writeups, coursesPlayed, courses, groups, session, isFollowing, toggleFollow, getFollowerCount, getFollowingCount, getOrCreateConversation, isBlockedBy, isPaidMember } = useStore();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
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
        {isDesktop ? (
          <View style={styles.desktopTopBar}>
            <DesktopBackButton onPress={() => router.back()} />
          </View>
        ) : (
          <DetailHeader title="MEMBER" />
        )}
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
  const coursesPlayedCount = new Set([...playedCourseIds, ...writeupCourseIds]).size;

  return (
    <View style={styles.container}>
      <ResponsiveContainer>
      {isDesktop ? (
        <View style={styles.desktopTopBar}>
          <DesktopBackButton onPress={() => router.back()} />
        </View>
      ) : (
        <DetailHeader title="MEMBER" />
      )}
      <ScrollView contentContainerStyle={styles.content} {...desktopScrollProps}>
      <View style={styles.avatarSection}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={Colors.gray} />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.is_verified && <VerifiedBadge size={18} />}
        </View>
        {(profile.city || profile.state) ? <Text style={styles.location}>{[profile.city, profile.state].filter(Boolean).join(', ')}</Text> : null}
        {(!profile.subscription_tier || profile.subscription_tier === 'free') && <GuestBadge style={{ alignSelf: 'center', marginTop: 6 }} />}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {!isOwnProfile && isPaidMember && isDesktop && (
          <View style={styles.actionRow}>
            {isFollowing(profile.id) ? (
              <DesktopOutlineButton label="FOLLOWING" onPress={() => toggleFollow(profile.id)} />
            ) : (
              <DesktopBlackButton label="FOLLOW" onPress={() => toggleFollow(profile.id)} />
            )}
            {!isBlockedBy(profile.id) && !profile.dms_disabled && (
              <DesktopBlackButton
                label="MESSAGE"
                onPress={async () => {
                  const convoId = await getOrCreateConversation(profile.id);
                  router.push(`/conversation/${convoId}`);
                }}
              />
            )}
          </View>
        )}
        {!isOwnProfile && isPaidMember && !isDesktop && (
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
          <Text style={styles.detailLabel}>{(!profile.subscription_tier || profile.subscription_tier === 'free') ? 'Status' : 'Member Since'}</Text>
          <Text style={styles.detailValue}>
            {(!profile.subscription_tier || profile.subscription_tier === 'free') ? 'Guest' : new Date(profile.member_since).toLocaleDateString('en-US', {
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

      {coursesPlayedCount > 0 && (
        <View style={styles.passportSection}>
          <Text style={styles.passportTitle}>Course Passport</Text>
          <PassportBook
            userId={profile.id}
            coursesPlayed={coursesPlayed}
            courses={courses}
            writeups={writeups}
            onStampPress={(courseId) => router.push(`/course/${courseId}`)}
          />
        </View>
      )}
      </ScrollView>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  bio: { fontSize: 14, color: Colors.black, marginTop: 8, fontFamily: Fonts!.sans, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: {
    backgroundColor: Colors.black, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  actionBtnActive: { backgroundColor: Colors.lightGray },
  actionBtnText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  actionBtnTextActive: { color: Colors.black },
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
  desktopTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  desktopBackBtn: { borderRadius: 8, overflow: 'hidden' },
  desktopBackInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  desktopBackText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
  dtBlackBtn: { borderRadius: 8, overflow: 'hidden' },
  dtBlackBtnInner: { paddingHorizontal: 14, paddingVertical: DT_SCROLL_GAP },
  dtBlackBtnText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.white, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
  dtOutlineBtn: { borderRadius: 8, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.black },
  dtOutlineBtnText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
});
