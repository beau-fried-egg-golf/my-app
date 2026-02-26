import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useStore();
  const isDesktop = useIsDesktop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  async function handleLogin() {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await signIn(email.trim(), password);
      if (authError) {
        setError(authError.message);
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            {isDesktop ? (
              <>
                <LetterSpacedHeader text="Welcome to The" size={28} />
                <View style={{ height: 6 }} />
                <LetterSpacedHeader text="Fried Egg Golf Club" size={28} />
              </>
            ) : (
              <LetterSpacedHeader text="Welcome to The Fried Egg Golf Club" size={28} />
            )}
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.gray}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={Colors.gray}
                secureTextEntry
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>
                <Text style={styles.forgotBold}>Forgot password?</Text>
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!canSubmit || loading) && styles.buttonDisabled,
              pressed && canSubmit && !loading && styles.buttonPressed,
            ]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.outlineButtonText}>Create Account</Text>
          </Pressable>
          <Text style={styles.memberNote}>
            If you're a FEGC member, use the email associated with your membership.
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 12,
    fontFamily: Fonts!.sans,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontFamily: Fonts!.sans,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts!.sans,
  },
  button: {
    backgroundColor: Colors.orange,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'default' as any,
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
  forgotText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
    marginTop: 8,
  },
  forgotBold: {
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  outlineButtonPressed: {
    opacity: 0.6,
  },
  outlineButtonText: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  memberNote: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});
