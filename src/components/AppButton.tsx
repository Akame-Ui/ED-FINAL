import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOW } from '@/constants/ui';
import { UiIcon, type UiIconName } from '@/components/UiIcon';

type LegacyIcon = 'camera' | 'refresh' | 'login' | 'register' | 'logout';
type Props = {
  title: string;
  theme?: 'primary';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LegacyIcon | UiIconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  small?: boolean;
};

const LEGACY_MAP: Record<LegacyIcon, UiIconName> = {
  camera: 'camera',
  refresh: 'refresh',
  login: 'chevron-right',
  register: 'plus',
  logout: 'logout',
};

function resolveIcon(icon?: LegacyIcon | UiIconName): UiIconName | null {
  if (!icon) return null;
  return (LEGACY_MAP as Record<string, UiIconName>)[icon] ?? (icon as UiIconName);
}

// Modern button: taller, rounder, primary carries a soft emerald shadow.
export default function AppButton({
  title,
  theme,
  variant = 'secondary',
  icon,
  onPress,
  disabled,
  loading,
  fullWidth,
  small,
}: Props) {
  const resolved: 'primary' | 'secondary' | 'danger' | 'ghost' =
    theme === 'primary' ? 'primary' : variant;
  const name = resolveIcon(icon);
  const busy = loading || disabled;
  const iconColor =
    resolved === 'primary' ? COLORS.textOnPrimary : resolved === 'danger' ? '#FFFFFF' : resolved === 'ghost' ? COLORS.primary : COLORS.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: loading }}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        fullWidth && styles.fullWidth,
        resolved === 'primary' && styles.primary,
        resolved === 'danger' && styles.danger,
        resolved === 'ghost' && styles.ghost,
        resolved === 'secondary' && styles.secondary,
        pressed && !busy && styles.pressed,
        busy && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : name ? (
        <UiIcon name={name} size={small ? 16 : 19} color={iconColor} />
      ) : null}
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          resolved === 'primary' && styles.primaryLabel,
          resolved === 'danger' && styles.dangerLabel,
          resolved === 'ghost' && styles.ghostLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  small: { minHeight: 44, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 10 },
  fullWidth: { alignSelf: 'stretch' },
  primary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOW.pop },
  secondary: { backgroundColor: COLORS.card, borderColor: COLORS.border, ...SHADOW.card },
  danger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  ghost: { backgroundColor: COLORS.primarySoft, borderColor: `${COLORS.primary}26` },
  label: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 0.1 },
  labelSmall: { fontSize: 14 },
  primaryLabel: { color: COLORS.textOnPrimary },
  dangerLabel: { color: '#FFFFFF' },
  ghostLabel: { color: COLORS.primary },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
});
