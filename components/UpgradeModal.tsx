import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';

export default function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal } = useStore();

  return (
    <Modal visible={showUpgradeModal} transparent animationType="fade" onRequestClose={() => setShowUpgradeModal(false)}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>FEGC Membership Required</Text>
          <Text style={styles.body}>
            This feature is available to Fried Egg Golf Club members.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              setShowUpgradeModal(false);
              Linking.openURL('https://www.thefriedegg.com/membership');
            }}
          >
            <Text style={styles.primaryBtnText}>LEARN MORE</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => setShowUpgradeModal(false)}
          >
            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
  },
  secondaryBtn: {
    paddingVertical: 8,
  },
  secondaryBtnText: {
    color: Colors.gray,
    fontSize: 14,
    fontFamily: Fonts!.sans,
  },
});
