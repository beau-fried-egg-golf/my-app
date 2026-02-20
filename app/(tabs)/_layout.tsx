import { useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Image, Linking, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { useRouter, usePathname, useNavigation } from 'expo-router';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { ClubhouseIcon, CoursesIcon, MeetupsIcon, GroupsIcon, MembersIcon, MessagingIcon, NotificationsIcon, GolfBagIcon } from '@/components/icons/CustomIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import PlatformPressable from '@/components/PlatformPressable';
import { useIsDesktop } from '@/hooks/useIsDesktop';

function TabIconBox({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tabIconBox}>
      {children}
    </View>
  );
}

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="systemChromeMaterial"
        style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}
      />
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        },
      ]}
    />
  );
}

function HeaderRight() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasUnreadMessages, hasUnreadNotifications } = useStore();
  const isOnNotifications = pathname === '/notifications';
  const isOnConversations = pathname === '/conversations';
  return (
    <View style={styles.headerPill}>
      <PlatformPressable onPress={() => router.push('/notifications')} style={styles.headerPillBtn}>
        <NotificationsIcon size={34} color={isOnNotifications ? Colors.orange : Colors.black} />
        {hasUnreadNotifications && !isOnNotifications && <View style={styles.unreadBadge} />}
      </PlatformPressable>
      <PlatformPressable onPress={() => router.push('/conversations')} style={styles.headerPillBtn}>
        <MessagingIcon size={34} color={isOnConversations ? Colors.orange : Colors.black} />
        {hasUnreadMessages && !isOnConversations && <View style={styles.unreadBadge} />}
      </PlatformPressable>
      <PlatformPressable onPress={() => router.push('/profile')} style={styles.headerPillBtn}>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Ionicons name="person" size={20} color={Colors.black} />
          </View>
        )}
      </PlatformPressable>
    </View>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <PlatformPressable onPress={() => router.push('/')} style={styles.backBtn}>
      <Ionicons name="chevron-back" size={20} color={Colors.black} />
    </PlatformPressable>
  );
}

export default function TabLayout() {
  const { session, isLoading, isAdmin } = useStore();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = useIsDesktop();
  const TAB_BAR_WIDTH = 340;
  const [showMore, setShowMore] = useState(false);

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.orange }}>
      <Image source={require('../../assets/images/fegc-app-icon.png')} style={{ width: 120, height: 120 }} />
    </View>
  );

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
    <Tabs
      sceneContainerStyle={{ paddingBottom: 0 }}
      screenOptions={{
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.gray,
        tabBarShowLabel: false,
        tabBarStyle: isDesktop
          ? { display: 'none' }
          : [styles.tabBar, { bottom: Math.max(16, insets.bottom), transform: [{ translateX: (screenWidth - TAB_BAR_WIDTH) / 2 }] }],
        tabBarItemStyle: styles.tabBarItem,
        tabBarButton: HapticTab,
        tabBarIconStyle: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        tabBarBackground: () => <TabBarBackground />,
        headerShown: !isDesktop,
        headerStyle: { backgroundColor: Colors.white, height: 100 },
        headerTintColor: Colors.black,
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontFamily: Fonts!.sansBold,
          fontWeight: FontWeights.bold,
          fontSize: 18,
        },
        headerRight: () => <HeaderRight />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          headerTitle: () => <LetterSpacedHeader text="HOME" size={32} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIconBox>
              <ClubhouseIcon size={41} color={color} />
            </TabIconBox>
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'COURSES',
          headerTitle: () => <LetterSpacedHeader text="COURSES" size={32} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIconBox>
              <CoursesIcon size={41} color={color} />
            </TabIconBox>
          ),
        }}
      />
      <Tabs.Screen
        name="meetups"
        options={{
          title: 'MEETUPS',
          headerTitle: () => <LetterSpacedHeader text="MEETUPS" size={32} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIconBox>
              <MeetupsIcon size={41} color={color} />
            </TabIconBox>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'GROUPS',
          headerTitle: () => <LetterSpacedHeader text="GROUPS" size={32} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIconBox>
              <GroupsIcon size={41} color={color} />
            </TabIconBox>
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'MEMBERS',
          headerTitle: () => <LetterSpacedHeader text="MEMBERS" size={32} />,
          tabBarIcon: ({ color, focused }) => (
            <TabIconBox>
              <MembersIcon size={41} color={color} />
            </TabIconBox>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'MORE',
          tabBarIcon: ({ color }) => (
            <TabIconBox>
              <Ionicons name="ellipsis-horizontal" size={24} color={color} />
            </TabIconBox>
          ),
          tabBarButton: ({ href, onPress, ...rest }: any) => (
            <Pressable
              {...rest}
              onPress={() => setShowMore(true)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          href: null,
          headerTitle: () => <LetterSpacedHeader text="MESSAGES" size={32} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerTitle: () => <LetterSpacedHeader text="ALERTS" size={32} />,
        }}
      />
    </Tabs>

      <Modal
        visible={showMore && !isDesktop}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMore(false)}
      >
        <Pressable style={styles.moreBackdrop} onPress={() => setShowMore(false)}>
          <View style={styles.moreSheet}>
            {isAdmin && (
              <>
                <Pressable
                  style={styles.moreOption}
                  onPress={() => {
                    setShowMore(false);
                    navigation.dispatch(
                      CommonActions.reset({
                        index: 0,
                        routes: [{ name: '(experiences)' }],
                      })
                    );
                  }}
                >
                  <View style={[styles.moreIconBox, { backgroundColor: Colors.orange }]}>
                    <GolfBagIcon size={24} color={Colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.moreOptionTitle}>Experiences</Text>
                    <Text style={styles.moreOptionDesc}>Book lodging, tee times & curated trips</Text>
                  </View>
                  <Ionicons name="repeat-outline" size={20} color={Colors.gray} style={{ marginLeft: 'auto' }} />
                </Pressable>
                <View style={styles.moreSeparator} />
              </>
            )}
            <Pressable
              style={styles.moreOption}
              onPress={() => {
                setShowMore(false);
                Linking.openURL('https://proshop.thefriedegg.com/');
              }}
            >
              <View style={styles.moreIconBox}>
                <Ionicons name="bag-handle-outline" size={22} color={Colors.black} />
              </View>
              <View>
                <Text style={styles.moreOptionTitle}>Pro Shop</Text>
                <Text style={styles.moreOptionDesc}>Shop Fried Egg gear</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.gray} style={{ marginLeft: 'auto' }} />
            </Pressable>
            <View style={styles.moreSeparator} />
            <Pressable
              style={styles.moreOption}
              onPress={() => {
                setShowMore(false);
                Linking.openURL('https://www.thefriedegg.com/trip-planning');
              }}
            >
              <View style={styles.moreIconBox}>
                <Ionicons name="airplane-outline" size={22} color={Colors.black} />
              </View>
              <View>
                <Text style={styles.moreOptionTitle}>International Trip Planning</Text>
                <Text style={styles.moreOptionDesc}>Plan your next golf trip abroad</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.gray} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Floating pill tab bar ──
  tabBar: {
    position: 'absolute',
    bottom: 16,
    width: 340,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarItem: {
    flex: 1,
    height: 56,
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Header pill bar ──
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginRight: 8,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  headerPillBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.orange,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  profileImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  profilePlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
  },

  // ── More modal ──
  moreBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  moreSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  moreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  moreIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOptionTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  moreOptionDesc: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  moreSeparator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 58,
  },

  // ── Back button (circle) ──
  backBtn: {
    marginLeft: 8,
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
  },
});
