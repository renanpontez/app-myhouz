import { useCallback } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { supabase } from "@/data/supabase/client";
import { useAuthStore } from "@/stores";
import { getHttpClient } from "@/core/config";
import { API } from "@/data/api/endpoints";
import type { Profile } from "@/domain/models";

export function useAppleAuth() {
  const router = useRouter();
  const { signIn: storeSignIn, setLoading } = useAuthStore();

  const signInWithApple = useCallback(async () => {
    try {
      setLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No Apple identity token");
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) throw error;

      if (data.session) {
        const httpClient = getHttpClient();
        const response = await httpClient.get<{ data: Profile }>(
          API.user.profile,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          },
        );

        httpClient.setAuthToken(data.session.access_token);
        storeSignIn(response.data.data, data.session.access_token);
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Apple sign in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, setLoading, storeSignIn]);

  return { signInWithApple };
}
