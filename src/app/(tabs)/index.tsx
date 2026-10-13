import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOW } from '@/constants/ui';
import { EmptyState, ErrorNotice, LoadingState, StatusBadge } from '@/components/feedback';
import { IconTile } from '@/components/IconTile';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UiIcon } from '@/components/UiIcon';
import { getAllEvents, type CloudEvent } from '@/lib/events';
import { useAuth, useRole } from '@/lib/auth';

// Student capability: view available events. Teacher/Admin see management hints.
export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();
  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEvents(await getAllEvents());
    } catch {
      setError('Could not load events. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState message="Loading events…" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScreenHeader eyebrow="SCHOOL EVENTS" title="Available events" />
        <ErrorNotice message={error} onRetry={() => void load()} />
      </View>
    );
  }

  const openCount = events.filter((e) => e.status === 'open').length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow="SCHOOL EVENTS"
        title="Available events"
        subtitle={
          role === 'teacher' || role === 'admin'
            ? 'Manage events in the Event tab. Students scan the QR to check in.'
            : 'Open an event, then scan its QR code to record attendance.'
        }
      />

      {/* Modern hero: one-tap check-in + live open count. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan QR to check in now"
        onPress={() => router.push('/(tabs)/scan')}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
      >
        <View style={styles.heroTile}>
          <UiIcon name="scan" size={26} color={COLORS.textOnPrimary} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Ready to check in?</Text>
          <Text style={styles.heroSub}>
            {openCount > 0 ? `${openCount} event${openCount === 1 ? '' : 's'} open now` : 'Point at the event QR'}
          </Text>
        </View>
        <View style={styles.heroCta}>
          <Text style={styles.heroCtaText}>Scan</Text>
          <UiIcon name="chevron-right" size={16} color={COLORS.textOnPrimary} />
        </View>
      </Pressable>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={events.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.status}`}
            onPress={() => router.push('/(tabs)/scan')}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <IconTile name="calendar" tone={item.status === 'open' ? 'primary' : 'neutral'} size={44} />
              <View style={styles.titleBlock}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardCode}>{item.event_code}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.chipRow}>
              <View style={styles.metaChip}>
                <UiIcon name="clock" size={13} color={COLORS.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.start_time ? new Date(item.start_time).toLocaleString() : 'No start set'}
                </Text>
              </View>
              {item.venue ? (
                <View style={styles.metaChip}>
                  <UiIcon name="pin" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>{item.venue}</Text>
                </View>
              ) : null}
            </View>
            {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={styles.ctaRow}>
              <Text style={[styles.cardCta, item.status !== 'open' && styles.cardCtaMuted]}>
                {item.status === 'open' ? 'Scan QR to check in' : 'Closed — check-in disabled'}
              </Text>
              {item.status === 'open' ? <UiIcon name="chevron-right" size={16} color={COLORS.primary} /> : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No events yet"
            hint={user ? 'Ask a teacher to create one. Pull down to refresh.' : 'Sign in to view events.'}
            art="no-results"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 24 },
  list: { gap: 14, paddingBottom: 28 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.primaryDeep,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF22',
    ...SHADOW.pop,
  },
  heroTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF22',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  heroSub: { color: '#D1FAE5', fontSize: 13, fontWeight: '600' },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFFFF22',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
  heroCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOW.card,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleBlock: { flex: 1, gap: 2 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', lineHeight: 22, letterSpacing: -0.2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  metaText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  cardCode: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    minHeight: 24,
  },
  cardCta: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  cardCtaMuted: { color: COLORS.textSecondary },
});
