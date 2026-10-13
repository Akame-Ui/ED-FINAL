import { supabase } from '@/lib/supabase';
import { getEventByCode } from '@/lib/events';
import { parseQRPayload } from '@/lib/qr';

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
  startTime: string | null;
};

// Punctuality: checked in within the grace window after the event start
// counts as On-Time; later check-ins are Late; events without a start
// time show '—'.
export const LATE_GRACE_MINUTES = 15;

export type ArrivalStatus = 'On-Time' | 'Late' | '—';

export function getArrivalStatus(scannedAt: string, startTime: string | null): ArrivalStatus {
  if (!startTime) return '—';
  const start = new Date(startTime).getTime();
  const scanned = new Date(scannedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(scanned)) return '—';
  return scanned <= start + LATE_GRACE_MINUTES * 60 * 1000 ? 'On-Time' : 'Late';
}

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
  eventCode?: string;
  scannedAt?: string;
};

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: {
    studentId: string;
    studentName: string | null;
    studentEmail: string | null;
    scannedAt: string;
  }[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

type EventRow = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
};

type AttendanceRow = {
  event_id: string;
  student_id: string;
  scanned_at: string;
  profiles?: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
};

export async function getTeacherEventAttendance(teacherId: string): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) {
    return [];
  }

  const eventRows = events as EventRow[];
  const eventIds = eventRows.map((event) => event.id);
  if (eventIds.length === 0) {
    return [];
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('student_id, scanned_at, event_id, profiles ( full_name, email )')
    .in('event_id', eventIds)
    .order('scanned_at', { ascending: false });

  if (attendanceError || !attendance) {
    return eventRows.map((event) => ({
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time,
      attendeeCount: 0,
      attendees: [],
    }));
  }

  const attendanceRows = attendance as AttendanceRow[];
  return eventRows.map((event) => {
    const attendees = attendanceRows
      .filter((row) => row.event_id === event.id)
      .map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
          studentId: row.student_id,
          studentName: profile?.full_name ?? null,
          studentEmail: profile?.email ?? null,
          scannedAt: row.scanned_at,
        };
      });

    return {
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      startTime: event.start_time,
      endTime: event.end_time,
      attendeeCount: attendees.length,
      attendees,
    };
  });
}

export async function getTeacherEventSummary(teacherId: string): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) return [];

  const eventRows = events as Array<{ id: string; event_code: string; title: string }>;
  const eventIds = eventRows.map((event) => event.id);
  if (eventIds.length === 0) return [];

  const { data: attRows, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);

  if (attendanceError || !attRows) {
    return eventRows.map((event) => ({
      eventId: event.id,
      eventCode: event.event_code,
      title: event.title,
      attendeeCount: 0,
    }));
  }

  const counts: Record<string, number> = {};
  (attRows as Array<{ event_id: string }>).forEach((row) => {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  });

  return eventRows.map((event) => ({
    eventId: event.id,
    eventCode: event.event_code,
    title: event.title,
    attendeeCount: counts[event.id] ?? 0,
  }));
}

export async function registerAttendance(rawPayload: string, studentId: string): Promise<RegisterResult> {
  // --- Unauthorized recording guard (must come first) ---
  // 1. Must be logged in. 2. Can only record your OWN attendance.
  // 3. Only student accounts check in (teachers/admins manage events).
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return { success: false, message: 'Please log in to record attendance.' };
  }
  if (!studentId || studentId !== authUser.id) {
    return { success: false, message: 'You can only record your own attendance.' };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authUser.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'student') {
    return { success: false, message: 'Only student accounts can record attendance.' };
  }

  // --- Invalid QR guard ---
  // Step 3→4: parse the scanned QR, then VALIDATE against the database.
  const parsed = parseQRPayload(rawPayload);
  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }

  const payload = parsed.payload;
  const now = Date.now();

  // Step 4: system validates the event — it must exist (created by
  // teacher/admin). Unknown codes are rejected, never auto-created.
  const foundEvent = await getEventByCode(payload.event);
  if (!foundEvent) {
    return {
      success: false,
      message: 'Invalid QR: event not found. Ask your teacher to verify the event.',
      eventCode: payload.event,
    };
  }

  // Step 4 (cont.): closed events block new check-ins.
  if ((foundEvent as { status?: string }).status === 'closed') {
    return {
      success: false,
      message: 'This event is closed. Check-in is disabled.',
      eventTitle: foundEvent.title,
      eventCode: payload.event,
    };
  }

  // Step 4 (cont.): validate the time window against the DATABASE record
  // (authoritative), falling back to QR payload times for legacy events.
  const dbStart = foundEvent.start_time ? new Date(foundEvent.start_time).getTime() : null;
  const dbEnd = foundEvent.end_time ? new Date(foundEvent.end_time).getTime() : null;
  const qrStart = payload.start ? new Date(payload.start).getTime() : null;
  const qrEnd = payload.end ? new Date(payload.end).getTime() : null;
  const start = dbStart ?? qrStart;
  const end = dbEnd ?? qrEnd;

  if ((start !== null && Number.isNaN(start)) || (end !== null && Number.isNaN(end))) {
    return { success: false, message: 'Invalid event time.', eventTitle: foundEvent.title, eventCode: payload.event };
  }
  if (start !== null && end !== null && start >= end) {
    return { success: false, message: 'Invalid event time.', eventTitle: foundEvent.title, eventCode: payload.event };
  }
  if (start !== null && now < start) {
    return { success: false, message: 'Event has not started yet.', eventTitle: foundEvent.title, eventCode: payload.event };
  }
  if (end !== null && now > end) {
    return { success: false, message: 'Event has already ended.', eventTitle: foundEvent.title, eventCode: payload.event };
  }

  // Step 5: system records the student's attendance.
  const { error: attendanceError } = await supabase.from('attendance').insert({
    student_id: studentId,
    event_id: foundEvent.id,
  });

  if (attendanceError) {
    if (attendanceError.code === '23505') {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: foundEvent.title,
        eventCode: payload.event,
      };
    }
    return { success: false, message: attendanceError.message, eventTitle: foundEvent.title, eventCode: payload.event };
  }

  // Step 6: confirmation payload for the student.
  return {
    success: true,
    message: 'Attendance recorded!',
    eventTitle: foundEvent.title,
    eventCode: payload.event,
    scannedAt: new Date().toISOString(),
  };
}

export async function getAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, events (event_code, title, start_time)')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? '',
    eventTitle: row.events?.title ?? '',
    scannedAt: row.scanned_at,
    startTime: row.events?.start_time ?? null,
  }));
}

// Admin capability: manage/correct attendance records (delete a bad scan).
export async function deleteAttendanceRecord(
  attendanceId: string,
): Promise<{ error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { error: 'Only administrators can correct attendance records.' };
  }

  const { error } = await supabase.from('attendance').delete().eq('id', attendanceId);
  return { error: error?.message ?? null };
}
