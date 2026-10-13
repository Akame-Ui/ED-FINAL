import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { RelativePathString } from 'expo-router';

import AppButton from '@/components/AppButton';
import { ErrorNotice } from '@/components/feedback';
import { UiIcon } from '@/components/UiIcon';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOW } from '@/constants/ui';
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
    <View style={styles.root}>
      {/* Modern brand hero */}
      <View style={styles.hero}>
        <View style={styles.brandTile}>
          <UiIcon name="qr" size={30} color={COLORS.textOnPrimary} />
        </View>
        <Text style={styles.eyebrow}>QR ATTENDANCE</Text>
        <Text style={styles.heroTitle}>Welcome back</Text>
        <Text style={styles.heroSub}>Sign in to record your attendance in seconds.</Text>
      </View>

      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <UiIcon name="mail" size={18} color={COLORS.textSecondary} />
            <TextInput value={email} onChangeText={setEmail} placeholder="you@school.edu" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
          </View>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <UiIcon name="lock" size={18} color={COLORS.textSecondary} />
            <TextInput value={password} onChangeText={setPassword} placeholder="Your password" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} secureTextEntry editable={!loading} />
          </View>

          {error && (
            <View style={styles.errorWrap}>
              <ErrorNotice message={error} />
            </View>
          )}
          <View style={styles.btnWrap}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="large" />
            ) : (
              <AppButton theme="primary" title="Sign in" icon="login" onPress={handleLogin} fullWidth />
            )}
          </View>

          <Link href={'/register' as RelativePathString} asChild>
            <Pressable style={styles.linkBtn}>
              <Text style={styles.link}>Don&apos;t have an account? <Text style={styles.linkStrong}>Sign up</Text></Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primaryDeep },
  hero: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 28, gap: 6 },
  brandTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF1F',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eyebrow: { color: '#A7F3D0', fontSize: 12, fontWeight: '800', letterSpacing: 1.6 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: '#D1FAE5', fontSize: 15, lineHeight: 22 },
  sheetWrap: { flex: 1 },
  sheet: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 26,
    gap: 2,
    ...SHADOW.sheet,
  },
  label: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 7, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    ...SHADOW.card,
  },
  inputInner: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingVertical: 12 },
  errorWrap: { marginTop: 16 },
  btnWrap: { marginTop: 22 },
  linkBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  link: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  linkStrong: { color: COLORS.primary, fontWeight: '800' },
});
