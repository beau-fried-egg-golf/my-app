import { useState } from 'react';
import { Image, Linking, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { ClubhouseIcon } from '@/components/icons/CustomIcons';

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="systemChromeMaterial"
        style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}
      />
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFFFFF' },
      ]}
    />
  );
}

export default function ExperiencesTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [showMore, setShowMore] = useState(false);

  const TAB_BAR_WIDTH = 200;

  const isExperiencesHome = pathname === '/' || pathname === '';
  const isReservations = pathname === '/reservations';
  const showBar = isExperiencesHome || isReservations;

  if (!showBar) return null;

  return (
    <>
      <View style={[styles.tabBar, { bottom: Math.max(16, insets.bottom), transform: [{ translateX: (screenWidth - TAB_BAR_WIDTH) / 2 }] }]}>
        <TabBarBackground />
        <Pressable
          style={styles.tabBarItem}
          onPress={() => router.replace('/(experiences)/')}
        >
          <View style={styles.tabIconBox}>
            <Ionicons name={isExperiencesHome ? 'compass' : 'compass-outline'} size={24} color={isExperiencesHome ? Colors.orange : Colors.gray} />
          </View>
        </Pressable>
        <Pressable
          style={styles.tabBarItem}
          onPress={() => router.push('/(experiences)/reservations')}
        >
          <View style={styles.tabIconBox}>
            <Ionicons name={isReservations ? 'receipt' : 'receipt-outline'} size={24} color={isReservations ? Colors.orange : Colors.gray} />
          </View>
        </Pressable>
        <Pressable
          style={styles.tabBarItem}
          onPress={() => setShowMore(true)}
        >
          <View style={styles.tabIconBox}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.gray} />
          </View>
        </Pressable>
      </View>

      <Modal
        visible={showMore}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMore(false)}
      >
        <Pressable style={styles.moreBackdrop} onPress={() => setShowMore(false)}>
          <View style={styles.moreSheet}>
            <Pressable
              style={styles.moreOption}
              onPress={() => {
                setShowMore(false);
                if (router.canGoBack()) {
                  router.dismissAll();
                }
                router.replace('/(tabs)/');
              }}
            >
              <View style={[styles.moreIconBox, { backgroundColor: Colors.orange }]}>
                <ClubhouseIcon size={28} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moreOptionTitle}>Community</Text>
                <Text style={styles.moreOptionDesc}>Back to the clubhouse</Text>
              </View>
              <Ionicons name="repeat-outline" size={20} color={Colors.gray} style={{ marginLeft: 'auto' }} />
            </Pressable>
            <View style={styles.moreSeparator} />
            <Pressable
              style={styles.moreOption}
              onPress={() => {
                setShowMore(false);
                Linking.openURL('https://proshop.thefriedegg.com/');
              }}
            >
              <View style={styles.moreIconBox}>
                <Ionicons name="bag-handle-outline" size={22} color={Colors.black} />
              </View>
              <View>
                <Text style={styles.moreOptionTitle}>Pro Shop</Text>
                <Text style={styles.moreOptionDesc}>Shop Fried Egg gear</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.gray} style={{ marginLeft: 'auto' }} />
            </Pressable>
            <View style={styles.moreSeparator} />
            <Pressable
              style={styles.moreOption}
              onPress={() => {
                setShowMore(false);
                Linking.openURL('https://www.thefriedegg.com/trip-planning');
              }}
            >
              <View style={styles.moreIconBox}>
                <Ionicons name="airplane-outline" size={22} color={Colors.black} />
              </View>
              <View>
                <Text style={styles.moreOptionTitle}>International Trip Planning</Text>
                <Text style={styles.moreOptionDesc}>Plan your next golf trip abroad</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Colors.gray} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Floating pill tab bar (matches Community) ──
  tabBar: {
    position: 'absolute',
    bottom: 16,
    width: 200,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarItem: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── More modal (matches Community) ──
  moreBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  moreSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  moreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  moreIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOptionTitle: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  moreOptionDesc: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  moreSeparator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginLeft: 58,
  },
});
