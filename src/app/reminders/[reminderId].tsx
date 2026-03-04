import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useReminder, useUpdateReminder, useDeleteReminder, useToggleReminder } from "@/hooks/useReminders";
import { useHouseholdStore } from "@/stores";
import { getMemberName } from "@/utils/members";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border dark:border-border-dark">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}

export default function ReminderDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { reminderId } = useLocalSearchParams<{ reminderId: string }>();
  const { data, isLoading } = useReminder(reminderId);
  const updateReminder = useUpdateReminder(reminderId);
  const deleteReminder = useDeleteReminder();
  const toggleReminder = useToggleReminder();
  const { members } = useHouseholdStore();
  const reminder = data?.data?.data;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDueAt, setEditDueAt] = useState<Date | null>(null);
  const [editAssignedTo, setEditAssignedTo] = useState<string | null>(null);

  const enterEditMode = () => {
    if (!reminder) return;
    setEditTitle(reminder.title);
    setEditDueAt(new Date(reminder.due_at));
    setEditAssignedTo(reminder.assigned_to);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editDueAt) return;
    try {
      await updateReminder.mutateAsync({
        title: editTitle,
        due_at: editDueAt.toISOString(),
        assigned_to: editAssignedTo,
      });
      setIsEditing(false);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("common.delete"), t("reminders.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReminder.mutateAsync(reminderId);
            router.back();
          } catch {
            toast.error(t("error.generic"));
          }
        },
      },
    ]);
  };

  if (isLoading || !reminder) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <SkeletonDetail />
      </SafeAreaView>
    );
  }

  const isOverdue = !reminder.is_completed && new Date(reminder.due_at) < new Date();

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <ScrollView className="flex-1 px-6 pt-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable onPress={() => setIsEditing(false)}>
              <Text className="text-primary text-base">{t("common.cancel")}</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              {t("reminders.editReminder")}
            </Text>
            <View className="w-16" />
          </View>

          <View className="gap-5">
            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("reminders.reminderTitle")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>

            <DateTimePicker
              value={editDueAt}
              onChange={setEditDueAt}
              mode="datetime"
              label={t("reminders.dueAt")}
              placeholder={t("reminders.selectDateTime")}
            />

            <MemberPicker
              value={editAssignedTo}
              onChange={setEditAssignedTo}
              label={t("reminders.assignedTo")}
            />
          </View>

          <Pressable
            className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8"
            onPress={handleSave}
            disabled={updateReminder.isPending || !editTitle.trim() || !editDueAt}
          >
            {updateReminder.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">{t("common.saveChanges")}</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary.DEFAULT} />
          </Pressable>
          <View className="flex-row gap-4">
            <Pressable onPress={enterEditMode}>
              <Ionicons name="create-outline" size={22} color={colors.primary.DEFAULT} />
            </Pressable>
            <Pressable onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={colors.destructive.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-2">
          {reminder.title}
        </Text>

        <View className="flex-row gap-2 mb-6">
          <Text className="text-muted-foreground">
            {format(new Date(reminder.due_at), "PPP 'at' HH:mm")}
          </Text>
          {isOverdue && (
            <View className="px-3 py-0.5 rounded-full bg-destructive/10">
              <Text className="text-xs font-medium text-destructive">{t("reminders.overdue")}</Text>
            </View>
          )}
          {reminder.is_completed && (
            <View className="px-3 py-0.5 rounded-full bg-success/10">
              <Text className="text-xs font-medium text-success">{t("reminders.completed")}</Text>
            </View>
          )}
        </View>

        <View className="mb-6">
          {reminder.assigned_to && (
            <InfoRow label={t("reminders.assignedTo")} value={getMemberName(reminder.assigned_to, members)} />
          )}
          <InfoRow label={t("reminders.createdBy")} value={getMemberName(reminder.created_by, members)} />
          {reminder.is_completed && reminder.completed_by && (
            <InfoRow label={t("reminders.completedBy")} value={getMemberName(reminder.completed_by, members)} />
          )}
          {reminder.is_completed && reminder.completed_at && (
            <InfoRow
              label={t("reminders.completed")}
              value={format(new Date(reminder.completed_at), "PPP 'at' HH:mm")}
            />
          )}
        </View>

        <Pressable
          className={`w-full rounded-2xl py-4 items-center active:opacity-80 ${reminder.is_completed ? "bg-muted dark:bg-muted-dark" : "bg-success"}`}
          onPress={() => toggleReminder.mutate(reminderId)}
        >
          <Text className={`font-semibold text-base ${reminder.is_completed ? "text-muted-foreground" : "text-white"}`}>
            {reminder.is_completed ? t("reminders.markPending") : t("reminders.markDone")}
          </Text>
        </Pressable>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
