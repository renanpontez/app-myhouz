import { View, Text, Pressable, RefreshControl } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useRoutines, useToggleRoutine } from "@/hooks/useRoutines";
import { useHouseholdStore } from "@/stores";
import { isActiveToday, isCompletedThisCycle, getStreak } from "@/utils/cycle";
import { formatDisplayName } from "@/utils/format";
import { getTaskIcon } from "@/utils/task-icons";
import { Badge } from "@/components/ui/Badge";
import { StreakIndicator } from "@/components/ui/StreakIndicator";
import { SkeletonListRow } from "@/components/ui/Skeleton";
import { colors } from "@/styles/colors";
import type { RoutineTaskWithCompletions } from "@/domain/models";

function TaskRowContent({
  task,
  isCompleted: serverCompleted,
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
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const isCompleted = optimistic ?? serverCompleted;

  const prevServer = useRef(serverCompleted);
  if (prevServer.current !== serverCompleted) {
    prevServer.current = serverCompleted;
    setOptimistic(null);
  }

  const TaskIcon = getTaskIcon(task.icon);

  const subtitleParts: string[] = [];
  subtitleParts.push(t(`routines.${task.recurrence}`));
  if (assigneeName) subtitleParts.push(assigneeName);

  const handleToggle = () => {
    setOptimistic(!isCompleted);
    onToggle();
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
      <Pressable
        onPress={handleToggle}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: isCompleted ? colors.success.DEFAULT : colors.border.DEFAULT,
          backgroundColor: isCompleted ? colors.success.DEFAULT : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
        hitSlop={10}
      >
        {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
      </Pressable>

      {/* Card — separate Pressable for navigation */}
      <Pressable
        onPress={onPress}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, borderWidth: 1 }}
        className="bg-card dark:bg-card-dark border-border dark:border-border-dark active:opacity-80"
      >
        <TaskIcon size={20} color={colors.primary.DEFAULT} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: "500",
                flex: 1,
                textDecorationLine: isCompleted ? "line-through" : "none",
                color: isCompleted ? colors.muted.foreground : colors.foreground.DEFAULT,
              }}
              className={isCompleted ? "text-muted-foreground" : "text-foreground dark:text-foreground-dark"}
            >
              {task.title}
            </Text>
            <Badge label={t(`routines.${task.recurrence}`)} variant="muted" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <TaskIcon size={12} color={colors.muted.foreground} />
            <Text style={{ fontSize: 12, color: colors.muted.foreground }}>
              {subtitleParts.join(" · ")}
            </Text>
          </View>
        </View>
        <View style={{ marginLeft: 8 }}>
          <StreakIndicator streak={streak} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted.foreground} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, refetch, isLoading } = useRoutines();
  const toggleMutation = useToggleRoutine();
  const { members } = useHouseholdStore();

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      refetchRef.current();
    }, []),
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
            <Animated.View entering={FadeIn.duration(300)}>
              <TaskRowContent
                task={item}
                isCompleted={isCompleted}
                onToggle={() => {
                  toggleMutation.mutate(item.id, {
                    onSuccess: () => refetch(),
                  });
                }}
                onPress={() => router.push(`/routines/${item.id}`)}
                assigneeName={assigneeName}
                streak={streak}
                t={t}
              />
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View>
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonListRow key={i} />
              ))}
            </View>
          ) : (
            <View className="items-center pt-20">
              <Ionicons name="checkbox-outline" size={48} color={colors.muted.foreground} />
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mt-4">
                {t("routines.noTasks")}
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                {t("routines.noTasksSubtitle")}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
