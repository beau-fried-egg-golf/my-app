import { useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { NotificationsIcon, MessagingIcon } from '@/components/icons/CustomIcons';
import { useIsCompactDesktop } from '@/hooks/useIsDesktop';

const TEXT_LINE_HEIGHT = 18;
const SCROLL_GAP = 14;

function ReturnButton({ compact }: { compact?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(TEXT_LINE_HEIGHT + SCROLL_GAP)],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.cream, Colors.white],
  });

  if (compact) {
    return (
      <Animated.View style={[styles.leftBadge, { backgroundColor: bgColor }]}>
        <Pressable
          style={styles.leftBadgeCompact}
          onPress={() => Linking.openURL('https://www.thefriedegg.com')}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
        >
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/fe-icon-yellow.png')}
              style={styles.logo}
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.leftBadge, { backgroundColor: bgColor }]}>
      <Pressable
        style={styles.leftBadgeInner}
        onPress={() => Linking.openURL('https://www.thefriedegg.com')}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/fe-icon-yellow.png')}
            style={styles.logo}
          />
        </View>
        <View style={styles.returnTextClip}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.returnText}>RETURN TO THEFRIEDEGG.COM</Text>
            <View style={{ height: SCROLL_GAP }} />
            <Text style={styles.returnText}>RETURN TO THEFRIEDEGG.COM</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface DesktopHeaderProps {
  onMenuPress: () => void;
}

function HamburgerIcon({ size, color }: { size: number; color: string }) {
  const barH = 2;
  const gap = 6;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.7, height: barH, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ height: gap }} />
      <View style={{ width: size * 0.7, height: barH, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function HoverHamburger({ onPress }: { onPress: () => void }) {
  return (
    <HoverIcon onPress={onPress}>
      <HamburgerIcon size={24} color={Colors.black} />
    </HoverIcon>
  );
}

function HoverIcon({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <View style={[styles.iconBtn, hovered && { backgroundColor: Colors.white }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={styles.iconBtnInner}
      >
        {children}
      </Pressable>
    </View>
  );
}

export default function DesktopHeader({ onMenuPress }: DesktopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasUnreadMessages, hasUnreadNotifications, isPaidMember } = useStore();
  const isOnNotifications = pathname === '/notifications';
  const isOnConversations = pathname === '/conversations';
  const isCompact = useIsCompactDesktop();

  return (
    <View style={styles.container}>
      {/* Left: cream badge with yellow FE logo + text */}
      <ReturnButton compact={isCompact} />

      {/* Center: large script logotype */}
      {isCompact ? (
        <>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.monogramWrap} onPress={() => router.replace('/(tabs)')}>
            <Image
              source={require('@/assets/images/fegc-monogram-black.png')}
              style={styles.monogram}
              resizeMode="contain"
            />
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.center} onPress={() => router.replace('/(tabs)')}>
          <Image
            source={require('@/assets/images/FriedEggGolfClub_Horizontal_Black.png')}
            style={styles.logotype}
            resizeMode="contain"
          />
        </Pressable>
      )}

      {/* Right: hamburger, bell, chat, avatar — all inside cream badge */}
      <View style={styles.rightGroup}>
        <HoverHamburger onPress={onMenuPress} />
        <HoverIcon onPress={() => router.push('/notifications')}>
          <NotificationsIcon size={48} color={Colors.black} />
          {hasUnreadNotifications && !isOnNotifications && (
            <View style={styles.badge} />
          )}
        </HoverIcon>
        {isPaidMember && (
          <HoverIcon onPress={() => router.push('/conversations')}>
            <MessagingIcon size={48} color={Colors.black} />
            {hasUnreadMessages && !isOnConversations && (
              <View style={styles.badge} />
            )}
          </HoverIcon>
        )}
        <HoverIcon onPress={() => router.push('/profile')}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={Colors.black} />
            </View>
          )}
        </HoverIcon>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 88,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  leftBadge: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.black,
    overflow: 'hidden',
  },
  leftBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 3,
    paddingRight: 12,
    paddingVertical: 3,
  },
  leftBadgeCompact: {
    padding: 3,
  },
  logoWrap: {
    backgroundColor: Colors.feYellow,
    borderRadius: 6,
    padding: 4,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 3,
  },
  returnTextClip: {
    height: TEXT_LINE_HEIGHT,
  },
  returnText: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: TEXT_LINE_HEIGHT,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  logotype: {
    height: 44,
    width: 320,
  },
  monogramWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  } as any,
  monogram: {
    height: 40,
    width: 40,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.black,
    paddingHorizontal: 6,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  iconBtn: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  iconBtnInner: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.accentRed,
    borderWidth: 1.5,
    borderColor: Colors.cream,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
