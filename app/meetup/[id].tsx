import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { MeetupMember } from '@/types';
import DetailHeader from '@/components/DetailHeader';

function formatMeetupDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const PAYMENT_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3CD', text: '#856404' },
  paid: { bg: '#D4EDDA', text: '#155724' },
  waived: { bg: '#D1ECF1', text: '#0C5460' },
};

export default function MeetupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { meetups, session, joinMeetup, leaveMeetup, withdrawAndRefund, getMeetupMembers, loadMeetups, deleteMeetup } = useStore();
  const router = useRouter();
  const [members, setMembers] = useState<MeetupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const meetup = meetups.find(m => m.id === id);
  const currentUserId = session?.user?.id;
  const isMember = meetup?.is_member ?? false;
  const isHost = meetup?.host_id === currentUserId;
  const canManage = isHost || (meetup?.is_fe_coordinated && !meetup?.host_id);
  const slotsRemaining = meetup ? meetup.total_slots - (meetup.member_count ?? 0) : 0;
  const isFull = slotsRemaining <= 0;

  const isFeMeetupWithPayment = meetup?.is_fe_coordinated && meetup?.stripe_payment_url;
  const currentUserMember = members.find(m => m.user_id === currentUserId);
  const currentPaymentStatus = currentUserMember?.payment_status;

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
        <DetailHeader title="MEETUP" />
        <Text style={styles.emptyText}>Meetup not found</Text>
      </View>
    );
  }

  const openStripeWithMemberId = (memberId: string) => {
    const url = `${meetup.stripe_payment_url}?client_reference_id=${memberId}`;
    Linking.openURL(url);
  };

  const handleJoin = async () => {
    const memberId = await joinMeetup(meetup.id);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
    if (memberId && isFeMeetupWithPayment) {
      openStripeWithMemberId(memberId);
    }
  };

  const handleLeave = async () => {
    await leaveMeetup(meetup.id);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
  };

  const renderActionButtons = () => {
    if (isFeMeetupWithPayment) {
      // FE-coordinated meetup with Stripe payment
      if (!isMember) {
        // Not yet joined — single "Reserve & Pay" button
        if (isFull) {
          return (
            <View style={[styles.stripeBtn, { opacity: 0.4 }]}>
              <Text style={styles.stripeBtnText}>Meetup Full</Text>
            </View>
          );
        }
        return (
          <Pressable style={styles.stripeBtn} onPress={handleJoin}>
            <Text style={styles.stripeBtnText}>Reserve & Pay</Text>
          </Pressable>
        );
      }

      // Already joined
      if (currentPaymentStatus === 'paid' || currentPaymentStatus === 'waived') {
        // Paid or waived — show badge
        const badgeColor = PAYMENT_BADGE_COLORS[currentPaymentStatus];
        return (
          <>
            <Pressable
              style={styles.actionBtnPrimary}
              onPress={() => router.push(`/meetup-chat/${meetup.id}`)}
            >
              <Text style={styles.actionBtnPrimaryText}>Meetup Chat</Text>
            </Pressable>
            <View style={[styles.paidBadge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[styles.paidBadgeText, { color: badgeColor.text }]}>
                {currentPaymentStatus === 'paid' ? 'Paid' : 'Waived'}
              </Text>
            </View>
            {!isHost && currentPaymentStatus === 'paid' && currentUserMember && (
              <Pressable
                style={styles.actionBtnOutline}
                onPress={async () => {
                  const confirmed = Platform.OS === 'web'
                    ? window.confirm('Are you sure you want to withdraw? Your payment will be refunded.')
                    : await new Promise<boolean>(resolve =>
                        Alert.alert(
                          'Withdraw & Refund',
                          'Are you sure you want to withdraw? Your payment will be refunded.',
                          [
                            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                            { text: 'Withdraw & Refund', style: 'destructive', onPress: () => resolve(true) },
                          ],
                        ),
                      );
                  if (!confirmed) return;
                  const prevMembers = members;
                  setMembers(prev => prev.filter(m => m.id !== currentUserMember.id));
                  const success = await withdrawAndRefund(meetup.id, currentUserMember.id);
                  if (!success) {
                    setMembers(prevMembers);
                    if (Platform.OS === 'web') {
                      window.alert('Failed to process refund. Please try again.');
                    } else {
                      Alert.alert('Error', 'Failed to process refund. Please try again.');
                    }
                  }
                }}
              >
                <Text style={styles.actionBtnOutlineText}>Withdraw & Refund</Text>
              </Pressable>
            )}
            {!isHost && currentPaymentStatus === 'waived' && (
              <Pressable style={styles.actionBtnOutline} onPress={handleLeave}>
                <Text style={styles.actionBtnOutlineText}>Leave</Text>
              </Pressable>
            )}
          </>
        );
      }

      // Payment pending — show "Pay Now" button
      return (
        <>
          <Pressable
            style={styles.actionBtnPrimary}
            onPress={() => router.push(`/meetup-chat/${meetup.id}`)}
          >
            <Text style={styles.actionBtnPrimaryText}>Meetup Chat</Text>
          </Pressable>
          <Pressable
            style={styles.stripeBtn}
            onPress={() => currentUserMember && openStripeWithMemberId(currentUserMember.id)}
          >
            <Text style={styles.stripeBtnText}>Pay Now</Text>
          </Pressable>
          {!isHost && (
            <Pressable style={styles.actionBtnOutline} onPress={handleLeave}>
              <Text style={styles.actionBtnOutlineText}>Leave</Text>
            </Pressable>
          )}
        </>
      );
    }

    // Non-FE meetup: existing flow
    if (isMember) {
      return (
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
      );
    }
    if (isFull) {
      return (
        <View style={[styles.actionBtnPrimary, { opacity: 0.4 }]}>
          <Text style={styles.actionBtnPrimaryText}>Meetup Full</Text>
        </View>
      );
    }
    return (
      <Pressable style={styles.actionBtnPrimary} onPress={handleJoin}>
        <Text style={styles.actionBtnPrimaryText}>Join Meetup</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader title="MEETUP" />

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
          {meetup.is_fe_coordinated && (
            <View style={styles.feBadge}>
              <Text style={styles.feBadgeText}>FE COORDINATED</Text>
            </View>
          )}
          <Text style={styles.meetupDateHero}>{formatMeetupDate(meetup.meetup_date)}</Text>
          <Text style={styles.meetupLocation}>{meetup.location_name}</Text>
        </View>

        {canManage && (
          <View style={styles.manageRow}>
            <Pressable style={styles.manageBtn} onPress={() => router.push(`/create-meetup?meetupId=${meetup.id}`)}>
              <Text style={styles.manageBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.manageBtn}
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (confirm('Delete this meetup? This cannot be undone.')) {
                    deleteMeetup(meetup.id).then(() => router.back());
                  }
                } else {
                  Alert.alert('Delete Meetup', 'Delete this meetup? This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMeetup(meetup.id).then(() => router.back()) },
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
          {renderActionButtons()}
        </View>

        {/* Details */}
        {meetup.host_id ? (
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
        ) : (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hosted by</Text>
            <Text style={styles.detailValue}>FE Coordinated</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{formatMeetupDate(meetup.meetup_date)}</Text>
        </View>

        <Pressable
          style={styles.detailRow}
          onPress={() => meetup.course_id ? router.push(`/course/${meetup.course_id}`) : undefined}
        >
          <Text style={styles.detailLabel}>Course</Text>
          <Text style={styles.detailValue}>{meetup.location_name}</Text>
        </Pressable>

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
              {isFeMeetupWithPayment && m.payment_status && PAYMENT_BADGE_COLORS[m.payment_status] && (
                <View style={[styles.paymentBadge, { backgroundColor: PAYMENT_BADGE_COLORS[m.payment_status].bg }]}>
                  <Text style={[styles.paymentBadgeText, { color: PAYMENT_BADGE_COLORS[m.payment_status].text }]}>
                    {m.payment_status === 'paid' ? 'Paid' : m.payment_status === 'waived' ? 'Waived' : 'Pending'}
                  </Text>
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
  manageRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 16 },
  manageBtn: { backgroundColor: Colors.black, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  manageBtnText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
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
  feBadge: {
    backgroundColor: '#FFEE54',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  feBadgeText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  stripeBtn: {
    backgroundColor: '#635BFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  stripeBtnText: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
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
  paidBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  paidBadgeText: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
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
  paymentBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
});
