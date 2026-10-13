import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

// One header for every screen: eyebrow + title + optional subtitle.
// Fixes the current drift (28px vs 30px titles, mixed padding).
export function ScreenHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  textBlock: { flex: 1, gap: 6 },
  right: { paddingTop: 4 },
  eyebrow: { color: COLORS.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
});
