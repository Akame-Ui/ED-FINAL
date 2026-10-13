import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Link href="/login" style={styles.link}>
        Return home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: COLORS.accent,
    fontSize: 16,
  },
});