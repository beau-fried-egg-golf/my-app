import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface LetterSpacedHeaderProps {
  text: string;
  size?: number;
}

export default function LetterSpacedHeader({ text, size = 32 }: LetterSpacedHeaderProps) {
  const words = text.toUpperCase().split(' ');

  return (
    <View style={styles.container}>
      {words.map((word, wi) => (
        <View key={`word-${wi}`} style={styles.wordGroup}>
          {word.split('').map((letter, li) => (
            <View
              key={`${letter}-${wi}-${li}`}
              style={[
                styles.letterBox,
                {
                  width: size * 0.75,
                  height: size * 1.1,
                },
              ]}
            >
              <Text
                style={[
                  styles.letter,
                  {
                    fontSize: size * 0.65,
                    lineHeight: size * 1.1,
                    fontFamily: Fonts!.sansBold,
                    fontWeight: FontWeights.bold,
                  },
                ]}
              >
                {letter}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'flex-start',
  },
  wordGroup: {
    flexDirection: 'row',
    gap: 2,
  },
  letterBox: {
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: Colors.black,
    textAlign: 'center',
  },
});
