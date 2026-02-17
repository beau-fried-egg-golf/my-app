import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface TutorialPopupProps {
  storageKey: string;
  title: string;
  paragraphs: string[];
  buttonLabel?: string;
}

export default function TutorialPopup({ storageKey, title, paragraphs, buttonLabel = 'Got it' }: TutorialPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(val => {
      if (val !== 'true') setVisible(true);
    });
  }, [storageKey]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    AsyncStorage.setItem(storageKey, 'true');
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Image
            source={require('@/assets/images/FEGC App Icon.png')}
            style={styles.icon}
          />
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.body} bounces={false}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
          </ScrollView>
          <Pressable style={styles.button} onPress={dismiss}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    maxHeight: 260,
    width: '100%',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.darkGray,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.black,
    borderRadius: 6,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
});
