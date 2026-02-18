import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

export default function ExperiencesLayout() {
  return (
    <Stack
      screenOptions={{
        animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
        headerStyle: { backgroundColor: Colors.black },
        headerTintColor: Colors.white,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.white },
        headerTitleStyle: {
          fontFamily: Fonts!.sansBold,
          fontWeight: FontWeights.bold,
          color: Colors.white,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="location/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="package/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="book-lodging"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="book-tee-time"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="book-package"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="reservations"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="reservation/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
