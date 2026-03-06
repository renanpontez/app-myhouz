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
import { storageService, STORAGE_KEYS } from "@/data/storage";
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

  // Tasks widget state
  const [expandedTasks, setExpandedTasks] = useState(false);

  // Add menu dropdown
  const [showAddMenu, setShowAddMenu] = useState(false);

  const itemsQuery = useItems({});
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

  const allItems = itemsQuery.data?.data?.data ?? [];
  const routines = routinesQuery.data?.data?.data ?? [];
  const reminders = remindersQuery.data?.data?.data ?? [];
  const urgentProblems = urgentQuery.data?.data?.data ?? [];

  // Filter items: show pending + in_progress
  const pendingItems = useMemo(
    () => allItems.filter((item) => item.status !== "done"),
    [allItems],
  );

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

  // Optimistic toggle overrides: "taskId:YYYY-MM-DD" → toggled completed state
  const [optimisticToggles, setOptimisticToggles] = useState<Map<string, boolean>>(new Map());

  // Helper: is a task completed on a given day, respecting optimistic overrides
  const isTaskDoneOnDay = useCallback(
    (task: (typeof routines)[0], day: Date) => {
      const toggleKey = `${task.id}:${format(day, "yyyy-MM-dd")}`;
      const override = optimisticToggles.get(toggleKey);
      if (override !== undefined) return override;
      if (isSameDay(day, new Date())) {
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
          isActiveOnDate(task.recurrence, task.recurrence_meta, day, task.starts_at, task.created_at),
      );
      const done = activeTasks.filter((task) => isTaskDoneOnDay(task, day)).length;
      return { total: activeTasks.length, done };
    });
  }, [weekDays, routines, isTaskDoneOnDay]);

  // Today's tasks for selected day — with smart sorting
  const selectedDayTasks = useMemo(() => {
    const tasks = routines.filter(
      (task) =>
        task.is_active &&
        isActiveOnDate(task.recurrence, task.recurrence_meta, selectedDay, task.starts_at, task.created_at),
    );

    // Smart sort: unchecked first, then current user first within each group
    return [...tasks].sort((a, b) => {
      const aDone = isTaskDoneOnDay(a, selectedDay);
      const bDone = isTaskDoneOnDay(b, selectedDay);

      // Unchecked first
      if (aDone !== bDone) return aDone ? 1 : -1;

      // Within same completion status: current user tasks first
      if (user?.id) {
        const aOwned = a.assigned_to === user.id;
        const bOwned = b.assigned_to === user.id;
        if (aOwned !== bOwned) return aOwned ? -1 : 1;
      }

      return 0;
    });
  }, [routines, selectedDay, isTaskDoneOnDay, user?.id]);

  const completedCount = selectedDayTasks.filter((task) =>
    isTaskDoneOnDay(task, selectedDay),
  ).length;

  const isSelectedToday = isSameDay(selectedDay, new Date());
  // Visible tasks (expand/collapse)
  const visibleTasks = expandedTasks ? selectedDayTasks : selectedDayTasks.slice(0, MAX_DASHBOARD_ROWS);

  // Sort reminders: overdue first, then by due date
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const aOverdue = !a.is_completed && isPast(new Date(a.due_at));
      const bOverdue = !b.is_completed && isPast(new Date(b.due_at));
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });
  }, [reminders]);

  // Overdue reminders
  const overdueReminders = useMemo(
    () => reminders.filter((r) => !r.is_completed && isPast(new Date(r.due_at))),
    [reminders],
  );
  const overdueCount = overdueReminders.length;

  // Notification dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellLayout, setBellLayout] = useState({ y: 0, height: 0 });
  const isSoleMember = members.length <= 1;
  const [inviteNotifDismissed, setInviteNotifDismissed] = useState(
    () => storageService.getBoolean(STORAGE_KEYS.DISMISSED_INVITE_NOTIF) ?? false,
  );
  const showInviteNotif = isSoleMember && !inviteNotifDismissed;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-2 pb-8"
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
        {/* Header: Avatar + Greeting + Plus + Bell */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingBottom: 16,
            paddingTop: 4,
          }}
        >
          {/* Avatar + Greeting → Settings */}
          <Pressable
            onPress={() => router.push("/settings")}
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          >
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
          </Pressable>

          {/* Add button */}
          <Pressable
            onPress={() => setShowAddMenu(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
            hitSlop={8}
          >
            <Ionicons name="add-circle-outline" size={26} color={mutedFg} />
          </Pressable>

          {/* Notification bell */}
          <View
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              setBellLayout({ y, height });
            }}
          >
            <Pressable
              onPress={() => setShowNotifications(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
              hitSlop={8}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={overdueCount > 0 ? colors.destructive.DEFAULT : mutedFg}
              />
              {(() => {
                const notifCount = overdueCount + (showInviteNotif ? 1 : 0);
                return notifCount > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 0,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      paddingHorizontal: 4,
                      backgroundColor: overdueCount > 0 ? colors.destructive.DEFAULT : colors.primary.DEFAULT,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                      {notifCount}
                    </Text>
                  </View>
                ) : null;
              })()}
            </Pressable>
          </View>
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
          />
          {selectedDayTasks.length === 0 ? (
            <View className="bg-card dark:bg-card-dark rounded-2xl px-4 py-6 border border-border dark:border-border-dark items-center">
              <Text className="text-muted-foreground text-sm">
                {t("dashboard.noTasksToday")}
              </Text>
            </View>
          ) : (
            <>
              {visibleTasks.map((task) => {
                const isDone = isTaskDoneOnDay(task, selectedDay);
                return (
                  <DashboardTaskRow
                    key={task.id}
                    task={task}
                    isCompleted={isDone}
                    memberNameMap={memberNameMap}
                    onToggle={() => {
                      const dateStr = format(selectedDay, "yyyy-MM-dd");
                      const toggleKey = `${task.id}:${dateStr}`;
                      setOptimisticToggles((prev) => {
                        const next = new Map(prev);
                        next.set(toggleKey, !isDone);
                        return next;
                      });
                      toggleMutation.mutate(
                        { taskId: task.id, date: dateStr },
                        {
                          onSuccess: () => {
                            refetchRef.current.routines();
                          },
                          onError: () => {
                            setOptimisticToggles((prev) => {
                              const next = new Map(prev);
                              next.delete(toggleKey);
                              return next;
                            });
                          },
                        },
                      );
                    }}
                    onPress={() => router.push(`/routines/${task.id}`)}
                    recurrenceLabel={t(`routines.${task.recurrence}`)}
                  />
                );
              })}
              {selectedDayTasks.length > MAX_DASHBOARD_ROWS && (
                <ViewAllLink
                  label={expandedTasks ? t("dashboard.showLess") : t("dashboard.viewAll")}
                  onPress={() => setExpandedTasks(!expandedTasks)}
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
            link={{
              label: t("dashboard.viewAll"),
              onPress: () => router.push("/(tabs)/items"),
            }}
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
              {pendingItems.slice(0, MAX_DASHBOARD_ROWS).map((item) => (
                <DashboardItemRow
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/items/${item.id}`)}
                  t={t}
                />
              ))}
            </>
          )}
        </Animated.View>

        {/* Reminders Preview */}
        <Animated.View entering={FadeIn.duration(300).delay(200)} className="mb-4">
          <SectionHeader
            title={t("dashboard.reminders")}
            counter={`${reminders.length}`}
            link={{
              label: t("dashboard.viewAll"),
              onPress: () => router.push("/reminders/"),
            }}
          />

          {sortedReminders.length === 0 ? (
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
              {sortedReminders.slice(0, MAX_DASHBOARD_ROWS).map((reminder) => (
                <DashboardReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  onPress={() => router.push(`/reminders/${reminder.id}`)}
                  t={t}
                />
              ))}
            </>
          )}
        </Animated.View>
        </>
        )}
      </ScrollView>

      {/* Notification Dropdown */}
      {showNotifications && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
          }}
          onPress={() => setShowNotifications(false)}
        >
          <View
            style={{
              position: "absolute",
              top: bellLayout.y + bellLayout.height + 8,
              right: 16,
              width: 340,
              borderRadius: 16,
              backgroundColor: isDark ? colors.card.dark : colors.card.DEFAULT,
              borderWidth: 1,
              borderColor: isDark ? colors.border.dark : colors.border.DEFAULT,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              overflow: "hidden",
            }}
          >
                {/* Header */}
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? colors.border.dark : colors.border.DEFAULT,
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: "700" }}
                    className="text-foreground dark:text-foreground-dark"
                  >
                    {t("notifications.title")}
                  </Text>
                </View>

                {/* Notification items */}
                {showInviteNotif && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      gap: 12,
                      borderBottomWidth: overdueReminders.length > 0 ? 1 : 0,
                      borderBottomColor: isDark ? colors.border.dark : colors.border.DEFAULT,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setShowNotifications(false);
                        router.push("/members");
                      }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: colors.primary.DEFAULT + "18",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="people-outline" size={16} color={colors.primary.DEFAULT} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: "600" }}
                          className="text-foreground dark:text-foreground-dark"
                        >
                          {t("notifications.inviteMembers")}
                        </Text>
                        <Text
                          style={{ fontSize: 12, marginTop: 2 }}
                          className="text-muted-foreground"
                        >
                          {t("notifications.inviteMembersDesc")}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        storageService.setBoolean(STORAGE_KEYS.DISMISSED_INVITE_NOTIF, true);
                        setInviteNotifDismissed(true);
                      }}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={16} color={mutedFg} />
                    </Pressable>
                  </View>
                )}

                {overdueReminders.map((reminder) => (
                  <Pressable
                    key={reminder.id}
                    onPress={() => {
                      setShowNotifications(false);
                      router.push(`/reminders/${reminder.id}` as any);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      gap: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? colors.border.dark : colors.border.DEFAULT,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.destructive.DEFAULT + "18",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="alarm-outline" size={16} color={colors.destructive.DEFAULT} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 13, fontWeight: "600" }}
                        className="text-foreground dark:text-foreground-dark"
                        numberOfLines={1}
                      >
                        {reminder.title}
                      </Text>
                      <Text
                        style={{ fontSize: 12, marginTop: 2 }}
                        className="text-destructive"
                      >
                        {t("notifications.overdueReminder")}
                      </Text>
                    </View>
                  </Pressable>
                ))}

                {/* Empty state */}
                {!showInviteNotif && overdueReminders.length === 0 && (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: "center" }}>
                    <Text
                      style={{ fontSize: 13 }}
                      className="text-muted-foreground"
                    >
                      {t("notifications.empty")}
                    </Text>
                  </View>
                )}
          </View>
        </Pressable>
      )}

      {/* Add Menu Dropdown */}
      {showAddMenu && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
          }}
          onPress={() => setShowAddMenu(false)}
        >
          <View
            style={{
              position: "absolute",
              top: bellLayout.y + bellLayout.height + 8,
              right: 56,
              width: 220,
              borderRadius: 16,
              backgroundColor: isDark ? colors.card.dark : colors.card.DEFAULT,
              borderWidth: 1,
              borderColor: isDark ? colors.border.dark : colors.border.DEFAULT,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              overflow: "hidden",
            }}
          >
            {[
              {
                icon: "checkbox-outline" as const,
                label: t("dashboard.addTask"),
                color: colors.primary.DEFAULT,
                onPress: () => {
                  setShowAddMenu(false);
                  router.push(
                    isSelectedToday
                      ? "/routines/new"
                      : `/routines/new?startsAt=${format(selectedDay, "yyyy-MM-dd")}`,
                  );
                },
              },
              {
                icon: "cart-outline" as const,
                label: t("dashboard.addItem"),
                color: colors.primary.DEFAULT,
                onPress: () => {
                  setShowAddMenu(false);
                  router.push("/items/new");
                },
              },
              {
                icon: "alert-circle-outline" as const,
                label: t("dashboard.addUrgent"),
                color: colors.destructive.DEFAULT,
                onPress: () => {
                  setShowAddMenu(false);
                  router.push("/urgent/new");
                },
              },
            ].map((item, i) => (
              <Pressable
                key={i}
                onPress={item.onPress}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  gap: 12,
                  borderBottomWidth: i < 2 ? 1 : 0,
                  borderBottomColor: isDark ? colors.border.dark : colors.border.DEFAULT,
                }}
              >
                <Ionicons name={item.icon} size={20} color={item.color} />
                <Text
                  style={{ fontSize: 14, fontWeight: "500" }}
                  className="text-foreground dark:text-foreground-dark"
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function DashboardTaskRow({
  task,
  isCompleted,
  memberNameMap,
  onToggle,
  onPress,
  recurrenceLabel,
}: {
  task: RoutineTaskWithCompletions;
  isCompleted: boolean;
  memberNameMap: Map<string, string>;
  onToggle: () => void;
  onPress: () => void;
  recurrenceLabel: string;
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
          <Text style={{ fontSize: 12, marginTop: 2 }} className="text-muted-foreground dark:text-muted-foreground-dark">
            {recurrenceLabel}{assigneeName ? ` · ${assigneeName}` : ""}
          </Text>
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

  const statusIcon: keyof typeof Ionicons.glyphMap =
    item.status === "in_progress" ? "play-circle-outline" : "time-outline";

  const statusColor =
    item.status === "in_progress" ? colors.warning.DEFAULT : colors.muted.foreground;

  const priceStr = item.price ? ` · R$ ${item.price.toFixed(2)}` : "";

  return (
    <ListRow
      icon={{ icon: typeIcon, color: priorityColor }}
      title={item.name}
      subtitle={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name={statusIcon} size={12} color={statusColor} />
          <Text style={{ fontSize: 12 }} className="text-muted-foreground dark:text-muted-foreground-dark">
            {t(`items.${item.type}`)}
            {item.status === "in_progress" ? ` · ${t("items.inProgress")}` : ""}
            {priceStr}
          </Text>
        </View>
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
