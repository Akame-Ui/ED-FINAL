import { Platform } from 'react-native';

export type AttendanceCsvRow = {
  student: string;
  email: string;
  eventCode: string;
  eventTitle: string;
  scannedAt: string;
  status: string;
};

function escapeCell(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

// Export options: build a CSV string from attendance rows (Excel opens CSVs
// natively, so one format covers both CSV + Excel requirements).
export function buildAttendanceCsv(rows: AttendanceCsvRow[]): string {
  const header = ['Student', 'Email', 'Event Code', 'Event Title', 'Scanned At', 'Status'];
  const lines = rows.map((r) =>
    [r.student, r.email, r.eventCode, r.eventTitle, r.scannedAt, r.status]
      .map(escapeCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function attendanceFileName(prefix = 'qratt-attendance'): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}

// Cross-platform share: web downloads via Blob; native writes a file and
// opens the OS share sheet (Save to Files / email / Drive…).
export async function shareCsv(csv: string, fileName: string): Promise<{ error: string | null }> {
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      return { error: null };
    }
    const FileSystem = await import('expo-file-system');
    const Sharing = await import('expo-sharing');
    const available = await Sharing.isAvailableAsync();
    if (!available) return { error: 'Sharing is not available on this device.' };
    const dir = FileSystem.Paths.cache ?? FileSystem.Paths.document;
    const file = new FileSystem.File(dir, fileName);
    file.write(csv);
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export attendance' });
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Export failed.' };
  }
}
