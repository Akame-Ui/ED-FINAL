import { supabase } from '@/lib/supabase';
import type { CloudEvent } from '@/lib/events';
import type { Profile, Role } from '@/lib/profiles';

async function requireAdmin(): Promise<{ userId: string; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: '', error: 'Not signed in.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { userId: user.id, error: 'Administrator access required.' };
  }
  return { userId: user.id, error: null };
}

// Admin: manage users — list every profile.
export async function listAllUsers(): Promise<Profile[]> {
  const { error } = await requireAdmin();
  if (error) return [];
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('created_at', { ascending: false });
  return ((data ?? []) as Profile[]);
}

// Admin: manage users — change a user's role.
export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ error: string | null }> {
  const { error: adminError } = await requireAdmin();
  if (adminError) return { error: adminError };
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  return { error: error?.message ?? null };
}

// Admin: manage events — list every event with its creator.
export async function listAllEvents(): Promise<CloudEvent[]> {
  const { error } = await requireAdmin();
  if (error) return [];
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  return ((data ?? []) as CloudEvent[]);
}

export type SystemReport = {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalEvents: number;
  totalAttendance: number;
  perEvent: { eventCode: string; title: string; count: number }[];
};

export type OverallAttendanceRow = {
  id: string;
  scannedAt: string;
  eventCode: string;
  eventTitle: string;
  eventStart: string | null;
  studentName: string | null;
  studentEmail: string | null;
};

// Admin: view overall attendance — every check-in with event + student.
// Implemented as 3 simple queries merged in code so it works regardless of
// whether attendance.student_id has a FK to profiles (no PostgREST join needed).
export async function listAllAttendance(): Promise<OverallAttendanceRow[]> {
  const { error } = await requireAdmin();
  if (error) return [];
  const [{ data: attendance }, { data: events }, { data: profiles }] = await Promise.all([
    supabase.from('attendance').select('id, scanned_at, event_id, student_id').order('scanned_at', { ascending: false }).limit(500),
    supabase.from('events').select('id, event_code, title, start_time'),
    supabase.from('profiles').select('id, full_name, email'),
  ]);
  const eventMap = new Map(
    (((events ?? []) as { id: string; event_code: string; title: string; start_time: string | null }[])).map((e) => [e.id, e]),
  );
  const profileMap = new Map(
    (((profiles ?? []) as { id: string; full_name: string | null; email: string | null }[])).map((p) => [p.id, p]),
  );
  return (((attendance ?? []) as { id: string; scanned_at: string; event_id: string; student_id: string }[])).map((a) => {
    const e = eventMap.get(a.event_id);
    const p = profileMap.get(a.student_id);
    return {
      id: a.id,
      scannedAt: a.scanned_at,
      eventCode: e?.event_code ?? '—',
      eventTitle: e?.title ?? 'Unknown event',
      eventStart: e?.start_time ?? null,
      studentName: p?.full_name ?? null,
      studentEmail: p?.email ?? null,
    };
  });
}

// Admin: view system reports — overall attendance summary.
export async function getSystemReport(): Promise<SystemReport> {
  const empty: SystemReport = {
    totalUsers: 0,
    usersByRole: {},
    totalEvents: 0,
    totalAttendance: 0,
    perEvent: [],
  };
  const { error } = await requireAdmin();
  if (error) return empty;

  const [{ data: profiles }, { data: events }, { data: attendance }] = await Promise.all([
    supabase.from('profiles').select('role'),
    supabase.from('events').select('id, event_code, title'),
    supabase.from('attendance').select('id, event_id'),
  ]);

  const usersByRole: Record<string, number> = {};
  for (const p of ((profiles ?? []) as { role: string }[])) {
    usersByRole[p.role] = (usersByRole[p.role] ?? 0) + 1;
  }

  const counts: Record<string, number> = {};
  for (const a of ((attendance ?? []) as { event_id: string }[])) {
    counts[a.event_id] = (counts[a.event_id] ?? 0) + 1;
  }

  const eventRows = ((events ?? []) as { id: string; event_code: string; title: string }[]);
  return {
    totalUsers: (profiles ?? []).length,
    usersByRole,
    totalEvents: eventRows.length,
    totalAttendance: (attendance ?? []).length,
    perEvent: eventRows.map((e) => ({
      eventCode: e.event_code,
      title: e.title,
      count: counts[e.id] ?? 0,
    })),
  };
}
