import type { RelativePathString } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UiIcon } from '@/components/UiIcon';
import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOW } from '@/constants/ui';
import { signOut, useAuth } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const nextProfile = await getProfile(user.id);
    setProfile(nextProfile);
    setDraftName(nextProfile?.full_name ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    router.replace('/login' as RelativePathString);
  };

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, { full_name: draftName.trim() });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    setProfile((current) => current ? { ...current, full_name: draftName.trim() } : current);
    setEditing(false);
  };

  const initial = (profile?.full_name ?? user?.email ?? '?').trim().charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="ACCOUNT" title="My profile" subtitle="Your identity across every check-in." />
      {/* Modern identity hero */}
      <View style={styles.heroCard}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.identityName} numberOfLines={1}>
            {profile?.full_name || 'Add your name'}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <UiIcon name={profile?.role === 'teacher' ? 'school' : profile?.role === 'admin' ? 'shield' : 'user'} size={13} color={COLORS.primary} />
            <Text style={styles.roleBadgeText}>{profile?.role ?? 'student'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.card}>

        <View style={styles.row}>
          <UiIcon name="user" size={17} color={COLORS.textSecondary} />
          <Text style={styles.label}>Name</Text>
        </View>
        {editing ? (
          <View style={styles.nameEditRow}>
            <TextInput value={draftName} onChangeText={setDraftName} style={styles.nameInput} placeholder="Your name" placeholderTextColor={COLORS.textSecondary} editable={!saving} />
            <Pressable onPress={handleSaveName} disabled={saving} style={styles.saveButton} accessibilityRole="button">
              <Text style={styles.saveButtonText}>{saving ? '…' : 'Save'}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} style={styles.nameRow} accessibilityRole="button">
            <Text style={styles.value}>{profile?.full_name || 'Tap to add your name'}</Text>
            <View style={styles.editPill}>
              <UiIcon name="edit" size={13} color={COLORS.primary} />
              <Text style={styles.editHint}>Edit</Text>
            </View>
          </Pressable>
        )}
        <View style={styles.row}>
          <UiIcon name="mail" size={17} color={COLORS.textSecondary} />
          <Text style={styles.label}>Email</Text>
        </View>
        <Text style={styles.value}>{user?.email ?? 'Unknown account'}</Text>
        <View style={styles.row}>
          <UiIcon name="shield" size={17} color={COLORS.textSecondary} />
          <Text style={styles.label}>User ID</Text>
        </View>
        <Text style={styles.id}>{user?.id ?? 'Not available'}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.accent} />
      ) : (
        <AppButton title="Sign out" icon="logout" variant="danger" fullWidth onPress={handleSignOut} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 24 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.primaryDeep,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    ...SHADOW.pop,
  },
  avatarRing: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF22', borderWidth: 1, borderColor: '#FFFFFF44', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.primaryDeep, fontSize: 24, fontWeight: '800' },
  identityText: { flex: 1, gap: 3 },
  identityName: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  identityEmail: { color: '#A7F3D0', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: 20, marginBottom: 20, gap: 6, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  value: { color: COLORS.textPrimary, fontSize: 16, flex: 1 },
  id: { color: COLORS.textSecondary, fontSize: 11 },
  roleBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFFFFF1F', borderWidth: 1, borderColor: '#FFFFFF33', marginTop: 4 },
  roleBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44 },
  editPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.primary}14`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  nameInput: { flex: 1, minHeight: 52, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.textPrimary, paddingHorizontal: 12 },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 18, minHeight: 52, justifyContent: 'center' },
  saveButtonText: { color: COLORS.textOnPrimary, fontWeight: '800' },
  editHint: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
});
