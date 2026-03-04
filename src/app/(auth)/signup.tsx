import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/stores/toast.store";

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signUpWithEmail, isLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    if (password.length < 6) {
      toast.error(t("auth.errorPasswordTooShort"));
      return;
    }
    try {
      await signUpWithEmail({ name, email, password });
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        toast.error(t("auth.errorEmailTaken"));
      } else if (msg.includes("password")) {
        toast.error(t("auth.errorPasswordTooShort"));
      } else if (msg.includes("valid email") || msg.includes("invalid email")) {
        toast.error(t("auth.errorInvalidEmail"));
      } else if (msg.includes("too many")) {
        toast.error(t("auth.errorTooManyAttempts"));
      } else {
        toast.error(t("auth.errorSignUp"));
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-8">
        <Pressable onPress={() => router.back()} className="mb-8">
          <Text className="text-primary text-base">{t("common.back")}</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-8">
          {t("auth.signUp")}
        </Text>

        <View className="gap-4 mb-6">
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">
              {t("auth.name")}
            </Text>
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder={t("auth.name")}
              placeholderTextColor="#64697A"
            />
          </View>

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
              placeholder={t("auth.password")}
              placeholderTextColor="#64697A"
            />
          </View>
        </View>

        <Pressable
          className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
          onPress={handleSignUp}
          disabled={isLoading || !name || !email || !password}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">
              {t("auth.signUp")}
            </Text>
          )}
        </Pressable>

        <Pressable
          className="mt-6 items-center"
          onPress={() => router.push("/(auth)/signin")}
        >
          <Text className="text-muted-foreground text-sm">
            {t("auth.hasAccount")}{" "}
            <Text className="text-primary font-semibold">
              {t("auth.signIn")}
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
