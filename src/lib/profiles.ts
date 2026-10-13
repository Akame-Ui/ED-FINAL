import { supabase } from '@/lib/supabase';

export type Role = 'student' | 'teacher' | 'admin';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; role?: Role },
): Promise<{ error: string | null }> {
  // Client-side RBAC: only admins may change roles. Name edits are owner-only
  // (RLS enforces this too — this is a fast, friendly early check).
  if (updates.role !== undefined) {
    const { data } = await supabase.auth.getUser();
    const me = data.user ? await getProfile(data.user.id) : null;
    if (me?.role !== 'admin') {
      return { error: 'Only administrators can change roles.' };
    }
  }
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  return { error: error?.message ?? null };
}
