import { View, Text, ScrollView, Pressable, RefreshControl, Image } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuthStore, useHouseholdStore } from "@/stores";
import { useItems } from "@/hooks/useItems";
import { useRoutines, useToggleRoutine } from "@/hooks/useRoutines";
import { useReminders } from "@/hooks/useReminders";
import { useUrgentProblems } from "@/hooks/useUrgent";
import { useHousehold } from "@/hooks/useHousehold";
import {
  isActiveOnDate,
  isCompletedThisCycle,
  hasCompletionOnDate,
  getStreak,
} from "@/utils/cycle";
import { formatDisplayName, getInitials } from "@/utils/format";
import { getTaskIcon } from "@/utils/task-icons";
import { WeekStrip } from "@/components/ui/WeekStrip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { StreakIndicator } from "@/components/ui/StreakIndicator";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { colors } from "@/styles/colors";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameWeek,
  isSameDay,
  format,
  isPast,
  isToday as isDateToday,
} from "date-fns";
import type { RoutineTaskWithCompletions, HouseholdItem, Reminder } from "@/domain/models";

const MAX_DASHBOARD_ROWS = 5;

function getTimeGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.goodMorning";
  if (hour < 18) return "dashboard.goodAfternoon";
  return "dashboard.goodEvening";
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const { members } = useHouseholdStore();
  const mutedFg = isDark ? colors.muted.foregroundDark : colors.muted.foreground;
  const { fetchHousehold } = useHousehold();
  const toggleMutation = useToggleRoutine();

  const itemsQuery = useItems({ status: "pending" });
  const routinesQuery = useRoutines();
  const remindersQuery = useReminders({ status: "active" });
  const urgentQuery = useUrgentProblems({ active: true });

  // Store refetch fns in a ref so useFocusEffect has stable deps
  const refetchRef = useRef({ routines: routinesQuery.refetch, items: itemsQuery.refetch, reminders: remindersQuery.refetch, urgent: urgentQuery.refetch });
  refetchRef.current = { routines: routinesQuery.refetch, items: itemsQuery.refetch, reminders: remindersQuery.refetch, urgent: urgentQuery.refetch };

  useFocusEffect(
    useCallback(() => {
      refetchRef.current.routines();
      refetchRef.current.items();
      refetchRef.current.reminders();
      refetchRef.current.urgent();
    }, []),
  );

  const [refreshing, setRefreshing] = useState(false);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedDay, setSelectedDay] = useState(new Date());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchRef.current.routines(),
      refetchRef.current.items(),
      refetchRef.current.reminders(),
      refetchRef.current.urgent(),
      fetchHousehold(),
    ]);
    setOptimisticToggles(new Map());
    setRefreshing(false);
  }, [fetchHousehold]);

  const isInitialLoad =
    itemsQuery.isLoading &&
    routinesQuery.isLoading &&
    remindersQuery.isLoading &&
    urgentQuery.isLoading;

  const pendingItems = itemsQuery.data?.data?.data ?? [];
  const routines = routinesQuery.data?.data?.data ?? [];
  const reminders = remindersQuery.data?.data?.data ?? [];
  const urgentProblems = urgentQuery.data?.data?.data ?? [];

  const displayName = user?.name ? formatDisplayName(user.name) : "";

  // Week navigation
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });
  const weekLabel = `${format(weekDays[0]!, "d MMM")} – ${format(weekDays[6]!, "d MMM")}`;

  // Member name map
  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      map.set(m.user_id, formatDisplayName(m.profile.name));
    }
    return map;
  }, [members]);

  // Optimistic toggle overrides: taskId → toggled completed state
  const [optimisticToggles, setOptimisticToggles] = useState<Map<string, boolean>>(new Map());

  // Helper: is a task completed on a given day, respecting optimistic overrides
  const isTaskDoneOnDay = useCallback(
    (task: (typeof routines)[0], day: Date) => {
      // Optimistic overrides always apply for today (toggles are always for today)
      if (isSameDay(day, new Date())) {
        const override = optimisticToggles.get(task.id);
        if (override !== undefined) return override;
        return isCompletedThisCycle(task.last_completed_at, task.recurrence, task.recurrence_meta);
      }
      return hasCompletionOnDate(task.completions ?? [], day);
    },
    [optimisticToggles],
  );

  // Per-day status for week strip
  const dayStatuses = useMemo(() => {
    return weekDays.map((day) => {
      const activeTasks = routines.filter(
        (task) =>
          task.is_active &&
          isActiveOnDate(task.recurrence, task.recurrence_meta, day),
      );
      const done = activeTasks.filter((task) => isTaskDoneOnDay(task, day)).length;
      return { total: activeTasks.length, done };
    });
  }, [weekDays, routines, isTaskDoneOnDay]);

  // Today's tasks for selected day
  const selectedDayTasks = useMemo(() => {
    return routines.filter(
      (task) =>
        task.is_active &&
        isActiveOnDate(task.recurrence, task.recurrence_meta, selectedDay),
    );
  }, [routines, selectedDay]);

  const completedCount = selectedDayTasks.filter((task) =>
    isTaskDoneOnDay(task, selectedDay),
  ).length;

  const isSelectedToday = isSameDay(selectedDay, new Date());
  const isSelectedTodayOrFuture = isSelectedToday || selectedDay > new Date();

  // Overdue reminders count
  const overdueCount = useMemo(
    () =>
      reminders.filter(
        (r) => !r.is_completed && isPast(new Date(r.due_at)),
      ).length,
    [reminders],
  );

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {isInitialLoad ? (
          <SkeletonDashboard />
        ) : (
        <>
        {/* Header: Avatar + Greeting + Bell */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingBottom: 16,
            paddingTop: 4,
          }}
        >
          {/* Avatar */}
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                marginRight: 12,
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary.DEFAULT + "18",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary.DEFAULT }}>
                {user?.name ? getInitials(user.name) : ""}
              </Text>
            </View>
          )}

          {/* Greeting text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13 }}
              className="text-muted-foreground dark:text-muted-foreground-dark"
            >
              {t(getTimeGreetingKey())}
            </Text>
            <Text
              style={{ fontSize: 22, fontWeight: "700" }}
              className="text-foreground dark:text-foreground-dark"
            >
              {displayName}
            </Text>
          </View>

          {/* Notification bell */}
          {(() => {
            const alertCount = reminders.length + urgentProblems.length;
            const hasOverdue = overdueCount > 0 || urgentProblems.length > 0;
            return (
              <Pressable
                onPress={() => router.push("/reminders/")}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 8,
                }}
                hitSlop={8}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={hasOverdue ? colors.destructive.DEFAULT : mutedFg}
                />
                {alertCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 0,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      paddingHorizontal: 4,
                      backgroundColor: hasOverdue ? colors.destructive.DEFAULT : colors.primary.DEFAULT,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                      {alertCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })()}
        </Animated.View>

        {/* Week Strip */}
        <WeekStrip
          weekDays={weekDays}
          dayStatuses={dayStatuses}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          weekLabel={weekLabel}
          onPrevWeek={() => setWeekStart((w) => subWeeks(w, 1))}
          onNextWeek={() => setWeekStart((w) => addWeeks(w, 1))}
          isCurrentWeek={isCurrentWeek}
          onGoToToday={() => {
            setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
            setSelectedDay(new Date());
          }}
          todayLabel={t("dashboard.today")}
        />

        {/* Today's Tasks Section */}
        <Animated.View entering={FadeIn.duration(300).delay(100)} className="mb-4">
          <SectionHeader
            title={t("dashboard.todaysTasks")}
            counter={t("dashboard.tasksCompleted", {
              done: completedCount,
              total: selectedDayTasks.length,
            })}
            action={
              isSelectedTodayOrFuture
                ? { icon: "add", onPress: () => router.push(
                    isSelectedToday
                      ? "/routines/new"
                      : `/routines/new?startsAt=${format(selectedDay, "yyyy-MM-dd")}`,
                  ) }
                : undefined
            }
          />
          {selectedDayTasks.length === 0 ? (
            <View className="bg-card dark:bg-card-dark rounded-2xl px-4 py-6 border border-border dark:border-border-dark items-center">
              <Text className="text-muted-foreground text-sm">
                {t("dashboard.noTasksToday")}
              </Text>
            </View>
          ) : (
            <>
              {selectedDayTasks.slice(0, MAX_DASHBOARD_ROWS).map((task) => {
                const isDone = isTaskDoneOnDay(task, selectedDay);
                return (
                  <DashboardTaskRow
                    key={task.id}
                    task={task}
                    isCompleted={isDone}
                    memberNameMap={memberNameMap}
                    onToggle={() => {
                      setOptimisticToggles((prev) => {
                        const next = new Map(prev);
                        next.set(task.id, !isDone);
                        return next;
                      });
                      toggleMutation.mutate(task.id, {
                        onError: () => {
                          setOptimisticToggles((prev) => {
                            const next = new Map(prev);
                            next.delete(task.id);
                            return next;
                          });
                        },
                      });
                    }}
                    onPress={() => router.push(`/routines/${task.id}`)}
                  />
                );
              })}
              {selectedDayTasks.length > MAX_DASHBOARD_ROWS && (
                <ViewAllLink
                  label={t("dashboard.viewAll")}
                  onPress={() => router.push("/(tabs)/routines")}
                />
              )}
            </>
          )}
        </Animated.View>

        {/* Items Preview */}
        <Animated.View entering={FadeIn.duration(300).delay(150)} className="mb-4">
          <SectionHeader
            title={t("dashboard.items")}
            counter={`${pendingItems.length}`}
          />
          {pendingItems.length === 0 ? (
            <View className="bg-card dark:bg-card-dark rounded-2xl px-4 py-6 border border-border dark:border-border-dark items-center">
              <Text className="text-muted-foreground text-sm mb-3">
                {t("items.noItems")}
              </Text>
              <Pressable
                onPress={() => router.push("/items/new")}
                className="flex-row items-center gap-1.5 active:opacity-70"
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, fontWeight: "600" }}>
                  {t("items.addItem")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {pendingItems.slice(0, 3).map((item) => (
                <DashboardItemRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/items/${item.id}`)}
                  t={t}
                />
              ))}
              {pendingItems.length > 3 && (
                <ViewAllLink
                  label={t("dashboard.viewAll")}
                  onPress={() => router.push("/(tabs)/items")}
                />
              )}
            </>
          )}
        </Animated.View>

        {/* Reminders Preview */}
        <Animated.View entering={FadeIn.duration(300).delay(200)} className="mb-4">
          <SectionHeader
            title={t("dashboard.reminders")}
            counter={`${reminders.length}`}
          />
          {reminders.length === 0 ? (
            <View className="bg-card dark:bg-card-dark rounded-2xl px-4 py-6 border border-border dark:border-border-dark items-center">
              <Text className="text-muted-foreground text-sm mb-3">
                {t("reminders.noReminders")}
              </Text>
              <Pressable
                onPress={() => router.push("/reminders/new")}
                className="flex-row items-center gap-1.5 active:opacity-70"
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, fontWeight: "600" }}>
                  {t("reminders.addReminder")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {reminders.slice(0, 3).map((reminder) => (
                <DashboardReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  onPress={() => router.push(`/reminders/${reminder.id}`)}
                  t={t}
                />
              ))}
              {reminders.length > 3 && (
                <ViewAllLink
                  label={t("dashboard.viewAll")}
                  onPress={() => router.push("/reminders/")}
                />
              )}
            </>
          )}
        </Animated.View>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Sub-components ---------- */

function DashboardTaskRow({
  task,
  isCompleted,
  memberNameMap,
  onToggle,
  onPress,
}: {
  task: RoutineTaskWithCompletions;
  isCompleted: boolean;
  memberNameMap: Map<string, string>;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const mutedFg = isDark ? colors.muted.foregroundDark : colors.muted.foreground;
  const borderColor = isDark ? colors.border.dark : colors.border.DEFAULT;
  const TaskIcon = getTaskIcon(task.icon);
  const streak = getStreak(task.completions ?? []);
  const assigneeName = task.assigned_to
    ? memberNameMap.get(task.assigned_to) ?? null
    : null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <Pressable
        onPress={onToggle}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: isCompleted ? colors.success.DEFAULT : borderColor,
          backgroundColor: isCompleted ? colors.success.DEFAULT : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
        hitSlop={10}
      >
        {isCompleted && <Ionicons name="checkmark" size={18} color="#fff" />}
      </Pressable>

      <Pressable
        onPress={onPress}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
        }}
        className="bg-card dark:bg-card-dark border-border dark:border-border-dark active:opacity-80"
      >
        <TaskIcon size={20} color={colors.primary.DEFAULT} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: "500",
              textDecorationLine: isCompleted ? "line-through" : "none",
            }}
            className={isCompleted ? "text-muted-foreground dark:text-muted-foreground-dark" : "text-foreground dark:text-foreground-dark"}
          >
            {task.title}
          </Text>
          {assigneeName && (
            <Text style={{ fontSize: 12, marginTop: 2 }} className="text-muted-foreground dark:text-muted-foreground-dark">
              {assigneeName}
            </Text>
          )}
        </View>
        {streak > 0 && (
          <View style={{ marginLeft: 8 }}>
            <StreakIndicator streak={streak} />
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={mutedFg}
          style={{ marginLeft: 4 }}
        />
      </Pressable>
    </View>
  );
}

function DashboardItemRow({
  item,
  onPress,
  t,
}: {
  item: HouseholdItem;
  onPress: () => void;
  t: (key: string) => string;
}) {
  const priorityColor =
    item.priority === "high"
      ? colors.destructive.DEFAULT
      : item.priority === "medium"
        ? colors.warning.DEFAULT
        : colors.muted.foreground;

  const typeIcon: keyof typeof Ionicons.glyphMap =
    item.type === "buy" ? "cart" : item.type === "repair" ? "construct" : "build";

  const priceStr = item.price ? ` · R$ ${item.price.toFixed(2)}` : "";

  return (
    <ListRow
      icon={{ icon: typeIcon, color: priorityColor }}
      title={item.name}
      subtitle={
        <Text style={{ fontSize: 12 }} className="text-muted-foreground dark:text-muted-foreground-dark">
          {t(`items.${item.type}`)}
          {priceStr}
        </Text>
      }
      onPress={onPress}
    />
  );
}

function DashboardReminderRow({
  reminder,
  onPress,
  t,
}: {
  reminder: Reminder;
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
      icon={{ icon: "notifications", color: bellColor }}
      title={reminder.title}
      subtitle={
        <Text
          style={{
            fontSize: 12,
            fontWeight: isOverdue ? "600" : "400",
            ...(isOverdue ? { color: colors.destructive.DEFAULT } : {}),
          }}
          className={isOverdue ? "" : "text-muted-foreground dark:text-muted-foreground-dark"}
        >
          {format(new Date(reminder.due_at), "MMM d, HH:mm")}
        </Text>
      }
      badge={
        isOverdue ? (
          <Badge label={t("reminders.overdue")} variant="destructive" />
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

function ViewAllLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: "center",
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary.DEFAULT,
        }}
      >
        {label} →
      </Text>
    </Pressable>
  );
}
