import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/data/supabase';
import type { EventSubscription } from 'expo-modules-core';

let notificationsModule: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  return notificationsModule;
}

export function usePushNotifications(userId: string | undefined) {
  const router = useRouter();
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;

    let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

    (async () => {
      const Notifications = await getNotifications();

      // Set notification handler for foreground notifications
      Notifications.setNotificationHandler({
        handleNotification: async (_notification) => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Register for push notifications
      await registerForPushNotifications(userId);

      // Clear any stale badge on initial launch
      Notifications.setBadgeCountAsync(0);

      // Clear badge whenever the app comes to foreground
      appStateSubscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          Notifications.setBadgeCountAsync(0);
        }
      });

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      // Handle notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (!data) return;

        if (data.conversation_id) {
          router.push(`/conversation/${data.conversation_id}`);
        } else if (data.meetup_id) {
          router.push(`/meetup/${data.meetup_id}`);
        } else if (data.writeup_id) {
          router.push(`/writeup/${data.writeup_id}`);
        } else if (data.post_id) {
          router.push(`/post/${data.post_id}`);
        } else if (data.group_id) {
          router.push(`/group/${data.group_id}`);
        }
      });
    })();

    return () => {
      responseListener.current?.remove();
      appStateSubscription?.remove();
    };
  }, [userId]);
}

async function registerForPushNotifications(userId: string) {
  const Device = await import('expo-device');
  if (!Device.isDevice) return;

  const Notifications = await getNotifications();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const projectId = '905e251e-b3b9-433f-ae61-e97e03c3261b';
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  // Save token to profile
  await supabase
    .from('profiles')
    .update({ expo_push_token: token } as any)
    .eq('id', userId);
}
