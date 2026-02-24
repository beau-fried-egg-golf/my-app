import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface ReactionTooltipProps {
  userIds: string[];
  getUserName: (userId: string) => string;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}

function formatNames(userIds: string[], getUserName: (id: string) => string): string {
  const names = userIds.map(getUserName);
  if (names.length <= 3) return names.join(', ');
  const shown = names.slice(0, 3);
  const remaining = names.length - 3;
  return `${shown.join(', ')}, and ${remaining} other${remaining > 1 ? 's' : ''}`;
}

export default function ReactionTooltip({ userIds, getUserName, onPress, children, style }: ReactionTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearHideTimer() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function scheduleHide() {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setShowTooltip(false), 200);
  }

  if (userIds.length === 0) {
    return (
      <Pressable onPress={onPress} style={style}>
        {children}
      </Pressable>
    );
  }

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        onLongPress={!isWeb ? () => setShowTooltip(prev => !prev) : undefined}
        onHoverIn={isWeb ? () => { clearHideTimer(); setShowTooltip(true); } : undefined}
        onHoverOut={isWeb ? scheduleHide : undefined}
        style={style}
      >
        {children}
      </Pressable>
      {showTooltip && (
        <View
          style={styles.tooltipContainer}
          // @ts-ignore - web hover events
          onMouseEnter={isWeb ? () => { clearHideTimer(); setShowTooltip(true); } : undefined}
          // @ts-ignore
          onMouseLeave={isWeb ? scheduleHide : undefined}
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{formatNames(userIds, getUserName)}</Text>
          </View>
          <View style={styles.tooltipArrow} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    alignItems: 'center',
    marginBottom: 2,
    zIndex: 1000,
  } as any,
  tooltip: {
    backgroundColor: Colors.darkGray,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 220,
  },
  tooltipText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts!.sans,
    textAlign: 'center',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.darkGray,
  },
});
