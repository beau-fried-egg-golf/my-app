import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { useGoBack } from '@/hooks/useGoBack';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface DetailHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function DetailHeader({ title, onBack, right }: DetailHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <Pressable onPress={onBack ?? goBack} style={styles.desktopBack}>
          <Ionicons name="chevron-back" size={16} color={Colors.black} />
          <Text style={styles.desktopBackText}>Back</Text>
        </Pressable>
        <View style={styles.desktopTitleContainer}>
          <LetterSpacedHeader text={title} size={28} />
        </View>
        {right && <View style={styles.rightSlot}>{right}</View>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 16 : insets.top }]}>
      <Pressable onPress={onBack ?? goBack} style={styles.backArrow}>
        <Ionicons name="chevron-back" size={20} color={Colors.black} />
      </Pressable>
      <View style={styles.titleContainer}>
        <LetterSpacedHeader text={title} size={32} />
      </View>
      {right && <View style={styles.rightSlot}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  backArrow: {
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  rightSlot: {
    marginLeft: 'auto',
  },
  desktopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  desktopBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  desktopBackText: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  desktopTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
});
