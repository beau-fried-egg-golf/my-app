import { Stack, Redirect } from 'expo-router';
import { Image, Platform, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import ExperiencesTabBar from '@/components/experiences/ExperiencesTabBar';

export default function ExperiencesLayout() {
  const { session, isLoading } = useStore();

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
      <Image
        source={require('../../assets/images/fegc-app-icon.png')}
        style={{ width: 120, height: 120 }}
      />
    </View>
  );

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
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
          name="lodging"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="room/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="tee-times"
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
          name="events"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="event/[slug]"
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
      <ExperiencesTabBar />
    </View>
  );
}
