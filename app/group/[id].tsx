import { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { GroupMember } from '@/types';
import DetailHeader from '@/components/DetailHeader';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, session, joinGroup, leaveGroup, getGroupMembers, loadGroups, deleteGroup } = useStore();
  const router = useRouter();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

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
      <DetailHeader title="GROUP" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Group Image & Info */}
        <View style={styles.heroSection}>
          {group.image ? (
            <Image source={{ uri: group.image }} style={styles.groupImage} />
          ) : (
            <View style={styles.groupImagePlaceholder}>
              <Ionicons name="people" size={40} color={Colors.gray} />
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

        {isCreator && (
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
        <View style={styles.actionRow}>
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
        </View>

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
});
