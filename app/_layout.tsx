import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider } from '@/data/store';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.black,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{ title: 'Profile', presentation: 'modal' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ title: 'Edit Profile', presentation: 'modal' }}
        />
        <Stack.Screen
          name="create-writeup"
          options={{ title: 'New Writeup', presentation: 'modal' }}
        />
        <Stack.Screen name="course/[id]" options={{ title: '' }} />
        <Stack.Screen name="writeup/[id]" options={{ title: '' }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </StoreProvider>
  );
}
