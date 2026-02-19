import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { ClubhouseIcon, CoursesIcon, MeetupsIcon, GroupsIcon, MembersIcon, MessagingIcon, NotificationsIcon, GolfBagIcon } from '@/components/icons/CustomIcons';
import PlatformPressable from '@/components/PlatformPressable';

interface NavItem {
  label: string;
  href: string;
  icon: (props: { size: number; color: string }) => React.ReactNode;
  badgeKey?: 'hasUnreadMessages' | 'hasUnreadNotifications';
  isExperiences?: boolean;
}

const COMMUNITY_ITEMS: NavItem[] = [
  { label: 'Newsfeed', href: '/', icon: ({ size, color }) => <ClubhouseIcon size={size} color={color} /> },
  { label: 'Courses', href: '/courses', icon: ({ size, color }) => <CoursesIcon size={size} color={color} /> },
  { label: 'Meetups', href: '/meetups', icon: ({ size, color }) => <MeetupsIcon size={size} color={color} /> },
  { label: 'Groups', href: '/groups', icon: ({ size, color }) => <GroupsIcon size={size} color={color} /> },
  { label: 'Members', href: '/members', icon: ({ size, color }) => <MembersIcon size={size} color={color} /> },
  { label: 'Messages', href: '/conversations', icon: ({ size, color }) => <MessagingIcon size={size} color={color} />, badgeKey: 'hasUnreadMessages' },
  { label: 'Alerts', href: '/notifications', icon: ({ size, color }) => <NotificationsIcon size={size} color={color} />, badgeKey: 'hasUnreadNotifications' },
];

const EXPERIENCES_ITEMS: NavItem[] = [
  { label: 'Browse', href: '/(experiences)', icon: ({ size, color }) => <Ionicons name="compass-outline" size={size} color={color} />, isExperiences: true },
  { label: 'Lodging', href: '/(experiences)/lodging', icon: ({ size, color }) => <Ionicons name="bed-outline" size={size} color={color} />, isExperiences: true },
  { label: 'Tee Times', href: '/(experiences)/tee-times', icon: ({ size, color }) => <GolfBagIcon size={size} color={color} />, isExperiences: true },
  { label: 'Reservations', href: '/(experiences)/reservations', icon: ({ size, color }) => <Ionicons name="receipt-outline" size={size} color={color} />, isExperiences: true },
];

function NavItemRow({ item, pathname, store, onPress }: { item: NavItem; pathname: string; store: any; onPress: () => void }) {
  const isActive = item.isExperiences
    ? pathname === item.href || pathname === item.href + '/'
    : item.href === '/'
      ? pathname === '/'
      : pathname.startsWith(item.href);
  const color = isActive ? Colors.orange : Colors.black;
  const showBadge = item.badgeKey ? store[item.badgeKey] : false;

  return (
    <PlatformPressable
      style={[styles.navItem, isActive && styles.navItemActive]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        {item.icon({ size: 22, color })}
        {showBadge && <View style={styles.badge} />}
      </View>
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {item.label}
      </Text>
    </PlatformPressable>
  );
}

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useNavigation();
  const store = useStore();

  const handlePress = (item: NavItem) => {
    if (item.isExperiences) {
      // Navigate into the experiences stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(experiences)' }],
        })
      );
      // For sub-pages, push after reset
      if (item.href !== '/(experiences)') {
        setTimeout(() => router.push(item.href as any), 50);
      }
    } else {
      // If we're currently in experiences, reset to tabs first
      if (pathname.startsWith('/(experiences)')) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: '(tabs)' }],
          })
        );
        if (item.href !== '/') {
          setTimeout(() => router.push(item.href as any), 50);
        }
      } else {
        router.push(item.href as any);
      }
    }
  };

  return (
    <View style={styles.sidebar}>
      <Image
        source={require('../assets/images/FriedEggGolfClub_Horizontal_Black.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>COMMUNITY</Text>
        <View style={styles.nav}>
          {COMMUNITY_ITEMS.map((item) => (
            <NavItemRow
              key={item.href}
              item={item}
              pathname={pathname}
              store={store}
              onPress={() => handlePress(item)}
            />
          ))}
        </View>

        {store.isAdmin && (
          <>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionHeader}>EXPERIENCES</Text>
            <View style={styles.nav}>
              {EXPERIENCES_ITEMS.map((item) => (
                <NavItemRow
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  store={store}
                  onPress={() => handlePress(item)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.lightGray,
    paddingTop: 20,
  },
  logo: {
    width: 180,
    height: 40,
    marginLeft: 16,
    marginBottom: 16,
  },
  navScroll: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 16,
    marginTop: 8,
  },
  nav: {
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#FFF0EB',
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },
  navLabel: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  navLabelActive: {
    color: Colors.orange,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
});
