import { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import TutorialPopup from '@/components/TutorialPopup';

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString()}`;
}

export default function ExperiencesHome() {
  const router = useRouter();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { user } = useStore();
  const {
    locations,
    loadLocations,
    packages,
    featuredPackages,
    loadPackages,
    events,
    loadEvents,
    myReservations,
    loadMyReservations,
    isLoading,
  } = useExperienceStore();

  useEffect(() => {
    loadLocations();
    loadPackages();
    loadEvents();
    loadMyReservations();
  }, []);

  const upcomingReservations = myReservations.filter(
    r => r.status === 'confirmed' || r.status === 'pending',
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TutorialPopup
        storageKey="tutorial_experiences"
        title="Welcome to Experiences"
        paragraphs={[
          "You've entered a new part of the app dedicated to booking real-world golf experiences.",
          "Browse curated packages, book lodging at premier destinations, and reserve tee times at top courses — all in one place.",
          "Your upcoming reservations and booking details will live here too.",
        ]}
        buttonLabel="Let's Go"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner with header overlay */}
        <View style={styles.heroBanner}>
          <Image
            source={require('@/assets/images/experiences-hero.jpg')}
            style={styles.heroImage}
          />
          <View style={styles.heroContent}>
            <View style={styles.headerRow}>
              <LetterSpacedHeader text="EXPERIENCES" size={32} variant="experiences" />
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
              <Text style={styles.heroTitle}>Curated Golf Experiences</Text>
              <Text style={styles.heroSubtitle}>
                Book lodging, tee times, and curated packages at the best courses in the country.
              </Text>
            </View>
          </View>
        </View>

        {/* Featured Packages */}
        {featuredPackages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Packages</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featuredPackages.map(pkg => (
                <Pressable
                  key={pkg.id}
                  style={styles.packageCard}
                  onPress={() => router.push(`/(experiences)/package/${pkg.id}`)}
                >
                  {pkg.hero_image ? (
                    <Image source={{ uri: pkg.hero_image }} style={styles.packageImage} />
                  ) : (
                    <View style={[styles.packageImage, styles.packageImagePlaceholder]}>
                      <Ionicons name="golf-outline" size={32} color={Colors.gray} />
                    </View>
                  )}
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName} numberOfLines={1}>{pkg.name}</Text>
                    {pkg.location_name && (
                      <Text style={styles.packageLocation} numberOfLines={1}>{pkg.location_name}</Text>
                    )}
                    <View style={styles.packageMeta}>
                      <Text style={styles.packagePrice}>
                        {formatPrice(pkg.price_per_person)}/person
                      </Text>
                      <Text style={styles.packageNights}>
                        {pkg.duration_nights} {pkg.duration_nights === 1 ? 'night' : 'nights'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Browse by Type */}
        {(locations.length > 0 || events.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse</Text>
            <View style={styles.browseGrid}>
              <Pressable
                style={styles.browseTile}
                onPress={() => router.push('/(experiences)/lodging')}
              >
                <Image
                  source={{ uri: 'https://maylqohoflkarvgadttn.supabase.co/storage/v1/object/public/experiences/broomsedge/interior.png' }}
                  style={styles.browseTileImage}
                />
                <View style={styles.browseTileOverlay} />
                <Ionicons name="bed-outline" size={28} color={Colors.white} />
                <Text style={styles.browseTileLabel}>Lodging</Text>
              </Pressable>
              <Pressable
                style={styles.browseTile}
                onPress={() => router.push('/(experiences)/tee-times')}
              >
                <Image
                  source={{ uri: 'https://maylqohoflkarvgadttn.supabase.co/storage/v1/object/public/experiences/bandon/bandon-trails.jpg' }}
                  style={styles.browseTileImage}
                />
                <View style={styles.browseTileOverlay} />
                <Ionicons name="golf-outline" size={28} color={Colors.white} />
                <Text style={styles.browseTileLabel}>Tee Times</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.browseTile, styles.browseTileFull]}
              onPress={() => router.push('/(experiences)/events')}
            >
              <Image
                source={require('@/assets/images/events-hero.png')}
                style={styles.browseTileImage}
              />
              <View style={styles.browseTileOverlay} />
              <Ionicons name="calendar-outline" size={28} color={Colors.white} />
              <Text style={styles.browseTileLabel}>Events</Text>
            </Pressable>
          </View>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations</Text>
            {locations.map(loc => (
              <Pressable
                key={loc.id}
                style={styles.locationRow}
                onPress={() => router.push(`/(experiences)/location/${loc.id}`)}
              >
                {loc.hero_image ? (
                  <Image source={{ uri: loc.hero_image }} style={styles.locationImage} />
                ) : (
                  <View style={[styles.locationImage, styles.locationImagePlaceholder]}>
                    <Ionicons name="location-outline" size={24} color={Colors.gray} />
                  </View>
                )}
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  {loc.city && loc.state && (
                    <Text style={styles.locationMeta}>{loc.city}, {loc.state}</Text>
                  )}
                  {loc.short_description && (
                    <Text style={styles.locationDesc} numberOfLines={2}>{loc.short_description}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Upcoming Reservations */}
        {upcomingReservations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              <Pressable onPress={() => router.push('/(experiences)/reservations')}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            {upcomingReservations.slice(0, 3).map(res => (
              <Pressable
                key={res.id}
                style={styles.reservationCard}
                onPress={() => router.push(`/(experiences)/reservation/${res.id}`)}
              >
                <View style={[styles.statusBadge, res.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                  <Text style={styles.statusText}>{res.status}</Text>
                </View>
                <Text style={styles.reservationType}>{res.type.replace('_', ' ')}</Text>
                {res.check_in_date && (
                  <Text style={styles.reservationDate}>{res.check_in_date}</Text>
                )}
                <Text style={styles.reservationPrice}>{formatPrice(res.total_price)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!isLoading && locations.length === 0 && packages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="golf-outline" size={48} color={Colors.lightGray} />
            <Text style={styles.emptyTitle}>Experiences Coming Soon</Text>
            <Text style={styles.emptySubtitle}>
              We're curating incredible golf experiences. Check back soon for lodging, tee times, and curated packages.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profilePlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero
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
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: 'rgba(255,255,255,0.7)',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    color: Colors.orange,
    marginBottom: 12,
  },

  // Featured packages
  horizontalScroll: {
    gap: 12,
    paddingRight: 16,
  },
  packageCard: {
    width: 240,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  packageImage: {
    width: '100%',
    height: 140,
  },
  packageImagePlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageInfo: {
    padding: 12,
  },
  packageName: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  packageLocation: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  packageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  packagePrice: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  packageNights: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },

  // Browse tiles
  browseGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  browseTile: {
    flex: 1,
    borderRadius: 12,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  browseTileFull: {
    marginTop: 12,
  },
  browseTileImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as any,
  browseTileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  browseTileLabel: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },

  // Locations
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 12,
  },
  locationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  locationImagePlaceholder: {
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  locationMeta: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  locationDesc: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.darkGray,
    marginTop: 4,
  },

  // Reservations
  reservationCard: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  statusConfirmed: {
    backgroundColor: '#D4EDDA',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
  reservationType: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textTransform: 'capitalize',
  },
  reservationDate: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  reservationPrice: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
