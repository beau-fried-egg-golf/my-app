import { useWindowDimensions } from 'react-native';

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= 660;
}

export function useIsCompactDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= 660 && width < 850;
}
