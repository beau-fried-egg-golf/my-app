import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

const EMOJI_LIST = [
  // Smileys
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔', '😏',
  '😅', '😬', '🙄', '😢', '😭', '🤯', '🥳', '🤗', '😤', '😡',
  // Gestures
  '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤙', '💪', '👊', '🫡',
  // Hearts & symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '🔥',
  // Golf & sports
  '⛳', '🏌️', '🏆', '🥇', '🎯', '🍺', '☀️', '🌧️', '💨', '🦅',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid}>
        {EMOJI_LIST.map((emoji) => (
          <Pressable
            key={emoji}
            style={styles.emojiButton}
            onPress={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    maxHeight: 200,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 2,
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emoji: {
    fontSize: 24,
  },
});
