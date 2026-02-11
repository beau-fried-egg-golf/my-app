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
import { Colors } from '@/constants/theme';
import { useStore } from '@/data/store';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useStore();
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
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
              autoFocus
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

        <Pressable style={styles.linkButton} onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </Pressable>
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.black,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginTop: 4,
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
    fontWeight: '600',
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
  },
  button: {
    backgroundColor: Colors.black,
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
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  linkText: {
    fontSize: 15,
    color: Colors.gray,
  },
  linkBold: {
    fontWeight: '600',
    color: Colors.black,
  },
});
