import { Platform, View, ViewStyle, StyleProp } from 'react-native';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ResponsiveContainer({ children, style }: Props) {
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
  const isWeb = Platform.OS === 'web';
  const outerFlex = isWeb ? { flexGrow: 1, flexShrink: 0 } : { flex: 1 };
  const innerFlex = isWeb ? { flexGrow: 1, flexShrink: 0 } : { flex: 1 };

  return (
    <View style={[{ backgroundColor: '#FFFFFF', ...outerFlex }, style]}>
      <View
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
