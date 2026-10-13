import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { RelativePathString } from 'expo-router';

import AppButton from '@/components/AppButton';
import { ErrorNotice, SuccessNotice } from '@/components/feedback';
import { UiIcon } from '@/components/UiIcon';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOW } from '@/constants/ui';
import { signUp } from '@/lib/auth';
import { sanitize, validateEmail, validatePassword, validateRequired } from '@/lib/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    const nameError = validateRequired(fullName, 'Full name', 100);
    if (nameError) return setError(nameError);
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(email.trim(), password, {
        full_name: sanitize(fullName, 100),
        role,
      });
      if (authError) setError(authError.message);
      else if (data.session) router.replace('/(tabs)');
      else setSuccess(true);
    } catch {
      setError('Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.brandTile}>
          <UiIcon name="qr" size={30} color={COLORS.textOnPrimary} />
        </View>
        <Text style={styles.eyebrow}>QR ATTENDANCE</Text>
        <Text style={styles.heroTitle}>Create account</Text>
        <Text style={styles.heroSub}>One account for check-ins, events and reports.</Text>
      </View>

      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          {success ? (
            <>
              <SuccessNotice title="Check your email" detail="Confirm your account, then return to sign in." />
              <View style={styles.btnWrap}>
                <AppButton title="Back to sign in" icon="chevron-left" variant="secondary" fullWidth onPress={() => router.replace('/login' as RelativePathString)} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Full name</Text>
              <View style={styles.inputWrap}>
                <UiIcon name="user" size={18} color={COLORS.textSecondary} />
                <TextInput value={fullName} onChangeText={setFullName} placeholder="Your name" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} autoCapitalize="words" editable={!loading} />
              </View>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <UiIcon name="mail" size={18} color={COLORS.textSecondary} />
                <TextInput value={email} onChangeText={setEmail} placeholder="you@school.edu" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
              </View>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <UiIcon name="lock" size={18} color={COLORS.textSecondary} />
                <TextInput value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} secureTextEntry editable={!loading} />
              </View>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.inputWrap}>
                <UiIcon name="lock" size={18} color={COLORS.textSecondary} />
                <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} secureTextEntry editable={!loading} />
              </View>
              <Text style={styles.label}>I am a...</Text>
              <View style={styles.roleRow}>
                {(['student', 'teacher', 'admin'] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setRole(option)}
                    style={[styles.roleChip, role === option && styles.roleChipActive]}
                    disabled={loading}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === option }}
                  >
                    <UiIcon
                      name={option === 'student' ? 'user' : option === 'teacher' ? 'school' : 'shield'}
                      size={17}
                      color={role === option ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text style={[styles.roleChipText, role === option && styles.roleChipTextActive]}>
                      {option === 'student' ? 'Student' : option === 'teacher' ? 'Teacher' : 'Admin'}
                    </Text>
                  </Pressable>
                ))}
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
                  <AppButton theme="primary" title="Sign up" icon="register" onPress={handleRegister} fullWidth />
                )}
              </View>
            </>
          )}
          <Link href={'/login' as RelativePathString} asChild>
            <Pressable style={styles.linkBtn}>
              <Text style={styles.link}>Already have an account? <Text style={styles.linkStrong}>Sign in</Text></Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primaryDeep },
  hero: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24, gap: 6 },
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
    paddingBottom: 32,
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
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    minHeight: 76,
    backgroundColor: COLORS.card,
    ...SHADOW.card,
  },
  roleChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  roleChipText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 12 },
  roleChipTextActive: { color: COLORS.primary, fontWeight: '800' },
});
