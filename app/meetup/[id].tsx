import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, Dimensions, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { CancellationRequest, MeetupMember, WaitlistEntry } from '@/types';
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

function DesktopBlackButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.black, Colors.orange] });
  return (
    <Animated.View style={[styles.dtBlackBtn, { backgroundColor: bgColor, opacity: disabled ? 0.6 : 1 }, style]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtBlackBtnInner} disabled={disabled}>
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

function DesktopStripeButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#635BFF', '#7A73FF'] });
  return (
    <Animated.View style={[styles.dtBlackBtn, { backgroundColor: bgColor, opacity: disabled ? 0.6 : 1 }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtBlackBtnInner} disabled={disabled}>
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.dtBlackBtnText}>{label}</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={[styles.dtBlackBtnText, { color: Colors.white }]}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

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
  const { meetups, session, profiles, joinMeetup, leaveMeetup, withdrawAndRefund, cancelPendingReservation, createCheckoutSession, getMeetupMembers, addMeetupMember, loadMeetups, deleteMeetup, requestCancellation, getUserCancellationRequest, joinWaitlist, leaveWaitlist, getWaitlistPosition, getWaitlistEntries, isPaidMember, setShowUpgradeModal } = useStore();
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
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
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
        getMeetupMembers(id).then(m => {
          setMembers(m);
          // Check if current user still has a pending payment
          const myMember = m.find(mem => mem.user_id === session?.user?.id);
          if (myMember?.payment_status === 'pending' && isFeMeetupWithPayment) {
            setShowPaymentWarning(true);
          }
        });
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [id, loadMeetups, getMeetupMembers, session, isFeMeetupWithPayment]);

  if (!meetup) {
    return (
      <View style={styles.container}>
        <DetailHeader title="MEETUP" />
        <Text style={styles.emptyText}>Meetup not found</Text>
      </View>
    );
  }

  const openCheckout = async (memberId: string, spots?: number) => {
    if (meetup.cost_cents != null && meetup.cost_cents > 0) {
      setCheckoutLoading(true);
      const url = await createCheckoutSession(memberId, meetup.cost_cents, meetup.name, meetup.id, spots);
      setCheckoutLoading(false);
      if (url) Linking.openURL(url);
    } else if (meetup.stripe_payment_url) {
      // Backward compat for old meetups with payment links
      Linking.openURL(`${meetup.stripe_payment_url}?client_reference_id=${memberId}`);
    }
  };

  const handleJoin = () => {
    if (!isPaidMember) { setShowUpgradeModal(true); return; }
    setShowSpotModal(true);
  };

  const handleSpotSelection = async (spots: number) => {
    setShowSpotModal(false);
    const memberId = await joinMeetup(meetup.id, spots);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
    if (memberId && isFeMeetupWithPayment) {
      await openCheckout(memberId, spots);
    }
  };

  const handleLeave = async () => {
    await leaveMeetup(meetup.id, currentUserMember?.spots ?? 1);
    const m = await getMeetupMembers(meetup.id);
    setMembers(m);
  };

  const handleShare = () => {
    if (!isPaidMember) { setShowUpgradeModal(true); return; }
    const description = `${formatMeetupDate(meetup.meetup_date)} · ${meetup.location_name}`;
    router.push({
      pathname: '/create-post',
      params: {
        shareType: 'meetup',
        shareId: meetup.id,
        shareTitle: meetup.name,
        shareDescription: description,
        shareImage: meetup.image || '',
      },
    });
  };

  const renderDesktopActionButtons = () => {
    if (isFeMeetupWithPayment) {
      if (!isMember) {
        if (isFull) {
          if (waitlistPosition != null) {
            return (
              <>
                <View style={[styles.paidBadge, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.paidBadgeText, { color: '#0C5460' }]}>Waitlist #{waitlistPosition}</Text>
                </View>
                <DesktopOutlineButton label="LEAVE WAITLIST" onPress={async () => {
                  await leaveWaitlist(meetup.id);
                  setWaitlistPosition(null);
                  setWaitlistEntries(prev => prev.filter(e => e.user_id !== currentUserId));
                }} />
              </>
            );
          }
          return (
            <DesktopBlackButton
              label={`JOIN WAITLIST${(meetup.waitlist_count ?? 0) > 0 ? ` (${meetup.waitlist_count} WAITING)` : ''}`}
              onPress={async () => {
                if (!isPaidMember) { setShowUpgradeModal(true); return; }
                await joinWaitlist(meetup.id);
                const pos = await getWaitlistPosition(meetup.id);
                setWaitlistPosition(pos);
                const entries = await getWaitlistEntries(meetup.id);
                setWaitlistEntries(entries);
              }}
              style={{ backgroundColor: '#6C757D' }}
            />
          );
        }
        return (
          <DesktopStripeButton label={checkoutLoading ? 'LOADING...' : 'RESERVE & PAY'} onPress={handleJoin} disabled={checkoutLoading} />
        );
      }

      if (currentPaymentStatus === 'paid' || currentPaymentStatus === 'waived') {
        const badgeColor = PAYMENT_BADGE_COLORS[currentPaymentStatus];

        const renderCancellationButton = () => {
          if (isHost || currentPaymentStatus !== 'paid' || !currentUserMember) return null;
          if (canAutoRefund) {
            return (
              <DesktopOutlineButton label="WITHDRAW & REFUND" onPress={async () => {
                if (!window.confirm('Are you sure you want to withdraw? Your payment will be refunded.')) return;
                const prevMembers = members;
                setMembers(prev => prev.filter(m => m.id !== currentUserMember.id));
                const success = await withdrawAndRefund(meetup.id, currentUserMember.id, currentUserMember.spots ?? 1);
                if (!success) {
                  setMembers(prevMembers);
                  window.alert('Failed to process refund. Please try again.');
                }
              }} />
            );
          }
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
          return <DesktopOutlineButton label="REQUEST CANCELLATION" onPress={() => setShowCancellationForm(true)} />;
        };

        return (
          <>
            <DesktopBlackButton label="MEETUP CHAT" onPress={() => router.push(`/meetup-chat/${meetup.id}`)} />
            <View style={[styles.paidBadge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[styles.paidBadgeText, { color: badgeColor.text }]}>
                {currentPaymentStatus === 'paid' ? 'Paid' : 'Waived'}
              </Text>
            </View>
            {renderCancellationButton()}
            {!isHost && currentPaymentStatus === 'waived' && (
              <DesktopOutlineButton label="LEAVE" onPress={handleLeave} />
            )}
          </>
        );
      }

      return (
        <>
          <DesktopBlackButton label="MEETUP CHAT" onPress={() => router.push(`/meetup-chat/${meetup.id}`)} />
          {!isHost && (
            <DesktopStripeButton label={checkoutLoading ? 'LOADING...' : 'PAY NOW'} onPress={() => currentUserMember && openCheckout(currentUserMember.id, currentUserMember.spots ?? 1)} disabled={checkoutLoading} />
          )}
          {!isHost && (
            <DesktopOutlineButton label="CANCEL RESERVATION" onPress={async () => {
              await cancelPendingReservation(meetup.id);
              const m = await getMeetupMembers(meetup.id);
              setMembers(m);
            }} />
          )}
        </>
      );
    }

    if (isMember) {
      return (
        <>
          <DesktopBlackButton label="MEETUP CHAT" onPress={() => router.push(`/meetup-chat/${meetup.id}`)} />
          {!isHost && (
            <DesktopOutlineButton label="LEAVE" onPress={handleLeave} />
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
            <DesktopOutlineButton label="LEAVE WAITLIST" onPress={async () => {
              await leaveWaitlist(meetup.id);
              setWaitlistPosition(null);
              setWaitlistEntries(prev => prev.filter(e => e.user_id !== currentUserId));
            }} />
          </>
        );
      }
      return (
        <DesktopBlackButton
          label={`JOIN WAITLIST${(meetup.waitlist_count ?? 0) > 0 ? ` (${meetup.waitlist_count} WAITING)` : ''}`}
          onPress={async () => {
            if (!isPaidMember) { setShowUpgradeModal(true); return; }
            await joinWaitlist(meetup.id);
            const pos = await getWaitlistPosition(meetup.id);
            setWaitlistPosition(pos);
            const entries = await getWaitlistEntries(meetup.id);
            setWaitlistEntries(entries);
          }}
          style={{ backgroundColor: '#6C757D' }}
        />
      );
    }
    return <DesktopBlackButton label="JOIN MEETUP" onPress={handleJoin} />;
  };

  const renderMobileActionButtons = () => {
    if (isFeMeetupWithPayment) {
      if (!isMember) {
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
                if (!isPaidMember) { setShowUpgradeModal(true); return; }
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

      if (currentPaymentStatus === 'paid' || currentPaymentStatus === 'waived') {
        const badgeColor = PAYMENT_BADGE_COLORS[currentPaymentStatus];

        const renderCancellationButton = () => {
          if (isHost || currentPaymentStatus !== 'paid' || !currentUserMember) return null;
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
                  const success = await withdrawAndRefund(meetup.id, currentUserMember.id, currentUserMember.spots ?? 1);
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
              onPress={() => currentUserMember && openCheckout(currentUserMember.id, currentUserMember.spots ?? 1)}
            >
              <Text style={styles.stripeBtnText}>{checkoutLoading ? 'Loading...' : 'Pay Now'}</Text>
            </Pressable>
          )}
          {!isHost && (
            <Pressable style={styles.actionBtnOutline} onPress={async () => {
              await cancelPendingReservation(meetup.id);
              const m = await getMeetupMembers(meetup.id);
              setMembers(m);
            }}>
              <Text style={styles.actionBtnOutlineText}>Cancel Reservation</Text>
            </Pressable>
          )}
        </>
      );
    }

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
            if (!isPaidMember) { setShowUpgradeModal(true); return; }
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
      <ResponsiveContainer>
      {isDesktop ? (
        <View style={styles.desktopTopBar}>
          <DesktopBackButton onPress={() => router.canGoBack() ? router.back() : router.push('/meetups')} />
          {canManage && (
            <View style={styles.desktopManageRight}>
              <DesktopBackStyleButton label="EDIT" onPress={() => router.push(`/create-meetup?meetupId=${meetup.id}`)} />
              <DesktopBackStyleButton label="DELETE" onPress={() => {
                if (confirm('Delete this meetup? This cannot be undone.')) {
                  deleteMeetup(meetup.id).then(() => router.back());
                }
              }} />
            </View>
          )}
        </View>
      ) : (
        <DetailHeader title="MEETUP" />
      )}

      <ScrollView {...desktopScrollProps} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.heroSection}>
          {meetup.image ? (
            <Image source={{ uri: meetup.image }} style={isDesktop ? styles.meetupImageDesktop : styles.meetupImage} resizeMode={isDesktop ? 'cover' : undefined} />
          ) : (
            <View style={isDesktop ? styles.meetupImagePlaceholderDesktop : styles.meetupImagePlaceholder}>
              <Ionicons name="calendar" size={isDesktop ? 60 : 40} color={Colors.gray} />
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

        {!isDesktop && canManage && (
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
        <View style={[styles.actionRow, isDesktop && styles.actionRowDesktop]}>
          {isDesktop ? (
            <>
              {renderDesktopActionButtons()}
              <DesktopShareButton onPress={handleShare} />
            </>
          ) : (
            <>
              {renderMobileActionButtons()}
              <Pressable style={styles.actionBtnOutline} onPress={handleShare}>
                <Ionicons name="share-outline" size={16} color={Colors.black} />
              </Pressable>
            </>
          )}
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
              {(() => { const p = profiles.find(pr => pr.id === m.user_id); return p && (!p.subscription_tier || p.subscription_tier === 'free') ? <GuestBadge style={{ marginLeft: 6 }} /> : null; })()}
              {m.user_id === meetup.host_id && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Host</Text>
                </View>
              )}
              {(m.spots ?? 1) > 1 && (
                <View style={[styles.paymentBadge, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.paymentBadgeText, { color: '#0C5460' }]}>x{m.spots}</Text>
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
                {(() => { const p = profiles.find(pr => pr.id === e.user_id); return p && (!p.subscription_tier || p.subscription_tier === 'free') ? <GuestBadge style={{ marginLeft: 6 }} /> : null; })()}
                <View style={[styles.paidBadge, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.paidBadgeText, { color: '#0C5460', fontSize: 11 }]}>#{e.position}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Spot Selection Modal */}
      <Modal visible={showSpotModal} transparent animationType="fade" onRequestClose={() => setShowSpotModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How many spots?</Text>
            {isFeMeetupWithPayment && meetup.cost_cents ? (
              <Text style={styles.modalSubtitle}>
                ${(meetup.cost_cents / 100).toFixed(2)} per spot
              </Text>
            ) : null}
            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalSpotBtn}
                onPress={() => handleSpotSelection(1)}
              >
                <Text style={styles.modalSpotBtnText}>1 Spot</Text>
                {isFeMeetupWithPayment && meetup.cost_cents ? (
                  <Text style={styles.modalSpotPrice}>${(meetup.cost_cents / 100).toFixed(2)}</Text>
                ) : null}
              </Pressable>
              {slotsRemaining >= 2 && (
                <Pressable
                  style={styles.modalSpotBtn}
                  onPress={() => handleSpotSelection(2)}
                >
                  <Text style={styles.modalSpotBtnText}>2 Spots</Text>
                  {isFeMeetupWithPayment && meetup.cost_cents ? (
                    <Text style={styles.modalSpotPrice}>${((meetup.cost_cents * 2) / 100).toFixed(2)}</Text>
                  ) : null}
                </Pressable>
              )}
            </View>
            <Pressable style={styles.modalCancelBtn} onPress={() => setShowSpotModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Payment Warning Modal */}
      <Modal visible={showPaymentWarning} transparent animationType="fade" onRequestClose={() => setShowPaymentWarning(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={32} color="#856404" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.modalTitle}>Payment Incomplete</Text>
            <Text style={styles.modalSubtitle}>Your spot is not being held. Complete payment to secure your reservation.</Text>
            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.stripeBtn, checkoutLoading && { opacity: 0.6 }]}
                disabled={checkoutLoading}
                onPress={async () => {
                  setShowPaymentWarning(false);
                  if (currentUserMember) {
                    await openCheckout(currentUserMember.id, currentUserMember.spots ?? 1);
                  }
                }}
              >
                <Text style={styles.stripeBtnText}>{checkoutLoading ? 'Loading...' : 'Complete Payment'}</Text>
              </Pressable>
              <Pressable
                style={styles.actionBtnOutline}
                onPress={async () => {
                  setShowPaymentWarning(false);
                  await cancelPendingReservation(meetup.id);
                  const m = await getMeetupMembers(meetup.id);
                  setMembers(m);
                }}
              >
                <Text style={styles.actionBtnOutlineText}>Cancel Reservation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      </ResponsiveContainer>
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
  actionRowDesktop: { flexWrap: 'wrap' },
  desktopTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  desktopManageRight: { flexDirection: 'row', gap: 10 },
  meetupImageDesktop: { width: '42%', aspectRatio: 1, borderRadius: 8, alignSelf: 'center' } as any,
  meetupImagePlaceholderDesktop: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  modalSpotBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: Colors.black,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSpotBtnText: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  modalSpotPrice: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  modalCancelBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
  },
});
