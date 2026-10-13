# QR-Att Icon System

## 1. Icon Metaphors & Concepts

Base + one modifier badge. Max 2 elements, readable at 16px.
Always pair with a text label — color is never the only signal.

| Status | Metaphor | Token | Notes |
|---|---|---|---|
| On-Time / Present | Check in circle | `success #059669` | `StatusIcon status="on-time"` |
| Late Check-in | Clock (hands ~12:05) in circle | `warning #D97706` | Avoid hourglass (reads as loading) |
| Absent | X in circle | `danger #DC2626` | Never person-icon alone |
| Excused Absence | Document + check | `textSecondary #64748B` | Neutral slate, not red |
| QR Session Expired | 3 QR finder squares + slash | `warning` | Dashed = inactive convention |
| Geofence Mismatch | Map pin + alert dot badge | `danger` | Dashed fence circle = wrong location |
| Open / Closed | Reuses present / absent glyph | success / danger | Backwards compat with `StatusBadge` |

Usage:

```tsx
import { StatusIcon } from '@/components/StatusIcon';
import { StatusBadge } from '@/components/feedback';

<StatusIcon status="late" size="md" />
<StatusBadge status="expired" />
```

## 2. AI Image Generation Prompts

Append to every prompt: `flat vector, rounded shapes, soft gradient, no text, no photorealism, mobile app illustration`.

1. **Onboarding hero — Scan to check-in:** `happy student holding smartphone scanning large floating QR code, checkmark popping out, indigo background #EEF2FF, flat vector with soft 3D depth --ar 4:3 --no text, watermark`
2. **All checked in:** `clipboard with all checkboxes ticked green, confetti, small plant, cream background, calm celebratory --ar 1:1 --no text`
3. **No internet:** `smartphone with disconnected wifi symbol, gray dashed line to cloud, slate palette, sympathetic --ar 1:1 --no text`
4. **Camera disabled:** `phone with QR scanner frame, lens with slash badge, permission dialog shape, amber accent, friendly --ar 1:1 --no text`

In-app fallback (no assets needed): `EmptyArt kind="all-checked-in" | "no-internet" | "camera-disabled" | "no-results"`.

```tsx
import { EmptyState } from '@/components/feedback';

<EmptyState title="All checked in for today" hint="See you at the next event." art="all-checked-in" />
```

## 3. Design Tokens (`src/constants/icons.ts`)

- Render: `sm 16 / md 20 / lg 24`. Tabs use `lg 24`.
- Touch: `44x44 iOS / 48x48 Android` (`ICON_TOUCH_MIN`). 20px glyph in 44px target = 12px padding/side.
- Stroke: `1.5px` at 16/20px, `2px` at 24px. Round caps/joins. Radius inner 2px, container 6px. Never scale stroke — redraw per size.
- Tabs: inactive outline `#9CA3AF` + label `#6B7280` 500; active filled `primary #047857` + wash `#04785714` + label semibold. Dark mode active `accent #10B981`. Ship as explicit `active/ / inactive/` assets, no runtime tint.
