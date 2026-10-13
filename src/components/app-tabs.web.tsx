import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import type { RelativePathString } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, View, StyleSheet } from 'react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import { useRole } from '@/lib/auth';

export default function AppTabs() {
  const { role } = useRole();
  const showTeacher = role === 'teacher' || role === 'admin';
  const showAdmin = role === 'admin';

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/(tabs)" asChild>
            <TabButton icon="home">Events</TabButton>
          </TabTrigger>
          <TabTrigger name="scan" href="/(tabs)/scan" asChild>
            <TabButton icon="scan">Scan</TabButton>
          </TabTrigger>
          <TabTrigger name="history" href={'/(tabs)/history' as RelativePathString} asChild>
            <TabButton icon="history">History</TabButton>
          </TabTrigger>
          {showTeacher ? (
            <TabTrigger name="teacher" href={'/(tabs)/teacher' as RelativePathString} asChild>
              <TabButton icon="teachers">Teacher</TabButton>
            </TabTrigger>
          ) : null}
          {showAdmin ? (
            <TabTrigger name="admin" href={'/(tabs)/admin' as RelativePathString} asChild>
              <TabButton icon="admin">Admin</TabButton>
            </TabTrigger>
          ) : null}
          <TabTrigger name="profile" href={'/(tabs)/profile' as RelativePathString} asChild>
            <TabButton icon="profile">Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, icon, isFocused, ...props }: TabTriggerSlotProps & { icon: 'home' | 'teachers' | 'scan' | 'history' | 'profile' | 'admin' }) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <SymbolView
          name={
            icon === 'home'
              ? { ios: isFocused ? 'house.fill' : 'house', android: 'home', web: 'home' }
              : icon === 'teachers'
                ? { ios: isFocused ? 'person.2.fill' : 'person.2', android: 'school', web: 'school' }
                : icon === 'scan'
                  ? { ios: 'qrcode', android: 'qr_code_scanner', web: 'qr_code_scanner' }
                  : icon === 'history'
                    ? { ios: isFocused ? 'clock.fill' : 'clock', android: 'history', web: 'history' }
                    : icon === 'admin'
                      ? { ios: isFocused ? 'shield.fill' : 'shield', android: 'admin_panel_settings', web: 'admin_panel_settings' }
                      : { ios: isFocused ? 'person.fill' : 'person', android: 'person', web: 'person' }
          }
          tintColor={isFocused ? COLORS.primary : COLORS.textSecondary}
          size={18}
        />
        <ThemedText type="small" style={{ color: isFocused ? COLORS.primary : COLORS.textSecondary }}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={[styles.innerContainer, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Expo Starter
        </ThemedText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link">Docs</ThemedText>
            <SymbolView
              tintColor={COLORS.textPrimary}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    borderWidth: 1,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
