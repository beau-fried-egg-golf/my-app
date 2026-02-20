import { View, ViewStyle, StyleProp } from 'react-native';
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

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View
        style={[
          {
            flex: 1,
            maxWidth: 960,
            width: '100%',
            alignSelf: 'center' as const,
            paddingHorizontal: 20,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
