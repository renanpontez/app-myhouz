import { useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore, useHouseholdStore } from "@/stores";
import { supabase } from "@/data/supabase/client";
import { getHttpClient, getStorage } from "@/core/config";
import { API } from "@/data/api/endpoints";
import { STORAGE_KEYS } from "@/data/storage/storage.interface";
import type { Profile, HouseholdWithRole } from "@/domain/models";

interface SignInRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

async function fetchProfileWithRetry(
  httpClient: ReturnType<typeof getHttpClient>,
  token: string,
  retries = 3,
): Promise<Profile> {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  for (let i = 0; i < retries; i++) {
    try {
      const res = await httpClient.get<{ data: Profile }>(API.user.profile, config);
      return res.data.data;
    } catch (err) {
      if (i === retries - 1) throw err;
      // Profile may not exist yet (DB trigger delay) — wait and retry
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Failed to fetch profile");
}

/**
 * After auth, ensure the household store has a valid activeHouseholdId
 * that belongs to the current user. Always fetches from the API to
 * prevent stale IDs from a previous user session.
 * Returns true if a household is active, false if user needs onboarding.
 */
async function ensureActiveHousehold(
  httpClient: ReturnType<typeof getHttpClient>,
): Promise<boolean> {
  const { activeHouseholdId, setActiveHouseholdId } =
    useHouseholdStore.getState();

  try {
    const res = await httpClient.get<unknown>(API.user.households);
    const raw = res.data as any;
    const list: any[] | null = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : null;

    if (list && list.length > 0) {
      // Check if the persisted ID is still valid for this user
      const ids = list.map((h: any) => h?.household?.id ?? h?.id).filter(Boolean);
      if (activeHouseholdId && ids.includes(activeHouseholdId)) {
        return true;
      }
      // Persisted ID is stale or missing — use the first valid one
      const id = ids[0];
      if (id) {
        setActiveHouseholdId(id);
        return true;
      }
    }
  } catch (error) {
    console.error("Failed to fetch households:", error);
  }

  // No households found — clear any stale ID
  setActiveHouseholdId(null);
  return false;
}

export function useAuth() {
  const router = useRouter();
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    setLoading,
    setInitialized,
    signIn: storeSignIn,
    signOut: storeSignOut,
    updateUser,
  } = useAuthStore();

  const httpClient = getHttpClient();

  // Listen for token refreshes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) {
        httpClient.setAuthToken(session.access_token);
      } else if (event === "SIGNED_OUT") {
        httpClient.setAuthToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [httpClient]);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfileWithRetry(httpClient, session.access_token);
        httpClient.setAuthToken(session.access_token);
        storeSignIn(profile, session.access_token);
        const hasHousehold = await ensureActiveHousehold(httpClient);
        if (!hasHousehold) {
          router.replace("/onboarding");
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      httpClient.setAuthToken(null);
      storeSignOut();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [httpClient, router, setLoading, setInitialized, storeSignIn, storeSignOut]);

  const signInWithEmail = useCallback(
    async (credentials: SignInRequest) => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) throw error;

        if (data.session) {
          // Reset household store to prevent stale data from a previous user
          useHouseholdStore.getState().reset();
          const profile = await fetchProfileWithRetry(httpClient, data.session.access_token);
          httpClient.setAuthToken(data.session.access_token);
          storeSignIn(profile, data.session.access_token);
          getStorage().setString(STORAGE_KEYS.LAST_EMAIL, credentials.email);
          const hasHousehold = await ensureActiveHousehold(httpClient);
          router.replace(hasHousehold ? "/(tabs)" : "/onboarding");
        }
      } catch (error) {
        console.error("Sign in failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [httpClient, router, setLoading, storeSignIn],
  );

  const signUpWithEmail = useCallback(
    async (request: SignUpRequest) => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
          email: request.email,
          password: request.password,
          options: {
            data: { name: request.name },
          },
        });

        if (error) throw error;

        if (data.session) {
          useHouseholdStore.getState().reset();
          const profile = await fetchProfileWithRetry(httpClient, data.session.access_token);
          httpClient.setAuthToken(data.session.access_token);
          storeSignIn(profile, data.session.access_token);
          getStorage().setString(STORAGE_KEYS.LAST_EMAIL, request.email);
          const hasHousehold = await ensureActiveHousehold(httpClient);
          router.replace(hasHousehold ? "/(tabs)" : "/onboarding");
        }
      } catch (error) {
        console.error("Sign up failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [httpClient, router, setLoading, storeSignIn],
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      httpClient.setAuthToken(null);
      storeSignOut();
      useHouseholdStore.getState().reset();
      router.replace("/(auth)/signup");
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, setLoading, storeSignOut, httpClient]);

  const deleteAccount = useCallback(async () => {
    try {
      setLoading(true);
      await httpClient.delete(API.user.profile);
      await supabase.auth.signOut();
      httpClient.setAuthToken(null);
      storeSignOut();
      useHouseholdStore.getState().reset();
      getStorage().delete(STORAGE_KEYS.LAST_EMAIL);
      router.replace("/(auth)/signup");
    } catch (error) {
      console.error("Delete account failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [httpClient, router, setLoading, storeSignOut]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isInitialized,
    initializeAuth,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    deleteAccount,
    updateUser,
  };
}
