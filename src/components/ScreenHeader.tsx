import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS } from '@/constants/ui';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

// Modern header: eyebrow becomes a tinted pill, title is larger + tighter.
export function ScreenHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.textBlock}>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  textBlock: { flex: 1, gap: 8 },
  right: { paddingTop: 6 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: `${COLORS.primary}26`,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  eyebrow: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '800', lineHeight: 36, letterSpacing: -0.4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21 },
});
