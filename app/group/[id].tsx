import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { GroupMember } from '@/types';
import DetailHeader from '@/components/DetailHeader';
import GuestBadge from '@/components/GuestBadge';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';

const SCREEN_HEIGHT = Dimensions.get('window').height;
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
            <Text style={[styles.dtBlackBtnText, { color: Colors.black }]}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DesktopBackStyleButton({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackBtnInner}>
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>{label}</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DesktopShareButton({ onPress }: { onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.white, Colors.cream] });
  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackInner}>
        <Ionicons name="share-outline" size={18} color={Colors.black} />
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>SHARE</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>SHARE</Text>
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

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, session, profiles, joinGroup, leaveGroup, getGroupMembers, loadGroups, deleteGroup, isPaidMember, setShowUpgradeModal } = useStore();
  const router = useRouter();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
  const group = groups.find(g => g.id === id);
  const currentUserId = session?.user?.id;
  const isMember = group?.is_member ?? false;
  const isCreator = group?.creator_id === currentUserId;

  useEffect(() => {
    if (!id) return;
    loadGroups();
    getGroupMembers(id).then(m => {
      setMembers(m);
      setLoadingMembers(false);
    });
  }, [id, loadGroups, getGroupMembers]);

  if (!group) {
    return (
      <View style={styles.container}>
        <DetailHeader title="GROUP" />
        <Text style={styles.emptyText}>Group not found</Text>
      </View>
    );
  }

  const handleJoin = async () => {
    if (!isPaidMember) { setShowUpgradeModal(true); return; }
    await joinGroup(group.id);
    const m = await getGroupMembers(group.id);
    setMembers(m);
  };

  const handleLeave = async () => {
    await leaveGroup(group.id);
    const m = await getGroupMembers(group.id);
    setMembers(m);
  };

  const handleShare = () => {
    if (!isPaidMember) { setShowUpgradeModal(true); return; }
    router.push({
      pathname: '/create-post',
      params: {
        shareType: 'group',
        shareId: group.id,
        shareTitle: group.name,
        shareDescription: group.description || group.location_name || '',
        shareImage: group.image || '',
      },
    });
  };

  const creator = members.find(m => m.role === 'creator');

  return (
    <View style={styles.container}>
      <ResponsiveContainer>
      {isDesktop ? (
        <View style={styles.desktopTopBar}>
          <DesktopBackButton onPress={() => router.canGoBack() ? router.back() : router.push('/groups')} />
          {isCreator && (
            <View style={styles.desktopManageRight}>
              <DesktopBackStyleButton label="EDIT" onPress={() => router.push(`/create-group?groupId=${group.id}`)} />
              <DesktopBackStyleButton label="DELETE" onPress={() => {
                if (confirm('Delete this group? This cannot be undone.')) {
                  deleteGroup(group.id).then(() => router.back());
                }
              }} />
            </View>
          )}
        </View>
      ) : (
        <DetailHeader title="GROUP" />
      )}

      <ScrollView {...desktopScrollProps} contentContainerStyle={styles.scrollContent}>
        {/* Group Image & Info */}
        <View style={styles.heroSection}>
          {group.image ? (
            <Image source={{ uri: group.image }} style={isDesktop ? styles.groupImageDesktop : styles.groupImage} resizeMode={isDesktop ? 'cover' : undefined} />
          ) : (
            <View style={isDesktop ? styles.groupImagePlaceholderDesktop : styles.groupImagePlaceholder}>
              <Ionicons name="people" size={isDesktop ? 60 : 40} color={Colors.gray} />
            </View>
          )}
          <Text style={styles.groupName}>{group.name}</Text>
          {group.location_name ? (
            <Text style={styles.groupLocation}>{group.location_name}</Text>
          ) : null}
          <Text style={styles.memberCount}>
            {group.member_count ?? 0} member{(group.member_count ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        {!isDesktop && isCreator && (
          <View style={styles.manageRow}>
            <Pressable style={styles.manageBtn} onPress={() => router.push(`/create-group?groupId=${group.id}`)}>
              <Text style={styles.manageBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.manageBtn}
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (confirm('Delete this group? This cannot be undone.')) {
                    deleteGroup(group.id).then(() => router.back());
                  }
                } else {
                  Alert.alert('Delete Group', 'Delete this group? This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteGroup(group.id).then(() => router.back()) },
                  ]);
                }
              }}
            >
              <Text style={styles.manageBtnText}>Delete</Text>
            </Pressable>
          </View>
        )}

        {/* Action Buttons */}
        {isPaidMember ? (
          <View style={styles.actionRow}>
            {isDesktop ? (
              <>
                {isMember ? (
                  <>
                    <DesktopBlackButton label="GROUP CHAT" onPress={() => router.push(`/group-chat/${group.id}`)} />
                    {!isCreator && (
                      <DesktopOutlineButton label="LEAVE" onPress={handleLeave} />
                    )}
                  </>
                ) : (
                  <DesktopBlackButton label="JOIN GROUP" onPress={handleJoin} />
                )}
                <DesktopShareButton onPress={handleShare} />
              </>
            ) : (
              <>
                {isMember ? (
                  <>
                    <Pressable
                      style={styles.actionBtnPrimary}
                      onPress={() => router.push(`/group-chat/${group.id}`)}
                    >
                      <Text style={styles.actionBtnPrimaryText}>Group Chat</Text>
                    </Pressable>
                    {!isCreator && (
                      <Pressable style={styles.actionBtnOutline} onPress={handleLeave}>
                        <Text style={styles.actionBtnOutlineText}>Leave</Text>
                      </Pressable>
                    )}
                  </>
                ) : (
                  <Pressable style={styles.actionBtnPrimary} onPress={handleJoin}>
                    <Text style={styles.actionBtnPrimaryText}>Join Group</Text>
                  </Pressable>
                )}
                <Pressable style={styles.actionBtnOutline} onPress={handleShare}>
                  <Ionicons name="share-outline" size={16} color={Colors.black} />
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <View style={styles.guestNote}>
            <Text style={styles.guestNoteText}>Joining groups is a member benefit.</Text>
            <Pressable onPress={() => Linking.openURL('https://www.thefriedegg.com/membership')}>
              <Text style={styles.guestNoteLink}>Learn more</Text>
            </Pressable>
          </View>
        )}

        {/* Creator */}
        {creator && (
          <Pressable
            style={styles.detailRow}
            onPress={() => {
              if (creator.user_id === currentUserId) {
                router.push('/profile');
              } else {
                router.push(`/member/${creator.user_id}`);
              }
            }}
          >
            <Text style={styles.detailLabel}>Created by</Text>
            <Text style={styles.detailValue}>{creator.user_name ?? group.creator_name ?? 'Member'}</Text>
          </Pressable>
        )}

        {/* Home Course */}
        {group.home_course_id && group.home_course_name ? (
          <Pressable
            style={styles.detailRow}
            onPress={() => router.push(`/course/${group.home_course_id}`)}
          >
            <Text style={styles.detailLabel}>Home Course</Text>
            <Text style={styles.detailValue}>{group.home_course_name}</Text>
          </Pressable>
        ) : null}

        {/* Description */}
        {group.description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>{group.description}</Text>
          </View>
        ) : null}

        {/* Member Roster */}
        <View style={styles.rosterSection}>
          <Text style={styles.rosterTitle}>Members</Text>
          {members.map(m => (
            <Pressable
              key={m.id}
              style={styles.memberRow}
              onPress={() => {
                if (m.user_id === currentUserId) {
                  router.push('/profile');
                } else {
                  router.push(`/member/${m.user_id}`);
                }
              }}
            >
              {m.user_image ? (
                <Image source={{ uri: m.user_image }} style={styles.memberAvatar} />
              ) : (
                <View style={styles.memberAvatarPlaceholder}>
                  <Ionicons name="person" size={16} color={Colors.gray} />
                </View>
              )}
              <Text style={styles.memberName}>{m.user_name ?? 'Member'}</Text>
              {(() => { const p = profiles.find(pr => pr.id === m.user_id); return p && (!p.subscription_tier || p.subscription_tier === 'free') ? <GuestBadge style={{ marginLeft: 6 }} /> : null; })()}
              {m.role === 'creator' && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Creator</Text>
                </View>
              )}
              {m.role === 'admin' && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Admin</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { padding: 24, paddingBottom: 40 },
  emptyText: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: Fonts!.sans,
  },
  heroSection: { alignItems: 'center', marginBottom: 24 },
  manageRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 16 },
  manageBtn: { backgroundColor: Colors.black, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  manageBtnText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  groupImage: { width: 96, height: 96, borderRadius: 16 },
  groupImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 22,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 12,
    textAlign: 'center',
  },
  groupLocation: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 4,
  },
  memberCount: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.black,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  actionBtnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.black,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  actionBtnOutlineText: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  detailLabel: {
    fontSize: 15,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  descriptionSection: { marginTop: 20 },
  descriptionTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    lineHeight: 22,
  },
  rosterSection: { marginTop: 24 },
  rosterTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  roleBadge: {
    backgroundColor: Colors.orange,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  desktopTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  desktopManageRight: { flexDirection: 'row', gap: 10 },
  groupImageDesktop: { width: '42%', aspectRatio: 1, borderRadius: 8, alignSelf: 'center' } as any,
  groupImagePlaceholderDesktop: {
    width: '60%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  } as any,
  desktopBackBtn: { alignSelf: 'flex-start', borderRadius: 8, overflow: 'hidden', marginLeft: 16 },
  desktopBackInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  desktopBackBtnInner: { paddingHorizontal: 16, paddingVertical: 14 },
  desktopBackText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
  dtBlackBtn: { borderRadius: 8, overflow: 'hidden', flexShrink: 0 },
  dtBlackBtnInner: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  dtBlackBtnText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.white, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
  dtOutlineBtn: { borderRadius: 8, overflow: 'hidden', flexShrink: 0, borderWidth: 1.5, borderColor: Colors.black },
  dtOutlineBtnText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: DT_TEXT_HEIGHT },
  guestNote: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 4,
  },
  guestNoteText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
  },
  guestNoteLink: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.orange,
    textDecorationLine: 'underline',
  },
});
