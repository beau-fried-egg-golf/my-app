import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User, Course, Writeup, Photo, Activity, Profile, CoursePlayed, profileToUser } from '@/types';

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
  saveUser: (user: User) => Promise<void>;
  addWriteup: (data: { courseId: string; title: string; content: string; photos: { url: string; caption: string }[] }) => Promise<Writeup>;
  updateWriteup: (writeupId: string, data: { title: string; content: string; photos: { id?: string; url: string; caption: string }[] }) => Promise<void>;
  deleteWriteup: (writeupId: string) => Promise<void>;
  toggleUpvote: (writeupId: string) => Promise<void>;
  togglePhotoUpvote: (photoId: string) => Promise<void>;
  getWriteupsForCourse: (courseId: string) => Writeup[];
  getCourseName: (courseId: string) => string;
  getUserName: (userId: string) => string;
  markCoursePlayed: (courseId: string) => Promise<void>;
  unmarkCoursePlayed: (courseId: string) => Promise<void>;
  refreshData: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, string>>(new Map());

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadProfile(s.user.id);
        loadData();
      } else {
        setUser(null);
        setWriteups([]);
        setActivities([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      const [coursesRes, writeupsRes, profilesRes, playedRes] = await Promise.all([
        supabase.from('courses').select('*').order('name'),
        loadWriteups(),
        supabase.from('profiles').select('*').order('name'),
        supabase.from('courses_played').select('*'),
      ]);

      const loadedCourses = coursesRes.data ?? [];
      if (loadedCourses.length) setCourses(loadedCourses);
      if (writeupsRes) setWriteups(writeupsRes);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (playedRes.data) setCoursesPlayed(playedRes.data);

      const activitiesRes = await loadActivities(loadedCourses);
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
      .order('created_at', { ascending: false });

    if (!rawWriteups || rawWriteups.length === 0) return [];

    // Load photos for all writeups
    const writeupIds = rawWriteups.map(w => w.id);
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .in('writeup_id', writeupIds);

    // Load upvote counts for writeups
    const { data: writeupUpvotes } = await supabase
      .from('writeup_upvotes')
      .select('writeup_id, user_id')
      .in('writeup_id', writeupIds);

    // Load photo upvote counts
    const photoIds = (photos ?? []).map(p => p.id);
    const { data: photoUpvotes } = photoIds.length > 0
      ? await supabase
          .from('photo_upvotes')
          .select('photo_id, user_id')
          .in('photo_id', photoIds)
      : { data: [] };

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

    return rawWriteups.map(w => {
      const upvotes = (writeupUpvotes ?? []).filter(u => u.writeup_id === w.id);
      return {
        ...w,
        photos: photosByWriteup.get(w.id) ?? [],
        upvote_count: upvotes.length,
        user_has_upvoted: currentUserId ? upvotes.some(u => u.user_id === currentUserId) : false,
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

    return data.map(a => {
      const w = a.writeup_id ? writeupMap.get(a.writeup_id) : null;
      const courseList = coursesData ?? courses;
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
      };
    });
  }

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
        upvote_count: 0,
        user_has_upvoted: false,
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

  const toggleUpvote = useCallback(
    async (writeupId: string) => {
      if (!session || !user) return;
      const userId = session.user.id;

      const writeup = writeups.find(w => w.id === writeupId);
      if (!writeup) return;

      if (writeup.user_has_upvoted) {
        // Remove upvote
        await supabase
          .from('writeup_upvotes')
          .delete()
          .eq('user_id', userId)
          .eq('writeup_id', writeupId);

        // Remove upvote activity
        await supabase
          .from('activities')
          .delete()
          .eq('type', 'upvote')
          .eq('user_id', userId)
          .eq('writeup_id', writeupId);
      } else {
        // Add upvote
        await supabase
          .from('writeup_upvotes')
          .insert({ user_id: userId, writeup_id: writeupId });

        // Add activity
        await supabase.from('activities').insert({
          type: 'upvote',
          user_id: userId,
          writeup_id: writeupId,
          course_id: writeup.course_id,
          target_user_id: writeup.user_id,
        });
      }

      // Optimistic update
      setWriteups(prev =>
        prev.map(w => {
          if (w.id !== writeupId) return w;
          return {
            ...w,
            user_has_upvoted: !w.user_has_upvoted,
            upvote_count: (w.upvote_count ?? 0) + (w.user_has_upvoted ? -1 : 1),
          };
        }),
      );

      // Refresh activities
      const newActivities = await loadActivities();
      setActivities(newActivities);
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
        saveUser,
        addWriteup,
        updateWriteup,
        deleteWriteup,
        toggleUpvote,
        togglePhotoUpvote,
        getWriteupsForCourse,
        getCourseName,
        getUserName,
        markCoursePlayed,
        unmarkCoursePlayed,
        refreshData,
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
