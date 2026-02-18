import { useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface DateRangePickerProps {
  checkIn: string | null;
  checkOut: string | null;
  onSelect: (checkIn: string, checkOut: string) => void;
  minDate?: string;
  /** Dates with limited availability shown in amber */
  limitedDates?: Set<string>;
  /** Dates with no availability shown as disabled */
  unavailableDates?: Set<string>;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  onSelect,
  minDate,
  limitedDates,
  unavailableDates,
}: DateRangePickerProps) {
  const today = new Date();
  const [baseMonth, setBaseMonth] = useState(today.getMonth());
  const [baseYear, setBaseYear] = useState(today.getFullYear());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<string | null>(checkIn);

  const minDateStr = minDate ?? today.toISOString().split('T')[0];

  const months = useMemo(() => {
    const result = [];
    for (let i = 0; i < 2; i++) {
      let m = baseMonth + i;
      let y = baseYear;
      if (m > 11) { m -= 12; y += 1; }
      result.push({ year: y, month: m });
    }
    return result;
  }, [baseMonth, baseYear]);

  function prevMonth() {
    if (baseMonth === 0) {
      setBaseMonth(11);
      setBaseYear(baseYear - 1);
    } else {
      setBaseMonth(baseMonth - 1);
    }
  }

  function nextMonth() {
    if (baseMonth === 11) {
      setBaseMonth(0);
      setBaseYear(baseYear + 1);
    } else {
      setBaseMonth(baseMonth + 1);
    }
  }

  function handleDayPress(dateStr: string) {
    if (unavailableDates?.has(dateStr)) return;

    if (!selectingCheckOut || !tempCheckIn) {
      setTempCheckIn(dateStr);
      setSelectingCheckOut(true);
    } else {
      if (dateStr <= tempCheckIn) {
        // Restart selection
        setTempCheckIn(dateStr);
        setSelectingCheckOut(true);
      } else {
        onSelect(tempCheckIn, dateStr);
        setSelectingCheckOut(false);
      }
    }
  }

  function isInRange(dateStr: string): boolean {
    if (!tempCheckIn || !checkOut) return false;
    return dateStr > tempCheckIn && dateStr < checkOut;
  }

  function renderMonth(year: number, month: number) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = new Date(year, month, 1).getDay();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDow).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return (
      <View key={`${year}-${month}`} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{formatMonth(year, month)}</Text>
        <View style={styles.weekdayRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} style={styles.weekdayLabel}>{d}</Text>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === null) return <View key={di} style={styles.dayCell} />;

              const dateStr = toDateStr(year, month, day);
              const isPast = dateStr < minDateStr;
              const isUnavailable = unavailableDates?.has(dateStr);
              const isDisabled = isPast || isUnavailable;
              const isCheckIn = dateStr === (tempCheckIn ?? checkIn);
              const isCheckOut = dateStr === checkOut;
              const inRange = isInRange(dateStr);
              const isLimited = limitedDates?.has(dateStr);

              return (
                <Pressable
                  key={di}
                  style={[
                    styles.dayCell,
                    isCheckIn && styles.daySelected,
                    isCheckOut && styles.daySelected,
                    inRange && styles.dayInRange,
                    isDisabled && styles.dayDisabled,
                  ]}
                  onPress={() => !isDisabled && handleDayPress(dateStr)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.dayText,
                    (isCheckIn || isCheckOut) && styles.dayTextSelected,
                    isDisabled && styles.dayTextDisabled,
                    isLimited && !isCheckIn && !isCheckOut && styles.dayTextLimited,
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        <Pressable onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
        <Pressable onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>→</Text>
        </Pressable>
      </View>

      {selectingCheckOut && tempCheckIn && (
        <Text style={styles.hint}>Select check-out date</Text>
      )}

      <View style={styles.monthsRow}>
        {months.map(({ year, month }) => renderMonth(year, month))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn: {
    padding: 8,
  },
  navBtnText: {
    fontSize: 18,
    color: Colors.black,
  },
  hint: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.orange,
    textAlign: 'center',
    marginBottom: 8,
  },
  monthsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  monthContainer: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    color: Colors.gray,
    paddingVertical: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  dayText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  daySelected: {
    backgroundColor: Colors.black,
    borderRadius: 20,
  },
  dayTextSelected: {
    color: Colors.white,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
  dayInRange: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayTextDisabled: {
    color: Colors.lightGray,
  },
  dayTextLimited: {
    color: '#D97706',
  },
});
