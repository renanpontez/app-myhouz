import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useCreateUrgentProblem } from "@/hooks/useUrgent";
import { toast } from "@/stores/toast.store";

export default function NewUrgentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const create = useCreateUrgentProblem();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    try { await create.mutateAsync({ title, description }); router.dismiss(); } catch (err) { console.error("[CREATE_URGENT]", err); toast.error(t("error.generic")); }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.dismiss()}><Text className="text-primary text-base">{t("common.cancel")}</Text></Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">{t("urgent.addProblem")}</Text>
          <View className="w-16" />
        </View>
        <View className="gap-5">
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("urgent.problemTitle")}</Text>
            <TextInput className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark" value={title} onChangeText={setTitle} placeholder={t("urgent.problemTitle")} placeholderTextColor="#64697A" autoFocus />
          </View>
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("urgent.description")}</Text>
            <TextInput className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark" value={description} onChangeText={setDescription} placeholder={t("urgent.description")} placeholderTextColor="#64697A" multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100 }} />
          </View>
        </View>
        <Pressable className="w-full bg-destructive rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8" onPress={handleCreate} disabled={create.isPending || !title.trim() || !description.trim()}>
          {create.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">{t("urgent.addProblem")}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
