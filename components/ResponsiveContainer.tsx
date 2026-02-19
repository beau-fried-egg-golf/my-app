import { View, ViewStyle, StyleProp } from 'react-native';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ResponsiveContainer({ children, style }: Props) {
  const isDesktop = useIsDesktop();

  return (
    <View
      style={[
        { flex: 1 },
        isDesktop && {
          maxWidth: 840,
          width: '100%',
          alignSelf: 'center' as const,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
