import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { COLORS } from '@/constants/colors';
import { ICON_RENDER_SIZES, ICON_STROKE, STATUS_META, type AttendanceVisualStatus, type IconRenderSize } from '@/constants/icons';

type Props = {
  status: AttendanceVisualStatus;
  size?: IconRenderSize | number;
  testID?: string;
};

// Status glyphs: 24x24 viewBox, round caps/joins, base shape + one modifier
// badge. Readable at 16px — max 2 visual elements per icon.
export function StatusIcon({ status, size = 'md', testID }: Props) {
  const px = typeof size === 'number' ? size : ICON_RENDER_SIZES[size];
  const stroke = px <= 20 ? ICON_STROKE.md : ICON_STROKE.lg;
  const color = STATUS_META[status].color;
  const label = STATUS_META[status].label;

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.box, { width: px, height: px }]}
    >
      <Svg width={px} height={px} viewBox="0 0 24 24" fill="none">
        <Glyph status={status} color={color} stroke={stroke} />
      </Svg>
    </View>
  );
}

function Glyph({ status, color, stroke }: { status: AttendanceVisualStatus; color: string; stroke: number }) {
  const common = {
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (status) {
    case 'on-time':
    case 'present':
    case 'open':
      // Check in circle — success/present.
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M8.5 12.5l2.5 2.5 4.5-5.5" {...common} />
        </>
      );
    case 'late':
      // Clock with hands at ~12:05 — late check-in.
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Line x1="12" y1="7.5" x2="12" y2="12" {...common} />
          <Line x1="12" y1="12" x2="15.5" y2="13.5" {...common} />
          <Circle cx="12" cy="12" r="1" fill={color} />
        </>
      );
    case 'absent':
    case 'closed':
      // X in circle — negative, always paired with label.
      return (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Line x1="9" y1="9" x2="15" y2="15" {...common} />
          <Line x1="15" y1="9" x2="9" y2="15" {...common} />
        </>
      );
    case 'excused':
      // Document with check — neutral (slate), not red.
      return (
        <>
          <Path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" {...common} />
          <Path d="M14 3.5V8h4" {...common} />
          <Path d="M9.5 14.5l2 2 3.5-4" {...common} />
        </>
      );
    case 'expired':
      // QR finders + dashed ring + slash — expired session.
      return (
        <>
          <Rect x="3.5" y="3.5" width="6" height="6" rx="1" {...common} />
          <Rect x="14.5" y="3.5" width="6" height="6" rx="1" {...common} />
          <Rect x="3.5" y="14.5" width="6" height="6" rx="1" {...common} />
          <Line x1="13.5" y1="13.5" x2="20.5" y2="20.5" {...common} />
        </>
      );
    case 'geofence':
      // Map pin outside dashed fence + alert dot.
      return (
        <>
          <Path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.4 12 21 12 21z" {...common} />
          <Circle cx="12" cy="10.5" r="2.2" {...common} />
          <Circle cx="18.5" cy="18.5" r="3.2" fill={COLORS.card} stroke={color} strokeWidth={stroke} />
          <Line x1="18.5" y1="17.2" x2="18.5" y2="18.6" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
          <Circle cx="18.5" cy="19.8" r="0.6" fill={color} />
        </>
      );
    case 'generic':
    default:
      return <Circle cx="12" cy="12" r="9" stroke={COLORS.border} strokeWidth={stroke} strokeDasharray="3 3" />;
  }
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
