import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useExperienceStore } from '@/data/experienceStore';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

function formatEventDate(dateStr: string, timeStr: string | null): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  let result = `${weekday}, ${month} ${day}`;
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    result += ` \u00B7 ${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  return result;
}

export default function EventsBrowse() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useStore();
  const { events, loadEvents, isLoading } = useExperienceStore();

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={require('@/assets/images/events-hero.png')}
            style={styles.heroImage}
          />
          <View style={styles.heroContent}>
            <View style={styles.headerRow}>
              <LetterSpacedHeader text="EVENTS" size={32} variant="experiences" />
              <Pressable onPress={() => router.push('/profile')} style={styles.profileBtn}>
                {user?.image ? (
                  <Image source={{ uri: user.image }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person" size={16} color={Colors.white} />
                  </View>
                )}
              </Pressable>
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>Upcoming Events</Text>
              <Text style={styles.heroSubtitle}>Join us for unforgettable rounds at extraordinary courses</Text>
            </View>
          </View>
        </View>
        {events.length > 0 ? (
          events.map((ev, idx) => (
            <Pressable
              key={ev.id}
              style={[styles.eventCard, { marginHorizontal: 16 }, idx === 0 && { marginTop: 20 }]}
              onPress={() => router.push(`/(experiences)/event/${ev.slug}`)}
            >
              {ev.image_url ? (
                <Image source={{ uri: ev.image_url }} style={styles.eventImage} />
              ) : (
                <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
                  <Ionicons name="calendar-outline" size={36} color={Colors.gray} />
                </View>
              )}
              <View style={styles.eventOverlay} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{ev.name}</Text>
                <Text style={styles.eventDate}>
                  {formatEventDate(ev.date, ev.time)}
                </Text>
                {ev.location && (
                  <Text style={styles.eventLocation}>
                    <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" /> {ev.location}
                  </Text>
                )}
                {ev.spots_remaining != null && (
                  <View style={[
                    styles.spotsBadge,
                    ev.spots_remaining <= 0 && styles.spotsBadgeSoldOut,
                  ]}>
                    <Text style={styles.spotsBadgeText}>
                      {ev.spots_remaining <= 0
                        ? 'Sold Out'
                        : `${ev.spots_remaining} spot${ev.spots_remaining === 1 ? '' : 's'} left`}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        ) : isLoading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color={Colors.lightGray} />
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtitle}>Check back soon for new events</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingBottom: 100 },

  // Hero banner (matches Experiences home)
  heroBanner: {
    height: 280,
    backgroundColor: Colors.black,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.55,
  } as any,
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  profileImage: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: Colors.white,
  },
  profilePlaceholder: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroTextBlock: {
    padding: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.7)',
  },

  eventCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    height: 200,
  },
  eventImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as any,
  eventImagePlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  eventName: {
    fontSize: 20, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white,
  },
  eventDate: {
    fontSize: 13, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.9)', marginTop: 4,
  },
  eventLocation: {
    fontSize: 13, fontFamily: Fonts!.sans, color: 'rgba(255,255,255,0.8)', marginTop: 2,
  },
  spotsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8,
  },
  spotsBadgeSoldOut: {
    backgroundColor: 'rgba(220,38,38,0.7)',
  },
  spotsBadgeText: {
    fontSize: 12, fontFamily: Fonts!.sansBold, color: Colors.white,
  },

  emptyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, textAlign: 'center', paddingVertical: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  emptySubtitle: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
});
