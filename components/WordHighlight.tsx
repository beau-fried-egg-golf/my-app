import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface WordHighlightProps {
  words: string[];
  size?: number;
}

export default function WordHighlight({ words, size = 14 }: WordHighlightProps) {
  return (
    <View style={styles.container}>
      {words.map((word, i) => (
        <View key={`${word}-${i}`} style={styles.wordBox}>
          <Text
            style={[
              styles.word,
              {
                fontSize: size,
                fontFamily: Fonts!.sansBold,
                fontWeight: FontWeights.bold,
              },
            ]}
          >
            {word.toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  wordBox: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  word: {
    color: Colors.black,
  },
});
