import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Platform, Pressable, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider, useStore } from '@/data/store';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function BackArrow() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.back()}
      style={{
        marginLeft: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="chevron-back" size={20} color={Colors.black} />
    </Pressable>
  );
}

function PushNotificationRegistrar() {
  const { session } = useStore();
  usePushNotifications(session?.user?.id);
  return null;
}

function PasswordResetNavigator() {
  const { needsPasswordReset } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (needsPasswordReset) {
      router.replace('/reset-password');
    }
  }, [needsPasswordReset]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    'GreyLL-Regular': require('../public/fonts/GreyLLTT-Regular.ttf'),
    'GreyLL-Medium': require('../public/fonts/GreyLLTT-Medium.ttf'),
    'GreyLL-Bold': require('../public/fonts/GreyLLTT-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <Image
          source={require('../assets/images/new welcome screen.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <StoreProvider>
      <PushNotificationRegistrar />
      <PasswordResetNavigator />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.black,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.white },
          headerTitleStyle: {
            fontFamily: Fonts!.sansBold,
            fontWeight: FontWeights.bold,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="create-writeup"
          options={{ title: '', presentation: 'modal', headerLeft: () => <BackArrow /> }}
        />
        <Stack.Screen
          name="create-post"
          options={{ title: '', presentation: 'modal', headerLeft: () => <BackArrow /> }}
        />
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="writeup/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="member/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-group"
          options={{ title: '', presentation: 'modal', headerLeft: () => <BackArrow /> }}
        />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="group-chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-meetup"
          options={{ title: '', presentation: 'modal', headerLeft: () => <BackArrow /> }}
        />
        <Stack.Screen name="meetup/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="meetup-chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ headerShown: false }}
        />
      </Stack>
    </StoreProvider>
    </SafeAreaProvider>
  );
}
