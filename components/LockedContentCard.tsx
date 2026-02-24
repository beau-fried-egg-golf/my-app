import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

export default function LockedContentCard() {
  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={20} color={Colors.gray} style={styles.icon} />
      <Text style={styles.text}>Available to FEGC members</Text>
      <Pressable onPress={() => Linking.openURL('https://www.thefriedegg.com/membership')}>
        <Text style={styles.link}>Become a member</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 8,
  },
  icon: {
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textDecorationLine: 'underline',
  },
});
