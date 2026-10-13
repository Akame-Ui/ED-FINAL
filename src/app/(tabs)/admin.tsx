import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { EmptyState, LoadingState, StatusBadge } from '@/components/feedback';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UiIcon } from '@/components/UiIcon';
import { getArrivalStatus } from '@/lib/attendance';
import { attendanceFileName, buildAttendanceCsv, shareCsv, type AttendanceCsvRow } from '@/lib/export';
import { useRole } from '@/lib/auth';
import {
  getSystemReport,
  listAllAttendance,
  listAllEvents,
  listAllUsers,
  setUserRole,
  type OverallAttendanceRow,
  type SystemReport,
} from '@/lib/admin';
import { deleteAttendanceRecord } from '@/lib/attendance';
import { deleteEvent, setEventStatus } from '@/lib/events';
import type { CloudEvent } from '@/lib/events';
import type { Profile, Role } from '@/lib/profiles';

type Tab = 'report' | 'users' | 'events' | 'attendance';

const ROLE_ORDER: Role[] = ['admin', 'teacher', 'student'];

// Administrator capabilities: manage users, manage events, view overall
// attendance, manage/correct attendance records, view system reports.
export default function AdminScreen() {
  const { role, loading: roleLoading } = useRole();
  const [tab, setTab] = useState<Tab>('report');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SystemReport | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [attendance, setAttendance] = useState<OverallAttendanceRow[]>([]);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, u, e, a] = await Promise.all([
      getSystemReport(),
      listAllUsers(),
      listAllEvents(),
      listAllAttendance(),
    ]);
    setReport(r);
    setUsers(u);
    setEvents(e);
    setAttendance(a);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (roleLoading) {
    return <LoadingState message="Checking your role…" />;
  }

  if (role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.lockTitle}>Administrators only</Text>
        <Text style={styles.muted}>Ask an admin to promote your account.</Text>
      </View>
    );
  }

  const handleRoleChange = (user: Profile, next: Role) => {
    if (user.role === next) return;
    Alert.alert('Change role', `${user.email} → ${next}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          void (async () => {
            const { error } = await setUserRole(user.id, next);
            if (error) Alert.alert('Error', error);
            else void load();
          })(),
      },
    ]);
  };

  const handleDeleteEvent = (event: CloudEvent) => {
    Alert.alert('Delete event', `${event.title} (${event.event_code})? Attendance rows delete too.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            const { error } = await deleteEvent(event.id);
            if (error) Alert.alert('Error', error);
            else void load();
          })(),
      },
    ]);
  };

  const handleToggleEventStatus = (event: CloudEvent) => {
    const next = event.status === 'open' ? 'closed' : 'open';
    Alert.alert(
      next === 'closed' ? 'Close event' : 'Reopen event',
      `${event.title} (${event.event_code})?${next === 'closed' ? ' New check-ins will be blocked.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            void (async () => {
              const { error } = await setEventStatus(event.id, next);
              if (error) Alert.alert('Error', error);
              else void load();
            })(),
        },
      ],
    );
  };

  // Manage / correct a single attendance record (e.g. accidental duplicate scan).
  const handleCorrectAttendance = (row: OverallAttendanceRow) => {
    Alert.alert(
      'Correct record',
      `Remove check-in: ${row.studentEmail ?? row.studentName ?? 'student'} @ ${row.eventCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            void (async () => {
              const { error } = await deleteAttendanceRecord(row.id);
              if (error) Alert.alert('Error', error);
              else void load();
            })(),
        },
      ],
    );
  };

  // Export options: CSV of all attendance (opens in Excel) via share sheet / download.
  const handleExportAttendance = () => {
    if (attendance.length === 0 || exporting) return;
    setExporting(true);
    void (async () => {
      try {
        const rows: AttendanceCsvRow[] = attendance.map((r) => ({
          student: r.studentName ?? r.studentEmail ?? 'Unknown',
          email: r.studentEmail ?? '',
          eventCode: r.eventCode,
          eventTitle: r.eventTitle,
          scannedAt: new Date(r.scannedAt).toLocaleString(),
          status: getArrivalStatus(r.scannedAt, r.eventStart),
        }));
        const { error } = await shareCsv(buildAttendanceCsv(rows), attendanceFileName('qratt-admin'));
        if (error) Alert.alert('Export failed', error);
      } finally {
        setExporting(false);
      }
    })();
  };

  const migrationMissing =
    !loading && users.length === 0 && events.length === 0 && attendance.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="ADMINISTRATION" title="System overview" subtitle="Users, events, attendance and reports." />

      <View style={styles.tabRow}>
        {(['report', 'users', 'events', 'attendance'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'report'
                ? 'Reports'
                : t === 'users'
                  ? `Users (${users.length})`
                  : t === 'events'
                    ? `Events (${events.length})`
                    : `Attend. (${attendance.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {migrationMissing ? (
        <View style={styles.warnCard}>
          <Text style={styles.warnTitle}>No data returned</Text>
          <Text style={styles.muted}>
            Run supabase/migrations/20260919000000_admin_role_rbac.sql in the Supabase SQL editor,
            then reload. Admin RLS policies are required for this screen.
          </Text>
          <Pressable onPress={() => void load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <LoadingState message="Loading admin data…" />
      ) : tab === 'report' && report ? (
        <FlatList
          data={report.perEvent}
          keyExtractor={(item) => item.eventCode}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.statsRow}>
                <Stat label="Users" value={report.totalUsers} icon="users" />
                <Stat label="Events" value={report.totalEvents} icon="calendar" />
                <Stat label="Check-ins" value={report.totalAttendance} icon="check" />
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Users by role</Text>
                <Text style={styles.muted}>
                  {(['admin', 'teacher', 'student'] as const)
                    .map((r) => `${r}: ${report.usersByRole[r] ?? 0}`)
                    .join('   •   ')}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCode}>{item.eventCode}</Text>
              <Text style={styles.count}>{item.count} attended</Text>
            </View>
          )}
          ListEmptyComponent={<EmptyState title="No events yet" hint="Create one in the Teacher tab." art="no-results" />}
        />
      ) : tab === 'users' ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.full_name ?? 'Unnamed user'}</Text>
              <Text style={styles.muted}>{item.email}</Text>
              <View style={styles.roleRow}>
                {ROLE_ORDER.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => handleRoleChange(item, r)}
                    style={[styles.roleChip, item.role === r && styles.roleChipActive]}>
                    <Text style={[styles.roleText, item.role === r && styles.roleTextActive]}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState title="No users found" hint="Registered accounts will appear here." art="no-results" />}
        />
      ) : tab === 'events' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.cardCode}>{item.event_code}</Text>
              {item.venue ? <Text style={styles.mutedLeft}>{item.venue}</Text> : null}
              <View style={styles.btnRow}>
                <Pressable onPress={() => handleToggleEventStatus(item)} style={styles.toggleBtn} accessibilityRole="button">
                  <UiIcon name={item.status === 'open' ? 'lock' : 'refresh'} size={15} color={COLORS.textPrimary} />
                  <Text style={styles.toggleText}>{item.status === 'open' ? 'Close' : 'Reopen'}</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteEvent(item)} style={styles.deleteBtn} accessibilityRole="button">
                  <UiIcon name="trash" size={15} color="#FFFFFF" />
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState title="No events found" hint="Create one in the Teacher tab." art="no-results" />}
        />
      ) : (
        <FlatList
          data={attendance}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            attendance.length > 0 ? (
              <Pressable
                onPress={handleExportAttendance}
                disabled={exporting}
                style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
                accessibilityRole="button"
              >
                <UiIcon name="download" size={16} color={COLORS.textOnPrimary} />
                <Text style={styles.exportText}>
                  {exporting ? 'Exporting…' : `Export CSV (${attendance.length})`}
                </Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {item.studentName ?? item.studentEmail ?? 'Unknown student'}
              </Text>
              <Text style={styles.muted}>{item.studentEmail ?? ''}</Text>
              <Text style={styles.cardCode}>
                {item.eventTitle} ({item.eventCode})
              </Text>
              <Text style={styles.count}>{new Date(item.scannedAt).toLocaleString()}</Text>
              <Pressable onPress={() => handleCorrectAttendance(item)} style={styles.deleteBtn} accessibilityRole="button">
                <UiIcon name="edit" size={15} color="#FFFFFF" />
                <Text style={styles.deleteText}>Correct (remove)</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<EmptyState title="No attendance records yet" hint="Check-ins will appear here once students scan in." art="all-checked-in" />}
        />
      )}
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: 'users' | 'calendar' | 'check' }) {
  return (
    <View style={styles.stat}>
      {icon ? <UiIcon name={icon} size={18} color={COLORS.primary} /> : null}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, paddingTop: 32 },
  center: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  lockTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  muted: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  eyebrow: { color: COLORS.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 6, marginBottom: 14 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 14, backgroundColor: COLORS.card, borderRadius: 12, padding: 4 },
  tab: { flex: 1, minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: COLORS.textOnPrimary },
  list: { gap: 10, paddingBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: COLORS.textSecondary, fontSize: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', flex: 1 },
  mutedLeft: { color: COLORS.textSecondary, fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  toggleText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 12 },
  cardCode: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  count: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  roleChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, minHeight: 44 },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  roleTextActive: { color: COLORS.textOnPrimary },
  deleteBtn: { marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.danger, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  warnCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  warnTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  retryText: { color: COLORS.textOnPrimary, fontWeight: '700' },
  exportBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, minHeight: 48, justifyContent: 'center' },
  exportBtnDisabled: { opacity: 0.5 },
  exportText: { color: COLORS.textOnPrimary, fontSize: 13, fontWeight: '800' },
});
