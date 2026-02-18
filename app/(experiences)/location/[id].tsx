import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import type { ExperienceLocation, RoomType, TeeTimeSlot } from '@/types/experiences';
import type { Course } from '@/types';
import RoomCard from '@/components/experiences/RoomCard';
import TeeTimeRow from '@/components/experiences/TeeTimeRow';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

type Tab = 'lodging' | 'tee_times' | 'packages';

export default function LocationDetail() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { getLocation, checkLodgingAvailability, checkTeeTimeAvailability, packages } = useExperienceStore();

  const [location, setLocation] = useState<ExperienceLocation | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const initialTab = (tab === 'tee_times' || tab === 'packages') ? tab : 'lodging';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Lodging availability
  const [lodgingAvailability, setLodgingAvailability] = useState<any[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Tee time availability
  const [teeTimeDate, setTeeTimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [teeTimeSlots, setTeeTimeSlots] = useState<TeeTimeSlot[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    if (!id) return;
    getLocation(id).then(result => {
      if (result) {
        setLocation(result.location);
        setRoomTypes(result.roomTypes);
        setCourses(result.courses);
        if (result.courses.length > 0) {
          setSelectedCourseId(result.courses[0].id);
        }
      }
    });
  }, [id]);

  // Load tee times when course or date changes
  useEffect(() => {
    if (selectedCourseId && teeTimeDate) {
      checkTeeTimeAvailability(selectedCourseId, teeTimeDate).then(setTeeTimeSlots);
    }
  }, [selectedCourseId, teeTimeDate]);

  const locationPackages = packages.filter(p => p.location_id === id);

  if (!location) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero with back button overlay */}
        <View>
          {location.hero_image ? (
            <Image source={{ uri: location.hero_image }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Ionicons name="location-outline" size={48} color={Colors.gray} />
            </View>
          )}
          <View style={styles.backBtnOverlay}>
            <Pressable onPress={goBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={{ marginBottom: 10 }}>
            <LetterSpacedHeader text={location.name} size={26} variant="experiences" />
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{location.type.replace('_', ' ')}</Text>
          </View>
          {location.city && location.state && (
            <Text style={styles.locationAddress}>{location.city}, {location.state}</Text>
          )}
          {location.description && (
            <Text style={styles.description}>{location.description}</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['lodging', 'tee_times', 'packages'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'tee_times' ? 'Tee Times' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'lodging' && (
          <View style={styles.tabContent}>
            {roomTypes.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Available Rooms</Text>
                {roomTypes.map(rt => (
                  <RoomCard
                    key={rt.id}
                    roomType={rt}
                    nightlyRate={rt.base_price_per_night}
                    availableUnits={99} // TODO: Wire up date selection
                    onSelect={() => router.push({
                      pathname: '/(experiences)/room/[id]',
                      params: { id: rt.id, locationId: id },
                    })}
                  />
                ))}
              </>
            ) : (
              <Text style={styles.emptyText}>No lodging available at this location</Text>
            )}
          </View>
        )}

        {activeTab === 'tee_times' && (
          <View style={styles.tabContent}>
            {courses.length > 0 ? (
              <>
                {courses.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {courses.map(c => (
                      <Pressable
                        key={c.id}
                        style={[styles.courseChip, selectedCourseId === c.id && styles.courseChipActive]}
                        onPress={() => setSelectedCourseId(c.id)}
                      >
                        <Text style={[styles.courseChipText, selectedCourseId === c.id && styles.courseChipTextActive]}>
                          {c.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                {teeTimeSlots.length > 0 ? (
                  teeTimeSlots.map(slot => (
                    <TeeTimeRow
                      key={slot.id}
                      slot={slot}
                      onSelect={() => router.push({
                        pathname: '/(experiences)/book-tee-time',
                        params: { courseId: selectedCourseId, slotId: slot.id, date: teeTimeDate },
                      })}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No tee times available for this date</Text>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No courses at this location</Text>
            )}
          </View>
        )}

        {activeTab === 'packages' && (
          <View style={styles.tabContent}>
            {locationPackages.length > 0 ? (
              locationPackages.map(pkg => (
                <Pressable
                  key={pkg.id}
                  style={styles.packageRow}
                  onPress={() => router.push(`/(experiences)/package/${pkg.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    {pkg.short_description && (
                      <Text style={styles.packageDesc} numberOfLines={2}>{pkg.short_description}</Text>
                    )}
                    <Text style={styles.packageMeta}>
                      ${(pkg.price_per_person / 100).toLocaleString()}/person · {pkg.duration_nights} nights
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No packages at this location</Text>
            )}
          </View>
        )}

        {/* Amenities */}
        {location.amenities.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenityGrid}>
              {location.amenities.map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Policies */}
        <View style={styles.infoSection}>
          {location.check_in_time && (
            <Text style={styles.policyText}>Check-in: {location.check_in_time}</Text>
          )}
          {location.check_out_time && (
            <Text style={styles.policyText}>Check-out: {location.check_out_time}</Text>
          )}
          <Text style={styles.policyText}>
            Cancellation: {location.cancellation_policy.charAt(0).toUpperCase() + location.cancellation_policy.slice(1)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  backBtnOverlay: {
    position: 'absolute', top: 12, left: 16, zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 100 },
  hero: { width: '100%', height: 220 },
  heroPlaceholder: { backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  infoSection: { paddingHorizontal: 16, paddingTop: 16 },
  locationName: { fontSize: 22, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  typeBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.lightGray, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 6,
  },
  typeBadgeText: { fontSize: 12, fontFamily: Fonts!.sansBold, color: Colors.darkGray, textTransform: 'capitalize' },
  locationAddress: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  description: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray, marginTop: 8, lineHeight: 20 },

  // Tabs
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.lightGray, marginTop: 16, paddingHorizontal: 16,
  },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.black },
  tabText: { fontSize: 14, fontFamily: Fonts!.sansMedium, color: Colors.gray },
  tabTextActive: { color: Colors.black, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
  tabContent: { padding: 16 },

  // Course chips
  courseChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.lightGray, marginRight: 8,
  },
  courseChipActive: { backgroundColor: Colors.black },
  courseChipText: { fontSize: 13, fontFamily: Fonts!.sansMedium, color: Colors.darkGray },
  courseChipTextActive: { color: Colors.white },

  // Package rows
  packageRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, gap: 12,
  },
  packageName: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  packageDesc: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  packageMeta: { fontSize: 13, fontFamily: Fonts!.sansBold, color: Colors.black, marginTop: 4 },

  sectionTitle: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12 },
  emptyText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, textAlign: 'center', paddingVertical: 32 },

  // Amenities
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { backgroundColor: Colors.lightGray, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  amenityText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.darkGray },

  policyText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
});
