import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/stores/toast.store";
import { getStorage } from "@/core/config";
import { STORAGE_KEYS } from "@/data/storage/storage.interface";

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signInWithEmail, isLoading } = useAuth();

  const savedEmail = useMemo(() => getStorage().getString(STORAGE_KEYS.LAST_EMAIL) ?? "", []);
  const isReturningUser = savedEmail.length > 0;

  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    try {
      await signInWithEmail({ email, password });
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (msg.includes("invalid") || msg.includes("credentials")) {
        toast.error(t("auth.errorInvalidCredentials"));
      } else if (msg.includes("email not confirmed")) {
        toast.error(t("auth.errorEmailNotConfirmed"));
      } else if (msg.includes("too many")) {
        toast.error(t("auth.errorTooManyAttempts"));
      } else {
        toast.error(t("auth.errorSignIn"));
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-8 sm:items-center sm:px-12 lg:justify-center lg:pt-0"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full sm:max-w-form lg:max-w-none lg:flex-row lg:items-center gap-8 lg:gap-16">
          {/* Logo */}
          <View className="justify-center items-center mb-6 lg:mb-0 lg:flex-1">
            <Image
              source={require("../../../assets/myhouz-logo.png")}
              className="w-[180px] h-[75px] lg:w-[240px] lg:h-[100px]"
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View className="lg:flex-1 lg:max-w-[400px]">
            <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-4 text-center">
              {isReturningUser ? t("auth.welcomeBack") : t("auth.signIn")}
            </Text>

            <View className="gap-4 mb-6">
              <View>
                <Text className="text-sm text-muted-foreground mb-1.5">
                  {t("auth.email")}
                </Text>
                <TextInput
                  className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder={t("auth.email")}
                  placeholderTextColor="#64697A"
                />
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-1.5">
                  {t("auth.password")}
                </Text>
                <TextInput
                  className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoFocus={isReturningUser}
                  placeholder={t("auth.password")}
                  placeholderTextColor="#64697A"
                />
              </View>

              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text className="text-primary text-sm text-right">
                  {t("auth.forgotPassword")}
                </Text>
              </Pressable>
            </View>

            <Pressable
              className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
              onPress={handleSignIn}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-semibold text-base">
                  {t("auth.signIn")}
                </Text>
              )}
            </Pressable>

            <Pressable
              className="mt-6 items-center"
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text className="text-muted-foreground text-sm">
                {t("auth.noAccount")}{" "}
                <Text className="text-primary font-semibold">
                  {t("auth.signUp")}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
