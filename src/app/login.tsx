import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { RelativePathString } from 'expo-router';

import AppButton from '@/components/AppButton';
import { ErrorNotice } from '@/components/feedback';
import { UiIcon } from '@/components/UiIcon';
import { COLORS } from '@/constants/colors';
import { signIn } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await signIn(email.trim(), password);
      if (authError) setError(authError.message);
      else router.replace('/(tabs)');
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandTile}>
            <UiIcon name="qr" size={28} color={COLORS.textOnPrimary} />
          </View>
          <Text style={styles.eyebrow}>QR ATTENDANCE</Text>
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to record your attendance.</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <UiIcon name="mail" size={17} color={COLORS.textSecondary} />
          <TextInput value={email} onChangeText={setEmail} placeholder="you@school.edu" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
        </View>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <UiIcon name="lock" size={17} color={COLORS.textSecondary} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} secureTextEntry editable={!loading} />
        </View>

        {error && (
          <View style={styles.errorWrap}>
            <ErrorNotice message={error} />
          </View>
        )}
        {loading ? <ActivityIndicator color={COLORS.accent} style={styles.loader} /> : <View style={styles.btnWrap}><AppButton theme="primary" title="Sign in" icon="login" onPress={handleLogin} fullWidth /></View>}

        <Link href={'/register' as RelativePathString} asChild>
          <Pressable><Text style={styles.link}>Don't have an account? Sign up</Text></Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  brandTile: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 8 },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  label: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 12 },
  inputInner: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingVertical: 12 },
  errorWrap: { marginTop: 14 },
  btnWrap: { marginTop: 18 },
  loader: { marginVertical: 18 },
  link: { color: COLORS.primary, textAlign: 'center', fontWeight: '700', marginTop: 24, minHeight: 44 },
});
