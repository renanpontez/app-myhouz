import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getHttpClient } from "@/core/config";
import { API } from "@/data/api/endpoints";
import { useHouseholdStore } from "@/stores";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";

export default function HouseholdSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { household, activeHouseholdId } = useHouseholdStore();
  const [name, setName] = useState(household?.name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeHouseholdId) return;
    try {
      setSaving(true);
      const httpClient = getHttpClient();
      await httpClient.patch(API.household(activeHouseholdId).detail, { name });
      toast.success(t("common.success"));
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t("settings.deleteHousehold"), t("settings.deleteHouseholdConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"), style: "destructive", onPress: async () => {
          if (!activeHouseholdId) return;
          try {
            const httpClient = getHttpClient();
            await httpClient.delete(API.household(activeHouseholdId).detail);
            useHouseholdStore.getState().reset();
            router.replace("/onboarding");
          } catch { toast.error(t("error.generic")); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.primary.DEFAULT} /></Pressable>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t("settings.householdSettings")}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm text-muted-foreground mb-1.5">{t("settings.householdName")}</Text>
          <TextInput className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark" value={name} onChangeText={setName} />
        </View>

        <Pressable className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mb-6" onPress={handleSave} disabled={saving || !name.trim()}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-primary-foreground font-semibold text-base">{t("common.save")}</Text>}
        </Pressable>

        <Pressable className="w-full border border-destructive rounded-2xl py-4 items-center mt-8" onPress={handleDelete}>
          <Text className="text-destructive font-semibold text-base">{t("settings.deleteHousehold")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
