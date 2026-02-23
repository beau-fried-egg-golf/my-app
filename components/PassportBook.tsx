import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { Course, CoursePlayed, Writeup } from '@/types';
import PassportStamp from './PassportStamp';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STAMPS_PER_PAGE = 6; // 2 columns × 3 rows

type SortMode = 'date' | 'state';

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

    // Prefer date_played, fall back to created_at from played record, then earliest writeup
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
    // Stamps with no date go last
    if (!a.datePlayed && !b.datePlayed) return a.courseName.localeCompare(b.courseName);
    if (!a.datePlayed) return 1;
    if (!b.datePlayed) return -1;
    // Newest first
    return b.datePlayed.localeCompare(a.datePlayed);
  });
}

function sortByState(stamps: StampData[]): StampData[] {
  return [...stamps].sort((a, b) => {
    const stateComp = a.state.localeCompare(b.state);
    if (stateComp !== 0) return stateComp;
    return a.courseName.localeCompare(b.courseName);
  });
}

function getYearFromDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return String(date.getFullYear());
}

interface ScrubberLabel {
  label: string;
  pageIndex: number;
}

function buildDateScrubber(pages: StampData[][]): ScrubberLabel[] {
  const labels: ScrubberLabel[] = [];
  let lastYear = '';
  for (let i = 0; i < pages.length; i++) {
    const firstStamp = pages[i][0];
    if (!firstStamp) continue;
    const year = getYearFromDate(firstStamp.datePlayed);
    if (year !== lastYear) {
      labels.push({ label: year, pageIndex: i });
      lastYear = year;
    }
  }
  return labels;
}

function buildStateScrubber(pages: StampData[][]): ScrubberLabel[] {
  const labels: ScrubberLabel[] = [];
  let lastState = '';
  for (let i = 0; i < pages.length; i++) {
    const firstStamp = pages[i][0];
    if (!firstStamp) continue;
    const st = firstStamp.state;
    if (st !== lastState) {
      labels.push({ label: st, pageIndex: i });
      lastState = st;
    }
  }
  return labels;
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
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrubberRef = useRef<ScrollView>(null);

  const allStamps = useMemo(
    () => getStamps(userId, coursesPlayed, courses, writeups),
    [userId, coursesPlayed, courses, writeups],
  );

  const sortedStamps = useMemo(
    () => (sortMode === 'date' ? sortByDate(allStamps) : sortByState(allStamps)),
    [allStamps, sortMode],
  );

  const pages = useMemo(() => chunkArray(sortedStamps, STAMPS_PER_PAGE), [sortedStamps]);
  const totalPages = pages.length;

  const scrubberLabels = useMemo(
    () => (sortMode === 'date' ? buildDateScrubber(pages) : buildStateScrubber(pages)),
    [pages, sortMode],
  );

  const pageWidth = SCREEN_WIDTH - 32; // 16px padding on each side

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [pageWidth, totalPages],
  );

  const goToPage = useCallback(
    (index: number) => {
      flatListRef.current?.scrollToOffset({ offset: index * pageWidth, animated: true });
      setCurrentPage(index);
    },
    [pageWidth],
  );

  const handleSortChange = useCallback(
    (mode: SortMode) => {
      setSortMode(mode);
      setCurrentPage(0);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [],
  );

  // Find which scrubber label is active based on current page
  const activeScrubberIndex = useMemo(() => {
    for (let i = scrubberLabels.length - 1; i >= 0; i--) {
      if (scrubberLabels[i].pageIndex <= currentPage) return i;
    }
    return 0;
  }, [scrubberLabels, currentPage]);

  const renderPage = useCallback(
    ({ item: pageStamps }: { item: StampData[] }) => (
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={styles.stampGrid}>
          {pageStamps.map(stamp => (
            <PassportStamp
              key={stamp.courseId}
              courseId={stamp.courseId}
              courseName={stamp.courseName}
              state={stamp.state}
              datePlayed={stamp.datePlayed}
              onPress={() => onStampPress(stamp.courseId)}
            />
          ))}
        </View>
      </View>
    ),
    [pageWidth, onStampPress],
  );

  if (allStamps.length === 0) return null;

  const sortBar = (
    <View style={styles.sortBar}>
      <Pressable
        style={[styles.sortTab, sortMode === 'date' && styles.sortTabActive]}
        onPress={() => handleSortChange('date')}
      >
        <Text style={[styles.sortTabText, sortMode === 'date' && styles.sortTabTextActive]}>
          BY DATE
        </Text>
      </Pressable>
      <Pressable
        style={[styles.sortTab, sortMode === 'state' && styles.sortTabActive]}
        onPress={() => handleSortChange('state')}
      >
        <Text style={[styles.sortTabText, sortMode === 'state' && styles.sortTabTextActive]}>
          BY STATE
        </Text>
      </Pressable>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.container}>
        {sortBar}
        <View style={styles.desktopGrid}>
          {sortedStamps.map(stamp => (
            <PassportStamp
              key={stamp.courseId}
              courseId={stamp.courseId}
              courseName={stamp.courseName}
              state={stamp.state}
              datePlayed={stamp.datePlayed}
              onPress={() => onStampPress(stamp.courseId)}
              size={200}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortBar}

      {/* Navigation scrubber */}
      {scrubberLabels.length > 1 && (
        <ScrollView
          ref={scrubberRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrubber}
          contentContainerStyle={styles.scrubberContent}
        >
          {scrubberLabels.map((item, i) => (
            <Pressable
              key={`${item.label}-${item.pageIndex}`}
              style={[styles.scrubberItem, i === activeScrubberIndex && styles.scrubberItemActive]}
              onPress={() => goToPage(item.pageIndex)}
            >
              <Text style={[styles.scrubberText, i === activeScrubberIndex && styles.scrubberTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Paged stamps */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(_, i) => `page-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        snapToInterval={pageWidth}
        decelerationRate="fast"
      />

      {/* Page indicator */}
      {totalPages > 1 && (
        totalPages <= 8 ? (
          <View style={styles.dots}>
            {pages.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentPage && styles.dotActive]}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.pageText}>
            Page {currentPage + 1} of {totalPages}
          </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sortBar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sortTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: Colors.lightGray,
  },
  sortTabActive: {
    backgroundColor: Colors.black,
  },
  sortTabText: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1,
  },
  sortTabTextActive: {
    color: Colors.white,
  },
  scrubber: {
    marginBottom: 8,
    maxHeight: 32,
  },
  scrubberContent: {
    gap: 6,
    paddingRight: 16,
  },
  scrubberItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
  },
  scrubberItemActive: {
    backgroundColor: Colors.orange,
  },
  scrubberText: {
    fontSize: 12,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
  },
  scrubberTextActive: {
    color: Colors.white,
  },
  page: {
    paddingHorizontal: 4,
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.lightGray,
  },
  dotActive: {
    backgroundColor: Colors.black,
  },
  pageText: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 12,
  },
});
