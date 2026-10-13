// QR-att palette: Emerald/Forest Green + Slate Grey.
// - Green  → key actions, success, scanner focal points, active/open status.
// - Slate  → backgrounds, cards, borders, typography (charcoal text).
// - White text ONLY on green fills (see textOnPrimary).
export const COLORS = {
  primary: '#047857', // emerald-700 — key actions, active states
  primaryDeep: '#065F46', // emerald-800 — hero / dark surfaces
  primarySoft: '#ECFDF5', // emerald-50 — tinted tiles, pills
  background: '#F8FAFC', // slate-50 — modern app background
  card: '#FFFFFF', // white — cards over slate
  textPrimary: '#0F172A', // slate-900 — modern ink
  textSecondary: '#64748B', // slate-500 — muted text
  textOnPrimary: '#FFFFFF', // white — text on green fills
  surface: '#F1F5F9', // slate-100 — chips, inactive tracks
  border: '#E2E8F0', // slate-200 — modern hairline
  borderStrong: '#CBD5E1', // slate-300 — inputs
  shadow: '#0F172A20',
  warning: '#D97706', // amber-600
  warningSoft: '#FFFBEB', // amber-50
  success: '#059669', // emerald-600 — success, open badges
  successSoft: '#ECFDF5', // emerald-50
  danger: '#DC2626', // red-600
  dangerSoft: '#FEF2F2', // red-50
  accent: '#10B981', // emerald-500 — scanner focal points, highlights
} as const;
