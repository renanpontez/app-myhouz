import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/stores";
import { useAuth } from "@/hooks/useAuth";
import { getStorage } from "@/core/config";
import { STORAGE_KEYS } from "@/data/storage/storage.interface";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      const savedEmail = getStorage().getString(STORAGE_KEYS.LAST_EMAIL);
      router.replace(savedEmail ? "/(auth)/signin" : "/(auth)/signup");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  return <>{children}</>;
}
