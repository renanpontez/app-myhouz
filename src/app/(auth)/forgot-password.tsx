import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { supabase } from "@/data/supabase/client";
import { toast } from "@/stores/toast.store";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success(t("auth.resetPasswordSent"));
      router.back();
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
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
            <Pressable onPress={() => router.back()} className="mb-4">
              <Text className="text-primary text-base">{t("common.back")}</Text>
            </Pressable>

            <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-4 text-center">
              {t("auth.resetPassword")}
            </Text>

            <View className="mb-6">
              <Text className="text-sm text-muted-foreground mb-1.5">
                {t("auth.email")}
              </Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t("auth.email")}
                placeholderTextColor="#64697A"
              />
            </View>

            <Pressable
              className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
              onPress={handleReset}
              disabled={loading || !email}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-semibold text-base">
                  {t("auth.resetPassword")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
