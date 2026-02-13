import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User, Course, Writeup, Photo, Activity, Profile, CoursePlayed, Post, PostPhoto, PostReply, WriteupReply, Follow, Conversation, Message, UserBlock, Group, GroupMember, GroupMessage, Meetup, MeetupMember, MeetupMessage, ConversationListItem, Notification, profileToUser } from '@/types';

interface StoreContextType {
  session: Session | null;
  user: User | null;
  writeups: Writeup[];
  activities: Activity[];
  courses: Course[];
  profiles: Profile[];
  coursesPlayed: CoursePlayed[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  needsPasswordReset: boolean;
  clearPasswordReset: () => void;
  saveUser: (user: User) => Promise<void>;
  addWriteup: (data: { courseId: string; title: string; content: string; photos: { url: string; caption: string }[] }) => Promise<Writeup>;
  updateWriteup: (writeupId: string, data: { title: string; content: string; photos: { id?: string; url: string; caption: string }[] }) => Promise<void>;
  deleteWriteup: (writeupId: string) => Promise<void>;
  toggleWriteupReaction: (writeupId: string, reaction: string) => Promise<void>;
  togglePhotoUpvote: (photoId: string) => Promise<void>;
  getWriteupsForCourse: (courseId: string) => Writeup[];
  getCourseName: (courseId: string) => string;
  getUserName: (userId: string) => string;
  markCoursePlayed: (courseId: string) => Promise<void>;
  unmarkCoursePlayed: (courseId: string) => Promise<void>;
  posts: Post[];
  addPost: (data: { content: string; photos: { url: string; caption: string }[] }) => Promise<Post>;
  togglePostReaction: (postId: string, reaction: string) => Promise<void>;
  getPostReplies: (postId: string) => Promise<PostReply[]>;
  addPostReply: (postId: string, content: string) => Promise<PostReply>;
  getWriteupReplies: (writeupId: string) => Promise<WriteupReply[]>;
  addWriteupReply: (writeupId: string, content: string) => Promise<WriteupReply>;
  deletePost: (postId: string) => Promise<void>;
  flagContent: (contentType: 'post' | 'writeup', contentId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  // Follows
  follows: Follow[];
  followingIds: Set<string>;
  toggleFollow: (targetUserId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  getFollowerCount: (userId: string) => number;
  getFollowingCount: (userId: string) => number;
  // Conversations / DMs
  conversations: Conversation[];
  blockedUserIds: Set<string>;
  blockedByIds: Set<string>;
  loadConversations: () => Promise<void>;
  getOrCreateConversation: (otherUserId: string) => Promise<string>;
  getMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, content: string) => Promise<Message>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  toggleDms: (disabled: boolean) => Promise<void>;
  isBlocked: (userId: string) => boolean;
  isBlockedBy: (userId: string) => boolean;
  dmsDisabled: boolean;
  hasUnreadMessages: boolean;
  markConversationRead: (conversationId: string) => Promise<void>;
  // Groups
  groups: Group[];
  conversationListItems: ConversationListItem[];
  loadGroups: () => Promise<void>;
  createGroup: (data: { name: string; description: string; home_course_id: string | null; location_name: string; image: string | null }) => Promise<Group>;
  updateGroup: (groupId: string, data: { name: string; description: string; home_course_id: string | null; location_name: string; image: string | null }) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  getGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  getGroupMessages: (groupId: string) => Promise<GroupMessage[]>;
  sendGroupMessage: (groupId: string, content: string) => Promise<GroupMessage>;
  markGroupRead: (groupId: string) => Promise<void>;
  // Meetups
  meetups: Meetup[];
  loadMeetups: () => Promise<void>;
  createMeetup: (data: { name: string; description: string; course_id: string | null; location_name: string; meetup_date: string; cost: string; total_slots: number; host_takes_slot: boolean; image: string | null; is_fe_coordinated?: boolean; stripe_payment_url?: string | null; host_id?: string | null }) => Promise<Meetup>;
  updateMeetup: (meetupId: string, data: { name: string; description: string; course_id: string | null; location_name: string; meetup_date: string; cost: string; total_slots: number; host_takes_slot: boolean; image: string | null; is_fe_coordinated?: boolean; stripe_payment_url?: string | null }) => Promise<void>;
  deleteMeetup: (meetupId: string) => Promise<void>;
  joinMeetup: (meetupId: string) => Promise<void>;
  leaveMeetup: (meetupId: string) => Promise<void>;
  getMeetupMembers: (meetupId: string) => Promise<MeetupMember[]>;
  getMeetupMessages: (meetupId: string) => Promise<MeetupMessage[]>;
  sendMeetupMessage: (meetupId: string, content: string) => Promise<MeetupMessage>;
  markMeetupRead: (meetupId: string) => Promise<void>;
  // Notifications
  notifications: Notification[];
  hasUnreadNotifications: boolean;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [coursesPlayed, setCoursesPlayed] = useState<CoursePlayed[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, string>>(new Map());
  const coursesRef = useRef<Course[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [blockedByIds, setBlockedByIds] = useState<Set<string>>(new Set());
  const [dmsDisabled, setDmsDisabled] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const groupsRef = useRef<Group[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const meetupsRef = useRef<Meetup[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  const followingIds = React.useMemo(() => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) return new Set<string>();
    return new Set(follows.filter(f => f.follower_id === currentUserId).map(f => f.following_id));
  }, [follows, session]);

  const hasUnreadGroupMessages = React.useMemo(() => {
    return groups.some(g => g._has_unread);
  }, [groups]);

  const hasUnreadMeetupMessages = React.useMemo(() => {
    return meetups.some(m => m._has_unread);
  }, [meetups]);

  const hasUnreadMessages = React.useMemo(
    () => conversations.some(c => c.unread) || hasUnreadGroupMessages || hasUnreadMeetupMessages,
    [conversations, hasUnreadGroupMessages, hasUnreadMeetupMessages],
  );

  const hasUnreadNotifications = React.useMemo(
    () => notifications.some(n => !n.is_read),
    [notifications],
  );

  const conversationListItems = React.useMemo((): ConversationListItem[] => {
    const dmItems: ConversationListItem[] = conversations.map(c => ({
      id: c.id,
      type: 'dm' as const,
      name: c.other_user_name ?? 'Member',
      image: c.other_user_image ?? null,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      unread: c.unread ?? false,
      other_user_id: c.user1_id === session?.user?.id ? c.user2_id : c.user1_id,
    }));

    const groupItems: ConversationListItem[] = groups
      .filter(g => g.is_member)
      .map(g => ({
        id: g.id,
        type: 'group' as const,
        name: g.name,
        image: g.image,
        last_message: g._last_message,
        last_message_at: g._last_message_at,
        unread: g._has_unread ?? false,
        group_id: g.id,
        member_count: g.member_count,
      }));

    const meetupItems: ConversationListItem[] = meetups
      .filter(m => m.is_member)
      .map(m => ({
        id: m.id,
        type: 'meetup' as const,
        name: m.name,
        image: m.image,
        last_message: m._last_message,
        last_message_at: m._last_message_at,
        unread: m._has_unread ?? false,
        meetup_id: m.id,
        member_count: m.member_count,
      }));

    return [...dmItems, ...groupItems, ...meetupItems].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [conversations, groups, meetups, session]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    meetupsRef.current = meetups;
  }, [meetups]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        loadProfile(s.user.id);
        loadData();
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordReset(true);
      }
      if (s) {
        loadProfile(s.user.id);
        loadData();
      } else {
        setUser(null);
        setWriteups([]);
        setActivities([]);
        setPosts([]);
        setFollows([]);
        setConversations([]);
        setBlockedUserIds(new Set());
        setBlockedByIds(new Set());
        setDmsDisabled(false);
        setGroups([]);
        setMeetups([]);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global polling for unread badges — refreshes conversations, groups, meetups every 15s
  useEffect(() => {
    if (!session) return;
    const userId = session.user.id;

    const poll = () => {
      loadConversations(userId);
      loadGroupsData(userId);
      loadMeetupsData(userId);
      loadNotificationsData(userId);
    };

    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [session]);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      const profile = data as Profile;
      if (profile.suspended) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return;
      }
      setUser(profileToUser(profile));
    }
  }

  async function loadData() {
    try {
      const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;

      const [coursesRes, writeupsRes, profilesRes, playedRes, postsRes, followsRes, blockerRes, blockedRes] = await Promise.all([
        supabase.from('courses').select('*').order('name'),
        loadWriteups(),
        supabase.from('profiles').select('*').order('name'),
        supabase.from('courses_played').select('*'),
        loadPosts(),
        currentUserId
          ? supabase.from('follows').select('*').or(`follower_id.eq.${currentUserId},following_id.eq.${currentUserId}`)
          : { data: [] },
        currentUserId
          ? supabase.from('user_blocks').select('*').eq('blocker_id', currentUserId)
          : { data: [] },
        currentUserId
          ? supabase.from('user_blocks').select('*').eq('blocked_id', currentUserId)
          : { data: [] },
      ]);

      const loadedCourses = coursesRes.data ?? [];
      if (loadedCourses.length) {
        setCourses(loadedCourses);
        coursesRef.current = loadedCourses;
      }
      if (writeupsRes) setWriteups(writeupsRes);
      if (profilesRes.data) {
        setProfiles(profilesRes.data);
        // Set dmsDisabled from own profile
        if (currentUserId) {
          const ownProfile = profilesRes.data.find((p: Profile) => p.id === currentUserId);
          if (ownProfile) setDmsDisabled(!!ownProfile.dms_disabled);
        }
      }
      if (playedRes.data) setCoursesPlayed(playedRes.data);
      if (postsRes) setPosts(postsRes);
      if (followsRes.data) setFollows(followsRes.data);
      if (blockerRes.data) setBlockedUserIds(new Set(blockerRes.data.map((b: UserBlock) => b.blocked_id)));
      if (blockedRes.data) setBlockedByIds(new Set(blockedRes.data.map((b: UserBlock) => b.blocker_id)));

      const [activitiesRes] = await Promise.all([
        loadActivities(loadedCourses),
        currentUserId ? loadConversations(currentUserId) : Promise.resolve(),
        currentUserId ? loadGroupsData(currentUserId) : Promise.resolve(),
        currentUserId ? loadMeetupsData(currentUserId) : Promise.resolve(),
        currentUserId ? loadNotificationsData(currentUserId) : Promise.resolve(),
      ]);
      if (activitiesRes) setActivities(activitiesRes);
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadWriteups(): Promise<Writeup[]> {
    const { data: rawWriteups } = await supabase
      .from('writeups')
      .select('*')
      .eq('hidden', false)
      .order('created_at', { ascending: false });

    if (!rawWriteups || rawWriteups.length === 0) return [];

    // Load photos for all writeups
    const writeupIds = rawWriteups.map(w => w.id);
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .in('writeup_id', writeupIds);

    // Load reactions for writeups
    const { data: writeupReactions } = await supabase
      .from('writeup_reactions')
      .select('writeup_id, user_id, reaction')
      .in('writeup_id', writeupIds);

    // Load photo upvote counts
    const photoIds = (photos ?? []).map(p => p.id);
    const { data: photoUpvotes } = photoIds.length > 0
      ? await supabase
          .from('photo_upvotes')
          .select('photo_id, user_id')
          .in('photo_id', photoIds)
      : { data: [] };

    // Load reply counts
    const { data: writeupRepliesData } = await supabase
      .from('writeup_replies')
      .select('writeup_id')
      .in('writeup_id', writeupIds);

    const replyCountByWriteup = new Map<string, number>();
    for (const r of writeupRepliesData ?? []) {
      replyCountByWriteup.set(r.writeup_id, (replyCountByWriteup.get(r.writeup_id) ?? 0) + 1);
    }

    // Load profile names for all authors
    const authorIds = [...new Set(rawWriteups.map(w => w.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', authorIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));
    // Update cache
    setProfileCache(prev => {
      const next = new Map(prev);
      for (const [id, name] of profileMap) next.set(id, name);
      return next;
    });

    const currentUserId = session?.user?.id;

    const photosByWriteup = new Map<string, Photo[]>();
    for (const photo of photos ?? []) {
      const upvotes = (photoUpvotes ?? []).filter(u => u.photo_id === photo.id);
      const enrichedPhoto: Photo = {
        ...photo,
        upvote_count: upvotes.length,
        user_has_upvoted: currentUserId ? upvotes.some(u => u.user_id === currentUserId) : false,
      };
      const list = photosByWriteup.get(photo.writeup_id) ?? [];
      list.push(enrichedPhoto);
      photosByWriteup.set(photo.writeup_id, list);
    }

    // Aggregate reactions per writeup
    const reactionsByWriteup = new Map<string, { counts: Record<string, number>; userReactions: string[] }>();
    for (const r of writeupReactions ?? []) {
      const entry = reactionsByWriteup.get(r.writeup_id) ?? { counts: {}, userReactions: [] };
      entry.counts[r.reaction] = (entry.counts[r.reaction] ?? 0) + 1;
      if (r.user_id === currentUserId) entry.userReactions.push(r.reaction);
      reactionsByWriteup.set(r.writeup_id, entry);
    }

    return rawWriteups.map(w => {
      const rData = reactionsByWriteup.get(w.id);
      const counts = rData?.counts ?? {};
      const reactionCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
      return {
        ...w,
        photos: photosByWriteup.get(w.id) ?? [],
        reactions: counts,
        user_reactions: rData?.userReactions ?? [],
        reaction_count: reactionCount,
        reply_count: replyCountByWriteup.get(w.id) ?? 0,
        author_name: profileMap.get(w.user_id) ?? 'Member',
      };
    });
  }

  async function loadActivities(coursesData?: Course[]): Promise<Activity[]> {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    // Enrich with names
    const userIds = [...new Set(data.map(a => a.user_id).concat(data.filter(a => a.target_user_id).map(a => a.target_user_id!)))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

    const writeupIds = [...new Set(data.filter(a => a.writeup_id).map(a => a.writeup_id!))];
    const { data: writeupData } = writeupIds.length > 0
      ? await supabase
          .from('writeups')
          .select('id, title, course_id')
          .in('id', writeupIds)
      : { data: [] };

    const writeupMap = new Map((writeupData ?? []).map(w => [w.id, w]));

    // Load post content for post activities
    const postIds = [...new Set(data.filter(a => a.post_id).map(a => a.post_id!))];
    const { data: postData } = postIds.length > 0
      ? await supabase
          .from('posts')
          .select('id, content')
          .in('id', postIds)
      : { data: [] };
    const postMap = new Map((postData ?? []).map(p => [p.id, p.content]));

    // Load group names for group_created activities
    const groupIds = [...new Set(data.filter(a => a.group_id).map(a => a.group_id!))];
    const { data: groupData } = groupIds.length > 0
      ? await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds)
      : { data: [] };
    const groupMap = new Map((groupData ?? []).map(g => [g.id, g.name]));

    // Load meetup names for meetup activities
    const meetupIds = [...new Set(data.filter(a => a.meetup_id).map(a => a.meetup_id!))];
    const { data: meetupData } = meetupIds.length > 0
      ? await supabase
          .from('meetups')
          .select('id, name')
          .in('id', meetupIds)
      : { data: [] };
    const meetupMap = new Map((meetupData ?? []).map(m => [m.id, m.name]));

    return data.map(a => {
      const w = a.writeup_id ? writeupMap.get(a.writeup_id) : null;
      const courseList = coursesData ?? coursesRef.current;
      const courseName = w?.course_id
        ? courseList.find(c => c.id === w.course_id)?.short_name
        : a.course_id
          ? courseList.find(c => c.id === a.course_id)?.short_name
          : '';
      return {
        ...a,
        user_name: profileMap.get(a.user_id) ?? 'Member',
        writeup_title: w?.title ?? '',
        course_name: courseName ?? '',
        target_user_name: a.target_user_id ? (profileMap.get(a.target_user_id) ?? 'another member') : undefined,
        post_content: a.post_id ? postMap.get(a.post_id) ?? '' : undefined,
        group_name: a.group_id ? groupMap.get(a.group_id) ?? '' : undefined,
        meetup_name: a.meetup_id ? meetupMap.get(a.meetup_id) ?? '' : undefined,
      };
    });
  }

  async function loadPosts(): Promise<Post[]> {
    const { data: rawPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('hidden', false)
      .order('created_at', { ascending: false });

    if (!rawPosts || rawPosts.length === 0) return [];

    const postIds = rawPosts.map(p => p.id);

    // Load photos, reactions, reply counts in parallel
    const [photosRes, reactionsRes, repliesRes] = await Promise.all([
      supabase.from('post_photos').select('*').in('post_id', postIds),
      supabase.from('post_reactions').select('*').in('post_id', postIds),
      supabase.from('post_replies').select('post_id').in('post_id', postIds),
    ]);

    // Load author names
    const authorIds = [...new Set(rawPosts.map(p => p.user_id))];
    const { data: authorProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', authorIds);
    const authorMap = new Map((authorProfiles ?? []).map(p => [p.id, p.name]));

    const currentUserId = session?.user?.id;

    const photosByPost = new Map<string, PostPhoto[]>();
    for (const photo of photosRes.data ?? []) {
      const list = photosByPost.get(photo.post_id) ?? [];
      list.push(photo);
      photosByPost.set(photo.post_id, list);
    }

    // Aggregate reactions per post
    const reactionsByPost = new Map<string, { counts: Record<string, number>; userReactions: string[] }>();
    for (const r of reactionsRes.data ?? []) {
      const entry = reactionsByPost.get(r.post_id) ?? { counts: {}, userReactions: [] };
      entry.counts[r.reaction] = (entry.counts[r.reaction] ?? 0) + 1;
      if (r.user_id === currentUserId) entry.userReactions.push(r.reaction);
      reactionsByPost.set(r.post_id, entry);
    }

    // Count replies per post
    const replyCountByPost = new Map<string, number>();
    for (const r of repliesRes.data ?? []) {
      replyCountByPost.set(r.post_id, (replyCountByPost.get(r.post_id) ?? 0) + 1);
    }

    return rawPosts.map(p => {
      const rData = reactionsByPost.get(p.id);
      return {
        ...p,
        photos: photosByPost.get(p.id) ?? [],
        reactions: rData?.counts ?? {},
        user_reactions: rData?.userReactions ?? [],
        reply_count: replyCountByPost.get(p.id) ?? 0,
        author_name: authorMap.get(p.user_id) ?? 'Member',
      };
    });
  }

  async function generateMeetupReminders(userId: string) {
    // Fetch meetups the user is a member of
    const { data: memberships } = await supabase
      .from('meetup_members')
      .select('meetup_id')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) return;

    const meetupIds = memberships.map(m => m.meetup_id);
    const { data: meetupData } = await supabase
      .from('meetups')
      .select('id, name, meetup_date')
      .in('id', meetupIds);

    if (!meetupData || meetupData.length === 0) return;

    const now = new Date();

    // Check existing reminders to dedup
    const { data: existingReminders } = await supabase
      .from('notifications')
      .select('type, meetup_id')
      .eq('user_id', userId)
      .in('type', ['meetup_reminder_7d', 'meetup_reminder_1d'])
      .in('meetup_id', meetupIds);

    const existingSet = new Set(
      (existingReminders ?? []).map(r => `${r.type}:${r.meetup_id}`)
    );

    const toInsert: { user_id: string; type: string; meetup_id: string }[] = [];

    for (const m of meetupData) {
      const meetupDate = new Date(m.meetup_date);
      const daysUntil = (meetupDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntil <= 7 && daysUntil > 1 && !existingSet.has(`meetup_reminder_7d:${m.id}`)) {
        toInsert.push({ user_id: userId, type: 'meetup_reminder_7d', meetup_id: m.id });
      }
      if (daysUntil <= 1 && daysUntil > 0 && !existingSet.has(`meetup_reminder_1d:${m.id}`)) {
        toInsert.push({ user_id: userId, type: 'meetup_reminder_1d', meetup_id: m.id });
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('notifications').insert(toInsert);
    }
  }

  async function loadNotificationsData(overrideUserId?: string) {
    const userId = overrideUserId ?? session?.user?.id;
    if (!userId) return;

    // Generate meetup reminders first
    await generateMeetupReminders(userId);

    const { data: rawNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!rawNotifications || rawNotifications.length === 0) {
      setNotifications([]);
      return;
    }

    // Batch fetch actor profiles
    const actorIds = [...new Set(rawNotifications.filter(n => n.actor_id).map(n => n.actor_id!))];
    const { data: actorProfiles } = actorIds.length > 0
      ? await supabase.from('profiles').select('id, name, image').in('id', actorIds)
      : { data: [] };
    const actorMap = new Map((actorProfiles ?? []).map(p => [p.id, p]));

    // Batch fetch writeup titles + course_ids
    const writeupIds = [...new Set(rawNotifications.filter(n => n.writeup_id).map(n => n.writeup_id!))];
    const { data: writeupData } = writeupIds.length > 0
      ? await supabase.from('writeups').select('id, title, course_id').in('id', writeupIds)
      : { data: [] };
    const writeupMap = new Map((writeupData ?? []).map(w => [w.id, w]));

    // Batch fetch meetup names + dates
    const meetupIds = [...new Set(rawNotifications.filter(n => n.meetup_id).map(n => n.meetup_id!))];
    const { data: meetupInfo } = meetupIds.length > 0
      ? await supabase.from('meetups').select('id, name, meetup_date').in('id', meetupIds)
      : { data: [] };
    const meetupMap = new Map((meetupInfo ?? []).map(m => [m.id, m]));

    // Batch fetch post data for notifications with post_id
    const postIds = [...new Set(rawNotifications.filter(n => n.post_id).map(n => n.post_id!))];
    const { data: postInfo } = postIds.length > 0
      ? await supabase.from('posts').select('id, content').in('id', postIds)
      : { data: [] };
    const postMap = new Map((postInfo ?? []).map(p => [p.id, p.content]));

    // Batch fetch group names
    const groupIds = [...new Set(rawNotifications.filter(n => n.group_id).map(n => n.group_id!))];
    const { data: groupInfo } = groupIds.length > 0
      ? await supabase.from('groups').select('id, name').in('id', groupIds)
      : { data: [] };
    const groupMap = new Map((groupInfo ?? []).map(g => [g.id, g.name]));

    const crs = coursesRef.current;

    const enriched: Notification[] = rawNotifications.map(n => {
      const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
      const writeup = n.writeup_id ? writeupMap.get(n.writeup_id) : null;
      const meetup = n.meetup_id ? meetupMap.get(n.meetup_id) : null;
      const courseName = writeup?.course_id
        ? crs.find(c => c.id === writeup.course_id)?.short_name ?? ''
        : '';
      return {
        ...n,
        actor_name: actor?.name,
        actor_image: actor?.image ?? null,
        writeup_title: writeup?.title,
        post_content: n.post_id ? postMap.get(n.post_id) ?? '' : undefined,
        course_name: courseName,
        meetup_name: meetup?.name,
        meetup_date: meetup?.meetup_date,
        group_name: n.group_id ? groupMap.get(n.group_id) : undefined,
      };
    });

    setNotifications(enriched);
  }

  const markNotificationRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    [],
  );

  const markAllNotificationsRead = useCallback(
    async () => {
      if (!session) return;
      const unreadIds = notificationsRef.current.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    },
    [session],
  );

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myapp://reset-password',
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setNeedsPasswordReset(false);
    return { error };
  }, []);

  const clearPasswordReset = useCallback(() => {
    setNeedsPasswordReset(false);
  }, []);

  const saveUser = useCallback(async (u: User) => {
    if (!session) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        name: u.name,
        image: u.image,
        location: u.location,
        handicap: u.handicap,
        home_course: u.homeCourse,
        favorite_ball: u.favoriteBall,
      })
      .eq('id', session.user.id);

    if (!error) {
      setUser(u);
    }
  }, [session]);

  const addWriteup = useCallback(
    async (data: { courseId: string; title: string; content: string; photos: { url: string; caption: string }[] }): Promise<Writeup> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      // Insert writeup
      const { data: writeupData, error: writeupError } = await supabase
        .from('writeups')
        .insert({
          user_id: userId,
          course_id: data.courseId,
          title: data.title,
          content: data.content,
        })
        .select()
        .single();

      if (writeupError || !writeupData) throw writeupError ?? new Error('Failed to create writeup');

      // Insert photos
      const photos: Photo[] = [];
      if (data.photos.length > 0) {
        const photoInserts = data.photos.map(p => ({
          writeup_id: writeupData.id,
          user_id: userId,
          url: p.url,
          caption: p.caption,
        }));

        const { data: photoData } = await supabase
          .from('photos')
          .insert(photoInserts)
          .select();

        if (photoData) {
          photos.push(...photoData.map(p => ({ ...p, upvote_count: 0, user_has_upvoted: false })));
        }
      }

      // Insert activity
      const course = courses.find(c => c.id === data.courseId);
      await supabase.from('activities').insert({
        type: 'writeup',
        user_id: userId,
        writeup_id: writeupData.id,
        course_id: data.courseId,
      });

      const writeup: Writeup = {
        ...writeupData,
        photos,
        reactions: {},
        user_reactions: [],
        reaction_count: 0,
        reply_count: 0,
        author_name: user?.name ?? 'Member',
      };

      setWriteups(prev => [writeup, ...prev]);

      // Refresh activities
      const newActivities = await loadActivities();
      setActivities(newActivities);

      return writeup;
    },
    [session, user, courses],
  );

  const updateWriteup = useCallback(
    async (writeupId: string, data: { title: string; content: string; photos: { id?: string; url: string; caption: string }[] }) => {
      if (!session) return;

      // Update writeup fields
      await supabase
        .from('writeups')
        .update({ title: data.title, content: data.content })
        .eq('id', writeupId);

      // Get existing photos
      const { data: existingPhotos } = await supabase
        .from('photos')
        .select('id')
        .eq('writeup_id', writeupId);

      const existingIds = new Set((existingPhotos ?? []).map(p => p.id));
      const keepIds = new Set(data.photos.filter(p => p.id).map(p => p.id!));

      // Delete removed photos
      const toDelete = [...existingIds].filter(id => !keepIds.has(id));
      if (toDelete.length > 0) {
        await supabase.from('photos').delete().in('id', toDelete);
      }

      // Insert new photos
      const newPhotos = data.photos.filter(p => !p.id);
      if (newPhotos.length > 0) {
        await supabase.from('photos').insert(
          newPhotos.map(p => ({
            writeup_id: writeupId,
            user_id: session.user.id,
            url: p.url,
            caption: p.caption,
          })),
        );
      }

      // Refresh
      const updatedWriteups = await loadWriteups();
      setWriteups(updatedWriteups);
    },
    [session],
  );

  const deleteWriteup = useCallback(
    async (writeupId: string) => {
      await supabase.from('writeups').delete().eq('id', writeupId);
      setWriteups(prev => prev.filter(w => w.id !== writeupId));

      // Refresh activities
      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [],
  );

  const toggleWriteupReaction = useCallback(
    async (writeupId: string, reaction: string) => {
      if (!session || !user) return;
      const userId = session.user.id;

      const writeup = writeups.find(w => w.id === writeupId);
      if (!writeup) return;

      const hasReaction = writeup.user_reactions.includes(reaction);

      // Optimistic update
      setWriteups(prev =>
        prev.map(w => {
          if (w.id !== writeupId) return w;
          const newReactions = { ...w.reactions };
          const newUserReactions = [...w.user_reactions];
          if (hasReaction) {
            newReactions[reaction] = Math.max(0, (newReactions[reaction] ?? 0) - 1);
            if (newReactions[reaction] === 0) delete newReactions[reaction];
            const idx = newUserReactions.indexOf(reaction);
            if (idx >= 0) newUserReactions.splice(idx, 1);
          } else {
            newReactions[reaction] = (newReactions[reaction] ?? 0) + 1;
            newUserReactions.push(reaction);
          }
          const reactionCount = Object.values(newReactions).reduce((sum, n) => sum + n, 0);
          return { ...w, reactions: newReactions, user_reactions: newUserReactions, reaction_count: reactionCount };
        }),
      );

      if (hasReaction) {
        await supabase
          .from('writeup_reactions')
          .delete()
          .eq('writeup_id', writeupId)
          .eq('user_id', userId)
          .eq('reaction', reaction);
      } else {
        await supabase
          .from('writeup_reactions')
          .insert({ writeup_id: writeupId, user_id: userId, reaction });

        // Add activity (keep 'upvote' type for compatibility)
        await supabase.from('activities').insert({
          type: 'upvote',
          user_id: userId,
          writeup_id: writeupId,
          course_id: writeup.course_id,
          target_user_id: writeup.user_id,
        });

        // Add notification (no self-notification)
        if (writeup.user_id !== userId) {
          await supabase.from('notifications').insert({
            user_id: writeup.user_id,
            type: 'upvote',
            actor_id: userId,
            writeup_id: writeupId,
          });
        }
      }
    },
    [session, user, writeups],
  );

  const togglePhotoUpvote = useCallback(
    async (photoId: string) => {
      if (!session) return;
      const userId = session.user.id;

      // Find the photo in writeups
      let photoFound: Photo | null = null;
      for (const w of writeups) {
        const p = w.photos.find(p => p.id === photoId);
        if (p) { photoFound = p; break; }
      }
      if (!photoFound) return;

      if (photoFound.user_has_upvoted) {
        await supabase
          .from('photo_upvotes')
          .delete()
          .eq('user_id', userId)
          .eq('photo_id', photoId);
      } else {
        await supabase
          .from('photo_upvotes')
          .insert({ user_id: userId, photo_id: photoId });
      }

      // Optimistic update
      setWriteups(prev =>
        prev.map(w => ({
          ...w,
          photos: w.photos.map(p => {
            if (p.id !== photoId) return p;
            return {
              ...p,
              user_has_upvoted: !p.user_has_upvoted,
              upvote_count: (p.upvote_count ?? 0) + (p.user_has_upvoted ? -1 : 1),
            };
          }),
        })),
      );
    },
    [session, writeups],
  );

  const markCoursePlayed = useCallback(
    async (courseId: string) => {
      if (!session) return;
      const userId = session.user.id;

      // Optimistic update
      const optimistic: CoursePlayed = {
        id: crypto.randomUUID(),
        user_id: userId,
        course_id: courseId,
        created_at: new Date().toISOString(),
      };
      setCoursesPlayed(prev => [...prev, optimistic]);

      const { data } = await supabase
        .from('courses_played')
        .insert({ user_id: userId, course_id: courseId })
        .select()
        .single();

      if (data) {
        setCoursesPlayed(prev => prev.map(cp => cp.id === optimistic.id ? data : cp));
      }

      // Insert activity
      await supabase.from('activities').insert({
        type: 'played',
        user_id: userId,
        course_id: courseId,
      });

      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [session, courses],
  );

  const unmarkCoursePlayed = useCallback(
    async (courseId: string) => {
      if (!session) return;
      const userId = session.user.id;

      setCoursesPlayed(prev => prev.filter(cp => !(cp.user_id === userId && cp.course_id === courseId)));

      await supabase
        .from('courses_played')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);
    },
    [session],
  );

  const addPost = useCallback(
    async (data: { content: string; photos: { url: string; caption: string }[] }): Promise<Post> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({ user_id: userId, content: data.content })
        .select()
        .single();

      if (postError || !postData) {
        console.error('Failed to insert post:', postError);
        throw postError ?? new Error('Failed to create post');
      }

      const photos: PostPhoto[] = [];
      if (data.photos.length > 0) {
        const photoInserts = data.photos.map(p => ({
          post_id: postData.id,
          user_id: userId,
          url: p.url,
          caption: p.caption,
        }));
        const { data: photoData, error: photoError } = await supabase
          .from('post_photos')
          .insert(photoInserts)
          .select();
        if (photoError) console.error('Failed to insert post photos:', photoError);
        if (photoData) photos.push(...photoData);
      }

      const { error: activityError } = await supabase.from('activities').insert({
        type: 'post',
        user_id: userId,
        post_id: postData.id,
      });
      if (activityError) console.error('Failed to insert post activity:', activityError);

      const post: Post = {
        ...postData,
        photos,
        reactions: {},
        user_reactions: [],
        reply_count: 0,
        author_name: user?.name ?? 'Member',
      };

      setPosts(prev => [post, ...prev]);

      const newActivities = await loadActivities();
      setActivities(newActivities);

      return post;
    },
    [session, user],
  );

  const togglePostReaction = useCallback(
    async (postId: string, reaction: string) => {
      if (!session) return;
      const userId = session.user.id;

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const hasReaction = post.user_reactions.includes(reaction);

      // Optimistic update
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          const newReactions = { ...p.reactions };
          const newUserReactions = [...p.user_reactions];
          if (hasReaction) {
            newReactions[reaction] = Math.max(0, (newReactions[reaction] ?? 0) - 1);
            if (newReactions[reaction] === 0) delete newReactions[reaction];
            const idx = newUserReactions.indexOf(reaction);
            if (idx >= 0) newUserReactions.splice(idx, 1);
          } else {
            newReactions[reaction] = (newReactions[reaction] ?? 0) + 1;
            newUserReactions.push(reaction);
          }
          return { ...p, reactions: newReactions, user_reactions: newUserReactions };
        }),
      );

      if (hasReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('reaction', reaction);
      } else {
        await supabase
          .from('post_reactions')
          .insert({ post_id: postId, user_id: userId, reaction });
      }
    },
    [session, posts],
  );

  const getPostReplies = useCallback(
    async (postId: string): Promise<PostReply[]> => {
      const { data: replies } = await supabase
        .from('post_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!replies || replies.length === 0) return [];

      const authorIds = [...new Set(replies.map(r => r.user_id))];
      const { data: authorProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', authorIds);
      const authorMap = new Map((authorProfiles ?? []).map(p => [p.id, p.name]));

      return replies.map(r => ({
        ...r,
        author_name: authorMap.get(r.user_id) ?? 'Member',
      }));
    },
    [],
  );

  const addPostReply = useCallback(
    async (postId: string, content: string): Promise<PostReply> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      const { data: reply, error } = await supabase
        .from('post_replies')
        .insert({ post_id: postId, user_id: userId, content })
        .select()
        .single();

      if (error || !reply) throw error ?? new Error('Failed to add reply');

      // Update reply count optimistically
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, reply_count: p.reply_count + 1 } : p),
      );

      // Insert activity
      const post = posts.find(p => p.id === postId);
      await supabase.from('activities').insert({
        type: 'post_reply',
        user_id: userId,
        post_id: postId,
        target_user_id: post?.user_id ?? null,
      });

      // Insert notification (no self-notification)
      if (post && post.user_id !== userId) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'post_reply',
          actor_id: userId,
          post_id: postId,
        });
      }

      // Refresh activities
      const newActivities = await loadActivities();
      setActivities(newActivities);

      return { ...reply, author_name: user?.name ?? 'Member' };
    },
    [session, user, posts],
  );

  const getWriteupReplies = useCallback(
    async (writeupId: string): Promise<WriteupReply[]> => {
      const { data: replies } = await supabase
        .from('writeup_replies')
        .select('*')
        .eq('writeup_id', writeupId)
        .order('created_at', { ascending: true });

      if (!replies || replies.length === 0) return [];

      const authorIds = [...new Set(replies.map(r => r.user_id))];
      const { data: authorProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', authorIds);
      const authorMap = new Map((authorProfiles ?? []).map(p => [p.id, p.name]));

      return replies.map(r => ({
        ...r,
        author_name: authorMap.get(r.user_id) ?? 'Member',
      }));
    },
    [],
  );

  const addWriteupReply = useCallback(
    async (writeupId: string, content: string): Promise<WriteupReply> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      const { data: reply, error } = await supabase
        .from('writeup_replies')
        .insert({ writeup_id: writeupId, user_id: userId, content })
        .select()
        .single();

      if (error || !reply) throw error ?? new Error('Failed to add reply');

      // Update reply count optimistically
      setWriteups(prev =>
        prev.map(w => w.id === writeupId ? { ...w, reply_count: w.reply_count + 1 } : w),
      );

      // Insert activity
      const writeup = writeups.find(w => w.id === writeupId);
      await supabase.from('activities').insert({
        type: 'writeup_reply',
        user_id: userId,
        writeup_id: writeupId,
        target_user_id: writeup?.user_id ?? null,
      });

      // Insert notification (no self-notification)
      if (writeup && writeup.user_id !== userId) {
        await supabase.from('notifications').insert({
          user_id: writeup.user_id,
          type: 'writeup_reply',
          actor_id: userId,
          writeup_id: writeupId,
        });
      }

      // Refresh activities
      const newActivities = await loadActivities();
      setActivities(newActivities);

      return { ...reply, author_name: user?.name ?? 'Member' };
    },
    [session, user, writeups],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      await supabase.from('posts').delete().eq('id', postId);
      setPosts(prev => prev.filter(p => p.id !== postId));

      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [],
  );

  const flagContent = useCallback(
    async (contentType: 'post' | 'writeup', contentId: string) => {
      if (!session) return;
      const userId = session.user.id;

      await supabase
        .from('content_flags')
        .insert({ user_id: userId, content_type: contentType, content_id: contentId });

      // Count flags for this content
      const { count } = await supabase
        .from('content_flags')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if ((count ?? 0) >= 3) {
        const table = contentType === 'post' ? 'posts' : 'writeups';
        await supabase.from(table).update({ hidden: true }).eq('id', contentId);

        // Remove from local state optimistically
        if (contentType === 'post') {
          setPosts(prev => prev.filter(p => p.id !== contentId));
        } else {
          setWriteups(prev => prev.filter(w => w.id !== contentId));
        }
      }
    },
    [session],
  );

  // ---- Follow methods ----
  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (!session) return;
      const userId = session.user.id;
      const existing = follows.find(f => f.follower_id === userId && f.following_id === targetUserId);

      if (existing) {
        // Optimistic remove
        setFollows(prev => prev.filter(f => f.id !== existing.id));
        await supabase.from('follows').delete().eq('id', existing.id);
      } else {
        // Optimistic add
        const optimistic: Follow = {
          id: crypto.randomUUID(),
          follower_id: userId,
          following_id: targetUserId,
          created_at: new Date().toISOString(),
        };
        setFollows(prev => [...prev, optimistic]);
        const { data } = await supabase
          .from('follows')
          .insert({ follower_id: userId, following_id: targetUserId })
          .select()
          .single();
        if (data) {
          setFollows(prev => prev.map(f => f.id === optimistic.id ? data : f));
        }
      }
    },
    [session, follows],
  );

  const isFollowing = useCallback(
    (userId: string) => followingIds.has(userId),
    [followingIds],
  );

  const getFollowerCount = useCallback(
    (userId: string) => follows.filter(f => f.following_id === userId).length,
    [follows],
  );

  const getFollowingCount = useCallback(
    (userId: string) => follows.filter(f => f.follower_id === userId).length,
    [follows],
  );

  // ---- Conversation / DM methods ----
  const loadConversations = useCallback(async (overrideUserId?: string) => {
    const userId = overrideUserId ?? session?.user?.id;
    if (!userId) return;

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (!convos || convos.length === 0) { setConversations([]); return; }

    // Get other user IDs
    const otherIds = [...new Set(convos.map(c => c.user1_id === userId ? c.user2_id : c.user1_id))];
    const { data: otherProfiles } = await supabase
      .from('profiles')
      .select('id, name, image')
      .in('id', otherIds);
    const profileMap = new Map((otherProfiles ?? []).map((p: { id: string; name: string; image: string | null }) => [p.id, p]));

    // Get last message for each conversation
    const convoIds = convos.map(c => c.id);
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('conversation_id, user_id, content, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false });

    const lastMsgMap = new Map<string, { user_id: string; content: string; created_at: string }>();
    for (const msg of lastMessages ?? []) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg);
      }
    }

    const enriched: Conversation[] = convos.map(c => {
      const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const otherProfile = profileMap.get(otherId);
      const lastMsg = lastMsgMap.get(c.id);
      const lastReadAt = c.user1_id === userId ? c.user1_last_read_at : c.user2_last_read_at;
      // Only mark unread if the last message was sent by the OTHER user
      const unread = lastMsg && lastMsg.user_id !== userId
        ? (!lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt))
        : false;
      return {
        ...c,
        other_user_name: otherProfile?.name ?? 'Member',
        other_user_image: otherProfile?.image ?? null,
        last_message: lastMsg?.content,
        last_message_at: lastMsg?.created_at,
        unread,
      };
    });

    setConversations(enriched);
  }, [session]);

  const getOrCreateConversation = useCallback(
    async (otherUserId: string): Promise<string> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;
      const [u1, u2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

      // Check existing
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', u1)
        .eq('user2_id', u2)
        .single();

      if (existing) {
        await loadConversations();
        return existing.id;
      }

      const { data: created, error } = await supabase
        .from('conversations')
        .insert({ user1_id: u1, user2_id: u2 })
        .select()
        .single();

      if (error || !created) throw error ?? new Error('Failed to create conversation');

      await loadConversations();
      return created.id;
    },
    [session, loadConversations],
  );

  const getMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
    [],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string): Promise<Message> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, user_id: userId, content })
        .select()
        .single();
      if (error || !data) throw error ?? new Error('Failed to send message');

      // Update conversation's updated_at and sender's last_read_at
      const convo = conversationsRef.current.find(c => c.id === conversationId);
      const readField = convo && convo.user1_id === userId ? 'user1_last_read_at' : 'user2_last_read_at';
      const now = new Date().toISOString();
      await supabase
        .from('conversations')
        .update({ updated_at: now, [readField]: now })
        .eq('id', conversationId);

      // Keep local state in sync so sender doesn't see unread badge
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unread: false, [readField]: now, updated_at: now } : c
      ));

      return data;
    },
    [session],
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!session) return;
      const userId = session.user.id;
      const convo = conversationsRef.current.find(c => c.id === conversationId);
      if (!convo) return;

      const now = new Date().toISOString();
      const field = convo.user1_id === userId ? 'user1_last_read_at' : 'user2_last_read_at';

      // Optimistic update
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unread: false, [field]: now } : c
      ));

      await supabase
        .from('conversations')
        .update({ [field]: now })
        .eq('id', conversationId);
    },
    [session],
  );

  // ---- Group methods ----
  async function loadGroupsData(overrideUserId?: string) {
    const userId = overrideUserId ?? session?.user?.id;
    if (!userId) return;

    const { data: rawGroups } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (!rawGroups || rawGroups.length === 0) { setGroups([]); return; }

    const groupIds = rawGroups.map(g => g.id);

    // Load members, creator profiles, and last messages in parallel
    const [membersRes, lastMsgsRes] = await Promise.all([
      supabase.from('group_members').select('*').in('group_id', groupIds),
      supabase.from('group_messages').select('group_id, user_id, content, created_at').in('group_id', groupIds).order('created_at', { ascending: false }),
    ]);

    const members = membersRes.data ?? [];
    const lastMsgs = lastMsgsRes.data ?? [];

    // Creator IDs
    const creatorIds = [...new Set(rawGroups.map(g => g.creator_id))];
    const { data: creatorProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', creatorIds);
    const creatorMap = new Map((creatorProfiles ?? []).map(p => [p.id, p.name]));

    // Member counts per group
    const memberCountMap = new Map<string, number>();
    const membershipMap = new Map<string, boolean>();
    const memberLastReadMap = new Map<string, string | null>();
    for (const m of members) {
      memberCountMap.set(m.group_id, (memberCountMap.get(m.group_id) ?? 0) + 1);
      if (m.user_id === userId) {
        membershipMap.set(m.group_id, true);
        memberLastReadMap.set(m.group_id, m.last_read_at);
      }
    }

    // Last message per group
    const lastMsgMap = new Map<string, { content: string; created_at: string }>();
    for (const msg of lastMsgs) {
      if (!lastMsgMap.has(msg.group_id)) {
        lastMsgMap.set(msg.group_id, msg);
      }
    }

    const crs = coursesRef.current;

    const enriched: Group[] = rawGroups.map(g => {
      const lastMsg = lastMsgMap.get(g.id);
      const lastReadAt = memberLastReadMap.get(g.id);
      const isMember = membershipMap.get(g.id) ?? false;
      const hasUnread = isMember && lastMsg
        ? (!lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt))
        : false;
      return {
        ...g,
        creator_name: creatorMap.get(g.creator_id) ?? 'Member',
        home_course_name: g.home_course_id ? (crs.find(c => c.id === g.home_course_id)?.short_name ?? '') : undefined,
        member_count: memberCountMap.get(g.id) ?? 0,
        is_member: isMember,
        _last_message: lastMsg?.content,
        _last_message_at: lastMsg?.created_at,
        _has_unread: hasUnread,
        _member_last_read_at: lastReadAt,
      };
    });

    setGroups(enriched);
  }

  const loadGroups = useCallback(async () => {
    await loadGroupsData();
  }, [session]);

  const createGroup = useCallback(
    async (data: { name: string; description: string; home_course_id: string | null; location_name: string; image: string | null }): Promise<Group> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      const { data: groupData, error } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          creator_id: userId,
          home_course_id: data.home_course_id,
          location_name: data.location_name,
          image: data.image,
        })
        .select()
        .single();

      if (error || !groupData) throw error ?? new Error('Failed to create group');

      // Add creator as member with role 'creator'
      await supabase
        .from('group_members')
        .insert({ group_id: groupData.id, user_id: userId, role: 'creator' });

      const group: Group = {
        ...groupData,
        creator_name: user?.name ?? 'Member',
        home_course_name: data.home_course_id ? (courses.find(c => c.id === data.home_course_id)?.short_name ?? '') : undefined,
        member_count: 1,
        is_member: true,
      };

      setGroups(prev => [group, ...prev]);

      // Insert activity for group creation
      await supabase.from('activities').insert({
        type: 'group_created',
        user_id: userId,
        group_id: groupData.id,
      });

      const newActivities = await loadActivities();
      setActivities(newActivities);

      return group;
    },
    [session, user, courses],
  );

  const updateGroup = useCallback(
    async (groupId: string, data: { name: string; description: string; home_course_id: string | null; location_name: string; image: string | null }) => {
      if (!session) return;

      const { error } = await supabase
        .from('groups')
        .update({
          name: data.name,
          description: data.description,
          home_course_id: data.home_course_id,
          location_name: data.location_name,
          image: data.image,
        })
        .eq('id', groupId);

      if (error) throw error;

      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? {
              ...g,
              ...data,
              home_course_name: data.home_course_id ? (courses.find(c => c.id === data.home_course_id)?.short_name ?? '') : undefined,
            }
          : g
      ));

      // Refresh activities so the feed reflects updated name
      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [session, courses],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!session) return;
      await supabase.from('groups').delete().eq('id', groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));

      // Refresh activities to remove references to deleted group
      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [session],
  );

  const joinGroup = useCallback(
    async (groupId: string) => {
      if (!session) return;
      const userId = session.user.id;

      // Optimistic update
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, is_member: true, member_count: (g.member_count ?? 0) + 1 } : g
      ));

      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role: 'member' });

      if (error) {
        // Revert on error
        setGroups(prev => prev.map(g =>
          g.id === groupId ? { ...g, is_member: false, member_count: (g.member_count ?? 1) - 1 } : g
        ));
        return;
      }

      // Notify group creator (no self-notification)
      const group = groupsRef.current.find(g => g.id === groupId);
      if (group && group.creator_id !== userId) {
        await supabase.from('notifications').insert({
          user_id: group.creator_id,
          type: 'group_join',
          actor_id: userId,
          group_id: groupId,
        });
      }
    },
    [session],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!session) return;
      const userId = session.user.id;
      const group = groupsRef.current.find(g => g.id === groupId);
      if (group?.creator_id === userId) return; // Can't leave if creator

      // Optimistic update
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, is_member: false, member_count: Math.max(0, (g.member_count ?? 1) - 1) } : g
      ));

      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);
    },
    [session],
  );

  const getGroupMembers = useCallback(
    async (groupId: string): Promise<GroupMember[]> => {
      const { data: members } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (!members || members.length === 0) return [];

      const userIds = [...new Set(members.map(m => m.user_id))];
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select('id, name, image')
        .in('id', userIds);
      const profileMap = new Map((memberProfiles ?? []).map(p => [p.id, p]));

      return members.map(m => ({
        ...m,
        user_name: profileMap.get(m.user_id)?.name ?? 'Member',
        user_image: profileMap.get(m.user_id)?.image ?? null,
      }));
    },
    [],
  );

  const getGroupMessages = useCallback(
    async (groupId: string): Promise<GroupMessage[]> => {
      const { data: msgs } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (!msgs || msgs.length === 0) return [];

      const userIds = [...new Set(msgs.map(m => m.user_id))];
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, image')
        .in('id', userIds);
      const profileMap = new Map((senderProfiles ?? []).map(p => [p.id, p]));

      return msgs.map(m => ({
        ...m,
        sender_name: profileMap.get(m.user_id)?.name ?? 'Member',
        sender_image: profileMap.get(m.user_id)?.image ?? null,
      }));
    },
    [],
  );

  const sendGroupMessage = useCallback(
    async (groupId: string, content: string): Promise<GroupMessage> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('group_messages')
        .insert({ group_id: groupId, user_id: userId, content })
        .select()
        .single();

      if (error || !data) throw error ?? new Error('Failed to send group message');

      // Update sender's last_read_at
      const now = new Date().toISOString();
      await supabase
        .from('group_members')
        .update({ last_read_at: now })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      // Update local state
      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, _last_message: content, _last_message_at: now, _has_unread: false, _member_last_read_at: now }
          : g
      ));

      return { ...data, sender_name: user?.name ?? 'Member', sender_image: user?.image ?? null };
    },
    [session, user],
  );

  const markGroupRead = useCallback(
    async (groupId: string) => {
      if (!session) return;
      const userId = session.user.id;
      const now = new Date().toISOString();

      // Optimistic update
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, _has_unread: false, _member_last_read_at: now } : g
      ));

      await supabase
        .from('group_members')
        .update({ last_read_at: now })
        .eq('group_id', groupId)
        .eq('user_id', userId);
    },
    [session],
  );

  // ---- Meetup methods ----
  async function loadMeetupsData(overrideUserId?: string) {
    const userId = overrideUserId ?? session?.user?.id;
    if (!userId) return;

    const { data: rawMeetups } = await supabase
      .from('meetups')
      .select('*')
      .order('meetup_date', { ascending: true });

    if (!rawMeetups || rawMeetups.length === 0) { setMeetups([]); return; }

    const meetupIds = rawMeetups.map(m => m.id);

    const [membersRes, lastMsgsRes] = await Promise.all([
      supabase.from('meetup_members').select('*').in('meetup_id', meetupIds),
      supabase.from('meetup_messages').select('meetup_id, user_id, content, created_at').in('meetup_id', meetupIds).order('created_at', { ascending: false }),
    ]);

    const members = membersRes.data ?? [];
    const lastMsgs = lastMsgsRes.data ?? [];

    // Host names
    const hostIds = [...new Set(rawMeetups.map(m => m.host_id).filter(Boolean))];
    const { data: hostProfiles } = hostIds.length > 0
      ? await supabase.from('profiles').select('id, name').in('id', hostIds)
      : { data: [] };
    const hostMap = new Map((hostProfiles ?? []).map(p => [p.id, p.name]));

    // Member counts, membership, last read
    const memberCountMap = new Map<string, number>();
    const membershipMap = new Map<string, boolean>();
    const memberLastReadMap = new Map<string, string | null>();
    for (const m of members) {
      memberCountMap.set(m.meetup_id, (memberCountMap.get(m.meetup_id) ?? 0) + 1);
      if (m.user_id === userId) {
        membershipMap.set(m.meetup_id, true);
        memberLastReadMap.set(m.meetup_id, m.last_read_at);
      }
    }

    // Last message per meetup
    const lastMsgMap = new Map<string, { content: string; created_at: string }>();
    for (const msg of lastMsgs) {
      if (!lastMsgMap.has(msg.meetup_id)) {
        lastMsgMap.set(msg.meetup_id, msg);
      }
    }

    const enriched: Meetup[] = rawMeetups.map(m => {
      const lastMsg = lastMsgMap.get(m.id);
      const lastReadAt = memberLastReadMap.get(m.id);
      const isMember = membershipMap.get(m.id) ?? false;
      const hasUnread = isMember && lastMsg
        ? (!lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt))
        : false;
      return {
        ...m,
        host_name: m.host_id ? (hostMap.get(m.host_id) ?? 'Member') : undefined,
        member_count: memberCountMap.get(m.id) ?? 0,
        is_member: isMember,
        _last_message: lastMsg?.content,
        _last_message_at: lastMsg?.created_at,
        _has_unread: hasUnread,
        _member_last_read_at: lastReadAt,
      };
    });

    setMeetups(enriched);
  }

  const loadMeetups = useCallback(async () => {
    await loadMeetupsData();
  }, [session]);

  const createMeetup = useCallback(
    async (data: { name: string; description: string; course_id: string | null; location_name: string; meetup_date: string; cost: string; total_slots: number; host_takes_slot: boolean; image: string | null; is_fe_coordinated?: boolean; stripe_payment_url?: string | null; host_id?: string | null }): Promise<Meetup> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;
      const hostId = data.host_id === undefined ? userId : data.host_id;

      const { data: meetupData, error } = await supabase
        .from('meetups')
        .insert({
          name: data.name,
          description: data.description,
          host_id: hostId,
          course_id: data.course_id,
          location_name: data.location_name,
          meetup_date: data.meetup_date,
          cost: data.cost,
          total_slots: data.total_slots,
          host_takes_slot: data.host_takes_slot,
          image: data.image,
          is_fe_coordinated: data.is_fe_coordinated ?? false,
          stripe_payment_url: data.stripe_payment_url ?? null,
        })
        .select()
        .single();

      if (error || !meetupData) throw error ?? new Error('Failed to create meetup');

      // Add host as member if host_takes_slot and there is a host
      if (data.host_takes_slot && hostId) {
        await supabase
          .from('meetup_members')
          .insert({ meetup_id: meetupData.id, user_id: hostId });
      }

      const meetup: Meetup = {
        ...meetupData,
        host_name: hostId ? (user?.name ?? 'Member') : undefined,
        member_count: data.host_takes_slot && hostId ? 1 : 0,
        is_member: data.host_takes_slot && hostId === userId,
      };

      setMeetups(prev => [meetup, ...prev]);

      // Insert activity
      await supabase.from('activities').insert({
        type: 'meetup_created',
        user_id: userId,
        meetup_id: meetupData.id,
        course_id: data.course_id || null,
      });

      const newActivities = await loadActivities();
      setActivities(newActivities);

      return meetup;
    },
    [session, user],
  );

  const updateMeetup = useCallback(
    async (meetupId: string, data: { name: string; description: string; course_id: string | null; location_name: string; meetup_date: string; cost: string; total_slots: number; host_takes_slot: boolean; image: string | null; is_fe_coordinated?: boolean; stripe_payment_url?: string | null }) => {
      if (!session) return;

      const { error } = await supabase
        .from('meetups')
        .update({
          name: data.name,
          description: data.description,
          course_id: data.course_id,
          location_name: data.location_name,
          meetup_date: data.meetup_date,
          cost: data.cost,
          total_slots: data.total_slots,
          host_takes_slot: data.host_takes_slot,
          image: data.image,
          is_fe_coordinated: data.is_fe_coordinated ?? false,
          stripe_payment_url: data.stripe_payment_url ?? null,
        })
        .eq('id', meetupId);

      if (error) throw error;

      setMeetups(prev => prev.map(m =>
        m.id === meetupId
          ? { ...m, ...data, is_fe_coordinated: data.is_fe_coordinated ?? false, stripe_payment_url: data.stripe_payment_url ?? null }
          : m
      ));

      // Refresh activities so the feed reflects updated name/course
      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [session],
  );

  const deleteMeetup = useCallback(
    async (meetupId: string) => {
      if (!session) return;
      await supabase.from('meetups').delete().eq('id', meetupId);
      setMeetups(prev => prev.filter(m => m.id !== meetupId));

      // Refresh activities to remove references to deleted meetup
      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [session],
  );

  const joinMeetup = useCallback(
    async (meetupId: string) => {
      if (!session) return;
      const userId = session.user.id;

      // Optimistic update
      setMeetups(prev => prev.map(m =>
        m.id === meetupId ? { ...m, is_member: true, member_count: (m.member_count ?? 0) + 1 } : m
      ));

      const { error } = await supabase
        .from('meetup_members')
        .insert({ meetup_id: meetupId, user_id: userId });

      if (error) {
        // Revert on error
        setMeetups(prev => prev.map(m =>
          m.id === meetupId ? { ...m, is_member: false, member_count: (m.member_count ?? 1) - 1 } : m
        ));
        return;
      }

      // Insert activity
      const meetup = meetupsRef.current.find(m => m.id === meetupId);
      await supabase.from('activities').insert({
        type: 'meetup_signup',
        user_id: userId,
        meetup_id: meetupId,
        course_id: meetup?.course_id || null,
      });

      // Notify meetup host (no self-notification, skip if no host)
      if (meetup && meetup.host_id && meetup.host_id !== userId) {
        await supabase.from('notifications').insert({
          user_id: meetup.host_id,
          type: 'meetup_signup',
          actor_id: userId,
          meetup_id: meetupId,
        });
      }

      const newActivities = await loadActivities();
      setActivities(newActivities);
    },
    [session],
  );

  const leaveMeetup = useCallback(
    async (meetupId: string) => {
      if (!session) return;
      const userId = session.user.id;
      const meetup = meetupsRef.current.find(m => m.id === meetupId);
      if (meetup?.host_id === userId) return; // Can't leave if host

      // Optimistic update
      setMeetups(prev => prev.map(m =>
        m.id === meetupId ? { ...m, is_member: false, member_count: Math.max(0, (m.member_count ?? 1) - 1) } : m
      ));

      await supabase
        .from('meetup_members')
        .delete()
        .eq('meetup_id', meetupId)
        .eq('user_id', userId);
    },
    [session],
  );

  const getMeetupMembers = useCallback(
    async (meetupId: string): Promise<MeetupMember[]> => {
      const { data: members } = await supabase
        .from('meetup_members')
        .select('*')
        .eq('meetup_id', meetupId)
        .order('joined_at', { ascending: true });

      if (!members || members.length === 0) return [];

      const userIds = [...new Set(members.map(m => m.user_id))];
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select('id, name, image')
        .in('id', userIds);
      const profileMap = new Map((memberProfiles ?? []).map(p => [p.id, p]));

      return members.map(m => ({
        ...m,
        user_name: profileMap.get(m.user_id)?.name ?? 'Member',
        user_image: profileMap.get(m.user_id)?.image ?? null,
      }));
    },
    [],
  );

  const getMeetupMessages = useCallback(
    async (meetupId: string): Promise<MeetupMessage[]> => {
      const { data: msgs } = await supabase
        .from('meetup_messages')
        .select('*')
        .eq('meetup_id', meetupId)
        .order('created_at', { ascending: true });

      if (!msgs || msgs.length === 0) return [];

      const userIds = [...new Set(msgs.map(m => m.user_id))];
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, image')
        .in('id', userIds);
      const profileMap = new Map((senderProfiles ?? []).map(p => [p.id, p]));

      return msgs.map(m => ({
        ...m,
        sender_name: profileMap.get(m.user_id)?.name ?? 'Member',
        sender_image: profileMap.get(m.user_id)?.image ?? null,
      }));
    },
    [],
  );

  const sendMeetupMessage = useCallback(
    async (meetupId: string, content: string): Promise<MeetupMessage> => {
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('meetup_messages')
        .insert({ meetup_id: meetupId, user_id: userId, content })
        .select()
        .single();

      if (error || !data) throw error ?? new Error('Failed to send meetup message');

      // Update sender's last_read_at
      const now = new Date().toISOString();
      await supabase
        .from('meetup_members')
        .update({ last_read_at: now })
        .eq('meetup_id', meetupId)
        .eq('user_id', userId);

      // Update local state
      setMeetups(prev => prev.map(m =>
        m.id === meetupId
          ? { ...m, _last_message: content, _last_message_at: now, _has_unread: false, _member_last_read_at: now }
          : m
      ));

      return { ...data, sender_name: user?.name ?? 'Member', sender_image: user?.image ?? null };
    },
    [session, user],
  );

  const markMeetupRead = useCallback(
    async (meetupId: string) => {
      if (!session) return;
      const userId = session.user.id;
      const now = new Date().toISOString();

      // Optimistic update
      setMeetups(prev => prev.map(m =>
        m.id === meetupId ? { ...m, _has_unread: false, _member_last_read_at: now } : m
      ));

      await supabase
        .from('meetup_members')
        .update({ last_read_at: now })
        .eq('meetup_id', meetupId)
        .eq('user_id', userId);
    },
    [session],
  );

  const blockUser = useCallback(
    async (userId: string) => {
      if (!session) return;
      setBlockedUserIds(prev => new Set([...prev, userId]));
      await supabase.from('user_blocks').insert({ blocker_id: session.user.id, blocked_id: userId });
    },
    [session],
  );

  const unblockUser = useCallback(
    async (userId: string) => {
      if (!session) return;
      setBlockedUserIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
      await supabase.from('user_blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', userId);
    },
    [session],
  );

  const toggleDms = useCallback(
    async (disabled: boolean) => {
      if (!session) return;
      setDmsDisabled(disabled);
      await supabase.from('profiles').update({ dms_disabled: disabled }).eq('id', session.user.id);
    },
    [session],
  );

  const isBlocked = useCallback(
    (userId: string) => blockedUserIds.has(userId),
    [blockedUserIds],
  );

  const isBlockedBy = useCallback(
    (userId: string) => blockedByIds.has(userId),
    [blockedByIds],
  );

  const getWriteupsForCourse = useCallback(
    (courseId: string) => {
      return writeups.filter(w => w.course_id === courseId);
    },
    [writeups],
  );

  const getCourseName = useCallback(
    (courseId: string) => {
      return courses.find(c => c.id === courseId)?.short_name ?? '';
    },
    [courses],
  );

  const getUserName = useCallback(
    (userId: string) => {
      if (user && user.id === userId) return user.name;
      return profileCache.get(userId) ?? 'Member';
    },
    [user, profileCache],
  );

  return (
    <StoreContext.Provider
      value={{
        session,
        user,
        writeups,
        activities,
        courses,
        profiles,
        coursesPlayed,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        needsPasswordReset,
        clearPasswordReset,
        saveUser,
        addWriteup,
        updateWriteup,
        deleteWriteup,
        toggleWriteupReaction,
        togglePhotoUpvote,
        getWriteupsForCourse,
        getCourseName,
        getUserName,
        markCoursePlayed,
        unmarkCoursePlayed,
        posts,
        addPost,
        togglePostReaction,
        getPostReplies,
        addPostReply,
        getWriteupReplies,
        addWriteupReply,
        deletePost,
        flagContent,
        refreshData,
        follows,
        followingIds,
        toggleFollow,
        isFollowing,
        getFollowerCount,
        getFollowingCount,
        conversations,
        blockedUserIds,
        blockedByIds,
        loadConversations,
        getOrCreateConversation,
        getMessages,
        sendMessage,
        blockUser,
        unblockUser,
        toggleDms,
        isBlocked,
        isBlockedBy,
        dmsDisabled,
        hasUnreadMessages,
        markConversationRead,
        groups,
        conversationListItems,
        loadGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        joinGroup,
        leaveGroup,
        getGroupMembers,
        getGroupMessages,
        sendGroupMessage,
        markGroupRead,
        meetups,
        loadMeetups,
        createMeetup,
        updateMeetup,
        deleteMeetup,
        joinMeetup,
        leaveMeetup,
        getMeetupMembers,
        getMeetupMessages,
        sendMeetupMessage,
        markMeetupRead,
        notifications,
        hasUnreadNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
