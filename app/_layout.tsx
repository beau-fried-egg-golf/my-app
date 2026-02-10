import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '@/data/store';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
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
