import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useCreateReminder } from "@/hooks/useReminders";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { toast } from "@/stores/toast.store";

export default function NewReminderScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createReminder = useCreateReminder();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!dueAt) return;
    try {
      await createReminder.mutateAsync({
        title,
        due_at: dueAt.toISOString(),
        assigned_to: assignedTo || undefined,
      });
      router.dismiss();
    } catch (err) {
      console.error("[CREATE_REMINDER]", err);
      toast.error(t("error.generic"));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.dismiss()}>
            <Text className="text-primary text-base">{t("common.cancel")}</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {t("reminders.addReminder")}
          </Text>
          <View className="w-16" />
        </View>

        <View className="gap-5">
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("reminders.reminderTitle")}</Text>
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
              value={title}
              onChangeText={setTitle}
              placeholder={t("reminders.reminderTitle")}
              placeholderTextColor="#64697A"
              autoFocus
            />
          </View>

          <DateTimePicker
            value={dueAt}
            onChange={setDueAt}
            mode="datetime"
            label={t("reminders.dueAt")}
            minimumDate={new Date()}
            placeholder={t("reminders.selectDateTime")}
          />

          <MemberPicker
            value={assignedTo}
            onChange={setAssignedTo}
            label={t("reminders.assignedTo")}
          />
        </View>

        <Pressable
          className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8"
          onPress={handleCreate}
          disabled={createReminder.isPending || !title.trim() || !dueAt}
        >
          {createReminder.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">{t("common.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
