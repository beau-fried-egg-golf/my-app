import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { ClubhouseIcon, CoursesIcon, MeetupsIcon, GroupsIcon, MembersIcon } from '@/components/icons/CustomIcons';

const DT_TEXT_HEIGHT = 18;
const DT_SCROLL_GAP = 14;

interface DesktopDropdownMenuProps {
  visible: boolean;
  onClose: () => void;
}

function HoverItem({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  function onHoverIn() { Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start(); }
  function onHoverOut() { Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start(); }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(DT_TEXT_HEIGHT + DT_SCROLL_GAP)] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.cream, Colors.white] });
  return (
    <Animated.View style={[styles.itemWrap, { backgroundColor: bgColor }]}>
      <Pressable onPress={onPress} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={styles.itemInner}>
        <View style={styles.itemIcon}>{icon}</View>
        <View style={{ height: DT_TEXT_HEIGHT }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Text style={styles.itemText}>{label}</Text>
            <View style={{ height: DT_SCROLL_GAP }} />
            <Text style={styles.itemText}>{label}</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DesktopDropdownMenu({ visible, onClose }: DesktopDropdownMenuProps) {
  const router = useRouter();

  if (!visible) return null;

  function nav(path: string) {
    onClose();
    if (path === '/') {
      router.navigate('/(tabs)' as any);
    } else {
      router.push(path as any);
    }
  }

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.menu}>
        <HoverItem label="HOME" icon={<ClubhouseIcon size={38} color={Colors.black} />} onPress={() => nav('/')} />
        <HoverItem label="COURSES" icon={<CoursesIcon size={38} color={Colors.black} />} onPress={() => nav('/courses')} />
        <HoverItem label="MEETUPS" icon={<MeetupsIcon size={38} color={Colors.black} />} onPress={() => nav('/meetups')} />
        <HoverItem label="GROUPS" icon={<GroupsIcon size={38} color={Colors.black} />} onPress={() => nav('/groups')} />
        <HoverItem label="MEMBERS" icon={<MembersIcon size={38} color={Colors.black} />} onPress={() => nav('/members')} />

        <View style={styles.divider} />
        <HoverItem label="PROFILE" icon={<Ionicons name="person-outline" size={16} color={Colors.black} />} onPress={() => nav('/profile')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  } as any,
  menu: {
    position: 'fixed' as any,
    top: 86,
    right: 24,
    width: 215,
    backgroundColor: Colors.cream,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.black,
    paddingVertical: 10,
    zIndex: 9999,
  } as any,
  itemWrap: {
    marginHorizontal: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: DT_SCROLL_GAP,
    paddingLeft: 50,
  },
  itemIcon: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.black,
    letterSpacing: 0.5,
    lineHeight: DT_TEXT_HEIGHT,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 10,
    marginVertical: 8,
  },
});
