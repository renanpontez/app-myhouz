import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuthStore, useHouseholdStore } from "@/stores";
import { useAuth } from "@/hooks/useAuth";
import { getStorage } from "@/core/config";
import { STORAGE_KEYS } from "@/data/storage/storage.interface";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { activeHouseholdId } = useHouseholdStore();
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const inPublicRoute = segments[0] === "legal";

    if (!isAuthenticated && !inAuthGroup && !inPublicRoute) {
      const savedEmail = getStorage().getString(STORAGE_KEYS.LAST_EMAIL);
      router.replace(savedEmail ? "/(auth)/signin" : "/(auth)/signup");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(activeHouseholdId ? "/(tabs)" : "/onboarding");
    } else if (isAuthenticated && !inOnboarding && !inAuthGroup && !activeHouseholdId) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isInitialized, activeHouseholdId, segments, router]);

  return <>{children}</>;
}
