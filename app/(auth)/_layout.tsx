import { Stack, Redirect } from 'expo-router';
import { Image, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';

export default function AuthLayout() {
  const { session, isLoading } = useStore();

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
      <Image
        source={require('../../assets/images/new welcome screen.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.white },
      }}
    />
  );
}
