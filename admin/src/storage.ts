import { supabase } from './supabase';
import type { Course, Writeup, Photo, Activity, Profile, Post, PostPhoto, PostReply, Conversation, Message, Meetup } from './types';

export async function getCourses(): Promise<Course[]> {
  const { data } = await supabase.from('courses').select('*').order('name');
  return data ?? [];
}

export async function saveCourse(course: Course): Promise<void> {
  await supabase.from('courses').upsert(course);
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
  await supabase.from('meetups').upsert(data);
}

export async function deleteMeetup(id: string): Promise<void> {
  await supabase.from('meetups').delete().eq('id', id);
}
