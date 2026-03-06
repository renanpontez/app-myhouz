import React, { useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { AppProvider, useAppReady } from "@/providers";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { AuthGuard } from "@/core/guards/AuthGuard";
import { useAuthStore } from "@/stores";
import { colors } from "@/styles/colors";
import { ToastContainer } from "@/components/ui";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark } = useTheme();
  const { isReady } = useAppReady();
  const { isInitialized } = useAuthStore();

  const onLayoutRootView = useCallback(async () => {
    if (isReady && isInitialized) {
      await SplashScreen.hideAsync();
    }
  }, [isReady, isInitialized]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!isReady) {
    return null;
  }

  return (
    <AuthGuard>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ToastContainer />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: isDark
              ? colors.background.dark
              : colors.background.DEFAULT,
          },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="items/new" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }} />
        <Stack.Screen name="items/[itemId]" />
        <Stack.Screen name="routines/new" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }} />
        <Stack.Screen name="routines/[taskId]" />
        <Stack.Screen name="reminders/index" />
        <Stack.Screen name="reminders/new" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }} />
        <Stack.Screen name="reminders/[reminderId]" />
        <Stack.Screen name="urgent/index" />
        <Stack.Screen name="urgent/new" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }} />
        <Stack.Screen name="urgent/[problemId]" />
        <Stack.Screen name="members/index" />
        <Stack.Screen name="members/invite" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }} />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/household" />
        <Stack.Screen name="invite/[code]" />
        <Stack.Screen name="legal" options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }} />
      </Stack>
    </AuthGuard>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </AppProvider>
  );
}
