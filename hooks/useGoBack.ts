import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Returns a goBack function that falls back to the home screen
 * when there's no navigation history to go back to.
 */
export function useGoBack() {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);
}
