import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { EmptyState, ErrorNotice, LoadingState, StatusBadge } from '@/components/feedback';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusIcon } from '@/components/StatusIcon';
import { UiIcon } from '@/components/UiIcon';
import { getArrivalStatus, getAttendanceHistory, getTeacherEventAttendance, type AttendanceRecord, type TeacherEventAttendance } from '@/lib/attendance';
import { listAllAttendance, type OverallAttendanceRow } from '@/lib/admin';
import { useAuth } from '@/lib/auth';
import { attendanceFileName, buildAttendanceCsv, shareCsv, type AttendanceCsvRow } from '@/lib/export';
import type { Role } from '@/lib/profiles';
import { getProfile } from '@/lib/profiles';
import { clearScanHistory, getScanHistory, type ScanHistoryEntry } from '@/lib/scanHistory';

type Tab = 'attendance' | 'scans';
type DateFilter = 'all' | 'today' | 'week';
type StatusFilter = 'all' | 'on-time' | 'late';

// Unified row for search / filter / export across all roles.
type ViewRow = {
  id: string;
  student: string;
  email: string;
  eventCode: string;
  eventTitle: string;
  scannedAt: string;
  startTime: string | null;
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);
  const [systemRows, setSystemRows] = useState<OverallAttendanceRow[]>([]);
  const [scanEntries, setScanEntries] = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('attendance');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = await getProfile(user.id);
      const currentRole = profile?.role ?? 'student';
      setRole(currentRole);

    // Always load local scan history (every QR scanned, not just attendance)
    const scans = await getScanHistory(user.id);

    if (currentRole === 'teacher') {
      const events = await getTeacherEventAttendance(user.id);
      setTeacherEvents(events);
      setStudentRecords([]);
      setSystemRows([]);
      setScanEntries(scans);
    } else if (currentRole === 'admin') {
      // Admins view system-wide attendance records (all events, all students).
      const rows = await listAllAttendance();
      setSystemRows(rows);
      setTeacherEvents([]);
      setStudentRecords([]);
      setScanEntries(scans);
    } else {
      const records = await getAttendanceHistory(user.id);
      setStudentRecords(records);
      setTeacherEvents([]);
      setSystemRows([]);
      setScanEntries(scans);
    }
    } catch {
      setError('Could not load history. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleClearScans = useCallback(async () => {
    if (!user) return;
    await clearScanHistory(user.id);
    setScanEntries([]);
  }, [user]);

  // Normalize per-role data into filterable rows.
  const records: ViewRow[] = useMemo(() => {
    if (role === 'teacher') {
      return teacherEvents.flatMap((event) =>
        event.attendees.map((a) => ({
          id: `${event.eventId}-${a.studentId}-${a.scannedAt}`,
          student: a.studentName ?? a.studentEmail ?? shortId(a.studentId),
          email: a.studentEmail ?? '',
          eventCode: event.eventCode,
          eventTitle: event.title,
          scannedAt: a.scannedAt,
          startTime: event.startTime,
        })),
      );
    }
    if (role === 'admin') {
      return systemRows.map((r) => ({
        id: r.id,
        student: r.studentName ?? r.studentEmail ?? 'Unknown student',
        email: r.studentEmail ?? '',
        eventCode: r.eventCode,
        eventTitle: r.eventTitle,
        scannedAt: r.scannedAt,
        startTime: r.eventStart,
      }));
    }
    return studentRecords.map((r) => ({
      id: String(r.id),
      student: 'You',
      email: '',
      eventCode: r.eventId,
      eventTitle: r.eventTitle,
      scannedAt: r.scannedAt,
      startTime: r.startTime,
    }));
  }, [role, teacherEvents, systemRows, studentRecords]);

  // Search (ID / name / email / event) + date + On-Time/Late filters.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return records.filter((r) => {
      if (q) {
        const hay = `${r.student} ${r.email} ${r.eventCode} ${r.eventTitle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFilter !== 'all') {
        const age = now - new Date(r.scannedAt).getTime();
        if (Number.isNaN(age)) return false;
        if (dateFilter === 'today' && age > dayMs) return false;
        if (dateFilter === 'week' && age > 7 * dayMs) return false;
      }
      if (statusFilter !== 'all') {
        const status = getArrivalStatus(r.scannedAt, r.startTime);
        if (statusFilter === 'on-time' && status !== 'On-Time') return false;
        if (statusFilter === 'late' && status !== 'Late') return false;
      }
      return true;
    });
  }, [records, query, dateFilter, statusFilter]);

  const handleExport = useCallback(async () => {
    if (filtered.length === 0 || exporting) return;
    setExporting(true);
    try {
      const rows: AttendanceCsvRow[] = filtered.map((r) => ({
        student: r.student,
        email: r.email,
        eventCode: r.eventCode,
        eventTitle: r.eventTitle,
        scannedAt: new Date(r.scannedAt).toLocaleString(),
        status: getArrivalStatus(r.scannedAt, r.startTime),
      }));
      const { error: shareError } = await shareCsv(
        buildAttendanceCsv(rows),
        attendanceFileName('qratt-history'),
      );
      if (shareError) Alert.alert('Export failed', shareError);
    } finally {
      setExporting(false);
    }
  }, [filtered, exporting]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        eyebrow="ATTENDANCE"
        title={role === 'teacher' ? 'Event attendance' : role === 'admin' ? 'System attendance' : 'Scan history'}
        subtitle={
          role === 'teacher'
            ? 'Attendance for events you created + every QR you scanned.'
            : role === 'admin'
              ? 'Every check-in across all events and students.'
              : 'Every QR you scan is saved here — attendance and general codes.'
        }
      />

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTab('attendance')}
          style={[styles.tab, tab === 'attendance' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'attendance' && styles.tabTextActive]}>
            {role === 'teacher' ? 'Events' : role === 'admin' ? `All records (${systemRows.length})` : 'Attendance'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab('scans')} style={[styles.tab, tab === 'scans' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'scans' && styles.tabTextActive]}>
            Scan Detected ({scanEntries.length})
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingState message="Loading history…" />
      ) : error ? (
        <ErrorNotice message={error} onRetry={() => void load()} />
      ) : tab === 'scans' ? (
        <FlatList
          data={scanEntries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={scanEntries.length === 0 ? styles.emptyList : styles.list}
          renderItem={({ item }) => <ScanEntryCard entry={item} />}
          ListEmptyComponent={<EmptyState title="No scans yet" hint="Scan any QR — it will appear here." art="no-results" />}
          ListHeaderComponent={
            scanEntries.length > 0 ? (
              <View style={styles.clearRow}>
                <Pressable onPress={handleClearScans} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear history</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.attendanceWrap}>
          {/* Search & filter bar: text query + date + On-Time/Late status. */}
          <View style={styles.searchWrap}>
            <UiIcon name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, email, event code…"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.chipRow}>
            {(['all', 'today', 'week'] as const).map((d) => (
              <Pressable key={d} onPress={() => setDateFilter(d)} style={[styles.chip, dateFilter === d && styles.chipActive]}>
                <Text style={[styles.chipText, dateFilter === d && styles.chipTextActive]}>
                  {d === 'all' ? 'All dates' : d === 'today' ? 'Today' : 'Last 7 days'}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chipRow}>
            {(['all', 'on-time', 'late'] as const).map((s) => (
              <Pressable key={s} onPress={() => setStatusFilter(s)} style={[styles.chip, statusFilter === s && styles.chipActive]}>
                <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                  {s === 'all' ? 'All statuses' : s === 'on-time' ? 'On-Time' : 'Late'}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => void handleExport()}
              disabled={filtered.length === 0 || exporting}
              style={[styles.exportBtn, (filtered.length === 0 || exporting) && styles.exportBtnDisabled]}>
              <Text style={styles.exportText}>{exporting ? 'Exporting…' : `Export CSV (${filtered.length})`}</Text>
            </Pressable>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
            renderItem={({ item }) => <RecordRow row={item} showStudent={role !== 'student'} />}
            ListEmptyComponent={
              <EmptyState
                title={records.length === 0 ? 'No attendance yet' : 'No matches'}
                hint={
                  records.length === 0
                    ? role === 'teacher'
                      ? 'No students have checked in to your events yet.'
                      : 'Scan an event QR to record your first check-in.'
                    : 'Try a different search or filter.'
                }
                art={records.length === 0 ? 'all-checked-in' : 'no-results'}
              />
            }
          />
        </View>
      )}
    </View>
  );
}

function ScanEntryCard({ entry }: { entry: ScanHistoryEntry }) {
  const isAttendance = entry.isAttendanceQR;
  const isGenericSuccess = !isAttendance && entry.success;
  return (
    <View style={styles.record}>
      <View
        style={[
          styles.recordIcon,
          isAttendance ? styles.iconAttendance : isGenericSuccess ? styles.iconDetected : styles.iconGeneric,
        ]}
      >
        <StatusIcon status={isAttendance ? 'present' : isGenericSuccess ? 'on-time' : 'generic'} size={20} />
      </View>
      <View style={styles.recordDetails}>
        <Text style={styles.eventCode} numberOfLines={1}>
          {isAttendance ? (entry.eventTitle ?? entry.eventCode ?? 'Attendance QR') : 'Scan detected'}
        </Text>
        <Text style={styles.date} numberOfLines={3}>
          {entry.rawData}
        </Text>
        <Text style={styles.date}>{new Date(entry.scannedAt).toLocaleString()}</Text>
        <Text
          style={[
            styles.badge,
            isAttendance ? styles.badgeAttendance : isGenericSuccess ? styles.badgeDetected : styles.badgeGeneric,
          ]}
        >
          {entry.resultMessage}
        </Text>
      </View>
      <Text style={styles.status}>{isAttendance ? 'Event' : 'Detected'}</Text>
    </View>
  );
}

function RecordRow({ row, showStudent }: { row: ViewRow; showStudent: boolean }) {
  const status = getArrivalStatus(row.scannedAt, row.startTime);
  return (
    <View style={styles.record}>
      <StatusIcon status={status === 'Late' ? 'late' : status === 'On-Time' ? 'on-time' : 'generic'} size={24} />
      <View style={styles.recordDetails}>
        {showStudent ? (
          <Text style={styles.eventCode} numberOfLines={1}>
            {row.student}
          </Text>
        ) : null}
        <Text style={styles.date} numberOfLines={1}>
          {row.eventTitle} ({row.eventCode})
        </Text>
        <Text style={styles.date}>{new Date(row.scannedAt).toLocaleString()}</Text>
      </View>
      <ArrivalBadge status={status} />
    </View>
  );
}

function ArrivalBadge({ status }: { status: 'On-Time' | 'Late' | '—' }) {
  if (status === '—') return <StatusBadge status="generic" />;
  return <StatusBadge status={status === 'Late' ? 'late' : 'on-time'} />;
}

function shortId(id: string) {
  return id ? `…${id.slice(-8)}` : 'unknown';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 32 },
  header: { marginBottom: 16 },
  eyebrow: { color: COLORS.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '800', marginTop: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.textOnPrimary },
  clearRow: { alignItems: 'flex-end', marginBottom: 8 },
  clearButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  clearText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  list: { paddingBottom: 24, gap: 10 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  record: { backgroundColor: COLORS.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border },
  recordIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  iconAttendance: { backgroundColor: '#05966914', borderWidth: 1, borderColor: COLORS.success },
  iconGeneric: { backgroundColor: COLORS.border, borderWidth: 1, borderColor: COLORS.accent },
  iconDetected: { backgroundColor: COLORS.success, borderWidth: 1, borderColor: COLORS.accent },
  check: { color: COLORS.primary, fontSize: 16, fontWeight: '800' },
  checkDetected: { color: COLORS.card },
  recordDetails: { flex: 1, gap: 4 },
  eventCode: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  date: { color: COLORS.textSecondary, fontSize: 12 },
  badge: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  badgeAttendance: { color: COLORS.success ?? COLORS.accent },
  badgeDetected: { color: COLORS.success },
  badgeGeneric: { color: COLORS.textSecondary },
  status: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  empty: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' },
  attendanceWrap: { flex: 1, gap: 10 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15, height: 46 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: COLORS.textOnPrimary },
  exportBtn: { borderRadius: 999, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, minHeight: 44, justifyContent: 'center', marginLeft: 'auto' },
  exportBtnDisabled: { opacity: 0.5 },
  exportText: { color: COLORS.textOnPrimary, fontSize: 12, fontWeight: '800' },
  arrivalBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  arrivalOnTime: { backgroundColor: '#05966914', borderColor: COLORS.success },
  arrivalLate: { backgroundColor: '#D9770614', borderWidth: 1, borderColor: COLORS.warning },
  arrivalText: { fontSize: 11, fontWeight: '800' },
  arrivalTextOnTime: { color: COLORS.success },
  arrivalTextLate: { color: COLORS.warning },
  eventCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, gap: 10 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  eventHeading: { flex: 1, gap: 4 },
  eventTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  countBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  countText: { color: COLORS.textOnPrimary, fontSize: 17, fontWeight: '800' },
  countLabel: { color: COLORS.textOnPrimary, fontSize: 10, fontWeight: '700' },
  attendeeList: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, gap: 8 },
  attendeeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  attendeeId: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  noAttendees: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
});
