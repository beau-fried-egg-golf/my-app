import { supabase, supabaseAuth } from './supabase';
import type { Course, Writeup, Photo, Activity, Profile, Post, PostPhoto, PostReply, WriteupReply, Conversation, Message, Meetup, ContentFlag, AdminUser, MeetupMember, Group, HoleAnnotation, AnnotationPin, PinPhoto, CancellationRequest, WaitlistEntry } from './types';

export async function getCourses(): Promise<Course[]> {
  const all: Course[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('name')
      .range(from, from + pageSize - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function saveCourse(course: Course): Promise<void> {
  await supabase.from('courses').upsert(course);
}

export async function saveCourses(courses: Course[]): Promise<{ errors: string[] }> {
  const batchSize = 200;
  const errors: string[] = [];
  for (let i = 0; i < courses.length; i += batchSize) {
    const batch = courses.slice(i, i + batchSize);
    const { error } = await supabase.from('courses').upsert(batch);
    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
    }
  }
  return { errors };
}

export async function deleteCourse(id: string): Promise<void> {
  await supabase.from('courses').delete().eq('id', id);
}

export async function getWriteups(): Promise<Writeup[]> {
  const { data: writeups } = await supabase
    .from('writeups')
    .select('*')
    .order('created_at', { ascending: false });

  if (!writeups || writeups.length === 0) return [];

  // Load photos
  const writeupIds = writeups.map(w => w.id);
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .in('writeup_id', writeupIds);

  // Load upvote counts
  const { data: upvotes } = await supabase
    .from('writeup_upvotes')
    .select('writeup_id')
    .in('writeup_id', writeupIds);

  const photosByWriteup = new Map<string, Photo[]>();
  for (const p of photos ?? []) {
    const list = photosByWriteup.get(p.writeup_id) ?? [];
    list.push(p);
    photosByWriteup.set(p.writeup_id, list);
  }

  const upvoteCounts = new Map<string, number>();
  for (const u of upvotes ?? []) {
    upvoteCounts.set(u.writeup_id, (upvoteCounts.get(u.writeup_id) ?? 0) + 1);
  }

  return writeups.map(w => ({
    ...w,
    photos: photosByWriteup.get(w.id) ?? [],
    upvote_count: upvoteCounts.get(w.id) ?? 0,
  }));
}

export async function updateWriteup(id: string, data: Partial<Writeup>): Promise<void> {
  const { photos, upvote_count, ...writeupData } = data;
  await supabase.from('writeups').update(writeupData).eq('id', id);
}

export async function deleteWriteup(id: string): Promise<void> {
  await supabase.from('writeups').delete().eq('id', id);
}

export async function updatePhoto(id: string, data: Partial<Photo>): Promise<void> {
  await supabase.from('photos').update(data).eq('id', id);
}

export async function getActivities(): Promise<Activity[]> {
  const { data } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*');
  return data ?? [];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data;
}

export async function updateProfile(id: string, data: Partial<Profile>): Promise<void> {
  await supabase.from('profiles').update(data).eq('id', id);
}

// ---- Posts ----

export async function getPosts(): Promise<Post[]> {
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (!rawPosts || rawPosts.length === 0) return [];

  const postIds = rawPosts.map(p => p.id);

  const [photosRes, reactionsRes, repliesRes] = await Promise.all([
    supabase.from('post_photos').select('*').in('post_id', postIds),
    supabase.from('post_reactions').select('post_id').in('post_id', postIds),
    supabase.from('post_replies').select('post_id').in('post_id', postIds),
  ]);

  // Author names
  const authorIds = [...new Set(rawPosts.map(p => p.user_id))];
  const { data: authorProfiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', authorIds);
  const authorMap = new Map((authorProfiles ?? []).map(p => [p.id, p.name]));

  const photosByPost = new Map<string, PostPhoto[]>();
  for (const photo of photosRes.data ?? []) {
    const list = photosByPost.get(photo.post_id) ?? [];
    list.push(photo);
    photosByPost.set(photo.post_id, list);
  }

  const reactionCountByPost = new Map<string, number>();
  for (const r of reactionsRes.data ?? []) {
    reactionCountByPost.set(r.post_id, (reactionCountByPost.get(r.post_id) ?? 0) + 1);
  }

  const replyCountByPost = new Map<string, number>();
  for (const r of repliesRes.data ?? []) {
    replyCountByPost.set(r.post_id, (replyCountByPost.get(r.post_id) ?? 0) + 1);
  }

  return rawPosts.map(p => ({
    ...p,
    photos: photosByPost.get(p.id) ?? [],
    reaction_count: reactionCountByPost.get(p.id) ?? 0,
    reply_count: replyCountByPost.get(p.id) ?? 0,
    author_name: authorMap.get(p.user_id) ?? 'Member',
  }));
}

export async function deletePost(id: string): Promise<void> {
  await supabase.from('posts').delete().eq('id', id);
  await supabase.from('activities').delete().eq('post_id', id);
}

export async function getPostReplies(postId: string): Promise<PostReply[]> {
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
}

export async function deletePostReply(id: string): Promise<void> {
  await supabase.from('post_replies').delete().eq('id', id);
}

// ---- Writeup Replies ----

export async function getWriteupReplies(writeupId: string): Promise<WriteupReply[]> {
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
}

export async function deleteWriteupReply(id: string): Promise<void> {
  await supabase.from('writeup_replies').delete().eq('id', id);
}

// ---- Conversations / Messages ----

export async function getConversations(): Promise<Conversation[]> {
  const { data: convos } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (!convos || convos.length === 0) return [];

  // Get all participant IDs
  const userIds = [...new Set(convos.flatMap(c => [c.user1_id, c.user2_id]))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  // Get message counts and last messages
  const convoIds = convos.map(c => c.id);
  const { data: messages } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at')
    .in('conversation_id', convoIds)
    .order('created_at', { ascending: false });

  const lastMsgMap = new Map<string, { content: string; created_at: string }>();
  const msgCountMap = new Map<string, number>();
  for (const msg of messages ?? []) {
    msgCountMap.set(msg.conversation_id, (msgCountMap.get(msg.conversation_id) ?? 0) + 1);
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg);
    }
  }

  return convos.map(c => {
    const lastMsg = lastMsgMap.get(c.id);
    return {
      ...c,
      user1_name: profileMap.get(c.user1_id) ?? 'Member',
      user2_name: profileMap.get(c.user2_id) ?? 'Member',
      message_count: msgCountMap.get(c.id) ?? 0,
      last_message: lastMsg?.content,
      last_message_at: lastMsg?.created_at,
    };
  });
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) return [];

  const authorIds = [...new Set(messages.map(m => m.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', authorIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  return messages.map(m => ({
    ...m,
    author_name: profileMap.get(m.user_id) ?? 'Member',
  }));
}

export async function deleteMessage(id: string): Promise<void> {
  await supabase.from('messages').delete().eq('id', id);
}

// ---- Meetups ----

export async function getMeetups(): Promise<Meetup[]> {
  const { data: meetups } = await supabase
    .from('meetups')
    .select('*')
    .order('meetup_date', { ascending: false });

  if (!meetups || meetups.length === 0) return [];

  // Enrich with host names
  const hostIds = [...new Set(meetups.map(m => m.host_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', hostIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  // Get member counts
  const meetupIds = meetups.map(m => m.id);
  const { data: members } = await supabase
    .from('meetup_members')
    .select('meetup_id')
    .in('meetup_id', meetupIds);

  const memberCountMap = new Map<string, number>();
  for (const m of members ?? []) {
    memberCountMap.set(m.meetup_id, (memberCountMap.get(m.meetup_id) ?? 0) + 1);
  }

  return meetups.map(m => ({
    ...m,
    host_name: profileMap.get(m.host_id) ?? 'Member',
    member_count: memberCountMap.get(m.id) ?? 0,
  }));
}

export async function saveMeetup(meetup: Meetup): Promise<void> {
  const { host_name, member_count, ...data } = meetup;
  const { error } = await supabase.from('meetups').upsert(data);
  if (error) console.error('saveMeetup failed:', error, data);
}

export async function deleteMeetup(id: string): Promise<void> {
  const { error } = await supabase.from('meetups').delete().eq('id', id);
  if (error) console.error('deleteMeetup failed:', error);
}

export async function suspendMeetup(id: string, suspended: boolean): Promise<void> {
  const { error } = await supabase.from('meetups').update({ suspended }).eq('id', id);
  if (error) console.error('suspendMeetup failed:', error);
}

// ---- Admin Users ----

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function addAdminUser(email: string, name: string): Promise<void> {
  const { data: { user } } = await supabaseAuth.auth.getUser();
  // Find current admin user's id for invited_by
  const { data: currentAdmin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', user?.email ?? '')
    .single();

  await supabase.from('admin_users').insert({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    invited_by: currentAdmin?.id ?? null,
  });
}

export async function removeAdminUser(id: string): Promise<void> {
  await supabase.from('admin_users').delete().eq('id', id);
}

// ---- Meetup Members ----

export async function getMeetupMembers(meetupId: string): Promise<MeetupMember[]> {
  const { data: members } = await supabase
    .from('meetup_members')
    .select('*')
    .eq('meetup_id', meetupId)
    .order('joined_at', { ascending: true });

  if (!members || members.length === 0) return [];

  const userIds = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  return members.map(m => ({
    ...m,
    payment_status: m.payment_status ?? 'pending',
    member_name: profileMap.get(m.user_id) ?? 'Member',
  }));
}

export async function updateMeetupMemberPayment(memberId: string, status: string): Promise<void> {
  await supabase
    .from('meetup_members')
    .update({ payment_status: status })
    .eq('id', memberId);
}

// ---- Groups ----

export async function getGroups(): Promise<Group[]> {
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (!groups || groups.length === 0) return [];

  const creatorIds = [...new Set(groups.map(g => g.creator_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', creatorIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  const groupIds = groups.map(g => g.id);
  const { data: members } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds);
  const countMap = new Map<string, number>();
  for (const m of members ?? []) {
    countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1);
  }

  return groups.map(g => ({
    ...g,
    creator_name: profileMap.get(g.creator_id) ?? 'Member',
    member_count: countMap.get(g.id) ?? 0,
  }));
}

// ---- Content Flags ----

export async function fetchFlaggedContent(): Promise<ContentFlag[]> {
  const { data: flags } = await supabase
    .from('content_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (!flags || flags.length === 0) return [];

  // Group by content_type + content_id and count
  const grouped = new Map<string, { flags: typeof flags; content_type: string; content_id: string }>();
  for (const f of flags) {
    const key = `${f.content_type}:${f.content_id}`;
    const entry = grouped.get(key) ?? { flags: [] as typeof flags, content_type: f.content_type, content_id: f.content_id };
    entry.flags.push(f);
    grouped.set(key, entry);
  }

  // Fetch content previews
  const postIds = [...grouped.values()].filter(g => g.content_type === 'post').map(g => g.content_id);
  const writeupIds = [...grouped.values()].filter(g => g.content_type === 'writeup').map(g => g.content_id);
  const courseIds = [...grouped.values()].filter(g => g.content_type === 'course').map(g => g.content_id);

  const [postsRes, writeupsRes, coursesRes] = await Promise.all([
    postIds.length > 0
      ? supabase.from('posts').select('id, content, user_id, hidden').in('id', postIds)
      : { data: [] },
    writeupIds.length > 0
      ? supabase.from('writeups').select('id, title, user_id, hidden').in('id', writeupIds)
      : { data: [] },
    courseIds.length > 0
      ? supabase.from('courses').select('id, name').in('id', courseIds)
      : { data: [] },
  ]);

  const postMap = new Map((postsRes.data ?? []).map(p => [p.id, p]));
  const writeupMap = new Map((writeupsRes.data ?? []).map(w => [w.id, w]));
  const courseMap = new Map((coursesRes.data ?? []).map(c => [c.id, c.name as string]));

  // Fetch author names
  const allUserIds = [
    ...(postsRes.data ?? []).map(p => p.user_id),
    ...(writeupsRes.data ?? []).map(w => w.user_id),
  ];
  const uniqueUserIds = [...new Set(allUserIds)];
  const { data: profiles } = uniqueUserIds.length > 0
    ? await supabase.from('profiles').select('id, name').in('id', uniqueUserIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  const result: ContentFlag[] = [];
  for (const [, entry] of grouped) {
    const firstFlag = entry.flags[0];
    let content_preview = '';
    let author_name = '';
    let course_name: string | undefined;
    let reason: string | undefined;

    if (entry.content_type === 'course') {
      course_name = courseMap.get(entry.content_id) ?? 'Unknown Course';
      reason = firstFlag.reason ?? '';
      content_preview = reason || 'No reason provided';
    } else if (entry.content_type === 'post') {
      const post = postMap.get(entry.content_id);
      content_preview = post?.content?.slice(0, 100) ?? '[deleted]';
      author_name = post ? (profileMap.get(post.user_id) ?? 'Member') : 'Unknown';
    } else {
      const writeup = writeupMap.get(entry.content_id);
      content_preview = writeup?.title ?? '[deleted]';
      author_name = writeup ? (profileMap.get(writeup.user_id) ?? 'Member') : 'Unknown';
    }

    result.push({
      id: firstFlag.id,
      user_id: firstFlag.user_id,
      content_type: entry.content_type as 'post' | 'writeup' | 'course',
      content_id: entry.content_id,
      created_at: firstFlag.created_at,
      flag_count: entry.flags.length,
      content_preview,
      author_name,
      course_name,
      reason,
    });
  }

  return result.sort((a, b) => (b.flag_count ?? 0) - (a.flag_count ?? 0));
}

export async function republishContent(contentType: 'post' | 'writeup', contentId: string): Promise<void> {
  const table = contentType === 'post' ? 'posts' : 'writeups';
  await supabase.from(table).update({ hidden: false }).eq('id', contentId);
  await supabase.from('content_flags').delete().eq('content_type', contentType).eq('content_id', contentId);
}

export async function keepContentHidden(contentType: 'post' | 'writeup', contentId: string): Promise<void> {
  await supabase.from('content_flags').delete().eq('content_type', contentType).eq('content_id', contentId);
}

export async function dismissCourseReport(contentId: string): Promise<void> {
  await supabase.from('content_flags').delete().eq('content_type', 'course').eq('content_id', contentId);
}

export async function togglePostHidden(postId: string, currentHidden: boolean): Promise<void> {
  await supabase.from('posts').update({ hidden: !currentHidden }).eq('id', postId);
}

export async function togglePostPinned(id: string, currentPinned: boolean): Promise<void> {
  await supabase.from('posts').update({ pinned: !currentPinned }).eq('id', id);
}

export async function toggleWriteupPinned(id: string, currentPinned: boolean): Promise<void> {
  await supabase.from('writeups').update({ pinned: !currentPinned }).eq('id', id);
}

export async function toggleMeetupPinned(id: string, currentPinned: boolean): Promise<void> {
  await supabase.from('meetups').update({ pinned: !currentPinned }).eq('id', id);
}

export async function createFEPost(data: {
  user_id: string;
  content: string;
  link_url: string;
  link_title: string;
  link_description: string;
  link_image: string;
}): Promise<void> {
  const postId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error: postError } = await supabase.from('posts').insert({
    id: postId,
    user_id: data.user_id,
    content: data.content,
    hidden: false,
    created_at: now,
    link_url: data.link_url,
    link_title: data.link_title,
    link_description: data.link_description,
    link_image: data.link_image,
  });

  if (postError) throw postError;

  const { error: activityError } = await supabase.from('activities').insert({
    id: crypto.randomUUID(),
    type: 'post',
    user_id: data.user_id,
    post_id: postId,
    created_at: now,
  });

  if (activityError) throw activityError;

  // Notify followers via push + in-app notifications
  await supabase.functions.invoke('notify-fe-post', {
    body: { post_id: postId, poster_name: 'The Fried Egg' },
  });
}

// ---- Email Templates (Supabase Management API) ----

export interface EmailTemplate {
  subject: string;
  content: string;
}

export interface EmailTemplates {
  confirm: EmailTemplate;
  recovery: EmailTemplate;
  magic_link: EmailTemplate;
}

const SUPABASE_PROJECT_REF = import.meta.env.VITE_SUPABASE_URL
  ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
  : '';
const MANAGEMENT_API_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? '';

async function managementApiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.supabase.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${MANAGEMENT_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Management API error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getEmailTemplates(): Promise<EmailTemplates> {
  const config = await managementApiFetch(
    `/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`
  );

  return {
    confirm: {
      subject: config.MAILER_SUBJECTS_CONFIRMATION ?? '',
      content: config.MAILER_TEMPLATES_CONFIRMATION_CONTENT ?? '',
    },
    recovery: {
      subject: config.MAILER_SUBJECTS_RECOVERY ?? '',
      content: config.MAILER_TEMPLATES_RECOVERY_CONTENT ?? '',
    },
    magic_link: {
      subject: config.MAILER_SUBJECTS_MAGIC_LINK ?? '',
      content: config.MAILER_TEMPLATES_MAGIC_LINK_CONTENT ?? '',
    },
  };
}

export async function updateEmailTemplate(
  type: 'confirm' | 'recovery' | 'magic_link',
  subject: string,
  content: string
): Promise<void> {
  const keyMap: Record<string, { subject: string; content: string }> = {
    confirm: {
      subject: 'MAILER_SUBJECTS_CONFIRMATION',
      content: 'MAILER_TEMPLATES_CONFIRMATION_CONTENT',
    },
    recovery: {
      subject: 'MAILER_SUBJECTS_RECOVERY',
      content: 'MAILER_TEMPLATES_RECOVERY_CONTENT',
    },
    magic_link: {
      subject: 'MAILER_SUBJECTS_MAGIC_LINK',
      content: 'MAILER_TEMPLATES_MAGIC_LINK_CONTENT',
    },
  };

  const keys = keyMap[type];
  await managementApiFetch(
    `/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        [keys.subject]: subject,
        [keys.content]: content,
      }),
    }
  );
}

// ---- Hole Annotations ----

export async function getAnnotations(): Promise<HoleAnnotation[]> {
  const { data: annotations } = await supabase
    .from('hole_annotations')
    .select('*')
    .order('created_at', { ascending: false });

  if (!annotations || annotations.length === 0) return [];

  const annotationIds = annotations.map(a => a.id);
  const { data: pins } = await supabase
    .from('annotation_pins')
    .select('annotation_id')
    .in('annotation_id', annotationIds);

  const pinCountMap = new Map<string, number>();
  for (const p of pins ?? []) {
    pinCountMap.set(p.annotation_id, (pinCountMap.get(p.annotation_id) ?? 0) + 1);
  }

  return annotations.map(a => ({
    ...a,
    pin_count: pinCountMap.get(a.id) ?? 0,
  }));
}

export async function getAnnotation(id: string): Promise<{
  annotation: HoleAnnotation;
  pins: AnnotationPin[];
  pinPhotos: PinPhoto[];
} | null> {
  const { data: annotation } = await supabase
    .from('hole_annotations')
    .select('*')
    .eq('id', id)
    .single();

  if (!annotation) return null;

  const { data: pins } = await supabase
    .from('annotation_pins')
    .select('*')
    .eq('annotation_id', id)
    .order('sort_order');

  const pinIds = (pins ?? []).map(p => p.id);
  let pinPhotos: PinPhoto[] = [];
  if (pinIds.length > 0) {
    const { data } = await supabase
      .from('pin_photos')
      .select('*')
      .in('pin_id', pinIds)
      .order('sort_order');
    pinPhotos = data ?? [];
  }

  return { annotation, pins: pins ?? [], pinPhotos };
}

export async function createAnnotation(data: Partial<HoleAnnotation>): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await supabase.from('hole_annotations').insert({
    id,
    title: data.title ?? 'Untitled',
    course_name: data.course_name ?? '',
    hole_number: data.hole_number ?? 1,
    aerial_image_url: data.aerial_image_url ?? null,
    annotation_type: data.annotation_type ?? 'scroll',
    pin_color: data.pin_color ?? 'black',
    created_at: now,
    updated_at: now,
  });
  return id;
}

export async function saveAnnotation(
  annotation: HoleAnnotation,
  pins: AnnotationPin[],
  pinPhotos: PinPhoto[],
): Promise<void> {
  const { pin_count, ...annotationData } = annotation;
  annotationData.updated_at = new Date().toISOString();
  await supabase.from('hole_annotations').upsert(annotationData);

  // Get existing pins to diff
  const { data: existingPins } = await supabase
    .from('annotation_pins')
    .select('id')
    .eq('annotation_id', annotation.id);
  const existingPinIds = new Set((existingPins ?? []).map(p => p.id));
  const currentPinIds = new Set(pins.map(p => p.id));

  // Delete removed pins
  const removedPinIds = [...existingPinIds].filter(id => !currentPinIds.has(id));
  if (removedPinIds.length > 0) {
    await supabase.from('annotation_pins').delete().in('id', removedPinIds);
  }

  // Upsert current pins
  if (pins.length > 0) {
    await supabase.from('annotation_pins').upsert(pins);
  }

  // Get existing photos to diff
  const currentPinIdsArray = [...currentPinIds];
  let existingPhotoIds = new Set<string>();
  if (currentPinIdsArray.length > 0) {
    const { data: existingPhotos } = await supabase
      .from('pin_photos')
      .select('id')
      .in('pin_id', currentPinIdsArray);
    existingPhotoIds = new Set((existingPhotos ?? []).map(p => p.id));
  }
  const currentPhotoIds = new Set(pinPhotos.map(p => p.id));

  // Delete removed photos
  const removedPhotoIds = [...existingPhotoIds].filter(id => !currentPhotoIds.has(id));
  if (removedPhotoIds.length > 0) {
    await supabase.from('pin_photos').delete().in('id', removedPhotoIds);
  }

  // Upsert current photos
  if (pinPhotos.length > 0) {
    await supabase.from('pin_photos').upsert(pinPhotos);
  }
}

export async function deleteAnnotation(id: string): Promise<void> {
  await supabase.from('hole_annotations').delete().eq('id', id);
}

// ---- Cancellation Requests ----

export async function getCancellationRequests(): Promise<CancellationRequest[]> {
  const { data: requests } = await supabase
    .from('cancellation_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (!requests || requests.length === 0) return [];

  const userIds = [...new Set(requests.map(r => r.user_id))];
  const meetupIds = [...new Set(requests.map(r => r.meetup_id))];

  const [profilesRes, meetupsRes] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', userIds),
    supabase.from('meetups').select('id, name, meetup_date').in('id', meetupIds),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p.name]));
  const meetupMap = new Map((meetupsRes.data ?? []).map(m => [m.id, m]));

  return requests.map(r => ({
    ...r,
    user_name: profileMap.get(r.user_id) ?? 'Member',
    meetup_name: meetupMap.get(r.meetup_id)?.name ?? 'Unknown',
    meetup_date: meetupMap.get(r.meetup_id)?.meetup_date,
  }));
}

export async function approveCancellationRequest(id: string, adminNote?: string): Promise<void> {
  // Get the request
  const { data: request } = await supabase
    .from('cancellation_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (!request) return;

  // Update status
  await supabase.from('cancellation_requests').update({
    status: 'approved',
    admin_note: adminNote ?? null,
    resolved_at: new Date().toISOString(),
  }).eq('id', id);

  // Process refund via edge function
  await supabase.functions.invoke('stripe-refund', {
    body: { member_id: request.member_id },
  });

  // Insert notification for user
  await supabase.from('notifications').insert({
    user_id: request.user_id,
    type: 'cancellation_approved',
    meetup_id: request.meetup_id,
  });

  // Notify first waitlist person
  await notifyNextWaitlistUser(request.meetup_id);
}

export async function denyCancellationRequest(id: string, adminNote?: string): Promise<void> {
  const { data: request } = await supabase
    .from('cancellation_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (!request) return;

  await supabase.from('cancellation_requests').update({
    status: 'denied',
    admin_note: adminNote ?? null,
    resolved_at: new Date().toISOString(),
  }).eq('id', id);

  await supabase.from('notifications').insert({
    user_id: request.user_id,
    type: 'cancellation_denied',
    meetup_id: request.meetup_id,
  });
}

async function notifyNextWaitlistUser(meetupId: string): Promise<void> {
  const { data: first } = await supabase
    .from('meetup_waitlist')
    .select('*')
    .eq('meetup_id', meetupId)
    .order('position', { ascending: true })
    .limit(1)
    .single();

  if (!first) return;

  const { data: meetup } = await supabase
    .from('meetups')
    .select('name')
    .eq('id', meetupId)
    .single();

  await supabase.from('notifications').insert({
    user_id: first.user_id,
    type: 'waitlist_spot_available',
    meetup_id: meetupId,
  });

  // Send push via edge function
  await supabase.functions.invoke('send-push', {
    body: {
      recipient_id: first.user_id,
      title: 'Spot Available!',
      body: `A spot opened up in ${meetup?.name ?? 'a meetup'}! Reserve it now.`,
      data: { meetup_id: meetupId },
      push_type: 'notification',
    },
  });
}

export async function getWaitlistEntries(meetupId: string): Promise<WaitlistEntry[]> {
  const { data: entries } = await supabase
    .from('meetup_waitlist')
    .select('*')
    .eq('meetup_id', meetupId)
    .order('position', { ascending: true });

  if (!entries || entries.length === 0) return [];

  const userIds = [...new Set(entries.map(e => e.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]));

  return entries.map(e => ({
    ...e,
    user_name: profileMap.get(e.user_id) ?? 'Member',
  }));
}

export async function removeFromWaitlist(entryId: string): Promise<void> {
  await supabase.from('meetup_waitlist').delete().eq('id', entryId);
}

export async function duplicateAnnotation(id: string): Promise<string | null> {
  const result = await getAnnotation(id);
  if (!result) return null;

  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  await supabase.from('hole_annotations').insert({
    id: newId,
    title: result.annotation.title + ' (copy)',
    course_name: result.annotation.course_name,
    hole_number: result.annotation.hole_number,
    aerial_image_url: result.annotation.aerial_image_url,
    annotation_type: result.annotation.annotation_type,
    pin_color: result.annotation.pin_color,
    location: result.annotation.location,
    architect: result.annotation.architect,
    year_opened: result.annotation.year_opened,
    course_description: result.annotation.course_description,
    created_at: now,
    updated_at: now,
  });

  // Deep copy pins + photos with new UUIDs
  for (const pin of result.pins) {
    const newPinId = crypto.randomUUID();
    await supabase.from('annotation_pins').insert({
      id: newPinId,
      annotation_id: newId,
      position_x: pin.position_x,
      position_y: pin.position_y,
      sort_order: pin.sort_order,
      headline: pin.headline,
      body_text: pin.body_text,
      link_url: pin.link_url,
      par: pin.par,
      yardage: pin.yardage,
      handicap: pin.handicap,
      scroll_direction: pin.scroll_direction,
      card_position_x: pin.card_position_x,
      card_position_y: pin.card_position_y,
      created_at: now,
    });

    const pinPhotos = result.pinPhotos.filter(p => p.pin_id === pin.id);
    for (const photo of pinPhotos) {
      await supabase.from('pin_photos').insert({
        id: crypto.randomUUID(),
        pin_id: newPinId,
        photo_url: photo.photo_url,
        sort_order: photo.sort_order,
        caption: photo.caption,
        created_at: now,
      });
    }
  }

  return newId;
}
