import { useState, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { verifyEmailCode, sendVerificationCode } = useStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canSubmit = code.length === 6;

  async function handleVerify() {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await verifyEmailCode(code);
      if (result.success) {
        router.replace('/onboarding');
      } else {
        setError(result.error ?? 'Invalid code');
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setError('');
    try {
      const result = await sendVerificationCode();
      if (result.error) {
        setError(result.error);
      } else {
        setResendCooldown(60);
        cooldownRef.current = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              if (cooldownRef.current) clearInterval(cooldownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  function handleCodeChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <View style={styles.header}>
            <LetterSpacedHeader text="Verify Your Email" size={28} />
            <Text style={styles.subtitle}>We sent a 6-digit code to your email address</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="000000"
              placeholderTextColor={Colors.gray}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!canSubmit || loading) && styles.buttonDisabled,
              pressed && canSubmit && !loading && styles.buttonPressed,
            ]}
            onPress={handleVerify}
          >
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
          </Pressable>

          <Pressable style={styles.resendButton} onPress={handleResend} disabled={resending || resendCooldown > 0}>
            <Text style={styles.resendText}>
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't receive the code? Resend"}
            </Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
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
  field: {
    gap: 6,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 28,
    color: Colors.black,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    letterSpacing: 12,
    textAlign: 'center',
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
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  resendText: {
    fontSize: 15,
    color: Colors.gray,
    fontFamily: Fonts!.sans,
  },
});
