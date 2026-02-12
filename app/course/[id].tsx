import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Ionicons } from '@expo/vector-icons';
import { Course, Photo, Writeup } from '@/types';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import WordHighlight from '@/components/WordHighlight';
import EggRating from '@/components/EggRating';

function hasFEContent(course: Course): boolean {
  return !!(course.fe_hero_image || course.fe_profile_url || course.fe_profile_author || course.fe_egg_rating !== null || course.fe_bang_for_buck || course.fe_profile_date);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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

function WriteupCard({
  writeup,
  userName,
  onPress,
  isFeatured,
}: {
  writeup: Writeup;
  userName: string;
  onPress: () => void;
  isFeatured?: boolean;
}) {
  const nameParts = userName.split(' ').filter(Boolean);

  return (
    <Pressable style={[styles.writeupCard, isFeatured && styles.featuredCard]} onPress={onPress}>
      {isFeatured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="thumbs-up" size={12} color={Colors.black} />
          <Text style={styles.featuredText}>MOST LIKED</Text>
        </View>
      )}
      <Text style={styles.writeupTitle}>{writeup.title}</Text>
      <Text style={styles.writeupPreview} numberOfLines={2}>
        {writeup.content}
      </Text>
      <View style={styles.writeupMeta}>
        <WordHighlight words={nameParts} size={10} />
        <Text style={styles.writeupDot}> · </Text>
        <Text style={styles.writeupTime}>{formatTime(writeup.created_at)}</Text>
        <Text style={styles.writeupDot}> · </Text>
        <Ionicons name="thumbs-up-outline" size={12} color={Colors.gray} />
        <Text style={styles.writeupUpvotes}>{writeup.upvote_count ?? 0}</Text>
      </View>
    </Pressable>
  );
}

interface GalleryPhoto extends Photo {
  writeupId: string;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, writeups, getUserName, user, togglePhotoUpvote, coursesPlayed, markCoursePlayed, unmarkCoursePlayed } = useStore();
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [activeTab, setActiveTab] = useState<'writeups' | 'photos'>('writeups');
  const galleryScrollRef = useRef<ScrollView>(null);

  const course = courses.find((c) => c.id === id);
  if (!course) return null;

  const courseWriteups = useMemo(
    () =>
      writeups
        .filter((w) => w.course_id === id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [writeups, id],
  );

  const mostUpvoted = useMemo(() => {
    if (courseWriteups.length === 0) return null;
    return [...courseWriteups].sort((a, b) => (b.upvote_count ?? 0) - (a.upvote_count ?? 0))[0];
  }, [courseWriteups]);

  const allPhotos: GalleryPhoto[] = useMemo(
    () =>
      courseWriteups.flatMap((w) =>
        w.photos
          .filter((p) => !p.hidden)
          .map((p) => ({
            ...p,
            writeupId: w.id,
          })),
      ),
    [courseWriteups],
  );

  const sortedPhotos = useMemo(() => {
    return [...allPhotos].sort((a, b) => {
      if ((b.upvote_count ?? 0) !== (a.upvote_count ?? 0)) return (b.upvote_count ?? 0) - (a.upvote_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [allPhotos]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.courseNameBlock}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/courses')} style={styles.backArrow}>
          <Text style={styles.backArrowText}>{'<'}</Text>
        </Pressable>
        <View style={styles.courseNameContent}>
          <LetterSpacedHeader text={course.short_name} size={32} />
        </View>
      </View>

      {course.fe_hero_image && (
        <View style={styles.feHeroWrap}>
          {Platform.OS === 'web' ? (
            <img
              src={course.fe_hero_image}
              style={{ width: '100%', maxHeight: SCREEN_HEIGHT * 0.5, objectFit: 'cover', borderRadius: 8, display: 'block' }}
              alt={course.short_name}
            />
          ) : (
            <Image source={{ uri: course.fe_hero_image }} style={styles.feHero} resizeMode="cover" />
          )}
        </View>
      )}

      <View style={styles.courseHeader}>
        <View style={styles.courseDetailsRow}>
          <View style={styles.courseDetails}>
            <Text style={styles.courseAddress}>
              {course.address}, {course.city}
            </Text>
            <View style={styles.courseTagsRow}>
              <WordHighlight
                words={[
                  course.is_private ? 'PRIVATE' : 'PUBLIC',
                  `${course.holes} HOLES`,
                  `PAR ${course.par}`,
                  `EST. ${course.year_established}`,
                ]}
                size={11}
              />
            </View>
          </View>
          {user && (
            coursesPlayed.some(cp => cp.course_id === course.id && cp.user_id === user.id) ? (
              <Pressable style={styles.playedButtonActive} onPress={() => unmarkCoursePlayed(course.id)}>
                <Text style={styles.playedButtonActiveText}>Played</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.playedButton} onPress={() => markCoursePlayed(course.id)}>
                <Text style={styles.playedButtonText}>Mark Played</Text>
              </Pressable>
            )
          )}
        </View>
        <Text style={styles.courseDescription}>{course.description}</Text>
      </View>

      {course.fe_profile_url && (
        <Pressable
          style={styles.feProfileSection}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open(course.fe_profile_url!, '_blank');
            } else {
              Linking.openURL(course.fe_profile_url!);
            }
          }}
        >
          <Text style={styles.feProfileLink}>
            Read the full course profile{course.fe_profile_author ? ` by ${course.fe_profile_author}` : ''}
          </Text>
          {course.fe_profile_date && (
            <Text style={styles.feProfileDate}>
              {new Date(course.fe_profile_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          )}
          <EggRating rating={course.fe_egg_rating} />
        </Pressable>
      )}

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'writeups' && styles.tabActive]}
          onPress={() => setActiveTab('writeups')}
        >
          <Text style={[styles.tabText, activeTab === 'writeups' && styles.tabTextActive]}>
            Reviews ({courseWriteups.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
            Photos ({sortedPhotos.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'writeups' && (
        <>
          {mostUpvoted && (mostUpvoted.upvote_count ?? 0) > 0 && (
            <View style={styles.section}>
              <WriteupCard
                writeup={mostUpvoted}
                userName={mostUpvoted.author_name ?? getUserName(mostUpvoted.user_id)}
                onPress={() => router.push(`/writeup/${mostUpvoted.id}`)}
                isFeatured
              />
            </View>
          )}

          {courseWriteups.length > 0 && (
            <View style={styles.section}>
              {courseWriteups.map((w) => (
                <WriteupCard
                  key={w.id}
                  writeup={w}
                  userName={w.author_name ?? getUserName(w.user_id)}
                  onPress={() => router.push(`/writeup/${w.id}`)}
                />
              ))}
            </View>
          )}

          {courseWriteups.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          )}

          <View style={styles.addWriteupRow}>
            <Pressable
              style={styles.writeButton}
              onPress={() => router.push(`/create-writeup?courseId=${id}`)}
            >
              <Text style={styles.writeButtonText}>Post a review</Text>
            </Pressable>
          </View>
        </>
      )}

      {activeTab === 'photos' && (
        <>
          {sortedPhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {sortedPhotos.map((photo, i) => (
                <Pressable
                  key={photo.id}
                  onPress={() => {
                    setSelectedPhoto(i);
                    setGalleryVisible(true);
                  }}
                >
                  <View style={styles.photoGridItem}>
                    <Image source={{ uri: photo.url }} style={styles.photoGridThumb} />
                    {(photo.upvote_count ?? 0) > 0 && (
                      <View style={styles.thumbUpvoteBadge}>
                        <Text style={styles.thumbUpvoteText}>{photo.upvote_count}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No photos yet</Text>
            </View>
          )}
        </>
      )}

      <Modal visible={galleryVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalClose} onPress={() => setGalleryVisible(false)}>
            <Text style={styles.modalCloseText}>x</Text>
          </Pressable>
          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={() => {
              if (selectedPhoto > 0) {
                galleryScrollRef.current?.scrollTo({ x: selectedPhoto * SCREEN_WIDTH, animated: false });
              }
            }}
            style={Platform.OS === 'web' ? { scrollSnapType: 'x mandatory' } as any : undefined}
          >
            {sortedPhotos.map((photo) => {
              const photoHasUpvote = photo.user_has_upvoted ?? false;
              return (
                <View key={`modal-${photo.id}`} style={[styles.modalSlide, Platform.OS === 'web' && { scrollSnapAlign: 'start' } as any]}>
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <View style={styles.modalBelow}>
                    <Pressable
                      style={[styles.modalUpvote, photoHasUpvote && styles.modalUpvoteActive]}
                      onPress={() => togglePhotoUpvote(photo.id)}
                    >
                      <Ionicons name={photo.user_has_upvoted ? 'thumbs-up' : 'thumbs-up-outline'} size={13} color={Colors.white} />
                      <Text style={styles.modalUpvoteText}>{photo.upvote_count ?? 0}</Text>
                    </Pressable>
                    {photo.caption ? (
                      <Text style={styles.modalCaption} numberOfLines={2}>{photo.caption}</Text>
                    ) : null}
                    <Text style={styles.modalTime}>{formatTime(photo.created_at)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingBottom: 40 },
  courseNameBlock: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 16 },
  backArrow: { paddingRight: 12, paddingTop: 4 },
  backArrowText: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  courseNameContent: { flex: 1 },
  courseHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  courseDetails: { flex: 1 },
  courseAddress: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans },
  courseTagsRow: { marginTop: 10 },
  courseDescription: { fontSize: 15, color: Colors.darkGray, lineHeight: 22, marginTop: 12, fontFamily: Fonts!.sans },
  courseDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 },
  playedButton: { borderWidth: 1, borderColor: Colors.black, borderRadius: 4, paddingHorizontal: 15, paddingVertical: 8, marginLeft: 12, flexShrink: 0 },
  playedButtonText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  playedButtonActive: { backgroundColor: Colors.black, borderRadius: 4, paddingHorizontal: 15, paddingVertical: 8, marginLeft: 12, flexShrink: 0 },
  playedButtonActiveText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.black },
  tabText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
  tabTextActive: { fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  photoGridItem: { position: 'relative' },
  photoGridThumb: { width: (SCREEN_WIDTH - 24 - 16) / 3, height: (SCREEN_WIDTH - 24 - 16) / 3, borderRadius: 4 },
  thumbUpvoteBadge: { position: 'absolute', bottom: 4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  thumbUpvoteText: { fontSize: 10, color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  writeupCard: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 14, marginBottom: 10 },
  featuredCard: { borderColor: Colors.orange },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  featuredIcon: { marginRight: 2 },
  featuredText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.orange },
  writeupTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  writeupPreview: { fontSize: 14, color: Colors.darkGray, lineHeight: 20, marginTop: 4, fontFamily: Fonts!.sans },
  writeupMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4, flexWrap: 'wrap' },
  writeupDot: { color: Colors.gray, fontSize: 12, fontFamily: Fonts!.sans },
  writeupTime: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  writeupUpvotes: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, color: Colors.gray, fontFamily: Fonts!.sans },
  writeButton: { borderWidth: 1, borderColor: Colors.black, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  writeButtonText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  addWriteupRow: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  modalCloseText: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  modalSlide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.55 },
  modalBelow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, width: SCREEN_WIDTH, gap: 12 },
  modalCaption: { flex: 1, color: Colors.white, fontSize: 15, lineHeight: 22, fontFamily: Fonts!.sans, textAlign: 'center' },
  modalActions: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  modalUpvote: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  modalUpvoteActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: Colors.white },
  modalUpvoteText: { color: Colors.white, fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  modalTime: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: Fonts!.sans },
  feHeroWrap: { paddingHorizontal: 16, paddingTop: 12 },
  feHero: { width: '100%', height: SCREEN_HEIGHT * 0.4, borderRadius: 8 } as any,
  feProfileSection: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, gap: 4 },
  feProfileLink: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, textDecorationLine: 'underline' },
  feProfileDate: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
});
