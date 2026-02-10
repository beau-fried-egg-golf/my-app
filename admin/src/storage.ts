import { supabase } from './supabase';
import type { Course, Writeup, Photo, Activity, Profile } from './types';

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

  if (!writeups) return [];

  // Load photos
  const writeupIds = writeups.map(w => w.id);
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .in('writeup_id', writeupIds.length > 0 ? writeupIds : ['__none__']);

  // Load upvote counts
  const { data: upvotes } = await supabase
    .from('writeup_upvotes')
    .select('writeup_id')
    .in('writeup_id', writeupIds.length > 0 ? writeupIds : ['__none__']);

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
