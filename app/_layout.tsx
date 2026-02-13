import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider } from '@/data/store';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

function BackArrow() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} style={{ marginLeft: 16, paddingRight: 4 }}>
      <Text style={{ fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black }}>{'<'}</Text>
    </Pressable>
  );
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.orange }}>
        <Image source={require('../assets/images/FEGC App Icon.png')} style={{ width: 120, height: 120 }} />
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
          options={{ title: 'New Review', presentation: 'modal', headerLeft: () => <BackArrow />, headerTitle: () => <LetterSpacedHeader text="NEW REVIEW" size={32} /> }}
        />
        <Stack.Screen
          name="create-post"
          options={{ title: 'New Post', presentation: 'modal', headerLeft: () => <BackArrow />, headerTitle: () => <LetterSpacedHeader text="NEW POST" size={32} /> }}
        />
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="writeup/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="member/[id]" options={{ title: 'Member', headerTitle: () => <LetterSpacedHeader text="MEMBER" size={32} /> }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-group"
          options={{ title: 'New Group', presentation: 'modal', headerLeft: () => <BackArrow />, headerTitle: () => <LetterSpacedHeader text="NEW GROUP" size={32} /> }}
        />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="group-chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-meetup"
          options={{ title: 'New Meetup', presentation: 'modal', headerLeft: () => <BackArrow />, headerTitle: () => <LetterSpacedHeader text="NEW MEETUP" size={32} /> }}
        />
        <Stack.Screen name="meetup/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="meetup-chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </StoreProvider>
  );
}
