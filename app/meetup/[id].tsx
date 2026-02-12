import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { MeetupMember } from '@/types';

function formatMeetupDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function MeetupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { meetups, session, joinMeetup, leaveMeetup, getMeetupMembers, loadMeetups } = useStore();
  const router = useRouter();
  const [members, setMembers] = useState<MeetupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const meetup = meetups.find(m => m.id === id);
  const currentUserId = session?.user?.id;
  const isMember = meetup?.is_member ?? false;
  const isHost = meetup?.host_id === currentUserId;
  const slotsRemaining = meetup ? meetup.total_slots - (meetup.member_count ?? 0) : 0;
  const isFull = slotsRemaining <= 0;

  useEffect(() => {
    if (!id) return;
    loadMeetups();
    getMeetupMembers(id).then(m => {
      setMembers(m);
      setLoadingMembers(false);
    });
  }, [id, loadMeetups, getMeetupMembers]);

  if (!meetup) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backArrow}>
            <Text style={styles.backArrowText}>{'<'}</Text>
          </Pressable>
        </View>
        <Text style={styles.emptyText}>Meetup not found</Text>
      </View>
    );
  }

  const handleJoin = async () => {
    await joinMeetup(meetup.id);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
  };

  const handleLeave = async () => {
    await leaveMeetup(meetup.id);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{meetup.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.heroSection}>
          {meetup.image ? (
            <Image source={{ uri: meetup.image }} style={styles.meetupImage} />
          ) : (
            <View style={styles.meetupImagePlaceholder}>
              <Ionicons name="calendar" size={40} color={Colors.gray} />
            </View>
          )}
          <Text style={styles.meetupName}>{meetup.name}</Text>
          <Text style={styles.meetupDateHero}>{formatMeetupDate(meetup.meetup_date)}</Text>
          <Text style={styles.meetupLocation}>{meetup.location_name}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isMember ? (
            <>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => router.push(`/meetup-chat/${meetup.id}`)}
              >
                <Text style={styles.actionBtnPrimaryText}>Meetup Chat</Text>
              </Pressable>
              {!isHost && (
                <Pressable style={styles.actionBtnOutline} onPress={handleLeave}>
                  <Text style={styles.actionBtnOutlineText}>Leave</Text>
                </Pressable>
              )}
            </>
          ) : isFull ? (
            <View style={[styles.actionBtnPrimary, { opacity: 0.4 }]}>
              <Text style={styles.actionBtnPrimaryText}>Meetup Full</Text>
            </View>
          ) : (
            <Pressable style={styles.actionBtnPrimary} onPress={handleJoin}>
              <Text style={styles.actionBtnPrimaryText}>Join Meetup</Text>
            </Pressable>
          )}
        </View>

        {/* Details */}
        <Pressable
          style={styles.detailRow}
          onPress={() => {
            if (meetup.host_id === currentUserId) {
              router.push('/profile');
            } else {
              router.push(`/member/${meetup.host_id}`);
            }
          }}
        >
          <Text style={styles.detailLabel}>Hosted by</Text>
          <Text style={styles.detailValue}>{meetup.host_name ?? 'Member'}</Text>
        </Pressable>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{formatMeetupDate(meetup.meetup_date)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{meetup.location_name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cost</Text>
          <Text style={styles.detailValue}>{meetup.cost}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Spots</Text>
          <Text style={styles.detailValue}>{slotsRemaining} of {meetup.total_slots} available</Text>
        </View>

        {/* Description */}
        {meetup.description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>{meetup.description}</Text>
          </View>
        ) : null}

        {/* Member Roster */}
        <View style={styles.rosterSection}>
          <Text style={styles.rosterTitle}>Attendees</Text>
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
              {m.user_id === meetup.host_id && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Host</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  backArrow: { paddingRight: 12 },
  backArrowText: {
    fontSize: 24,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    flex: 1,
  },
  content: { padding: 24, paddingBottom: 40 },
  emptyText: {
    fontSize: 15,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: Fonts!.sans,
  },
  heroSection: { alignItems: 'center', marginBottom: 24 },
  meetupImage: { width: 96, height: 96, borderRadius: 16 },
  meetupImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetupName: {
    fontSize: 22,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 12,
    textAlign: 'center',
  },
  meetupDateHero: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
    marginTop: 4,
  },
  meetupLocation: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
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
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
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
