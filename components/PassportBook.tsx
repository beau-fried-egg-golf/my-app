import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { Course, CoursePlayed, Writeup } from '@/types';
import PassportStamp from './PassportStamp';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const STAMPS_PER_PAGE = 12; // 4 rows × 3 columns
const COLS = 3;
const ROWS = 4;
const FLIP_DURATION_MOBILE = 500;
const FLIP_DURATION_DESKTOP = 300;

const coverImage = require('@/assets/images/passport-cover.png');
const pageImage = require('@/assets/images/passport-page.png');

interface StampData {
  courseId: string;
  courseName: string;
  state: string;
  datePlayed: string | null;
}

interface PassportBookProps {
  userId: string;
  coursesPlayed: CoursePlayed[];
  courses: Course[];
  writeups: Writeup[];
  onStampPress: (courseId: string) => void;
}

function getStamps(
  userId: string,
  coursesPlayed: CoursePlayed[],
  courses: Course[],
  writeups: Writeup[],
): StampData[] {
  const userPlayed = coursesPlayed.filter(cp => cp.user_id === userId);
  const userWriteups = writeups.filter(w => w.user_id === userId);
  const writeupCourseIds = new Set(userWriteups.map(w => w.course_id));

  const playedCourseIds = userPlayed.map(cp => cp.course_id);
  const allCourseIds = new Set([...playedCourseIds, ...writeupCourseIds]);

  const stamps: StampData[] = [];
  for (const courseId of allCourseIds) {
    const course = courses.find(c => c.id === courseId);
    if (!course) continue;

    const playedRecord = userPlayed.find(cp => cp.course_id === courseId);
    const courseWriteups = userWriteups.filter(w => w.course_id === courseId);

    const datePlayed = playedRecord?.date_played
      ?? playedRecord?.created_at
      ?? courseWriteups.sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at
      ?? null;

    stamps.push({
      courseId,
      courseName: course.short_name,
      state: course.state,
      datePlayed,
    });
  }
  return stamps;
}

function sortByDate(stamps: StampData[]): StampData[] {
  return [...stamps].sort((a, b) => {
    if (!a.datePlayed && !b.datePlayed) return a.courseName.localeCompare(b.courseName);
    if (!a.datePlayed) return 1;
    if (!b.datePlayed) return -1;
    return b.datePlayed.localeCompare(a.datePlayed);
  });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function PassportBook({ userId, coursesPlayed, courses, writeups, onStampPress }: PassportBookProps) {
  const isDesktop = useIsDesktop();
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover; 1+ = stamp page (mobile) or spread index (desktop)
  const [flipping, setFlipping] = useState(false);
  const [bookWidth, setBookWidth] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');

  const allStamps = useMemo(
    () => getStamps(userId, coursesPlayed, courses, writeups),
    [userId, coursesPlayed, courses, writeups],
  );

  const sortedStamps = useMemo(() => sortByDate(allStamps), [allStamps]);
  const pages = useMemo(() => chunkArray(sortedStamps, STAMPS_PER_PAGE), [sortedStamps]);
  const totalStampPages = pages.length;

  // Desktop: currentPage 0=cover, 1=spread(pages 0-1), 2=spread(pages 2-3), ...
  // Mobile: currentPage 0=cover, 1=page 0, 2=page 1, ...
  const totalSpreads = Math.ceil(totalStampPages / 2);
  const totalPages = isDesktop ? totalSpreads + 1 : totalStampPages + 1;

  const onBookLayout = useCallback((e: LayoutChangeEvent) => {
    setBookWidth(e.nativeEvent.layout.width);
  }, []);

  const flipToPage = useCallback((targetPage: number) => {
    if (flipping) return;
    if (targetPage < 0 || targetPage >= totalPages) return;

    const dir = targetPage > currentPage ? 'forward' : 'backward';
    setFlipDirection(dir);
    setFlipping(true);
    flipAnim.setValue(0);

    Animated.timing(flipAnim, {
      toValue: 1,
      duration: isDesktop ? FLIP_DURATION_DESKTOP : FLIP_DURATION_MOBILE,
      useNativeDriver: true,
    }).start(() => {
      flipAnim.setValue(0);
      setCurrentPage(targetPage);
      setFlipping(false);
    });
  }, [flipping, currentPage, totalPages, flipAnim]);

  const handleCoverTap = useCallback(() => {
    flipToPage(1);
  }, [flipToPage]);

  if (allStamps.length === 0) return null;

  const renderStampGrid = (stampPage: StampData[], pageIndex: number, pageWidth: number) => {
    const innerPaddingH = pageWidth * 0.07;
    const innerTop = pageWidth * 1.5 * 0.08;
    const innerBottom = pageWidth * 1.5 * 0.05;
    const innerWidth = pageWidth - innerPaddingH * 2;
    const gap = innerWidth * 0.04;
    const stampSize = (innerWidth - gap * (COLS - 1)) / COLS;

    return (
      <View style={[styles.stampGridOuter, {
        paddingHorizontal: innerPaddingH,
        paddingTop: innerTop,
        paddingBottom: innerBottom,
      }]}>
        <View style={styles.stampGrid}>
          {Array.from({ length: ROWS }).map((_, rowIdx) => (
            <View key={rowIdx} style={[styles.stampRow, { gap }]}>
              {Array.from({ length: COLS }).map((_, colIdx) => {
                const idx = rowIdx * COLS + colIdx;
                const stamp = stampPage[idx];
                if (!stamp) return <View key={colIdx} style={{ width: stampSize, aspectRatio: 1 }} />;
                return (
                  <PassportStamp
                    key={stamp.courseId}
                    courseId={stamp.courseId}
                    courseName={stamp.courseName}
                    state={stamp.state}
                    datePlayed={stamp.datePlayed}
                    onPress={() => onStampPress(stamp.courseId)}
                    size={stampSize}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <Text style={styles.pageNumber}>
          Page {pageIndex} of {totalStampPages}
        </Text>
      </View>
    );
  };

  // Render a single stamp page by its 0-based index into the pages array
  const renderSingleStampPage = (stampPageIdx: number, pageWidth: number) => {
    const stampPage = pages[stampPageIdx];
    if (!stampPage) {
      return <Image source={pageImage} style={styles.pageImage} resizeMode="contain" />;
    }
    return (
      <ImageBackground source={pageImage} style={styles.pageImage} resizeMode="contain">
        {renderStampGrid(stampPage, stampPageIdx + 1, pageWidth)}
      </ImageBackground>
    );
  };

  // ======================== DESKTOP: TWO-PAGE SPREAD ========================
  if (isDesktop) {
    // Subtle crossfade for desktop transitions
    const fadeOut = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    });
    const fadeIn = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    // Cover
    if (currentPage === 0 && !flipping) {
      return (
        <View style={[styles.container, { maxWidth: 420, alignSelf: 'center', width: '100%' }]}>
          <Pressable onPress={handleCoverTap}>
            <View style={styles.bookContainer} onLayout={onBookLayout}>
              <Image source={coverImage} style={styles.pageImage} resizeMode="contain" />
            </View>
          </Pressable>
        </View>
      );
    }

    // Two-layer spread: background images with inner borders cropped,
    // stamp content positioned independently on top.
    const renderSpread = (spreadIdx: number, width: number) => {
      const leftStampIdx = (spreadIdx - 1) * 2;
      const rightStampIdx = leftStampIdx + 1;
      const halfWidth = width / 2;
      const leftPage = pages[leftStampIdx];
      const rightPage = pages[rightStampIdx];

      return (
        <View style={styles.spreadRow}>
          {/* Background layer: page images with inner borders cropped */}
          <View style={[styles.spreadHalf, { overflow: 'hidden' }]}>
            <View style={styles.spreadPageBgLeft}>
              <Image source={pageImage} style={styles.pageImage} resizeMode="stretch" />
            </View>
          </View>
          <View style={[styles.spreadHalf, { overflow: 'hidden' }]}>
            <View style={styles.spreadPageBgRight}>
              <Image source={pageImage} style={styles.pageImage} resizeMode="stretch" />
            </View>
          </View>

          {/* Content layer: stamp grids positioned on top of backgrounds */}
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]} pointerEvents="box-none">
            <View style={styles.spreadContentHalf}>
              {leftPage && renderStampGrid(leftPage, leftStampIdx + 1, halfWidth)}
            </View>
            <View style={styles.spreadContentHalf}>
              {rightPage && renderStampGrid(rightPage, rightStampIdx + 1, halfWidth)}
            </View>
          </View>
        </View>
      );
    };

    const displayPage = currentPage === 0 ? 1 : currentPage;
    const targetSpread = flipDirection === 'forward'
      ? Math.min(displayPage + 1, totalPages - 1)
      : Math.max(displayPage - 1, 1);

    const canGoBack = currentPage > 1;
    const canGoForward = currentPage < totalPages - 1;

    return (
      <View style={[styles.container, { maxWidth: 900, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.spreadContainer} onLayout={onBookLayout}>
          {/* Incoming spread (fades in during flip) */}
          {flipping && (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeIn }]}>
              {currentPage === 0
                ? renderSpread(1, bookWidth)
                : renderSpread(targetSpread, bookWidth)
              }
            </Animated.View>
          )}

          {/* Current spread / outgoing (fades out during flip) */}
          {currentPage === 0 && flipping ? (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeOut }]}>
              <Image source={coverImage} style={styles.pageImage} resizeMode="contain" />
            </Animated.View>
          ) : (
            <Animated.View style={[StyleSheet.absoluteFill, flipping ? { opacity: fadeOut } : undefined]}>
              {renderSpread(displayPage, bookWidth)}
            </Animated.View>
          )}

          {/* Spine overlay — covers double leather border between pages */}
          {(currentPage > 0 || flipping) && (
            <View style={styles.spineOverlay} pointerEvents="none" />
          )}

          {/* Navigation arrows */}
          {!flipping && currentPage > 0 && (
            <>
              {canGoBack && (
                <Pressable
                  style={[styles.navArrow, styles.navArrowLeft]}
                  onPress={() => flipToPage(currentPage - 1)}
                >
                  <Text style={styles.navArrowText}>{'\u2039'}</Text>
                </Pressable>
              )}
              {canGoForward && (
                <Pressable
                  style={[styles.navArrow, styles.navArrowRight]}
                  onPress={() => flipToPage(currentPage + 1)}
                >
                  <Text style={styles.navArrowText}>{'\u203A'}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Close book button */}
        {!flipping && currentPage > 0 && (
          <Pressable style={styles.closeBook} onPress={() => { setCurrentPage(0); }}>
            <Text style={styles.closeBookText}>Close Passport</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ======================== MOBILE: SINGLE PAGE ========================
  const mobileFadeOut = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const mobileFadeIn = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const mobileTargetPage = flipDirection === 'forward'
    ? Math.min(currentPage + 1, totalPages - 1)
    : Math.max(currentPage - 1, 0);

  const canGoBackMobile = currentPage > 1;
  const canGoForwardMobile = currentPage < totalPages - 1;

  return (
    <View style={styles.container}>
      <View style={styles.bookContainer} onLayout={onBookLayout}>
        {/* Incoming page (fades in during flip) */}
        {flipping && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: mobileFadeIn }]}>
            {mobileTargetPage === 0
              ? <Image source={coverImage} style={styles.pageImage} resizeMode="contain" />
              : renderSingleStampPage(mobileTargetPage - 1, bookWidth)
            }
          </Animated.View>
        )}

        {/* Current page — opacity always driven by mobileFadeOut (1 when idle, 0→1 fade when flipping) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: mobileFadeOut }]}>
          {currentPage === 0 ? (
            <Pressable onPress={!flipping ? handleCoverTap : undefined} style={styles.coverPressable}>
              <Image source={coverImage} style={styles.pageImage} resizeMode="contain" />
            </Pressable>
          ) : (
            renderSingleStampPage(currentPage - 1, bookWidth)
          )}
        </Animated.View>

        {/* Navigation arrows */}
        {!flipping && currentPage > 0 && (
          <>
            {canGoBackMobile && (
              <Pressable
                style={[styles.navArrow, styles.navArrowLeft]}
                onPress={() => flipToPage(currentPage - 1)}
              >
                <Text style={styles.navArrowText}>{'\u2039'}</Text>
              </Pressable>
            )}
            {canGoForwardMobile && (
              <Pressable
                style={[styles.navArrow, styles.navArrowRight]}
                onPress={() => flipToPage(currentPage + 1)}
              >
                <Text style={styles.navArrowText}>{'\u203A'}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Close book button */}
      {!flipping && currentPage > 0 && (
        <Pressable style={styles.closeBook} onPress={() => flipToPage(0)}>
          <Text style={styles.closeBookText}>Close Passport</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  bookContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  spreadContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    backgroundColor: '#7B5B3A',
  },
  spreadRow: {
    flex: 1,
    flexDirection: 'row',
  },
  spreadHalf: {
    flex: 1,
  },
  spineOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  spreadContentHalf: {
    width: '50%',
    overflow: 'hidden',
  },
  spreadPageBgLeft: {
    width: '104%',
    height: '100%',
  },
  spreadPageBgRight: {
    width: '104%',
    height: '100%',
    marginLeft: '-4%',
  },
  coverPressable: {
    flex: 1,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  stampGridOuter: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stampGrid: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageNumber: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
    paddingBottom: 4,
  },
  navArrow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  navArrowLeft: {
    left: 0,
  },
  navArrowRight: {
    right: 0,
  },
  navArrowText: {
    fontSize: 32,
    color: 'rgba(0,0,0,0.25)',
    fontWeight: '300',
  },
  closeBook: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  closeBookText: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textDecorationLine: 'underline',
  },
});
