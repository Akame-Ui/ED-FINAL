import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS } from '@/constants/ui';
import { UiIcon, type UiIconName } from '@/components/UiIcon';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_BG: Record<Tone, string> = {
  primary: COLORS.primarySoft,
  success: COLORS.successSoft,
  warning: COLORS.warningSoft,
  danger: COLORS.dangerSoft,
  neutral: COLORS.surface,
};

const TONE_FG: Record<Tone, string> = {
  primary: COLORS.primary,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
  neutral: COLORS.textSecondary,
};

// Modern icon tile — rounded tinted square behind every list / form icon.
// Replaces bare icons floating on white.
export function IconTile({
  name,
  tone = 'neutral',
  size = 40,
  iconSize = 19,
}: {
  name: UiIconName;
  tone?: Tone;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: TONE_BG[tone] }]}>
      <UiIcon name={name} size={iconSize} color={TONE_FG[tone]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#0F172A0D' },
});
