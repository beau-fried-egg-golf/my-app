import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, Platform, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider, useStore } from '@/data/store';
import { ExperienceStoreProvider } from '@/data/experienceStore';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopHeader, DesktopNav, DesktopDropdownMenu } from '@/components/desktop';
import { ActionPaneContext, ActionPaneType } from '@/hooks/useActionPane';
import { DesktopScrollContext } from '@/hooks/useDesktopScroll';
import UpgradeModal from '@/components/UpgradeModal';

const LazyCreatePost = React.lazy(() => import('./create-post'));
const LazyCreateWriteup = React.lazy(() => import('./create-writeup'));
const LazyCreateMeetup = React.lazy(() => import('./create-meetup'));
const LazyCreateGroup = React.lazy(() => import('./create-group'));
const LazyCreateChooser = React.lazy(() => import('@/components/desktop/CreateChooser'));

SplashScreen.preventAutoHideAsync();


export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function InitialRouteEnforcer() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Only enforce on root path — preserve deep links for refresh/URL sharing
      const path = window.location.pathname;
      if (path !== '/' && path !== '') return;
    }
    requestAnimationFrame(() => {
      router.replace('/(tabs)/');
    });
  }, []);

  return null;
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

function EmailVerificationNavigator() {
  const { session, emailVerified, user } = useStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!session || !user) return;
    if (emailVerified) return;
    const currentPath = segments.join('/');
    if (currentPath.startsWith('(auth)') || currentPath === 'verify-email') return;
    router.replace('/verify-email');
  }, [session, emailVerified, user, segments]);

  return null;
}

function AppShell() {
  const { isLoading } = useStore();
  const isDesktop = useIsDesktop();
  const segments = useSegments();
  const isAuthScreen = segments[0] === '(auth)';
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionPane, setActionPane] = useState<ActionPaneType | null>(null);
  const desktopScrollY = useRef(new Animated.Value(0)).current;

  // Desktop web: make root the scroll container and fix the flex/absolute chain
  // so all page content flows naturally and scrolls via the root container.
  useEffect(() => {
    if (!isDesktop || Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.id = 'desktop-scroll-fix';
    style.textContent = `
      /* Root becomes the page scroll container */
      #root-app-shell {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }

      /* Break the flex: 1 chain so containers grow to content height.
         flex-basis: auto overrides flex: 1's basis: 0%.
         flex-shrink: 0 prevents shrinking below content height. */
      #root-app-shell > div:not(:first-child),
      #root-app-shell > div:not(:first-child) div {
        flex-basis: auto !important;
        flex-shrink: 0 !important;
      }

      /* Active scene containers: undo absoluteFill so they participate in
         normal flow. CSS attribute selectors with !important persist across
         React re-renders (React doesn't use !important). */
      [data-dsk-scene] {
        position: relative !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        left: auto !important;
      }
      /* Inactive scene containers: completely hide so their content can't
         bleed through below active scenes. React state is preserved since
         components remain mounted — only CSS rendering is suppressed. */
      [data-dsk-scene-inactive] {
        display: none !important;
      }

      /* Hide scrollbars on inner containers — only root scrollbar visible */
      #root-app-shell > div:not(:first-child) ::-webkit-scrollbar {
        display: none !important;
      }
      #root-app-shell > div:not(:first-child) * {
        scrollbar-width: none !important;
      }

      /* Ensure content fills viewport so footer is never visible without scrolling */
      [data-dsk-scene] {
        min-height: 100vh !important;
      }

      /* Peek-behind footer: make scroll container transparent at bottom */
      #root-app-shell {
        background-color: transparent !important;
      }
      /* Exempt the footer from the flex-basis override */
      #desktop-footer {
        flex-shrink: 1 !important;
      }

      /* ── Fill-viewport screens (chat): constrain to viewport ── */
      #root-app-shell:has([data-dsk-scene] #dsk-fill-viewport) {
        overflow: hidden !important;
      }
      #root-app-shell:has([data-dsk-scene] #dsk-fill-viewport) #desktop-footer {
        display: none !important;
      }
      /* Stack container: fill remaining height after header */
      #root-app-shell:has([data-dsk-scene] #dsk-fill-viewport) > div:not(:first-child):has([data-dsk-scene]) {
        flex: 1 !important;
        min-height: 0 !important;
      }
      /* Scene container and all wrapper divs down to fill-viewport: flex to fill */
      #root-app-shell:has([data-dsk-scene] #dsk-fill-viewport) > div:not(:first-child) div:has(#dsk-fill-viewport) {
        flex: 1 !important;
        min-height: 0 !important;
      }
      /* Fill-viewport containers and chat message list: flex to fill */
      #root-app-shell #dsk-fill-viewport,
      #root-app-shell #dsk-fill-inner,
      #root-app-shell #dsk-chat-list {
        flex: 1 !important;
        min-height: 0 !important;
      }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [isDesktop]);

  // Desktop web: detect absoluteFill scene containers (from Stack and Bottom Tabs
  // navigators) and mark ACTIVE ones with data attributes so the CSS rules above
  // apply. Inactive scenes (z-index < 0) keep absoluteFill so they stay hidden.
  // Re-runs on every DOM/class change to handle tab switches.
  useEffect(() => {
    if (!isDesktop || Platform.OS !== 'web') return;

    const markSceneContainers = () => {
      const root = document.getElementById('root-app-shell');
      if (!root) return;

      // Check previously marked active scenes — if they became inactive, swap marks.
      root.querySelectorAll('[data-dsk-scene]').forEach(el => {
        const z = parseInt(getComputedStyle(el).zIndex, 10);
        if (isNaN(z) || z < 0) {
          el.removeAttribute('data-dsk-scene');
          el.setAttribute('data-dsk-scene-inactive', '');
        }
      });
      // Check previously marked inactive scenes — if they became active, swap marks.
      root.querySelectorAll('[data-dsk-scene-inactive]').forEach(el => {
        const z = parseInt(getComputedStyle(el).zIndex, 10);
        if (!isNaN(z) && z >= 0) {
          el.removeAttribute('data-dsk-scene-inactive');
          el.setAttribute('data-dsk-scene', '');
        }
      });

      // Search ALL descendant divs for absoluteFill scene containers
      const allDivs = root.querySelectorAll('div');
      for (const div of Array.from(allDivs) as HTMLElement[]) {
        if (div.hasAttribute('data-dsk-scene') || div.hasAttribute('data-dsk-scene-inactive')) continue;

        const cs = getComputedStyle(div);

        // Scene containers have absoluteFill + explicit z-index
        if (cs.position !== 'absolute') continue;
        if (cs.top !== '0px' || cs.right !== '0px' || cs.bottom !== '0px' || cs.left !== '0px') continue;
        if (cs.zIndex === 'auto') continue;

        // Skip absoluteFill elements that aren't full-viewport scene containers
        // (e.g. image layers, link preview cards, icon containers)
        if (div.offsetWidth < window.innerWidth * 0.8) continue;

        const zIndex = parseInt(cs.zIndex, 10);
        if (isNaN(zIndex)) continue;

        // Scene containers use z-index 0 (active) or -1 (inactive) —
        // skip high z-index elements (loading overlays, modals, etc.)
        if (zIndex > 1 || zIndex < -1) continue;

        if (zIndex >= 0) {
          // Active scene — make it participate in normal flow
          div.setAttribute('data-dsk-scene', '');
        } else {
          // Inactive scene — clip overflow so content doesn't bleed through
          div.setAttribute('data-dsk-scene-inactive', '');
        }
      }
    };

    // Run on next frame, then re-run on DOM or class/style changes (tab switches)
    let rafId: number;
    const debouncedMark = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(markSceneContainers);
    };
    debouncedMark();

    const root = document.getElementById('root-app-shell');
    const observer = root
      ? new MutationObserver(debouncedMark)
      : null;
    if (root && observer) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [isDesktop]);

  return (
    <ActionPaneContext.Provider
      value={{
        activePane: actionPane,
        openActionPane: (type) => setActionPane(type),
        closeActionPane: () => setActionPane(null),
      }}
    >
    <DesktopScrollContext.Provider value={desktopScrollY}>
    <View
      nativeID="root-app-shell"
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      {isDesktop && !isAuthScreen && (
        <View style={{ zIndex: 10, backgroundColor: '#FFFFFF' }}>
          <DesktopHeader onMenuPress={() => setShowDropdown(v => !v)} />
          <DesktopNav />
          <DesktopDropdownMenu
            visible={showDropdown}
            onClose={() => setShowDropdown(false)}
          />
        </View>
      )}
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.black,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.white,
          },
          headerTitleStyle: {
            fontFamily: Fonts!.sansBold,
            fontWeight: FontWeights.bold,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(experiences)" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{ headerShown: false, ...(!isDesktop && { presentation: 'modal' }) }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="create-writeup"
          options={{ headerShown: false, presentation: isDesktop ? 'transparentModal' : 'modal', ...(isDesktop && { contentStyle: { backgroundColor: 'transparent' } }) }}
        />
        <Stack.Screen
          name="create-post"
          options={{ headerShown: false, presentation: isDesktop ? 'transparentModal' : 'modal', ...(isDesktop && { contentStyle: { backgroundColor: 'transparent' } }) }}
        />
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="writeup/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="member/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-group"
          options={{ headerShown: false, presentation: isDesktop ? 'transparentModal' : 'modal', ...(isDesktop && { contentStyle: { backgroundColor: 'transparent' } }) }}
        />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="group-chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-meetup"
          options={{ headerShown: false, presentation: isDesktop ? 'transparentModal' : 'modal', ...(isDesktop && { contentStyle: { backgroundColor: 'transparent' } }) }}
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
        <Stack.Screen
          name="verify-email"
          options={{ headerShown: false }}
        />
      </Stack>
      {isDesktop && actionPane && (
        <Suspense fallback={null}>
          {actionPane === 'create' && <LazyCreateChooser />}
          {actionPane === 'review-only' && <LazyCreateChooser />}
          {actionPane === 'post' && <LazyCreatePost />}
          {actionPane === 'writeup' && <LazyCreateWriteup />}
          {actionPane === 'meetup' && <LazyCreateMeetup />}
          {actionPane === 'group' && <LazyCreateGroup />}
        </Suspense>
      )}
      {isLoading && isDesktop && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
          <Image source={require('../assets/images/fegc-monogram-black.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
          <Text style={{ fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, fontSize: 13, color: Colors.gray, letterSpacing: 1.5, marginTop: 16, textTransform: 'uppercase' }}>Loading...</Text>
        </View>
      )}
      {isDesktop && Platform.OS === 'web' && !isAuthScreen && (
        <View nativeID="desktop-footer" style={{ height: 300 }} />
      )}
    </View>
    {isDesktop && Platform.OS === 'web' && !isAuthScreen && (
      <View
        style={{
          position: 'fixed' as any,
          bottom: 0,
          left: 0,
          right: 0,
          height: 300,
          backgroundColor: Colors.orange,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: -1,
        }}
      >
        <Image
          source={require('../assets/images/FriedEggGolfClub_Horizontal_Black.png')}
          style={{ width: '80%', height: '60%' } as any}
          resizeMode="contain"
        />
      </View>
    )}
    </DesktopScrollContext.Provider>
    </ActionPaneContext.Provider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    'GreyLL-Regular': require('../public/fonts/GreyLLTT-Regular.ttf'),
    'GreyLL-Medium': require('../public/fonts/GreyLLTT-Medium.ttf'),
    'GreyLL-Bold': require('../public/fonts/GreyLLTT-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
    <StoreProvider>
    <ExperienceStoreProvider>
      <InitialRouteEnforcer />
      <PushNotificationRegistrar />
      <PasswordResetNavigator />
      <EmailVerificationNavigator />
      <UpgradeModal />
      <StatusBar style="dark" />
      <AppShell />
    </ExperienceStoreProvider>
    </StoreProvider>
    </SafeAreaProvider>
  );
}
