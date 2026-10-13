import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { STATUS_META, type AttendanceVisualStatus } from '@/constants/icons';
import { EmptyArt, type EmptyArtKind } from '@/components/EmptyArt';
import { StatusIcon } from '@/components/StatusIcon';
import { UiIcon } from '@/components/UiIcon';

// Shared feedback primitives — one look for loading / empty / error /
// success across every screen (clean + consistent + easy to understand).

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator color={COLORS.accent} size="large" />
      <Text style={styles.muted}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, hint, art = 'no-results' }: { title: string; hint?: string; art?: EmptyArtKind }) {
  return (
    <View style={styles.center}>
      <EmptyArt kind={art} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.mutedCenter}>{hint}</Text> : null}
    </View>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorCard} accessibilityRole="alert">
      <View style={styles.noticeRow}>
        <UiIcon name="alert" size={20} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
      </View>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SuccessNotice({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.successCard} accessibilityRole="alert">
      <StatusIcon status="present" size={28} />
      <Text style={styles.successTitle}>{title}</Text>
      {detail ? <Text style={styles.successDetail}>{detail}</Text> : null}
    </View>
  );
}

export function StatusBadge({ status }: { status: AttendanceVisualStatus | 'open' | 'closed' }) {
  const meta = STATUS_META[status];
  return (
    <View style={[styles.badge, { borderColor: meta.color, backgroundColor: `${meta.color}22` }]}>
      <View style={styles.badgeRow}>
        <StatusIcon status={status} size={16} />
        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  muted: { color: COLORS.textSecondary, fontSize: 14 },
  mutedCenter: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  errorCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.danger, gap: 8 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorTitle: { color: COLORS.danger, fontSize: 15, fontWeight: '800' },
  errorText: { color: COLORS.textPrimary, fontSize: 14 },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  retryText: { color: COLORS.textOnPrimary, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  successCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.success, alignItems: 'center', gap: 6 },
  successTitle: { color: COLORS.success, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  successDetail: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
});
