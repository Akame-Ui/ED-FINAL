import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { COLORS } from '@/constants/colors';
import { useRole } from '@/lib/auth';

export default function AppTabs() {
  const { role } = useRole();

  return (
    <NativeTabs
      backgroundColor={COLORS.card}
      indicatorColor={COLORS.surface}
      labelStyle={{ selected: { color: COLORS.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'qrcode', selected: 'qrcode' }}
          md={{ default: 'qr_code_scanner', selected: 'qr_code_scanner' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'clock', selected: 'clock.fill' }}
          md={{ default: 'history', selected: 'history' }}
        />
      </NativeTabs.Trigger>

      {/* Teacher tab: visible to teachers + admins (they create/manage events). */}
      <NativeTabs.Trigger name="teacher" hidden={role !== 'teacher' && role !== 'admin'}>
        <NativeTabs.Trigger.Label>Teacher</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          md={{ default: 'school', selected: 'school' }}
        />
      </NativeTabs.Trigger>

      {/* Admin tab: administrators only — manage users/events/records/reports. */}
      <NativeTabs.Trigger name="admin" hidden={role !== 'admin'}>
        <NativeTabs.Trigger.Label>Admin</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'shield', selected: 'shield.fill' }}
          md={{ default: 'admin_panel_settings', selected: 'admin_panel_settings' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md={{ default: 'person', selected: 'person' }}
        />
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
