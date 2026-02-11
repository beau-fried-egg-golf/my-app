import { Stack, Redirect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';

export default function AuthLayout() {
  const { session, isLoading } = useStore();

  if (isLoading) return null;

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
