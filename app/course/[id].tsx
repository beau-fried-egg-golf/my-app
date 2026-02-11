import { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Photo, Writeup } from '@/types';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import WordHighlight from '@/components/WordHighlight';

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
          <Text style={styles.featuredArrow}>^</Text>
          <Text style={styles.featuredText}>MOST UPVOTED</Text>
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
        <Text style={styles.writeupUpvotes}>^ {writeup.upvote_count ?? 0}</Text>
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
  const { courses, writeups, getUserName, user, togglePhotoUpvote } = useStore();
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

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
        <Pressable onPress={() => router.back()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>{'<'}</Text>
        </Pressable>
        <View style={styles.courseNameContent}>
          <LetterSpacedHeader text={course.short_name} size={32} />
        </View>
      </View>
      <View style={styles.courseHeader}>
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
        <Text style={styles.courseDescription}>{course.description}</Text>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {courseWriteups.length} writeup{courseWriteups.length !== 1 ? 's' : ''}
        </Text>
        {courseWriteups.length > 0 && (
          <Text style={styles.statsSubtext}>
            Latest {formatTime(courseWriteups[0].created_at)}
          </Text>
        )}
      </View>

      {sortedPhotos.length > 0 && (
        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>Photos ({sortedPhotos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {sortedPhotos.map((photo, i) => (
              <Pressable
                key={photo.id}
                onPress={() => {
                  setSelectedPhoto(i);
                  setGalleryVisible(true);
                }}
              >
                <View style={styles.galleryItem}>
                  <Image source={{ uri: photo.url }} style={styles.galleryThumb} />
                  {(photo.upvote_count ?? 0) > 0 && (
                    <View style={styles.thumbUpvoteBadge}>
                      <Text style={styles.thumbUpvoteText}>^ {photo.upvote_count}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

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
          <Text style={styles.sectionTitle}>Writeups</Text>
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
          <Text style={styles.emptyText}>No writeups yet</Text>
          <Pressable
            style={styles.writeButton}
            onPress={() => router.push(`/create-writeup?courseId=${id}`)}
          >
            <Text style={styles.writeButtonText}>Write the first one</Text>
          </Pressable>
        </View>
      )}

      {courseWriteups.length > 0 && (
        <View style={styles.addWriteupRow}>
          <Pressable
            style={styles.writeButton}
            onPress={() => router.push(`/create-writeup?courseId=${id}`)}
          >
            <Text style={styles.writeButtonText}>Write a review</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={galleryVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalClose} onPress={() => setGalleryVisible(false)}>
            <Text style={styles.modalCloseText}>x</Text>
          </Pressable>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedPhoto * SCREEN_WIDTH, y: 0 }}
          >
            {sortedPhotos.map((photo) => {
              const photoHasUpvote = photo.user_has_upvoted ?? false;
              return (
                <View key={`modal-${photo.id}`} style={styles.modalSlide}>
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <View style={styles.modalOverlay}>
                    {photo.caption ? (
                      <Text style={styles.modalCaption}>{photo.caption}</Text>
                    ) : null}
                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalUpvote, photoHasUpvote && styles.modalUpvoteActive]}
                        onPress={() => togglePhotoUpvote(photo.id)}
                      >
                        <Text style={styles.modalUpvoteText}>^ {photo.upvote_count ?? 0}</Text>
                      </Pressable>
                      <Text style={styles.modalTime}>{formatTime(photo.created_at)}</Text>
                    </View>
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
  courseDetails: { marginTop: 12 },
  courseAddress: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans },
  courseTagsRow: { marginTop: 10 },
  courseDescription: { fontSize: 15, color: Colors.darkGray, lineHeight: 22, marginTop: 12, fontFamily: Fonts!.sans },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  statsText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  statsSubtext: { fontSize: 13, color: Colors.gray, fontFamily: Fonts!.sans },
  gallerySection: { paddingTop: 16, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, paddingBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, paddingHorizontal: 16, marginBottom: 10 },
  gallery: { paddingHorizontal: 16 },
  galleryItem: { position: 'relative', marginRight: 8 },
  galleryThumb: { width: 100, height: 100, borderRadius: 6 },
  thumbUpvoteBadge: { position: 'absolute', bottom: 4, right: 4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  thumbUpvoteText: { fontSize: 10, color: Colors.white, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  writeupCard: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 14, marginBottom: 10 },
  featuredCard: { borderColor: Colors.orange },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  featuredArrow: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
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
  modalSlide: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center' },
  modalImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.65 },
  modalOverlay: { position: 'absolute', bottom: 100, left: 0, right: 0, paddingHorizontal: 20, gap: 8 },
  modalCaption: { color: Colors.white, fontSize: 15, lineHeight: 22, fontFamily: Fonts!.sans },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalUpvote: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  modalUpvoteActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: Colors.white },
  modalUpvoteText: { color: Colors.white, fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  modalTime: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: Fonts!.sans },
});
