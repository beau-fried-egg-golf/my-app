import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import PlatformPressable from '@/components/PlatformPressable';

interface Action {
  label: string;
  icon: string;
  onPress: () => void;
}

interface Props {
  placeholder: string;
  onPlaceholderPress: () => void;
  actions?: Action[];
}

export default function DesktopCreateBar({ placeholder, onPlaceholderPress, actions }: Props) {
  const { user } = useStore();

  return (
    <View
      style={styles.container}
      {...(Platform.OS === 'web' ? { dataSet: { card: true } } as any : {})}
    >
      <View style={styles.topRow}>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color={Colors.gray} />
          </View>
        )}
        <PlatformPressable style={styles.pill} onPress={onPlaceholderPress}>
          <Text style={styles.pillText}>{placeholder}</Text>
        </PlatformPressable>
      </View>
      {actions && actions.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.actionsRow}>
            {actions.map((action) => (
              <PlatformPressable key={action.label} style={styles.actionBtn} onPress={action.onPress}>
                <Ionicons name={action.icon as any} size={18} color={Colors.gray} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </PlatformPressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderWidth: Platform.OS === 'web' ? 1.5 : 1,
    borderColor: Platform.OS === 'web' ? Colors.webBlack : Colors.lightGray,
    borderRadius: Platform.OS === 'web' ? 8 : 10,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pillText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.gray,
  },
});
