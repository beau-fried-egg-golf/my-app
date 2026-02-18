import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { CancellationRequest, MeetupMember, WaitlistEntry } from '@/types';
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
  const { meetups, session, profiles, joinMeetup, leaveMeetup, withdrawAndRefund, createCheckoutSession, getMeetupMembers, addMeetupMember, loadMeetups, deleteMeetup, requestCancellation, getUserCancellationRequest, joinWaitlist, leaveWaitlist, getWaitlistPosition, getWaitlistEntries } = useStore();
  const router = useRouter();
  const [members, setMembers] = useState<MeetupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancellationRequest, setCancellationRequest] = useState<CancellationRequest | null>(null);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [cancellationNote, setCancellationNote] = useState('');
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);

  const meetup = meetups.find(m => m.id === id);
  const currentUserId = session?.user?.id;
  const isMember = meetup?.is_member ?? false;
  const isHost = meetup?.host_id === currentUserId;
  const canManage = isHost || (meetup?.is_fe_coordinated && !meetup?.host_id);
  const slotsRemaining = meetup ? meetup.total_slots - (meetup.member_count ?? 0) : 0;
  const isFull = slotsRemaining <= 0;

  const isFeMeetupWithPayment = meetup?.is_fe_coordinated && ((meetup?.cost_cents != null && meetup.cost_cents > 0) || meetup?.stripe_payment_url);
  const currentUserMember = members.find(m => m.user_id === currentUserId);
  const currentPaymentStatus = currentUserMember?.payment_status;

  const daysUntilMeetup = meetup ? Math.ceil((new Date(meetup.meetup_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const canAutoRefund = daysUntilMeetup > 7;

  const memberUserIds = useMemo(() => new Set(members.map(m => m.user_id)), [members]);

  const filteredAddMembers = useMemo(() => {
    let result = profiles.filter(p => !memberUserIds.has(p.id));
    if (addMemberSearch.trim()) {
      const q = addMemberSearch.trim().toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [profiles, memberUserIds, addMemberSearch]);

  useEffect(() => {
    if (!id) return;
    loadMeetups();
    getMeetupMembers(id).then(m => {
      setMembers(m);
      setLoadingMembers(false);
    });
    getUserCancellationRequest(id).then(setCancellationRequest);
    getWaitlistPosition(id).then(setWaitlistPosition);
    getWaitlistEntries(id).then(setWaitlistEntries);
  }, [id, loadMeetups, getMeetupMembers, getUserCancellationRequest, getWaitlistPosition, getWaitlistEntries]);

  // Re-fetch members when app returns to foreground (e.g. after Stripe checkout)
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    if (!id) return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        loadMeetups();
        getMeetupMembers(id).then(setMembers);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [id, loadMeetups, getMeetupMembers]);

  if (!meetup) {
    return (
      <View style={styles.container}>
        <DetailHeader title="MEETUP" />
        <Text style={styles.emptyText}>Meetup not found</Text>
      </View>
    );
  }

  const openCheckout = async (memberId: string) => {
    if (meetup.cost_cents != null && meetup.cost_cents > 0) {
      setCheckoutLoading(true);
      const url = await createCheckoutSession(memberId, meetup.cost_cents, meetup.name, meetup.id);
      setCheckoutLoading(false);
      if (url) Linking.openURL(url);
    } else if (meetup.stripe_payment_url) {
      // Backward compat for old meetups with payment links
      Linking.openURL(`${meetup.stripe_payment_url}?client_reference_id=${memberId}`);
    }
  };

  const handleJoin = async () => {
    const memberId = await joinMeetup(meetup.id);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
    if (memberId && isFeMeetupWithPayment) {
      await openCheckout(memberId);
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
        // Not yet joined — single "Reserve & Pay" button or waitlist
        if (isFull) {
          if (waitlistPosition != null) {
            return (
              <>
                <View style={[styles.paidBadge, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.paidBadgeText, { color: '#0C5460' }]}>Waitlist #{waitlistPosition}</Text>
                </View>
                <Pressable
                  style={styles.actionBtnOutline}
                  onPress={async () => {
                    await leaveWaitlist(meetup.id);
                    setWaitlistPosition(null);
                    setWaitlistEntries(prev => prev.filter(e => e.user_id !== currentUserId));
                  }}
                >
                  <Text style={styles.actionBtnOutlineText}>Leave Waitlist</Text>
                </Pressable>
              </>
            );
          }
          return (
            <Pressable
              style={[styles.actionBtnPrimary, { backgroundColor: '#6C757D' }]}
              onPress={async () => {
                await joinWaitlist(meetup.id);
                const pos = await getWaitlistPosition(meetup.id);
                setWaitlistPosition(pos);
                const entries = await getWaitlistEntries(meetup.id);
                setWaitlistEntries(entries);
              }}
            >
              <Text style={styles.actionBtnPrimaryText}>
                Join Waitlist{(meetup.waitlist_count ?? 0) > 0 ? ` (${meetup.waitlist_count} waiting)` : ''}
              </Text>
            </Pressable>
          );
        }
        return (
          <Pressable style={[styles.stripeBtn, checkoutLoading && { opacity: 0.6 }]} disabled={checkoutLoading} onPress={handleJoin}>
            <Text style={styles.stripeBtnText}>{checkoutLoading ? 'Loading...' : 'Reserve & Pay'}</Text>
          </Pressable>
        );
      }

      // Already joined
      if (currentPaymentStatus === 'paid' || currentPaymentStatus === 'waived') {
        // Paid or waived — show badge
        const badgeColor = PAYMENT_BADGE_COLORS[currentPaymentStatus];

        const renderCancellationButton = () => {
          if (isHost || currentPaymentStatus !== 'paid' || !currentUserMember) return null;

          // Auto-refund path (>7 days out)
          if (canAutoRefund) {
            return (
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
            );
          }

          // Within 7 days — cancellation request flow
          if (cancellationRequest?.status === 'pending') {
            return (
              <View style={[styles.paidBadge, { backgroundColor: '#FFF3CD' }]}>
                <Text style={[styles.paidBadgeText, { color: '#856404' }]}>Cancellation Request Pending</Text>
              </View>
            );
          }
          if (cancellationRequest?.status === 'denied') {
            return (
              <View style={[styles.paidBadge, { backgroundColor: '#F8D7DA' }]}>
                <Text style={[styles.paidBadgeText, { color: '#721C24' }]}>Cancellation Denied</Text>
              </View>
            );
          }

          return (
            <Pressable
              style={styles.actionBtnOutline}
              onPress={() => setShowCancellationForm(true)}
            >
              <Text style={styles.actionBtnOutlineText}>Request Cancellation</Text>
            </Pressable>
          );
        };

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
            {renderCancellationButton()}
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
          {!isHost && (
            <Pressable
              style={[styles.stripeBtn, checkoutLoading && { opacity: 0.6 }]}
              disabled={checkoutLoading}
              onPress={() => currentUserMember && openCheckout(currentUserMember.id)}
            >
              <Text style={styles.stripeBtnText}>{checkoutLoading ? 'Loading...' : 'Pay Now'}</Text>
            </Pressable>
          )}
          {!isHost && (
            <Pressable style={styles.actionBtnOutline} onPress={handleLeave}>
              <Text style={styles.actionBtnOutlineText}>Leave & Request Refund</Text>
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
      if (waitlistPosition != null) {
        return (
          <>
            <View style={[styles.paidBadge, { backgroundColor: '#E8F4FD' }]}>
              <Text style={[styles.paidBadgeText, { color: '#0C5460' }]}>Waitlist #{waitlistPosition}</Text>
            </View>
            <Pressable
              style={styles.actionBtnOutline}
              onPress={async () => {
                await leaveWaitlist(meetup.id);
                setWaitlistPosition(null);
                setWaitlistEntries(prev => prev.filter(e => e.user_id !== currentUserId));
              }}
            >
              <Text style={styles.actionBtnOutlineText}>Leave Waitlist</Text>
            </Pressable>
          </>
        );
      }
      return (
        <Pressable
          style={[styles.actionBtnPrimary, { backgroundColor: '#6C757D' }]}
          onPress={async () => {
            await joinWaitlist(meetup.id);
            const pos = await getWaitlistPosition(meetup.id);
            setWaitlistPosition(pos);
            const entries = await getWaitlistEntries(meetup.id);
            setWaitlistEntries(entries);
          }}
        >
          <Text style={styles.actionBtnPrimaryText}>
            Join Waitlist{(meetup.waitlist_count ?? 0) > 0 ? ` (${meetup.waitlist_count} waiting)` : ''}
          </Text>
        </Pressable>
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
              <Image source={require('@/assets/images/fe-icon.png')} style={styles.feBadgeIcon} />
              <Text style={styles.feBadgeText}>COORDINATED</Text>
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

        {isFeMeetupWithPayment && (
          <View style={styles.policyNotice}>
            <Ionicons name="information-circle" size={16} color="#856404" />
            <Text style={styles.policyNoticeText}>
              Cancellation Policy: Full refunds are automatic more than 7 days before the event. Within 7 days, cancellations require approval from FE coordinators.
            </Text>
          </View>
        )}

        {/* Cancellation Request Form */}
        {showCancellationForm && currentUserMember && (
          <View style={styles.cancellationForm}>
            <Text style={styles.cancellationFormTitle}>Request Cancellation</Text>
            <Text style={styles.cancellationFormSubtitle}>
              Since the event is within 7 days, your cancellation needs approval from FE coordinators.
            </Text>
            <TextInput
              style={styles.cancellationInput}
              value={cancellationNote}
              onChangeText={setCancellationNote}
              placeholder="Reason for cancellation..."
              placeholderTextColor={Colors.gray}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={async () => {
                  if (!cancellationNote.trim()) {
                    if (Platform.OS === 'web') window.alert('Please provide a reason.');
                    else Alert.alert('Required', 'Please provide a reason.');
                    return;
                  }
                  await requestCancellation(meetup.id, currentUserMember.id, cancellationNote.trim());
                  const req = await getUserCancellationRequest(meetup.id);
                  setCancellationRequest(req);
                  setShowCancellationForm(false);
                  setCancellationNote('');
                }}
              >
                <Text style={styles.actionBtnPrimaryText}>Submit Request</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnOutline}
                onPress={() => { setShowCancellationForm(false); setCancellationNote(''); }}
              >
                <Text style={styles.actionBtnOutlineText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

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
          <View style={styles.rosterHeader}>
            <Text style={styles.rosterTitle}>Attendees</Text>
            {canManage && !isFull && (
              <Pressable
                style={styles.addMemberBtn}
                onPress={() => { setShowAddMember(!showAddMember); setAddMemberSearch(''); }}
              >
                <Ionicons name={showAddMember ? 'close' : 'person-add'} size={16} color={Colors.orange} />
                <Text style={styles.addMemberBtnText}>{showAddMember ? 'Close' : 'Add Member'}</Text>
              </Pressable>
            )}
          </View>
          {showAddMember && (
            <View style={styles.addMemberSection}>
              <TextInput
                style={styles.addMemberSearch}
                value={addMemberSearch}
                onChangeText={setAddMemberSearch}
                placeholder="Search by name..."
                placeholderTextColor={Colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ScrollView style={styles.addMemberList} nestedScrollEnabled>
                {filteredAddMembers.map(p => (
                  <Pressable
                    key={p.id}
                    style={styles.addMemberRow}
                    onPress={async () => {
                      await addMeetupMember(meetup.id, p.id);
                      const m = await getMeetupMembers(meetup.id);
                      setMembers(m);
                      setAddMemberSearch('');
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addMemberName}>{p.name}</Text>
                      <Text style={styles.addMemberLocation}>{p.city}{p.state ? `, ${p.state}` : ''}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.orange} />
                  </Pressable>
                ))}
                {filteredAddMembers.length === 0 && (
                  <View style={{ padding: 14, alignItems: 'center' }}>
                    <Text style={styles.addMemberLocation}>No members found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
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
              {isFeMeetupWithPayment && m.payment_status && PAYMENT_BADGE_COLORS[m.payment_status] && m.user_id !== meetup.host_id && (
                <View style={[styles.paymentBadge, { backgroundColor: PAYMENT_BADGE_COLORS[m.payment_status].bg }]}>
                  <Text style={[styles.paymentBadgeText, { color: PAYMENT_BADGE_COLORS[m.payment_status].text }]}>
                    {m.payment_status === 'paid' ? 'Paid' : m.payment_status === 'waived' ? 'Waived' : 'Pending'}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Waitlist Section */}
        {waitlistEntries.length > 0 && (
          <View style={styles.rosterSection}>
            <Text style={styles.rosterTitle}>Waitlist ({waitlistEntries.length})</Text>
            {waitlistEntries.map(e => (
              <Pressable
                key={e.id}
                style={styles.memberRow}
                onPress={() => {
                  if (e.user_id === currentUserId) router.push('/profile');
                  else router.push(`/member/${e.user_id}`);
                }}
              >
                {e.user_image ? (
                  <Image source={{ uri: e.user_image }} style={styles.memberAvatar} />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Ionicons name="person" size={16} color={Colors.gray} />
                  </View>
                )}
                <Text style={styles.memberName}>{e.user_name ?? 'Member'}</Text>
                <View style={[styles.paidBadge, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.paidBadgeText, { color: '#0C5460', fontSize: 11 }]}>#{e.position}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  feBadgeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  feBadgeText: {
    fontSize: 12,
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
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rosterTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addMemberBtnText: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.orange },
  addMemberSection: { marginBottom: 12 },
  addMemberSearch: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    marginBottom: 6,
  },
  addMemberList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, maxHeight: 200 },
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  addMemberName: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  addMemberLocation: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray },
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
  policyNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: '#856404',
    lineHeight: 17,
  },
  cancellationForm: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  cancellationFormTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  cancellationFormSubtitle: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    lineHeight: 18,
  },
  cancellationInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
