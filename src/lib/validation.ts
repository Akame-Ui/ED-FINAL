// Centralized input validation (client-side first line of defense;
// Row Level Security + DB constraints enforce the same rules server-side).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Event codes: short, URL-safe identifiers like CALC-2026-001.
const EVENT_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9-_]{1,30}[A-Za-z0-9]$/;

export function sanitize(text: string, maxLength = 200): string {
  return text.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Email is required.';
  if (value.length > 254) return 'Email is too long.';
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password.length > 128) return 'Password must be under 128 characters.';
  return null;
}

export function validateRequired(value: string, label: string, maxLength = 200): string | null {
  const clean = value.trim();
  if (!clean) return `${label} is required.`;
  if (clean.length > maxLength) return `${label} must be under ${maxLength} characters.`;
  return null;
}

export function validateEventCode(code: string): string | null {
  const value = code.trim();
  if (!value) return 'Event code is required.';
  if (!EVENT_CODE_RE.test(value)) {
    return 'Event code must be 3–32 letters, numbers, dashes or underscores.';
  }
  return null;
}
