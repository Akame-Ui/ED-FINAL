import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { RelativePathString } from 'expo-router';

import AppButton from '@/components/AppButton';
import { ErrorNotice, SuccessNotice } from '@/components/feedback';
import { UiIcon } from '@/components/UiIcon';
import { COLORS } from '@/constants/colors';
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
    // Input validation (mirrored by RLS + constraints server-side).
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandTile}>
            <UiIcon name="qr" size={28} color={COLORS.textOnPrimary} />
          </View>
          <Text style={styles.eyebrow}>QR ATTENDANCE</Text>
        </View>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Register to start recording attendance.</Text>
        {success ? (
          <SuccessNotice title="Check your email" detail="Confirm your account, then return to sign in." />
        ) : (
          <>
            <Text style={styles.label}>Full name</Text>
            <View style={styles.inputWrap}>
              <UiIcon name="user" size={17} color={COLORS.textSecondary} />
              <TextInput value={fullName} onChangeText={setFullName} placeholder="Your name" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} autoCapitalize="words" editable={!loading} />
            </View>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <UiIcon name="mail" size={17} color={COLORS.textSecondary} />
              <TextInput value={email} onChangeText={setEmail} placeholder="you@school.edu" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
            </View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <UiIcon name="lock" size={17} color={COLORS.textSecondary} />
              <TextInput value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor={COLORS.textSecondary} style={styles.inputInner} secureTextEntry editable={!loading} />
            </View>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <UiIcon name="lock" size={17} color={COLORS.textSecondary} />
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
                    size={16}
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
            {loading ? <ActivityIndicator color={COLORS.accent} style={styles.loader} /> : <View style={styles.btnWrap}><AppButton theme="primary" title="Sign up" icon="register" onPress={handleRegister} fullWidth /></View>}
          </>
        )}
        <Link href={'/login' as RelativePathString} asChild><Pressable><Text style={styles.link}>Already have an account? Sign in</Text></Pressable></Link>
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
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  label: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 12 },
  inputInner: { flex: 1, color: COLORS.textPrimary, fontSize: 16, paddingVertical: 12 },
  errorWrap: { marginTop: 14 },
  btnWrap: { marginTop: 18 },
  loader: { marginVertical: 18 },
  link: { color: COLORS.primary, textAlign: 'center', fontWeight: '700', marginTop: 24, minHeight: 44 },
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, minHeight: 52, backgroundColor: COLORS.card },
  roleChipActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}14` },
  roleChipText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  roleChipTextActive: { color: COLORS.primary, fontWeight: '800' },
});
