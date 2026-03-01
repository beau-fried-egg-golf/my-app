import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface LinkPromptModalProps {
  visible: boolean;
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

export default function LinkPromptModal({ visible, onSubmit, onCancel }: LinkPromptModalProps) {
  const [url, setUrl] = useState('');

  // Web: use window.prompt for simplicity
  if (Platform.OS === 'web') {
    if (visible) {
      const result = window.prompt('Enter URL:');
      if (result) {
        // Ensure the URL has a protocol
        const normalized = result.match(/^https?:\/\//) ? result : `https://${result}`;
        setTimeout(() => onSubmit(normalized), 0);
      } else {
        setTimeout(() => onCancel(), 0);
      }
    }
    return null;
  }

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const normalized = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;
    onSubmit(normalized);
    setUrl('');
  };

  const handleCancel = () => {
    setUrl('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Insert Link</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com"
            placeholderTextColor={Colors.gray}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.buttons}>
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, !url.trim() && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!url.trim()}
            >
              <Text style={styles.submitText}>Insert</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: 300,
  },
  title: {
    fontFamily: Fonts?.sansBold,
    fontWeight: FontWeights.bold,
    fontSize: 16,
    color: Colors.black,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    fontFamily: Fonts?.sans,
    color: Colors.black,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: Fonts?.sans,
    fontSize: 15,
    color: Colors.gray,
  },
  submitBtn: {
    backgroundColor: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: Fonts?.sans,
    fontSize: 15,
    color: Colors.white,
  },
});
