import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '@/data/supabase';
import PlatformPressable from '@/components/PlatformPressable';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Activity, Profile, Writeup, Post } from '@/types';
import WordHighlight from '@/components/WordHighlight';
import LinkPreview from '@/components/LinkPreview';
import VerifiedBadge from '@/components/VerifiedBadge';
import TutorialPopup from '@/components/TutorialPopup';

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

const REACTION_EMOJI: Record<string, string> = {
  like: '\uD83D\uDC4D',
  love: '\u2764\uFE0F',
  fire: '\uD83D\uDD25',
  laugh: '\uD83D\uDE02',
};

function ActivityItem({ item, onPress, writeups, profiles, posts }: { item: Activity; onPress: () => void; writeups: Writeup[]; profiles: Profile[]; posts: Post[] }) {
  const userProfile = profiles.find(p => p.id === item.user_id);
  const thumbnail = item.type === 'writeup' && item.writeup_id
    ? writeups.find(w => w.id === item.writeup_id)?.photos[0]?.url
    : item.type === 'post' && item.post_id
      ? posts.find(p => p.id === item.post_id)?.photos[0]?.url
      : undefined;

  const isVerified = !!userProfile?.is_verified;

  if (item.type === 'post') {
    const name = item.user_name ?? '';
    const post = item.post_id ? posts.find(p => p.id === item.post_id) : null;
    const isLinkPost = !!post?.link_url;
    const contentPreview = (item.post_content ?? '').length > 80
      ? (item.post_content ?? '').slice(0, 80) + '...'
      : item.post_content ?? '';
    const reactionSummary = post
      ? Object.entries(post.reactions)
          .filter(([, count]) => count > 0)
          .map(([key, count]) => `${REACTION_EMOJI[key] ?? key} ${count}`)
          .join('  ')
      : '';

    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> posted</Text>
          </View>
          {contentPreview ? (
            <Text style={styles.postPreview} numberOfLines={2}>{contentPreview}</Text>
          ) : null}
          {isLinkPost && post ? (
            <LinkPreview
              url={post.link_url!}
              title={post.link_title}
              description={post.link_description}
              image={post.link_image}
            />
          ) : null}
          <View style={styles.socialRow}>
            {reactionSummary ? (
              <Text style={styles.reactionSummary}>{reactionSummary}</Text>
            ) : null}
            {post && post.reply_count > 0 ? (
              <View style={styles.commentCount}>
                <Ionicons name="chatbubble-outline" size={12} color={Colors.gray} />
                <Text style={styles.commentCountText}>{post.reply_count} {post.reply_count === 1 ? 'comment' : 'comments'}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
        {!isLinkPost && thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        )}
      </PlatformPressable>
    );
  }

  if (item.type === 'post_reply') {
    const name = item.user_name ?? '';
    const post = item.post_id ? posts.find(p => p.id === item.post_id) : null;
    const postDisplayName = post
      ? post.link_title
        ? decodeEntities(post.link_title)
        : post.content
          ? post.content.length > 50 ? post.content.slice(0, 50) + '...' : post.content
          : 'a post'
      : 'a post';
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> commented on </Text>
            <Text style={styles.activityTextBold}>{postDisplayName}</Text>
          </View>
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </PlatformPressable>
    );
  }

  if (item.type === 'writeup_reply') {
    const name = item.user_name ?? '';
    const writeupDisplayName = item.writeup_title ?? 'a review';
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> commented on </Text>
            <Text style={styles.activityTextBold}>{writeupDisplayName}</Text>
          </View>
          <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </PlatformPressable>
    );
  }

  if (item.type === 'group_created') {
    const name = item.user_name ?? '';
    const groupName = item.group_name ?? 'a group';
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon}>
            <Ionicons name="people" size={16} color={Colors.black} />
          </View>
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> created a group </Text>
            <Text style={styles.activityTextBold}>{groupName}</Text>
          </View>
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </PlatformPressable>
    );
  }

  if (item.type === 'meetup_created') {
    const name = item.user_name ?? '';
    const meetupName = item.meetup_name ?? 'a meetup';
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon}>
            <Ionicons name="calendar" size={16} color={Colors.black} />
          </View>
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> created a meetup </Text>
            <Text style={styles.activityTextBold}>{meetupName}</Text>
          </View>
          {item.course_name ? (
            <View style={styles.activityRow}>
              <Text style={styles.activityText}>at </Text>
              <WordHighlight words={(item.course_name).split(' ')} size={12} />
            </View>
          ) : null}
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </PlatformPressable>
    );
  }

  if (item.type === 'meetup_signup') {
    const name = item.user_name ?? '';
    const meetupName = item.meetup_name ?? 'a meetup';
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon}>
            <Ionicons name="person-add" size={16} color={Colors.black} />
          </View>
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> signed up for </Text>
            <Text style={styles.activityTextBold}>{meetupName}</Text>
          </View>
          {item.course_name ? (
            <View style={styles.activityRow}>
              <Text style={styles.activityText}>at </Text>
              <WordHighlight words={(item.course_name).split(' ')} size={12} />
            </View>
          ) : null}
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </PlatformPressable>
    );
  }

  if (item.type === 'writeup') {
    const name = item.user_name ?? '';
    const writeup = item.writeup_id ? writeups.find(w => w.id === item.writeup_id) : null;
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> posted a review on{' '}</Text>
          </View>
          <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
          {writeup && writeup.reply_count > 0 ? (
            <View style={styles.commentCount}>
              <Ionicons name="chatbubble-outline" size={12} color={Colors.gray} />
              <Text style={styles.commentCountText}>{writeup.reply_count} {writeup.reply_count === 1 ? 'comment' : 'comments'}</Text>
            </View>
          ) : null}
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
        {thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        )}
      </PlatformPressable>
    );
  }

  if (item.type === 'played') {
    const name = item.user_name ?? '';
    return (
      <PlatformPressable style={styles.activityItem} onPress={onPress}>
        {userProfile?.image ? (
          <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
        ) : (
          <View style={styles.activityIcon} />
        )}
        <View style={styles.activityContent}>
          <View style={styles.activityRow}>
            <Text style={styles.activityTextBold}>{name}</Text>
            {isVerified && <VerifiedBadge size={12} />}
            <Text style={styles.activityText}> played{' '}</Text>
          </View>
          <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
          <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
        </View>
      </PlatformPressable>
    );
  }

  const name = item.user_name ?? '';
  const targetName = item.target_user_name ?? '';

  return (
    <PlatformPressable style={styles.activityItem} onPress={onPress}>
      {userProfile?.image ? (
        <Image source={{ uri: userProfile.image }} style={styles.activityAvatar} />
      ) : (
        <View style={styles.activityIcon}>
          <Ionicons name="thumbs-up-outline" size={16} color={Colors.black} />
        </View>
      )}
      <View style={styles.activityContent}>
        <View style={styles.activityRow}>
          <Text style={styles.activityTextBold}>{name}</Text>
          {isVerified && <VerifiedBadge size={12} />}
          <Text style={styles.activityText}> liked </Text>
          <Text style={styles.activityTextBold}>{targetName}</Text>
          <Text style={styles.activityText}>{'\'s review on'}</Text>
        </View>
        <WordHighlight words={(item.course_name ?? '').split(' ')} size={12} />
        <Text style={styles.activityTime}>{formatTime(item.created_at)}</Text>
      </View>
    </PlatformPressable>
  );
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function FeedScreen() {
  const { activities, writeups, profiles, posts, session, user, followingIds, toggleFollow, isFollowing, getFollowerCount } = useStore();
  const router = useRouter();
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'FOLLOWING'>('ALL');
  const [activityFilter, setActivityFilter] = useState<'all' | 'posts' | 'reviews'>('all');
  const [showFollowRibbon, setShowFollowRibbon] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('followRibbonDismissed').then(val => {
      if (val !== 'true') setShowFollowRibbon(true);
    });
  }, []);

  const dismissRibbon = () => {
    setShowFollowRibbon(false);
    AsyncStorage.setItem('followRibbonDismissed', 'true');
  };

  const ribbonHidden = !showFollowRibbon || followingIds.size >= 5;

  const recommendedMembers = useMemo(() => {
    if (!session?.user?.id) return [];
    const currentUserId = session.user.id;
    const friedEgg = profiles.find(p => p.name.toLowerCase().includes('fried egg'));
    const candidates = profiles.filter(p =>
      p.id !== currentUserId && !followingIds.has(p.id)
    );
    const sorted = [...candidates].sort((a, b) => getFollowerCount(b.id) - getFollowerCount(a.id));
    const result: Profile[] = [];
    if (friedEgg && friedEgg.id !== currentUserId && !followingIds.has(friedEgg.id)) {
      result.push(friedEgg);
    }
    for (const p of sorted) {
      if (result.length >= 3) break;
      if (!result.find(r => r.id === p.id)) {
        result.push(p);
      }
    }
    return result;
  }, [profiles, session, followingIds, getFollowerCount]);

  if (!session) return null;

  const ACTIVITY_TYPE_MAP: Record<string, string[]> = {
    posts: ['post', 'post_reply'],
    reviews: ['writeup'],
  };

  const filteredActivities = activities.filter(a => {
    if (feedFilter === 'FOLLOWING' && !followingIds.has(a.user_id)) return false;
    if (activityFilter !== 'all' && !ACTIVITY_TYPE_MAP[activityFilter]?.includes(a.type)) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <PlatformPressable
          style={[styles.filterTab, feedFilter === 'ALL' && styles.filterTabActive]}
          onPress={() => setFeedFilter('ALL')}
        >
          <Text style={[styles.filterTabText, feedFilter === 'ALL' && styles.filterTabTextActive]}>ALL</Text>
        </PlatformPressable>
        <PlatformPressable
          style={[styles.filterTab, feedFilter === 'FOLLOWING' && styles.filterTabActive]}
          onPress={() => setFeedFilter('FOLLOWING')}
        >
          <Text style={[styles.filterTabText, feedFilter === 'FOLLOWING' && styles.filterTabTextActive]}>FOLLOWING</Text>
        </PlatformPressable>
      </View>
      {/* Activity type filter chips — hidden for now, revisit later
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilterRow} contentContainerStyle={styles.typeFilterContent}>
        {([['all', 'ALL'], ['posts', 'POSTS ONLY'], ['reviews', 'REVIEWS ONLY']] as const).map(([val, label]) => (
          <PlatformPressable
            key={val}
            style={[styles.typeChip, activityFilter === val && styles.typeChipActive]}
            onPress={() => setActivityFilter(val)}
          >
            <Text style={[styles.typeChipText, activityFilter === val && styles.typeChipTextActive]}>
              {label}
            </Text>
          </PlatformPressable>
        ))}
      </ScrollView>
      */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityItem
            item={item}
            writeups={writeups}
            profiles={profiles}
            posts={posts}
            onPress={() => {
              if (item.type === 'group_created' && item.group_id) router.push(`/group/${item.group_id}`);
              else if ((item.type === 'meetup_created' || item.type === 'meetup_signup') && item.meetup_id) router.push(`/meetup/${item.meetup_id}`);
              else if (item.type === 'post' && item.post_id) router.push(`/post/${item.post_id}`);
              else if (item.type === 'post_reply' && item.post_id) router.push(`/post/${item.post_id}`);
              else if (item.type === 'writeup_reply' && item.writeup_id) router.push(`/writeup/${item.writeup_id}`);
              else if (item.writeup_id) router.push(`/writeup/${item.writeup_id}`);
              else if (item.type === 'played' && item.course_id) router.push(`/course/${item.course_id}`);
            }}
          />
        )}
        ListHeaderComponent={!ribbonHidden && recommendedMembers.length > 0 ? (
          <View style={styles.ribbonContainer}>
            <View style={styles.ribbonHeader}>
              <Text style={styles.ribbonTitle}>Members to Follow</Text>
              <PlatformPressable onPress={dismissRibbon} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.gray} />
              </PlatformPressable>
            </View>
            <View style={styles.ribbonCards}>
              {recommendedMembers.map(member => (
                <PlatformPressable key={member.id} style={styles.ribbonCard} onPress={() => router.push(`/member/${member.id}`)}>
                  {member.image ? (
                    <Image source={{ uri: member.image }} style={styles.ribbonAvatar} />
                  ) : (
                    <View style={styles.ribbonAvatarPlaceholder}>
                      <Ionicons name="person" size={20} color={Colors.gray} />
                    </View>
                  )}
                  <Text style={styles.ribbonName} numberOfLines={1}>{member.name}</Text>
                  <PlatformPressable
                    style={[styles.ribbonFollowBtn, isFollowing(member.id) && styles.ribbonFollowingBtn]}
                    onPress={(e) => { e.stopPropagation(); toggleFollow(member.id); }}
                  >
                    <Text style={[styles.ribbonFollowText, isFollowing(member.id) && styles.ribbonFollowingText]}>
                      {isFollowing(member.id) ? 'Following' : 'Follow'}
                    </Text>
                  </PlatformPressable>
                </PlatformPressable>
              ))}
            </View>
            <PlatformPressable onPress={() => router.push('/members')} style={styles.ribbonSeeAll}>
              <Text style={styles.ribbonSeeAllText}>See All Members</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.black} />
            </PlatformPressable>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Write your first course review to get started
            </Text>
          </View>
        }
        contentContainerStyle={filteredActivities.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <PlatformPressable
        style={styles.fab}
        onPress={() => setShowFabMenu(true)}
      >
        <Ionicons name="add" size={28} color={Colors.black} />
      </PlatformPressable>

      <Modal
        visible={showFabMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFabMenu(false)}
      >
        <PlatformPressable style={styles.modalBackdrop} onPress={() => setShowFabMenu(false)}>
          <View style={styles.modalSheet}>
            <PlatformPressable
              style={styles.modalOption}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/create-writeup');
              }}
            >
              <View style={styles.modalIconBox}>
                <Ionicons name="document-text-outline" size={22} color={Colors.black} />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Review</Text>
                <Text style={styles.modalOptionDesc}>Write a course review</Text>
              </View>
            </PlatformPressable>
            <View style={styles.modalSeparator} />
            <PlatformPressable
              style={styles.modalOption}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/create-post');
              }}
            >
              <View style={styles.modalIconBox}>
                <Ionicons name="chatbubble-outline" size={22} color={Colors.black} />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Post</Text>
                <Text style={styles.modalOptionDesc}>Share an update with the club</Text>
              </View>
            </PlatformPressable>
            <View style={styles.modalSeparator} />
            <PlatformPressable
              style={styles.modalOption}
              onPress={() => {
                setShowFabMenu(false);
                setShowInvite(true);
              }}
            >
              <View style={[styles.modalIconBox, { backgroundColor: Colors.orange }]}>
                <Ionicons name="person-add-outline" size={20} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.modalOptionTitle}>Invite a Friend</Text>
                <Text style={styles.modalOptionDesc}>Inviting friends makes FEGC better</Text>
              </View>
            </PlatformPressable>
          </View>
        </PlatformPressable>
      </Modal>

      <Modal
        visible={showInvite}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvite(false)}
      >
        <Pressable style={styles.inviteBackdrop} onPress={() => setShowInvite(false)}>
          <Pressable style={styles.inviteModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.inviteTitle}>Invite a Friend</Text>
            <Text style={styles.inviteSubtitle}>Inviting friends makes FEGC better for everyone.</Text>
            <TextInput
              style={styles.inviteInput}
              placeholder="Friend's email address"
              placeholderTextColor={Colors.gray}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.inviteInput, { minHeight: 80 }]}
              placeholder="Add a personal note (optional)"
              placeholderTextColor={Colors.gray}
              value={inviteNote}
              onChangeText={setInviteNote}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.inviteActions}>
              <Pressable
                style={styles.inviteCancelBtn}
                onPress={() => {
                  setShowInvite(false);
                  setInviteEmail('');
                  setInviteNote('');
                }}
              >
                <Text style={styles.inviteCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.inviteSendBtn, (!inviteEmail.trim() || inviteSending) && { opacity: 0.4 }]}
                disabled={!inviteEmail.trim() || inviteSending}
                onPress={async () => {
                  setInviteSending(true);
                  try {
                    const { error } = await supabase.functions.invoke('send-invite', {
                      body: {
                        to_email: inviteEmail.trim(),
                        sender_name: user?.name ?? 'A fellow golfer',
                        note: inviteNote.trim() || null,
                      },
                    });
                    if (error) throw error;
                    setShowInvite(false);
                    setInviteEmail('');
                    setInviteNote('');
                    if (Platform.OS === 'web') {
                      window.alert('Invite sent!');
                    } else {
                      Alert.alert('Invite Sent', 'Your friend will receive an email invitation.');
                    }
                  } catch (e) {
                    console.error('Failed to send invite:', e);
                    if (Platform.OS === 'web') {
                      window.alert('Failed to send invite. Please try again.');
                    } else {
                      Alert.alert('Error', 'Failed to send invite. Please try again.');
                    }
                  } finally {
                    setInviteSending(false);
                  }
                }}
              >
                <Text style={styles.inviteSendText}>{inviteSending ? 'Sending...' : 'Send Invite'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TutorialPopup
        storageKey="tutorial_welcome"
        title="Welcome to FEGC"
        paragraphs={[
          'Welcome to the Fried Egg Golf Club! FEGC is a community of golfers who share a love for the game and the courses we play.',
          'Here you can write course reviews, share posts, organize meetups, and connect with fellow golfers.',
          'We encourage you to participate, share your experiences, and be respectful of other members. Enjoy the club!',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.black,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1,
  },
  filterTabTextActive: {
    color: Colors.black,
  },
  typeFilterRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  typeFilterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  typeChipActive: {
    backgroundColor: Colors.orange,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  typeChipTextActive: {
    color: Colors.black,
  },
  list: {
    paddingVertical: 8,
  },
  activityItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 21,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
  },
  activityTextBold: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 21,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
  postPreview: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 20,
    marginTop: 4,
    fontFamily: Fonts!.sans,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  reactionSummary: {
    fontSize: 13,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCountText: {
    fontSize: 13,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 4,
    fontFamily: Fonts!.sans,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 64,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  arrowText: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  fab: {
    position: 'absolute',
    bottom: 92,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  modalOptionDesc: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 58,
  },
  inviteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inviteModal: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  inviteTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginBottom: 16,
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts!.sans,
    color: Colors.black,
    marginBottom: 12,
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  inviteCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inviteCancelText: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
  },
  inviteSendBtn: {
    backgroundColor: Colors.black,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inviteSendText: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  ribbonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  ribbonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ribbonTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  ribbonCards: {
    flexDirection: 'row',
    gap: 12,
  },
  ribbonCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ribbonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  ribbonAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonName: {
    fontSize: 13,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
    textAlign: 'center',
    maxWidth: 90,
  },
  ribbonFollowBtn: {
    backgroundColor: Colors.black,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  ribbonFollowingBtn: {
    backgroundColor: Colors.lightGray,
  },
  ribbonFollowText: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  ribbonFollowingText: {
    color: Colors.black,
  },
  ribbonSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  ribbonSeeAllText: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
});
