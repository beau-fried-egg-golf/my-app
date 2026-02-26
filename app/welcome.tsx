import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isPaidMember } = useStore();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LetterSpacedHeader text="Welcome to The Fried Egg Golf Club" size={28} />

        {isPaidMember ? (
          <Text style={styles.body}>We're glad to have you as a member.</Text>
        ) : (
          <>
            <Text style={styles.body}>
              Though you're not a member, we love having guests here. Note that there are some things we reserve solely for members.
            </Text>
            <Pressable onPress={() => Linking.openURL('https://www.thefriedegg.com/membership')}>
              <Text style={styles.link}>Learn about membership</Text>
            </Pressable>
            <Text style={styles.body}>We hope you enjoy FEGC.</Text>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  body: {
    fontSize: 16,
    fontFamily: Fonts!.sans,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  link: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.orange,
    textDecorationLine: 'underline',
    marginTop: 12,
  },
  button: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
});
