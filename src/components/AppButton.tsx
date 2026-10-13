import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '@/constants/colors';
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

// Single button system: 52px min-height, icon + label, smooth press.
// theme="primary" kept for backwards compat — prefer variant going forward.
export default function AppButton({
  title,
  theme,
  variant = 'secondary',
  icon,
  onPress,
  disabled,
  loading,
  fullWidth,
}: Props) {
  const resolved: 'primary' | 'secondary' | 'danger' | 'ghost' =
    theme === 'primary' ? 'primary' : variant;
  const name = resolveIcon(icon);
  const busy = loading || disabled;
  const iconColor =
    resolved === 'primary' ? COLORS.textOnPrimary : resolved === 'danger' ? '#FFFFFF' : COLORS.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: loading }}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.base,
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
        <UiIcon name={name} size={18} color={iconColor} />
      ) : null}
      <Text
        style={[
          styles.label,
          resolved === 'primary' && styles.primaryLabel,
          resolved === 'danger' && styles.dangerLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fullWidth: { alignSelf: 'stretch' },
  primary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  danger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  label: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  primaryLabel: { color: COLORS.textOnPrimary, fontWeight: '800' },
  dangerLabel: { color: '#FFFFFF', fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
