import { Tabs, Redirect } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { useRouter, usePathname } from 'expo-router';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { ClubhouseIcon, CoursesIcon, MeetupsIcon, GroupsIcon, MembersIcon, MessagingIcon, NotificationsIcon } from '@/components/icons/CustomIcons';

function TabIconBox({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tabIconBox}>
      {children}
    </View>
  );
}

function SolidTabBarBackground() {
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
      <Pressable onPress={() => router.push('/notifications')} style={styles.headerPillBtn}>
        <NotificationsIcon size={28} color={isOnNotifications ? Colors.orange : Colors.black} />
        {hasUnreadNotifications && !isOnNotifications && <View style={styles.unreadBadge} />}
      </Pressable>
      <Pressable onPress={() => router.push('/conversations')} style={styles.headerPillBtn}>
        <MessagingIcon size={28} color={isOnConversations ? Colors.orange : Colors.black} />
        {hasUnreadMessages && !isOnConversations && <View style={styles.unreadBadge} />}
      </Pressable>
      <Pressable onPress={() => router.push('/profile')} style={styles.headerPillBtn}>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Ionicons name="person" size={16} color={Colors.black} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/')} style={styles.backBtn}>
      <Ionicons name="chevron-back" size={20} color={Colors.black} />
    </Pressable>
  );
}

export default function TabLayout() {
  const { session, isLoading } = useStore();

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.orange }}>
      <Image source={require('../../assets/images/FEGC App Icon.png')} style={{ width: 120, height: 120 }} />
    </View>
  );

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      sceneContainerStyle={{ paddingBottom: 0 }}
      screenOptions={{
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.gray,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        tabBarBackground: () => <SolidTabBarBackground />,
        headerStyle: { backgroundColor: Colors.white },
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
  );
}

const styles = StyleSheet.create({
  // ── Floating pill tab bar ──
  tabBar: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 286,
    left: '50%',
    marginLeft: -143,
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
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 8,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  headerPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profilePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
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
