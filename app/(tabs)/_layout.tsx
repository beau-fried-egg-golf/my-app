import { Tabs, Redirect } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { useRouter } from 'expo-router';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

function ProfileButton() {
  const router = useRouter();
  const { user } = useStore();
  return (
    <Pressable onPress={() => router.push('/profile')} style={styles.profileBtn}>
      {user?.image ? (
        <Image source={{ uri: user.image }} style={styles.profileImage} />
      ) : (
        <View style={styles.profilePlaceholder}>
          <Ionicons name="person" size={18} color={Colors.black} />
        </View>
      )}
    </Pressable>
  );
}

export default function TabLayout() {
  const { session, isLoading } = useStore();

  if (isLoading) return null;

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: Colors.black,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.lightGray,
        },
        tabBarLabel: ({ focused, children }: { focused: boolean; children: string }) => {
          const words = (children ?? '').split(' ').filter(Boolean);
          if (focused) {
            return (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
                {words.map((word: string, i: number) => (
                  <View key={`${word}-${i}`} style={{ backgroundColor: Colors.orange, paddingHorizontal: 4, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, fontSize: 12, color: Colors.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>{word}</Text>
                  </View>
                ))}
              </View>
            );
          }
          return (
            <Text style={{ fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, fontSize: 12, color: Colors.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</Text>
          );
        },
        tabBarItemStyle: {
          borderRadius: 0,
          justifyContent: 'center',
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          display: 'none',
          width: 0,
          height: 0,
          minHeight: 0,
          maxHeight: 0,
        },
        tabBarLabelPosition: 'beside-icon' as const,
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.black,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: Fonts!.sansBold,
          fontWeight: FontWeights.bold,
          fontSize: 18,
        },
        headerRight: () => <ProfileButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          headerTitle: () => <LetterSpacedHeader text="HOME" size={32} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'COURSES',
          headerTitle: () => <LetterSpacedHeader text="COURSES" size={32} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="golf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'MEMBERS',
          headerTitle: () => <LetterSpacedHeader text="MEMBERS" size={32} />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileBtn: {
    marginRight: 16,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
  },
});
