import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '@/theme';
import RootNavigator from '@/navigation/RootNavigator';
import { hydrateLastStudyDay, hydrateProgress, reconcileProgress } from '@/lib/progress';
import { hydrateSettings } from '@/lib/settings';
import { hydrateProfile } from '@/hooks/useProfile';
import { initializeAds } from '@/lib/ads';
import { hydratePremium, usePremiumSync } from '@/lib/premium';
import { hydrateWallpaper, isWallpaperHydrated } from '@/hooks/useWallpaper';
import { DailyAdConsent } from '@/components/DailyAdConsent';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Shell() {
  const { theme, colors, hydrated } = useTheme();
  const [wallpaperHydrated, setWallpaperHydrated] = useState(isWallpaperHydrated());
  // Keeps the ad layer's synchronous premium check up to date.
  usePremiumSync();

  useEffect(() => {
    // Load saved completion state before the first counts render, then try a
    // best-effort cloud merge (a no-op when signed out or offline).
    hydrateSettings().catch(() => {});
    hydrateProgress().then(() => {
      reconcileProgress().catch(() => {});
    });
    // Needed before the reminder digest is written, and cheap enough that it
    // rides along with the rest rather than waiting for a screen to want it.
    hydrateLastStudyDay().catch(() => {});
    // Profile, streak and XP; all cloud steps are best-effort.
    hydrateProfile().catch(() => {});
    // The chosen wallpaper, before the first paint of Home.
    hydrateWallpaper()
      .catch(() => {})
      // Even a failed read has to release the first paint, or an unreadable
      // entry is a permanently blank app.
      .finally(() => setWallpaperHydrated(true));
    // Load the cached ad-free expiry before any ad decision is made, then
    // start the SDK and preload so the first ad has no wait.
    hydratePremium().then(() => initializeAds()).catch(() => {});
  }, []);

  /**
   * Nothing renders until the stored theme is known.
   *
   * Without this the app painted its default dark theme for the frames it took
   * AsyncStorage to answer, then swapped — which a user reads as "it opens
   * wrong and then corrects itself". Holding the first paint costs those same
   * few milliseconds and shows one theme instead of two.
   *
   * The wallpaper is waited on for the same reason. Only the *record* is
   * waited on, not the decoded photo: reading a path is quick and lets the
   * image fade in over the right palette, whereas blocking on a decode would
   * hold the whole app behind a 1440x2880 bitmap.
   *
   * The placeholder is painted in the resolved background rather than left
   * transparent, so the gap is the app's own colour and not the window's.
   */
  if (!hydrated || !wallpaperHydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const navTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {/* Android draws edge-to-edge in RN 0.87, so the bar is translucent and
          only the icon style is ours to set. */}
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
      <DailyAdConsent />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    // Outside the providers on purpose: if the thing that throws is a provider,
    // a boundary nested inside it never runs.
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <Shell />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
