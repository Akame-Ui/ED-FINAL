// QR-att palette: Emerald/Forest Green + Slate Grey.
// - Green  → key actions, success, scanner focal points, active/open status.
// - Slate  → backgrounds, cards, borders, typography (charcoal text).
// - White text ONLY on green fills (see textOnPrimary).
export const COLORS = {
  primary: '#047857', // emerald-700 — key actions, active states
  background: '#F1F5F9', // slate-100 — app background
  card: '#FFFFFF', // white — cards over slate
  textPrimary: '#1E293B', // slate-800 charcoal — headings, body
  textSecondary: '#64748B', // slate-500 — muted text
  textOnPrimary: '#FFFFFF', // white — text on green fills
  surface: '#E2E8F0', // slate-200 — chips, inactive tracks
  border: '#CBD5E1', // slate-300 — borders, dividers
  shadow: '#0F172A20',
  warning: '#D97706', // amber-600
  success: '#059669', // emerald-600 — success, open badges
  danger: '#DC2626', // red-600
  accent: '#10B981', // emerald-500 — scanner focal points, highlights
} as const;
