import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useActionPane } from '@/hooks/useActionPane';
import { useStore } from '@/data/store';
import { supabase } from '@/data/supabase';
import { uploadPhoto } from '@/utils/photo';
import { Course } from '@/types';
import LinkPreview from '@/components/LinkPreview';
import DesktopActionPane from './DesktopActionPane';

type Mode = 'post' | 'review' | 'invite';

const TEXT_LINE_HEIGHT = 18;
const SCROLL_GAP = 14;
const URL_REGEX = /https?:\/\/\S+/;

function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  if (!match) return null;
  return match[0].replace(/[.,;:!?)]+$/, '');
}

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface PhotoDraft {
  uri: string;
  caption: string;
}

interface LinkMeta {
  title: string;
  description: string;
  image: string;
}

/* ── Tab with text-roll animation (matches ALL/FOLLOWING pattern) ── */

function HoverTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(TEXT_LINE_HEIGHT + SCROLL_GAP)],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [active ? Colors.black : 'transparent', Colors.white],
  });

  return (
    <Animated.View style={[styles.tab, { backgroundColor: bgColor }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={styles.tabInner}
      >
        <View style={styles.tabTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            <View style={{ height: SCROLL_GAP }} />
            <Text style={styles.tabText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ── Post Form ── */

function PostForm({
  content, setContent, photos, setPhotos, linkUrl, linkMeta, fetchingMeta, linkDismissed,
  onContentChange, dismissLink,
}: {
  content: string;
  setContent: (s: string) => void;
  photos: PhotoDraft[];
  setPhotos: (p: PhotoDraft[]) => void;
  linkUrl: string | null;
  linkMeta: LinkMeta | null;
  fetchingMeta: boolean;
  linkDismissed: boolean;
  onContentChange: (text: string) => void;
  dismissLink: () => void;
}) {
  const MAX_PHOTOS = 5;
  const showLinkPreview = linkUrl && !linkDismissed;

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.slice(0, remaining).map((a) => ({ uri: a.uri, caption: '' }));
      setPhotos([...photos, ...newPhotos]);
    }
  }

  return (
    <>
      <View style={styles.field}>
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={onContentChange}
          placeholder="What's on your mind?"
          placeholderTextColor={Colors.gray}
          multiline
          textAlignVertical="top"
        />
      </View>

      {showLinkPreview && (
        <View style={styles.linkPreviewSection}>
          {fetchingMeta ? (
            <View style={styles.linkLoading}>
              <ActivityIndicator size="small" color={Colors.gray} />
              <Text style={styles.linkLoadingText}>Loading preview...</Text>
            </View>
          ) : (
            <View>
              <LinkPreview
                url={linkUrl}
                title={linkMeta?.title}
                description={linkMeta?.description}
                image={linkMeta?.image}
              />
              <Pressable style={styles.dismissButton} onPress={dismissLink}>
                <Text style={styles.dismissText}>x</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View style={styles.photosSection}>
        {photos.length < MAX_PHOTOS && (
          <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
            <Text style={styles.addPhotoText}>ADD PHOTOS ({photos.length}/{MAX_PHOTOS})</Text>
          </Pressable>
        )}
        {photos.length >= MAX_PHOTOS && (
          <Text style={styles.photoLimitText}>Photo limit reached ({MAX_PHOTOS}/{MAX_PHOTOS})</Text>
        )}
        {photos.map((photo, i) => (
          <View key={i} style={styles.photoItem}>
            <View style={styles.photoRow}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TextInput
                style={styles.captionInput}
                value={photo.caption}
                onChangeText={(text) => {
                  const updated = [...photos];
                  updated[i] = { ...updated[i], caption: text };
                  setPhotos(updated);
                }}
                placeholder="Add a description..."
                placeholderTextColor={Colors.gray}
                multiline
                maxLength={200}
              />
              <Pressable style={styles.removePhoto} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
                <Text style={styles.removePhotoText}>x</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

/* ── Review Form ── */

function ReviewForm({
  courseId, setCourseId, title, setTitle, content, setContent, photos, setPhotos,
  courses,
}: {
  courseId: string | null;
  setCourseId: (id: string | null) => void;
  title: string;
  setTitle: (s: string) => void;
  content: string;
  setContent: (s: string) => void;
  photos: PhotoDraft[];
  setPhotos: (p: PhotoDraft[]) => void;
  courses: Course[];
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSortOrder, setCourseSortOrder] = useState<'alpha' | 'distance'>('alpha');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    })();
  }, []);

  function getCourseDistance(course: Course): number | null {
    if (!userLocation) return null;
    return getDistanceMiles(userLocation.lat, userLocation.lon, course.latitude, course.longitude);
  }

  const filteredCourses = useMemo(() => {
    let result = [...courses];
    if (courseSearch.trim()) {
      const q = courseSearch.trim().toLowerCase();
      result = result.filter(c => c.short_name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }
    if (courseSortOrder === 'distance' && userLocation) {
      result.sort((a, b) => (getCourseDistance(a) ?? Infinity) - (getCourseDistance(b) ?? Infinity));
    } else {
      result.sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
    return result;
  }, [courses, courseSearch, courseSortOrder, userLocation]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const MAX_PHOTOS = 10;

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.slice(0, remaining).map((a) => ({ uri: a.uri, caption: '' }));
      setPhotos([...photos, ...newPhotos]);
    }
  }

  return (
    <>
      <Pressable style={styles.coursePicker} onPress={() => setShowPicker(!showPicker)}>
        {selectedCourse ? (
          <Text style={styles.coursePickerText}>{selectedCourse.short_name}</Text>
        ) : (
          <Text style={styles.placeholder}>Select a course</Text>
        )}
        <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.gray} />
      </Pressable>

      {showPicker && (
        <>
          <View style={styles.pickerToolbar}>
            <TextInput
              style={styles.courseSearchInput}
              value={courseSearch}
              onChangeText={setCourseSearch}
              placeholder="Search courses..."
              placeholderTextColor={Colors.gray}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.pickerSortToggle}>
              <Pressable
                style={[styles.pickerSortBtn, courseSortOrder === 'alpha' && styles.pickerSortBtnActive]}
                onPress={() => setCourseSortOrder('alpha')}
              >
                <Text style={[styles.pickerSortBtnText, courseSortOrder === 'alpha' && styles.pickerSortBtnTextActive]}>A-Z</Text>
              </Pressable>
              <Pressable
                style={[styles.pickerSortBtn, courseSortOrder === 'distance' && styles.pickerSortBtnActive]}
                onPress={() => setCourseSortOrder('distance')}
              >
                <Text style={[styles.pickerSortBtnText, courseSortOrder === 'distance' && styles.pickerSortBtnTextActive]}>NEARBY</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView style={styles.courseList} nestedScrollEnabled>
            {filteredCourses.map((c) => {
              const dist = getCourseDistance(c);
              return (
                <Pressable
                  key={c.id}
                  style={[styles.courseOption, courseId === c.id && styles.courseOptionSelected]}
                  onPress={() => { setCourseId(c.id); setShowPicker(false); setCourseSearch(''); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseOptionText, courseId === c.id && styles.courseOptionTextSelected]}>
                      {c.short_name}
                    </Text>
                    <Text style={[styles.courseOptionCity, courseId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>{c.city}</Text>
                  </View>
                  {dist != null && (
                    <Text style={[styles.courseOptionCity, courseId === c.id && { color: 'rgba(255,255,255,0.7)' }]}>{Math.round(dist)} mi</Text>
                  )}
                </Pressable>
              );
            })}
            {filteredCourses.length === 0 && (
              <View style={{ padding: 14, alignItems: 'center' }}>
                <Text style={styles.courseOptionCity}>No courses found</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      <View style={styles.field}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={Colors.gray}
        />
      </View>

      <View style={styles.field}>
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Write about your experience..."
          placeholderTextColor={Colors.gray}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.photosSection}>
        {photos.length < MAX_PHOTOS && (
          <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
            <Text style={styles.addPhotoText}>ADD PHOTOS ({photos.length}/{MAX_PHOTOS})</Text>
          </Pressable>
        )}
        {photos.length >= MAX_PHOTOS && (
          <Text style={styles.photoLimitText}>Photo limit reached ({MAX_PHOTOS}/{MAX_PHOTOS})</Text>
        )}
        {photos.map((photo, i) => (
          <View key={i} style={styles.photoItem}>
            <View style={styles.photoRow}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TextInput
                style={styles.captionInput}
                value={photo.caption}
                onChangeText={(text) => {
                  const updated = [...photos];
                  updated[i] = { ...updated[i], caption: text };
                  setPhotos(updated);
                }}
                placeholder="Add a description..."
                placeholderTextColor={Colors.gray}
                multiline
                maxLength={200}
              />
              <Pressable style={styles.removePhoto} onPress={() => setPhotos(photos.filter((_, j) => j !== i))}>
                <Text style={styles.removePhotoText}>x</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

/* ── Invite Form ── */

function InviteForm({
  email, setEmail, note, setNote,
}: {
  email: string;
  setEmail: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
}) {
  return (
    <>
      <View style={styles.field}>
        <TextInput
          style={styles.titleInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Friend's email address"
          placeholderTextColor={Colors.gray}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={styles.field}>
        <TextInput
          style={[styles.contentInput, { minHeight: 100 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Add a personal note (optional)"
          placeholderTextColor={Colors.gray}
          multiline
          textAlignVertical="top"
        />
      </View>
    </>
  );
}

/* ── Main CreateChooser ── */

export default function CreateChooser() {
  const { activePane, closeActionPane } = useActionPane();
  const { user, courses, addPost, addWriteup, isPaidMember } = useStore();

  const reviewOnly = activePane === 'review-only';
  const [mode, setMode] = useState<Mode>(reviewOnly ? 'review' : 'post');
  const [submitting, setSubmitting] = useState(false);

  // Post state
  const [postContent, setPostContent] = useState('');
  const [postPhotos, setPostPhotos] = useState<PhotoDraft[]>([]);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Review state
  const [reviewCourseId, setReviewCourseId] = useState<string | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<PhotoDraft[]>([]);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNote, setInviteNote] = useState('');

  if (!user) return null;

  // Link detection for posts
  async function fetchLinkMeta(url: string): Promise<LinkMeta> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-link-meta', {
        body: { url },
      });
      if (!error && data && (data.title || data.image)) {
        return { title: data.title ?? '', description: data.description ?? '', image: data.image ?? '' };
      }
    } catch (e) {
      console.warn('fetch-link-meta call failed:', e);
    }
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.title && !data.error) {
        return {
          title: data.title,
          description: data.author_name ? `by ${data.author_name} on ${data.provider_name ?? ''}`.trim() : '',
          image: data.thumbnail_url ?? '',
        };
      }
    } catch (e) {
      console.warn('noembed fallback failed:', e);
    }
    return { title: '', description: '', image: '' };
  }

  function handlePostContentChange(text: string) {
    setPostContent(text);
    const detected = extractUrl(text);
    if (detected !== linkUrl) {
      setLinkDismissed(false);
      setLinkMeta(null);
      if (detected) {
        setLinkUrl(detected);
        setFetchingMeta(true);
        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;
        fetchLinkMeta(detected).then((meta) => {
          if (controller.signal.aborted) return;
          setLinkMeta(meta);
          setFetchingMeta(false);
        }).catch(() => {
          if (controller.signal.aborted) return;
          setFetchingMeta(false);
        });
      } else {
        setLinkUrl(null);
        setFetchingMeta(false);
      }
    }
  }

  // Submit logic
  const canSubmit = (() => {
    if (submitting) return false;
    if (mode === 'post') return !!postContent.trim();
    if (mode === 'review') return !!(reviewCourseId && reviewTitle.trim() && reviewContent.trim());
    if (mode === 'invite') return !!inviteEmail.trim();
    return false;
  })();

  const submitLabel = (() => {
    if (submitting) return 'SUBMITTING...';
    if (mode === 'post') return 'SUBMIT POST';
    if (mode === 'review') return 'SUBMIT REVIEW';
    return 'SEND INVITE';
  })();

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (mode === 'post') {
        const uploadedPhotos = await Promise.all(
          postPhotos.map(async (p) => ({
            url: await uploadPhoto(p.uri, user!.id),
            caption: p.caption.trim(),
          })),
        );
        const includingLink = linkUrl && !linkDismissed;
        await addPost({
          content: postContent.trim(),
          photos: uploadedPhotos,
          ...(includingLink && {
            link_url: linkUrl,
            link_title: linkMeta?.title || undefined,
            link_description: linkMeta?.description || undefined,
            link_image: linkMeta?.image || undefined,
          }),
        });
        closeActionPane();
      } else if (mode === 'review') {
        const uploadedPhotos = await Promise.all(
          reviewPhotos.map(async (p) => ({
            url: await uploadPhoto(p.uri, user!.id),
            caption: p.caption.trim(),
          })),
        );
        await addWriteup({
          courseId: reviewCourseId!,
          title: reviewTitle.trim(),
          content: reviewContent.trim(),
          photos: uploadedPhotos,
        });
        closeActionPane();
      } else if (mode === 'invite') {
        const { error } = await supabase.functions.invoke('send-invite', {
          body: {
            to_email: inviteEmail.trim(),
            sender_name: user?.name ?? 'A fellow golfer',
            note: inviteNote.trim() || null,
          },
        });
        if (error) throw error;
        closeActionPane();
        window.alert('Invite sent!');
      }
    } catch (e) {
      console.error('Failed to submit:', e);
      if (mode === 'invite') {
        window.alert('Failed to send invite. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <DesktopActionPane
      title=""
      onClose={closeActionPane}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
      submitDisabled={!canSubmit}
    >
      {/* Header text */}
      <Text style={styles.heroTitle}>
        {reviewOnly ? 'Share your experience with the club!' : 'Sometimes you have to crack an egg to make an omelet!'}
      </Text>
      <Text style={styles.heroSubtitle}>
        {reviewOnly ? 'Write a review for a course you\'ve played.' : 'What would you like to do today?'}
      </Text>

      {/* Tabs (hidden in review-only mode) */}
      {!reviewOnly && (
        <View style={styles.tabGroup}>
          <HoverTab label="POST" active={mode === 'post'} onPress={() => setMode('post')} />
          {isPaidMember && (
            <HoverTab label="REVIEW" active={mode === 'review'} onPress={() => setMode('review')} />
          )}
          <HoverTab label="INVITE" active={mode === 'invite'} onPress={() => setMode('invite')} />
        </View>
      )}

      {/* Form content */}
      <View style={styles.formArea}>
        {mode === 'post' && (
          <PostForm
            content={postContent}
            setContent={setPostContent}
            photos={postPhotos}
            setPhotos={setPostPhotos}
            linkUrl={linkUrl}
            linkMeta={linkMeta}
            fetchingMeta={fetchingMeta}
            linkDismissed={linkDismissed}
            onContentChange={handlePostContentChange}
            dismissLink={() => { setLinkDismissed(true); setLinkMeta(null); }}
          />
        )}
        {mode === 'review' && (
          <ReviewForm
            courseId={reviewCourseId}
            setCourseId={setReviewCourseId}
            title={reviewTitle}
            setTitle={setReviewTitle}
            content={reviewContent}
            setContent={setReviewContent}
            photos={reviewPhotos}
            setPhotos={setReviewPhotos}
            courses={courses}
          />
        )}
        {mode === 'invite' && (
          <InviteForm
            email={inviteEmail}
            setEmail={setInviteEmail}
            note={inviteNote}
            setNote={setInviteNote}
          />
        )}
      </View>
    </DesktopActionPane>
  );
}

const styles = StyleSheet.create({
  /* Header */
  heroTitle: {
    fontSize: 22,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 21,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 35,
  },

  /* Tabs (matches ALL/FOLLOWING) */
  tabGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.black,
    padding: 3,
    gap: 2,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tabInner: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabTextClip: {
    height: TEXT_LINE_HEIGHT,
  },
  tabText: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    letterSpacing: 0.5,
    lineHeight: TEXT_LINE_HEIGHT,
  },
  tabTextActive: {
    color: Colors.white,
  },

  /* Form area */
  formArea: {
    gap: 0,
  },

  /* Shared form styles */
  field: {
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    backgroundColor: Colors.white,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    minHeight: 160,
    lineHeight: 24,
    fontFamily: Fonts!.sans,
    backgroundColor: Colors.white,
  },
  coursePickerText: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  placeholder: {
    color: Colors.gray,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
  },

  /* Link preview */
  linkPreviewSection: { marginBottom: 12 },
  linkLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  linkLoadingText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
  dismissButton: { position: 'absolute', top: 16, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dismissText: { color: Colors.white, fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, lineHeight: 16 },

  /* Photos */
  photosSection: { marginBottom: 24, gap: 12 },
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addPhotoText: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  photoItem: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 8 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoThumb: { width: 72, height: 72, borderRadius: 6 },
  captionInput: { flex: 1, fontSize: 16, color: Colors.black, paddingVertical: 4, lineHeight: 20, fontFamily: Fonts!.sans, outlineStyle: 'none' } as any,
  removePhoto: { alignSelf: 'flex-start' },
  removePhotoText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  photoLimitText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, paddingVertical: 8 },

  /* Course picker (review) */
  coursePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12, backgroundColor: Colors.white },
  pickerToolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  courseSearchInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontFamily: Fonts!.sans, color: Colors.black, backgroundColor: Colors.white, outlineStyle: 'none' } as any,
  pickerSortToggle: { flexDirection: 'row', gap: 4 },
  pickerSortBtn: { paddingHorizontal: 6, paddingVertical: 5 },
  pickerSortBtnActive: { backgroundColor: Colors.orange },
  pickerSortBtnText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, letterSpacing: 0.5 },
  pickerSortBtnTextActive: { color: Colors.black },
  courseList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 12, maxHeight: 250, backgroundColor: Colors.white },
  courseOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  courseOptionSelected: { backgroundColor: Colors.orange },
  courseOptionText: { fontSize: 15, color: Colors.black, fontFamily: Fonts!.sans },
  courseOptionTextSelected: { color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  courseOptionCity: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
});
