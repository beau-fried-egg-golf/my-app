import { createContext, useContext, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
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

  const onScroll = useMemo(() => {
    if (!scrollY) return undefined;
    return Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: false },
    );
  }, [scrollY]);

  if (!isDesktop || !scrollY) return {};

  return { onScroll, scrollEventThrottle: 16 as const };
}
