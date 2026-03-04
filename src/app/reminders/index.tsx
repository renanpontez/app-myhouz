import { View, Text, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useReminders, useToggleReminder } from "@/hooks/useReminders";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { colors } from "@/styles/colors";
import type { Reminder } from "@/domain/models";
import { format, isPast, isToday as isDateToday } from "date-fns";

function ReminderRowContent({
  reminder,
  onToggle,
  onPress,
  t,
}: {
  reminder: Reminder;
  onToggle: () => void;
  onPress: () => void;
  t: (key: string) => string;
}) {
  const isOverdue = !reminder.is_completed && isPast(new Date(reminder.due_at));
  const isDueToday = isDateToday(new Date(reminder.due_at));

  const bellColor = isOverdue
    ? colors.destructive.DEFAULT
    : isDueToday
      ? colors.warning.DEFAULT
      : colors.muted.foreground;

  return (
    <ListRow
      icon={{
        icon: "notifications",
        color: bellColor,
      }}
      leading={
        <Pressable
          onPress={onToggle}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: reminder.is_completed ? colors.success.DEFAULT : colors.border.DEFAULT,
            backgroundColor: reminder.is_completed ? colors.success.DEFAULT : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
          hitSlop={8}
        >
          {reminder.is_completed && <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>
      }
      title={reminder.title}
      strikethrough={reminder.is_completed}
      subtitle={
        <Text
          style={{
            fontSize: 12,
            color: isOverdue ? colors.destructive.DEFAULT : colors.muted.foreground,
            fontWeight: isOverdue ? "600" : "400",
          }}
        >
          {format(new Date(reminder.due_at), "MMM d, HH:mm")}
        </Text>
      }
      badge={
        isOverdue ? (
          <Badge label={t("reminders.overdue")} variant="destructive" icon="alert-circle" />
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

export default function RemindersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "overdue" | "completed">("active");
  const apiStatus = filter === "overdue" ? "active" : filter;
  const { data, refetch, isLoading } = useReminders({ status: apiStatus });
  const toggleReminder = useToggleReminder();
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const allReminders = data?.data?.data ?? [];

  const overdueCount = useMemo(
    () =>
      allReminders.filter(
        (r) => !r.is_completed && isPast(new Date(r.due_at)),
      ).length,
    [allReminders],
  );

  const reminders = useMemo(
    () =>
      filter === "overdue"
        ? allReminders.filter((r) => !r.is_completed && isPast(new Date(r.due_at)))
        : allReminders,
    [allReminders, filter],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filters = ["active", "overdue", "completed"] as const;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.DEFAULT} />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark flex-1">
          {t("reminders.title")}
        </Text>
        <Pressable onPress={() => router.push("/reminders/new")} hitSlop={8}>
          <Ionicons name="add" size={26} color={colors.primary.DEFAULT} />
        </Pressable>
      </View>

      {/* Filters */}
      <View className="flex-row px-5 gap-2 mb-3">
        {filters.map((f) => {
          const isActive = filter === f;
          const label =
            f === "active" ? t("common.active")
            : f === "overdue" ? `${t("dashboard.overdue")}${overdueCount > 0 ? ` (${overdueCount})` : ""}`
            : t("reminders.completed");

          return (
            <Pressable
              key={f}
              className={`px-4 py-2 rounded-full ${isActive ? (f === "overdue" ? "bg-destructive" : "bg-primary") : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`text-sm font-medium ${isActive ? "text-white" : "text-muted-foreground"}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlashList
        data={reminders}
        renderItem={({ item }) => (
          <ReminderRowContent
            reminder={item}
            onToggle={() => toggleReminder.mutate(item.id)}
            onPress={() => router.push(`/reminders/${item.id}`)}
            t={t}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center pt-20">
              <Ionicons name="notifications-outline" size={48} color={colors.muted.foreground} />
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mt-4">
                {t("reminders.noReminders")}
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                {t("reminders.noRemindersSubtitle")}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
