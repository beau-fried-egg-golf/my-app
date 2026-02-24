import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

export default function GuestBadge({ style }: { style?: StyleProp<ViewStyle> } = {}) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>Guest</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
  },
});
