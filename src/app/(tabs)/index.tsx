import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { EmptyState, ErrorNotice, LoadingState, StatusBadge } from '@/components/feedback';
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

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow="SCHOOL EVENTS"
        title="Available events"
        subtitle={
          role === 'teacher' || role === 'admin'
            ? 'Manage events in the Teacher tab. Students scan the QR to check in.'
            : 'Open an event, then scan its QR code to record attendance.'
        }
      />

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
            <View style={styles.cardHeader}>
              <View style={styles.titleBlock}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.metaRow}>
              <UiIcon name="qr" size={15} color={COLORS.accent} />
              <Text style={styles.cardCode}>{item.event_code}</Text>
            </View>
            <View style={styles.metaRow}>
              <UiIcon name="calendar" size={15} color={COLORS.textSecondary} />
              <Text style={styles.cardDate}>
                {item.start_time ? new Date(item.start_time).toLocaleString() : 'No start set'}
                {item.end_time ? ` → ${new Date(item.end_time).toLocaleString()}` : ''}
              </Text>
            </View>
            {item.venue ? (
              <View style={styles.metaRow}>
                <UiIcon name="pin" size={15} color={COLORS.textSecondary} />
                <Text style={styles.cardVenue}>{item.venue}</Text>
              </View>
            ) : null}
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
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 32 },
  list: { gap: 12, paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleBlock: { flex: 1 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardVenue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  cardCode: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  cardDate: { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, minHeight: 24 },
  cardCta: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  cardCtaMuted: { color: COLORS.textSecondary },
});
