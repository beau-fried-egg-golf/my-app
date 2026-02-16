import { Platform, Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

type PlatformPressableProps = PressableProps & {
  haptic?: boolean;
};

export default function PlatformPressable({
  style,
  haptic,
  onPressIn,
  ...props
}: PlatformPressableProps) {
  const handlePressIn = (e: any) => {
    if (haptic && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressIn?.(e);
  };

  if (Platform.OS === 'android') {
    return (
      <Pressable
        android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
        style={style}
        onPressIn={handlePressIn}
        {...props}
      />
    );
  }

  return (
    <Pressable
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
      ]}
      onPressIn={handlePressIn}
      {...props}
    />
  );
}
