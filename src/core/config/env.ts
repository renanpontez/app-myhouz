interface Environment {
  API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  ENV: "development" | "production";
  DEBUG: boolean;
}

const getEnvironment = (): Environment => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  return {
    API_URL: apiUrl,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
    ENV: __DEV__ ? "development" : "production",
    DEBUG: __DEV__,
  };
};

export const env = getEnvironment();
