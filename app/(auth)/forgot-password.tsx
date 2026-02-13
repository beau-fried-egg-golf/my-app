import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const canSubmit = email.trim().length > 0;

  async function handleReset() {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await resetPassword(email.trim());
      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
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
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.black} />
        </Pressable>

        <View style={styles.header}>
          <LetterSpacedHeader text="Reset Password" size={28} />
          <Text style={styles.subtitle}>
            Enter your email and we'll send a reset link
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Check your email for a reset link
            </Text>
            <Pressable style={styles.linkButton} onPress={() => router.back()}>
              <Text style={styles.linkText}>
                <Text style={styles.linkBold}>Back to Sign In</Text>
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
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
                  autoFocus
                  onSubmitEditing={handleReset}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (!canSubmit || loading) && styles.buttonDisabled,
                pressed && canSubmit && !loading && styles.buttonPressed,
              ]}
              onPress={handleReset}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
  },
  backButton: {
    marginBottom: 24,
    alignSelf: 'flex-start',
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
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 16,
    fontFamily: Fonts!.sans,
    textAlign: 'center',
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
  linkButton: {
    marginTop: 4,
    cursor: 'pointer' as any,
  },
  linkText: {
    fontSize: 15,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
  linkBold: {
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
});
