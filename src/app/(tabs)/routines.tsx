import { View, Text, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useRoutines, useToggleRoutine } from "@/hooks/useRoutines";
import { useHouseholdStore } from "@/stores";
import { isActiveToday, isCompletedThisCycle, getStreak } from "@/utils/cycle";
import { formatDisplayName } from "@/utils/format";
import { getTaskIcon } from "@/utils/task-icons";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { StreakIndicator } from "@/components/ui/StreakIndicator";
import { colors } from "@/styles/colors";
import type { RoutineTaskWithCompletions } from "@/domain/models";

function TaskRowContent({
  task,
  isCompleted,
  onToggle,
  onPress,
  assigneeName,
  streak,
  t,
}: {
  task: RoutineTaskWithCompletions;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
  assigneeName: string | null;
  streak: number;
  t: (key: string) => string;
}) {
  const TaskIcon = getTaskIcon(task.icon);
  const iconColor = isCompleted ? colors.success.DEFAULT : colors.primary.DEFAULT;

  const subtitleParts: string[] = [];
  subtitleParts.push(t(`routines.${task.recurrence}`));
  if (assigneeName) subtitleParts.push(assigneeName);

  return (
    <ListRow
      icon={{
        icon: "ellipse-outline",
        color: iconColor,
      }}
      leading={
        <Pressable
          onPress={onToggle}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: isCompleted ? colors.success.DEFAULT : colors.border.DEFAULT,
            backgroundColor: isCompleted ? colors.success.DEFAULT : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
          hitSlop={8}
        >
          {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>
      }
      title={task.title}
      strikethrough={isCompleted}
      subtitle={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TaskIcon size={12} color={colors.muted.foreground} />
          <Text style={{ fontSize: 12, color: colors.muted.foreground }}>
            {subtitleParts.join(" · ")}
          </Text>
        </View>
      }
      badge={
        <Badge label={t(`routines.${task.recurrence}`)} variant="muted" />
      }
      trailing={<StreakIndicator streak={streak} />}
      onPress={onPress}
    />
  );
}

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, refetch, isLoading } = useRoutines();
  const toggleMutation = useToggleRoutine();
  const { members } = useHouseholdStore();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [viewMode, setViewMode] = useState<"today" | "all">("today");

  const routines = data?.data?.data ?? [];

  const displayTasks = viewMode === "today"
    ? routines.filter((task) => task.is_active && isActiveToday(task.recurrence, task.recurrence_meta))
    : routines.filter((task) => task.is_active);

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      map.set(m.user_id, formatDisplayName(m.profile.name));
    }
    return map;
  }, [members]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          {t("routines.title")}
        </Text>
        <Pressable
          className="w-10 h-10 bg-primary rounded-full items-center justify-center"
          onPress={() => router.push("/routines/new")}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* View toggle */}
      <View className="flex-row px-5 gap-2 mb-3">
        <Pressable
          className={`px-4 py-2 rounded-full ${viewMode === "today" ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
          onPress={() => setViewMode("today")}
        >
          <Text className={`text-sm font-medium ${viewMode === "today" ? "text-primary-foreground" : "text-muted-foreground"}`}>
            {t("routines.todaysTasks")}
          </Text>
        </Pressable>
        <Pressable
          className={`px-4 py-2 rounded-full ${viewMode === "all" ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
          onPress={() => setViewMode("all")}
        >
          <Text className={`text-sm font-medium ${viewMode === "all" ? "text-primary-foreground" : "text-muted-foreground"}`}>
            {t("routines.allRoutines")}
          </Text>
        </Pressable>
      </View>

      <FlashList
        data={displayTasks}
        renderItem={({ item }) => {
          const isCompleted = isCompletedThisCycle(
            item.last_completed_at,
            item.recurrence,
            item.recurrence_meta,
          );
          const streak = getStreak(item.completions ?? []);
          const assigneeName = item.assigned_to
            ? memberNameMap.get(item.assigned_to) ?? null
            : null;

          return (
            <TaskRowContent
              task={item}
              isCompleted={isCompleted}
              onToggle={() => toggleMutation.mutate(item.id)}
              onPress={() => router.push(`/routines/${item.id}`)}
              assigneeName={assigneeName}
              streak={streak}
              t={t}
            />
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center pt-20">
              <Ionicons name="checkbox-outline" size={48} color={colors.muted.foreground} />
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mt-4">
                {t("routines.noTasks")}
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                {t("routines.noTasksSubtitle")}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
