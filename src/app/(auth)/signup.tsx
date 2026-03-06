import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, ScrollView } from "react-native";
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
              {t("auth.createAccount")}
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

            <Text className="text-center text-xs text-muted-foreground mt-4 px-4">
              {t("auth.agreePrefix")}
              <Text
                className="text-primary font-medium"
                onPress={() => router.push("/legal")}
              >
                {t("auth.termsAndPrivacy")}
              </Text>
            </Text>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
