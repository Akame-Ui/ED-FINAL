import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { completeAuthFromUrl, setAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Keep the splash screen visible while the auth session is restored.
// The promise can reject on reload (already prevented/hidden) — never let
// that crash the root layout (it surfaces as an ExpoRoot/ContextNavigator error).
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Restore any persisted Supabase session so logged-in users stay logged in.
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (active) setAuth(data.session);
      } catch {
        if (active) setAuth(null);
      } finally {
        if (active) setReady(true);
      }
    })();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuth(session);
    });

    const handleUrl = ({ url }: { url: string }) => {
      void completeAuthFromUrl(url);
    };

    const urlSubscription = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) void completeAuthFromUrl(url);
    });

    return () => {
      active = false;
      urlSubscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  // Always render the navigator — never swap it for a plain <View />.
  // Conditionally returning a non-navigator root breaks expo-router's
  // ContextNavigator (ExpoRoot.js crash). Screens guard themselves via Redirect.
  return (
    <Stack initialRouteName="login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="attend" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
