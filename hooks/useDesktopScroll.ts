import { createContext, useContext, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
import { useIsDesktop } from './useIsDesktop';

/**
 * Context that holds an Animated.Value representing the current page's scroll offset.
 * The root layout uses this to collapse the desktop header as the user scrolls down.
 */
export const DesktopScrollContext = createContext<Animated.Value | null>(null);

/** Total height of DesktopHeader (88) + DesktopNav (~50) */
export const DESKTOP_HEADER_HEIGHT = 138;

/**
 * Returns props to spread onto a ScrollView or FlatList to connect it
 * to the desktop header collapse behavior. On mobile, returns empty object.
 *
 * On desktop web, disables internal scrolling so the root container handles it.
 * On desktop native (if ever used), connects scroll to header collapse.
 *
 * Usage:
 *   const desktopScrollProps = useDesktopScrollProps();
 *   <FlatList {...desktopScrollProps} ... />
 */
export function useDesktopScrollProps() {
  const scrollY = useContext(DesktopScrollContext);
  const isDesktop = useIsDesktop();

  // Reset scroll offset when page mounts so header is fully visible
  useEffect(() => {
    if (isDesktop && scrollY) scrollY.setValue(0);
  }, []);

  if (!isDesktop || !scrollY) return {};

  // On desktop web, the root container handles scrolling.
  // CSS in _layout.tsx breaks the flex chain so FlatList containers grow to
  // full content height. With no internal overflow, wheel events chain up to
  // the root. windowSize ensures all items render (not just visible window).
  // Hide the inner scrollbar — only the root scrollbar should be visible.
  if (Platform.OS === 'web') {
    return { showsVerticalScrollIndicator: false, windowSize: 100 };
  }

  // Native desktop (unused currently) — keep original behavior
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );
  return { onScroll, scrollEventThrottle: 16 as const };
}
