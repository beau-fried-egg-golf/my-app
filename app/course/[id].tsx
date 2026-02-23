import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Course, Meetup, Photo, Writeup } from '@/types';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import WordHighlight from '@/components/WordHighlight';
import VerifiedBadge from '@/components/VerifiedBadge';
import EggRating from '@/components/EggRating';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { MAPBOX_ACCESS_TOKEN } from '@/constants/mapbox';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useDesktopScrollProps } from '@/hooks/useDesktopScroll';

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
  isVerified,
  verifiedFeatured,
}: {
  writeup: Writeup;
  userName: string;
  onPress: () => void;
  isFeatured?: boolean;
  isVerified?: boolean;
  verifiedFeatured?: boolean;
}) {
  return (
    <Pressable style={[styles.writeupCard, isFeatured && styles.featuredCard, verifiedFeatured && styles.verifiedFeaturedCard]} onPress={onPress}>
      {isFeatured && !verifiedFeatured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="thumbs-up" size={12} color={Colors.black} />
          <Text style={styles.featuredText}>MOST LIKED</Text>
        </View>
      )}
      {verifiedFeatured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
          <Text style={styles.verifiedFeaturedText}>VERIFIED</Text>
        </View>
      )}
      <Text style={styles.writeupTitle}>{writeup.title}</Text>
      <Text style={styles.writeupPreview} numberOfLines={2}>
        {writeup.content}
      </Text>
      <View style={styles.writeupMeta}>
        <Text style={styles.writeupAuthorName}>{userName}</Text>
        {isVerified && <VerifiedBadge size={12} />}
        <Text style={styles.writeupDot}> · </Text>
        <Text style={styles.writeupTime}>{formatTime(writeup.created_at)}</Text>
        <Text style={styles.writeupDot}> · </Text>
        <Ionicons name="heart-outline" size={12} color={Colors.gray} />
        <Text style={styles.writeupUpvotes}>{writeup.reaction_count ?? 0}</Text>
        {writeup.reply_count > 0 ? (
          <>
            <Text style={styles.writeupDot}> · </Text>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.gray} />
            <Text style={styles.writeupUpvotes}>{writeup.reply_count}</Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

interface GalleryPhoto extends Photo {
  writeupId: string;
}

const BACK_TEXT_HEIGHT = 18;
const BACK_SCROLL_GAP = 14;

function DesktopBlackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(BACK_TEXT_HEIGHT + BACK_SCROLL_GAP)],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.black, Colors.orange],
  });

  return (
    <Animated.View style={[styles.dtBlackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.dtBlackBtnInner}>
        <View style={{ height: BACK_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.dtBlackBtnText}>{label}</Text>
            <View style={{ height: BACK_SCROLL_GAP }} />
            <Text style={[styles.dtBlackBtnText, { color: Colors.black }]}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function DesktopBackButton({ onPress }: { onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(BACK_TEXT_HEIGHT + BACK_SCROLL_GAP)],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.white, Colors.cream],
  });

  return (
    <Animated.View style={[styles.desktopBackBtn, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.desktopBackInner}>
        <Ionicons name="chevron-back" size={18} color={Colors.black} />
        <View style={{ height: BACK_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.desktopBackText}>BACK</Text>
            <View style={{ height: BACK_SCROLL_GAP }} />
            <Text style={styles.desktopBackText}>BACK</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, writeups, getUserName, user, togglePhotoUpvote, coursesPlayed, markCoursePlayed, unmarkCoursePlayed, meetups, loadMeetups, reportCourseInaccuracy } = useStore();
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [activeTab, setActiveTab] = useState<'writeups' | 'photos' | 'meetups'>('writeups');
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [markPlayedVisible, setMarkPlayedVisible] = useState(false);
  const [markPlayedDate, setMarkPlayedDate] = useState('');
  const [brokenPhotoIds, setBrokenPhotoIds] = useState<Set<string>>(new Set());
  const galleryScrollRef = useRef<ScrollView>(null);
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();
  const desktopScrollProps = useDesktopScrollProps();
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
    const sorted = [...courseWriteups].sort((a, b) => (b.reaction_count ?? 0) - (a.reaction_count ?? 0));
    const top = sorted[0];
    return top && (top.reaction_count ?? 0) > 0 ? top : null;
  }, [courseWriteups]);

  const verifiedWriteups = useMemo(
    () => courseWriteups.filter(w => w.author_verified),
    [courseWriteups],
  );

  const mostUpvotedVerified = useMemo(() => {
    if (verifiedWriteups.length === 0) return null;
    const sorted = [...verifiedWriteups].sort((a, b) => (b.reaction_count ?? 0) - (a.reaction_count ?? 0));
    const top = sorted[0];
    if (!top || (top.reaction_count ?? 0) === 0) return null;
    // Dedup: skip if same as overall most liked
    if (mostUpvoted && top.id === mostUpvoted.id) return null;
    return top;
  }, [verifiedWriteups, mostUpvoted]);

  const allPhotos: GalleryPhoto[] = useMemo(
    () =>
      courseWriteups.flatMap((w) =>
        w.photos
          .filter((p) => !p.hidden && !brokenPhotoIds.has(p.id))
          .map((p) => ({
            ...p,
            writeupId: w.id,
          })),
      ),
    [courseWriteups, brokenPhotoIds],
  );

  const sortedPhotos = useMemo(() => {
    return [...allPhotos].sort((a, b) => {
      if ((b.upvote_count ?? 0) !== (a.upvote_count ?? 0)) return (b.upvote_count ?? 0) - (a.upvote_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [allPhotos]);

  const courseMeetups = useMemo(
    () => meetups.filter(m => m.course_id === id),
    [meetups, id],
  );

  useEffect(() => {
    loadMeetups();
  }, [loadMeetups]);

  return (
    <ResponsiveContainer>
    <ScrollView {...desktopScrollProps} style={styles.container} contentContainerStyle={styles.content}>
      {/* Desktop: back button above hero */}
      {isDesktop && (
        <DesktopBackButton onPress={() => router.canGoBack() ? router.back() : router.push('/courses')} />
      )}

      {/* Mobile: title above hero */}
      {!isDesktop && (
        <View style={[styles.courseNameBlock, { paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backArrow}>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
          </Pressable>
          <View style={styles.courseNameContent}>
            <LetterSpacedHeader text={course.short_name} size={32} />
          </View>
        </View>
      )}

      {(() => {
        const firstPhoto = sortedPhotos.length > 0 ? sortedPhotos[0] : null;
        const heroUrl = course.fe_hero_image
          || (firstPhoto ? firstPhoto.url : null)
          || (MAPBOX_ACCESS_TOKEN
            ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${course.longitude},${course.latitude},14,0/800x400@2x?access_token=${MAPBOX_ACCESS_TOKEN}`
            : null);
        if (!heroUrl) return null;
        const handleHeroError = () => {
          if (firstPhoto && heroUrl === firstPhoto.url) {
            setBrokenPhotoIds(prev => new Set(prev).add(firstPhoto.id));
          }
        };
        return (
          <View style={styles.feHeroWrap}>
            {Platform.OS === 'web' ? (
              <img
                src={heroUrl}
                onError={handleHeroError}
                style={{ width: '100%', maxHeight: SCREEN_HEIGHT * 0.5, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                alt={course.short_name}
              />
            ) : (
              <Image source={{ uri: heroUrl }} style={styles.feHero} resizeMode="cover" onError={handleHeroError} />
            )}
          </View>
        );
      })()}

      {/* Desktop: title below hero, left-aligned */}
      {isDesktop && (
        <View style={styles.desktopCourseNameBlock}>
          <LetterSpacedHeader text={course.short_name} size={32} />
        </View>
      )}

      <View style={styles.courseHeader}>
        <View style={styles.courseDetailsRow}>
          <View style={styles.courseDetails}>
            <Text style={styles.courseAddress}>
              {[course.address, course.city, [course.state, course.postal_code].filter(Boolean).join(' '), course.country].filter(Boolean).join(', ')}
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
              isDesktop ? (
                <DesktopBlackButton label="PLAYED" onPress={() => unmarkCoursePlayed(course.id)} />
              ) : (
                <Pressable style={styles.playedButtonActive} onPress={() => unmarkCoursePlayed(course.id)}>
                  <Text style={styles.playedButtonActiveText}>Played</Text>
                </Pressable>
              )
            ) : (
              isDesktop ? (
                <DesktopBlackButton label="MARK PLAYED" onPress={() => {
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  setMarkPlayedDate(`${yyyy}-${mm}-${dd}`);
                  setMarkPlayedVisible(true);
                }} />
              ) : (
                <Pressable style={styles.playedButton} onPress={() => {
                  const today = new Date();
                  const yyyy = today.getFullYear();
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const dd = String(today.getDate()).padStart(2, '0');
                  setMarkPlayedDate(`${yyyy}-${mm}-${dd}`);
                  setMarkPlayedVisible(true);
                }}>
                  <Text style={styles.playedButtonText}>Mark Played</Text>
                </Pressable>
              )
            )
          )}
        </View>
        {user && (
          <Pressable style={styles.reportLink} onPress={() => setReportVisible(true)}>
            <Ionicons name="flag-outline" size={13} color={Colors.gray} />
            <Text style={styles.reportLinkText}>Report inaccuracy</Text>
          </Pressable>
        )}
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
        <Pressable
          style={[styles.tab, activeTab === 'meetups' && styles.tabActive]}
          onPress={() => setActiveTab('meetups')}
        >
          <Text style={[styles.tabText, activeTab === 'meetups' && styles.tabTextActive]}>
            Meetups ({courseMeetups.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'writeups' && (
        <>
          {mostUpvoted && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MOST LIKED</Text>
              <WriteupCard
                writeup={mostUpvoted}
                userName={mostUpvoted.author_name ?? getUserName(mostUpvoted.user_id)}
                onPress={() => router.push(`/writeup/${mostUpvoted.id}`)}
                isFeatured
                isVerified={mostUpvoted.author_verified}
              />
            </View>
          )}

          {mostUpvotedVerified && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MOST LIKED VERIFIED REVIEW</Text>
              <WriteupCard
                writeup={mostUpvotedVerified}
                userName={mostUpvotedVerified.author_name ?? getUserName(mostUpvotedVerified.user_id)}
                onPress={() => router.push(`/writeup/${mostUpvotedVerified.id}`)}
                isFeatured
                isVerified
                verifiedFeatured
              />
              {verifiedWriteups.length > 1 && (
                <Pressable onPress={() => {
                  // Navigate to filtered view — for now show all recent
                  setShowAllRecent(true);
                }}>
                  <Text style={styles.viewAllLink}>View all verified reviews ({verifiedWriteups.length})</Text>
                </Pressable>
              )}
            </View>
          )}

          {courseWriteups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MOST RECENT</Text>
              {(showAllRecent ? courseWriteups : courseWriteups.slice(0, 3)).map((w) => (
                <WriteupCard
                  key={w.id}
                  writeup={w}
                  userName={w.author_name ?? getUserName(w.user_id)}
                  onPress={() => router.push(`/writeup/${w.id}`)}
                  isVerified={w.author_verified}
                />
              ))}
              {!showAllRecent && courseWriteups.length > 3 && (
                <Pressable onPress={() => setShowAllRecent(true)}>
                  <Text style={styles.viewAllLink}>View all reviews ({courseWriteups.length})</Text>
                </Pressable>
              )}
            </View>
          )}

          {courseWriteups.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          )}

          <View style={styles.addWriteupRow}>
            {isDesktop ? (
              <DesktopBlackButton label="POST A REVIEW" onPress={() => router.push(`/create-writeup?courseId=${id}`)} />
            ) : (
              <Pressable
                style={styles.writeButton}
                onPress={() => router.push(`/create-writeup?courseId=${id}`)}
              >
                <Text style={styles.writeButtonText}>Post a review</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {activeTab === 'photos' && (() => {
        const cols = isDesktop ? 4 : 3;
        const gridPadding = 24;
        const totalGap = (cols - 1) * 8;
        const baseWidth = isDesktop ? Math.min(960 - 40, SCREEN_WIDTH - 40) : SCREEN_WIDTH;
        const thumbSize = (baseWidth - gridPadding - totalGap) / cols;
        return (
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
                    <Image
                      source={{ uri: photo.url }}
                      style={{ width: thumbSize, height: thumbSize, borderRadius: 4 }}
                      onError={() => setBrokenPhotoIds(prev => new Set(prev).add(photo.id))}
                    />
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
        );
      })()}

      {activeTab === 'meetups' && (
        <>
          {courseMeetups.length > 0 ? (
            <View style={styles.section}>
              {courseMeetups.map(m => {
                const slotsRemaining = m.total_slots - (m.member_count ?? 0);
                const meetupDate = new Date(m.meetup_date);
                const dateStr = meetupDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                  + ' · '
                  + meetupDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                return (
                  <Pressable
                    key={m.id}
                    style={styles.meetupCard}
                    onPress={() => router.push(`/meetup/${m.id}`)}
                  >
                    <View style={styles.meetupCardHeader}>
                      <Ionicons name="calendar" size={16} color={Colors.black} style={{ marginRight: 8 }} />
                      <Text style={styles.meetupCardName}>{m.name}</Text>
                    </View>
                    <Text style={styles.meetupCardMeta}>{dateStr}</Text>
                    <Text style={styles.meetupCardMeta}>
                      {slotsRemaining} of {m.total_slots} spot{m.total_slots !== 1 ? 's' : ''} available · {m.cost}
                    </Text>
                    {m.host_name && (
                      <Text style={styles.meetupCardMeta}>Hosted by {m.host_name}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No meetups at this course</Text>
            </View>
          )}
        </>
      )}

      <Modal visible={markPlayedVisible} transparent animationType="fade">
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>When did you play?</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={markPlayedDate}
                onChange={(e: any) => setMarkPlayedDate(e.target.value)}
                style={{
                  fontSize: 16,
                  fontFamily: 'inherit',
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${Colors.lightGray}`,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box' as any,
                }}
              />
            ) : (
              <DateTimePicker
                value={markPlayedDate ? new Date(markPlayedDate + 'T12:00:00') : new Date()}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_event: any, selectedDate?: Date) => {
                  if (selectedDate) {
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(selectedDate.getDate()).padStart(2, '0');
                    setMarkPlayedDate(`${yyyy}-${mm}-${dd}`);
                  }
                }}
              />
            )}
            <View style={styles.reportActions}>
              <Pressable
                style={styles.reportCancelBtn}
                onPress={() => {
                  setMarkPlayedVisible(false);
                  setMarkPlayedDate('');
                }}
              >
                <Text style={styles.reportCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.reportSubmitBtn}
                onPress={async () => {
                  const dateStr = markPlayedDate.trim();
                  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : undefined;
                  await markCoursePlayed(course.id, validDate);
                  setMarkPlayedVisible(false);
                  setMarkPlayedDate('');
                }}
              >
                <Text style={styles.reportSubmitText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={reportVisible} transparent animationType="fade">
        <View style={styles.reportOverlay}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>Report Inaccuracy</Text>
            {reportSubmitted ? (
              <>
                <Text style={styles.reportConfirmation}>Thanks for the report! We'll review it shortly.</Text>
                <Pressable
                  style={styles.reportSubmitBtn}
                  onPress={() => {
                    setReportVisible(false);
                    setReportSubmitted(false);
                    setReportReason('');
                  }}
                >
                  <Text style={styles.reportSubmitText}>Done</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.reportInput}
                  placeholder="Describe what's inaccurate..."
                  placeholderTextColor={Colors.gray}
                  multiline
                  value={reportReason}
                  onChangeText={setReportReason}
                />
                <View style={styles.reportActions}>
                  <Pressable
                    style={styles.reportCancelBtn}
                    onPress={() => {
                      setReportVisible(false);
                      setReportReason('');
                    }}
                  >
                    <Text style={styles.reportCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.reportSubmitBtn, !reportReason.trim() && { opacity: 0.4 }]}
                    disabled={!reportReason.trim()}
                    onPress={async () => {
                      await reportCourseInaccuracy(course.id, reportReason.trim());
                      setReportSubmitted(true);
                    }}
                  >
                    <Text style={styles.reportSubmitText}>Submit</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={galleryVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalTopBar}>
            <Pressable style={styles.modalClose} onPress={() => setGalleryVisible(false)}>
              <Ionicons name="chevron-back" size={18} color={Colors.white} />
              <Text style={styles.modalCloseText}>BACK</Text>
            </Pressable>
            {sortedPhotos.length > 1 && (
              <Text style={styles.modalCounter}>
                {selectedPhoto + 1} / {sortedPhotos.length}
              </Text>
            )}
            <Pressable style={{ padding: 4 }} onPress={() => setGalleryVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </Pressable>
          </View>
          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={() => {
              if (selectedPhoto > 0) {
                galleryScrollRef.current?.scrollTo({ x: selectedPhoto * winWidth, animated: false });
              }
            }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / winWidth);
              setSelectedPhoto(idx);
            }}
            style={Platform.OS === 'web' ? { scrollSnapType: 'x mandatory' } as any : undefined}
          >
            {sortedPhotos.map((photo) => {
              const photoHasUpvote = photo.user_has_upvoted ?? false;
              return (
                <View key={`modal-${photo.id}`} style={[styles.modalSlide, { width: winWidth, height: winHeight }, Platform.OS === 'web' && { scrollSnapAlign: 'start' } as any]}>
                  <Image
                    source={{ uri: photo.url }}
                    style={[styles.modalImage, { width: winWidth, height: winHeight * 0.55 }]}
                    resizeMode="contain"
                    onError={() => setBrokenPhotoIds(prev => new Set(prev).add(photo.id))}
                  />
                  <View style={[styles.modalBelow, { width: winWidth }]}>
                    <Pressable
                      style={[styles.modalUpvote, photoHasUpvote && styles.modalUpvoteActive]}
                      onPress={() => togglePhotoUpvote(photo.id)}
                    >
                      <Text style={{ fontSize: 16 }}>{'\uD83D\uDC4D'}</Text>
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
          {sortedPhotos.length > 1 && selectedPhoto > 0 && (
            <Pressable
              style={[styles.galleryNav, styles.galleryNavPrev]}
              onPress={() => {
                const next = selectedPhoto - 1;
                setSelectedPhoto(next);
                galleryScrollRef.current?.scrollTo({ x: next * winWidth, animated: true });
              }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
            </Pressable>
          )}
          {sortedPhotos.length > 1 && selectedPhoto < sortedPhotos.length - 1 && (
            <Pressable
              style={[styles.galleryNav, styles.galleryNavNext]}
              onPress={() => {
                const next = selectedPhoto + 1;
                setSelectedPhoto(next);
                galleryScrollRef.current?.scrollTo({ x: next * winWidth, animated: true });
              }}
            >
              <Ionicons name="chevron-forward" size={24} color={Colors.white} />
            </Pressable>
          )}
        </View>
      </Modal>
    </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingBottom: 40 },
  courseNameBlock: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16 },
  dtBlackBtn: { borderRadius: 8, overflow: 'hidden', flexShrink: 0 },
  dtBlackBtnInner: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  dtBlackBtnText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.white, letterSpacing: 0.5, lineHeight: BACK_TEXT_HEIGHT },
  desktopBackBtn: { alignSelf: 'flex-start', borderRadius: 8, overflow: 'hidden', marginLeft: 16 },
  desktopBackInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  desktopBackText: { fontSize: 14, fontFamily: Fonts!.sans, fontWeight: FontWeights.regular, color: Colors.black, letterSpacing: 0.5, lineHeight: BACK_TEXT_HEIGHT },
  desktopCourseNameBlock: { paddingHorizontal: 16, paddingTop: 16 },
  backArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backArrowText: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  courseNameContent: { flex: 1 },
  courseHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  courseDetails: { flex: 1 },
  courseAddress: { fontSize: 14, color: Colors.gray, fontFamily: Fonts!.sans },
  courseTagsRow: { marginTop: 10 },
  courseDescription: { fontSize: 15, color: Colors.darkGray, lineHeight: 22, marginTop: 12, fontFamily: Fonts!.sans },
  courseDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 },
  playedButton: { backgroundColor: Colors.black, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginLeft: 12, flexShrink: 0 },
  playedButtonText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  playedButtonActive: { backgroundColor: Colors.black, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginLeft: 12, flexShrink: 0 },
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
  verifiedFeaturedCard: { borderColor: '#22C55E' },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  featuredIcon: { marginRight: 2 },
  featuredText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.orange },
  verifiedFeaturedText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: '#22C55E' },
  writeupTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  writeupPreview: { fontSize: 14, color: Colors.darkGray, lineHeight: 20, marginTop: 4, fontFamily: Fonts!.sans },
  writeupMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4, flexWrap: 'wrap' },
  writeupAuthorName: { fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  writeupDot: { color: Colors.gray, fontSize: 12, fontFamily: Fonts!.sans },
  writeupTime: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  writeupUpvotes: { fontSize: 12, color: Colors.gray, fontFamily: Fonts!.sans },
  sectionLabel: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.gray, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 } as any,
  viewAllLink: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, textDecorationLine: 'underline', marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, color: Colors.gray, fontFamily: Fonts!.sans },
  writeButton: { backgroundColor: Colors.black, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  writeButtonText: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  addWriteupRow: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalTopBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, zIndex: 10 },
  modalClose: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  modalCloseText: { fontSize: 12, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white, letterSpacing: 0.5 },
  modalCounter: { fontSize: 14, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.white, opacity: 0.85, letterSpacing: 0.5 },
  galleryNav: { position: 'absolute', top: '50%', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 10, marginTop: -22 } as any,
  galleryNavPrev: { left: 20 },
  galleryNavNext: { right: 20 },
  modalSlide: { justifyContent: 'center', alignItems: 'center' },
  modalImage: {},
  modalBelow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
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
  meetupCard: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 14, marginBottom: 10 },
  meetupCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  meetupCardName: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  meetupCardMeta: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  reportLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  reportLinkText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
  reportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  reportModal: { backgroundColor: Colors.white, borderRadius: 12, padding: 24, width: '100%', maxWidth: 400 },
  reportTitle: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 16 },
  markPlayedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  markPlayedHint: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray },
  reportInput: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 12, fontSize: 16, fontFamily: Fonts!.sans, minHeight: 100, textAlignVertical: 'top', outlineStyle: 'none' } as any,
  reportActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  reportCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  reportCancelText: { fontSize: 15, fontFamily: Fonts!.sans, color: Colors.gray },
  reportSubmitBtn: { backgroundColor: Colors.black, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  reportSubmitText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
  reportConfirmation: { fontSize: 15, fontFamily: Fonts!.sans, color: Colors.darkGray, lineHeight: 22, marginBottom: 16 },
});
