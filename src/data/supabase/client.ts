import { createClient } from "@supabase/supabase-js";
import { createMMKV } from "react-native-mmkv";
import { env } from "@/core/config/env";

// Dedicated MMKV instance for Supabase auth persistence
const supabaseStorage = createMMKV({ id: "supabase-auth" });

const MMKVAdapter = {
  getItem: (key: string): string | null => {
    return supabaseStorage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    supabaseStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    supabaseStorage.remove(key);
  },
};

if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "Supabase credentials not configured. Auth features will not work.",
  );
}

export const supabase = createClient(
  env.SUPABASE_URL || "https://placeholder.supabase.co",
  env.SUPABASE_PUBLISHABLE_KEY || "placeholder-key",
  {
    auth: {
      storage: MMKVAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  return session;
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error);
    return null;
  }
  return user;
};
