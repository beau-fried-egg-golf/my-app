import { Platform, View, ViewStyle, StyleProp } from 'react-native';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fillViewport?: boolean;
}

export default function ResponsiveContainer({ children, style, fillViewport }: Props) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <View style={[{ flex: 1, backgroundColor: '#FFFFFF' }, style]}>
        {children}
      </View>
    );
  }

  // On desktop web, use flexShrink: 0 so content can grow beyond viewport
  // (the root container handles scrolling). On native, keep flex: 1.
  // When fillViewport is true (chat screens), use flex: 1 to constrain to viewport height.
  const isWeb = Platform.OS === 'web';
  const outerFlex = isWeb && !fillViewport ? { flexGrow: 1, flexShrink: 0 } : { flex: 1 };
  const innerFlex = isWeb && !fillViewport ? { flexGrow: 1, flexShrink: 0 } : { flex: 1 };

  const fillViewportWeb = fillViewport && isWeb;

  return (
    <View
      {...(fillViewportWeb && { nativeID: 'dsk-fill-viewport' })}
      style={[{ backgroundColor: '#FFFFFF', ...outerFlex }, style]}
    >
      <View
        {...(fillViewportWeb && { nativeID: 'dsk-fill-inner' })}
        style={[
          {
            maxWidth: 960,
            width: '100%',
            alignSelf: 'center' as const,
            paddingHorizontal: 20,
            ...innerFlex,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
