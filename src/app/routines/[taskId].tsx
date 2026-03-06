import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRoutine, useUpdateRoutine, useDeleteRoutine, useToggleRoutine } from "@/hooks/useRoutines";
import { useHouseholdStore } from "@/stores";
import { isCompletedThisCycle, getStreak } from "@/utils/cycle";
import { getMemberName } from "@/utils/members";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { DayOfWeekPicker } from "@/components/ui/DayOfWeekPicker";
import { IconPicker } from "@/components/ui/IconPicker";
import { StreakIndicator } from "@/components/ui/StreakIndicator";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";
import type { RecurrenceType, RecurrenceMeta } from "@/domain/models";

const RECURRENCES: RecurrenceType[] = ["daily", "weekly", "monthly", "weekdays", "weekends", "custom"];
const INTERVAL_UNITS = ["days", "weeks", "months"] as const;

const DAY_LABELS: Record<number, string> = {
  0: "days.sun", 1: "days.mon", 2: "days.tue", 3: "days.wed",
  4: "days.thu", 5: "days.fri", 6: "days.sat",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border dark:border-border-dark">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}

export default function RoutineDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { data, isLoading } = useRoutine(taskId);
  const updateRoutine = useUpdateRoutine(taskId);
  const deleteRoutine = useDeleteRoutine();
  const toggleRoutine = useToggleRoutine();
  const { members } = useHouseholdStore();

  const task = data?.data?.data;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>("daily");
  const [editAssignedTo, setEditAssignedTo] = useState<string | null>(null);
  const [editHasStartDate, setEditHasStartDate] = useState(false);
  const [editStartsAt, setEditStartsAt] = useState<Date | null>(null);
  const [editCustomMode, setEditCustomMode] = useState<"days_of_week" | "interval">("days_of_week");
  const [editSelectedDays, setEditSelectedDays] = useState<number[]>([]);
  const [editIntervalEvery, setEditIntervalEvery] = useState("2");
  const [editIntervalUnit, setEditIntervalUnit] = useState<"days" | "weeks" | "months">("days");
  const [editIcon, setEditIcon] = useState<string | null>(null);

  const enterEditMode = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditRecurrence(task.recurrence);
    setEditAssignedTo(task.assigned_to);
    setEditHasStartDate(!!task.starts_at);
    setEditStartsAt(task.starts_at ? new Date(task.starts_at) : null);
    if (task.recurrence_meta?.type === "days_of_week") {
      setEditCustomMode("days_of_week");
      setEditSelectedDays(task.recurrence_meta.days);
    } else if (task.recurrence_meta?.type === "interval") {
      setEditCustomMode("interval");
      setEditIntervalEvery(String(task.recurrence_meta.every));
      setEditIntervalUnit(task.recurrence_meta.unit);
    }
    setEditIcon(task.icon ?? null);
    setIsEditing(true);
  };

  const buildRecurrenceMeta = (): RecurrenceMeta => {
    if (editRecurrence !== "custom") return null;
    if (editCustomMode === "days_of_week") {
      return { type: "days_of_week", days: editSelectedDays };
    }
    return {
      type: "interval",
      every: parseInt(editIntervalEvery, 10) || 2,
      unit: editIntervalUnit,
    };
  };

  const handleSave = async () => {
    try {
      await updateRoutine.mutateAsync({
        title: editTitle,
        recurrence: editRecurrence,
        recurrence_meta: buildRecurrenceMeta(),
        assigned_to: editAssignedTo,
        icon: editIcon,
        starts_at: editStartsAt ? `${editStartsAt.getFullYear()}-${String(editStartsAt.getMonth() + 1).padStart(2, "0")}-${String(editStartsAt.getDate()).padStart(2, "0")}` : null,
      });
      setIsEditing(false);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("common.delete"), t("routines.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRoutine.mutateAsync(taskId);
            router.back();
          } catch {
            toast.error(t("error.generic"));
          }
        },
      },
    ]);
  };

  const recurrenceDescription = useMemo(() => {
    if (!task) return "";
    if (task.recurrence !== "custom" || !task.recurrence_meta) {
      return t(`routines.${task.recurrence}`);
    }
    if (task.recurrence_meta.type === "days_of_week") {
      const dayNames = task.recurrence_meta.days
        .sort((a, b) => a - b)
        .map((d) => t(DAY_LABELS[d] ?? ""));
      return dayNames.join(", ");
    }
    if (task.recurrence_meta.type === "interval") {
      return `${t("routines.every")} ${task.recurrence_meta.every} ${t(`intervalUnit.${task.recurrence_meta.unit}`)}`;
    }
    return t("routines.custom");
  }, [task, t]);

  if (isLoading || !task) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <SkeletonDetail />
      </SafeAreaView>
    );
  }

  const isCompleted = isCompletedThisCycle(task.last_completed_at, task.recurrence, task.recurrence_meta);
  const streak = getStreak(task.completions ?? []);
  const recentCompletions = (task.completions ?? [])
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 7);

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <ScrollView className="flex-1 px-6 pt-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable onPress={() => setIsEditing(false)}>
              <Text className="text-primary text-base">{t("common.cancel")}</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              {t("routines.editTask")}
            </Text>
            <View className="w-16" />
          </View>

          <View className="gap-5">
            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("routines.taskTitle")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-2">{t("routines.recurrence")}</Text>
              <View className="flex-row flex-wrap gap-2">
                {RECURRENCES.map((r) => (
                  <Pressable
                    key={r}
                    className={`px-4 py-2.5 rounded-xl ${editRecurrence === r ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                    onPress={() => setEditRecurrence(r)}
                  >
                    <Text className={`text-sm font-medium ${editRecurrence === r ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                      {t(`routines.${r}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {editRecurrence === "custom" && (
              <View className="gap-4">
                <View className="flex-row gap-2">
                  <Pressable
                    className={`flex-1 py-2.5 rounded-xl items-center ${editCustomMode === "days_of_week" ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                    onPress={() => setEditCustomMode("days_of_week")}
                  >
                    <Text className={`text-sm font-medium ${editCustomMode === "days_of_week" ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                      {t("routines.customDaysOfWeek")}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-2.5 rounded-xl items-center ${editCustomMode === "interval" ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                    onPress={() => setEditCustomMode("interval")}
                  >
                    <Text className={`text-sm font-medium ${editCustomMode === "interval" ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                      {t("routines.customInterval")}
                    </Text>
                  </Pressable>
                </View>

                {editCustomMode === "days_of_week" ? (
                  <DayOfWeekPicker
                    selectedDays={editSelectedDays}
                    onToggle={(day) =>
                      setEditSelectedDays((prev) =>
                        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
                      )
                    }
                  />
                ) : (
                  <View className="gap-3">
                    <View className="flex-row items-center gap-3">
                      <Text className="text-sm text-muted-foreground">{t("routines.every")}</Text>
                      <TextInput
                        className="border border-border dark:border-border-dark rounded-xl px-4 py-3 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark w-16 text-center"
                        value={editIntervalEvery}
                        onChangeText={setEditIntervalEvery}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View className="flex-row gap-2">
                      {INTERVAL_UNITS.map((u) => (
                        <Pressable
                          key={u}
                          className={`px-4 py-2.5 rounded-xl ${editIntervalUnit === u ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                          onPress={() => setEditIntervalUnit(u)}
                        >
                          <Text className={`text-sm font-medium ${editIntervalUnit === u ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                            {t(`intervalUnit.${u}`)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            <IconPicker
              value={editIcon}
              onChange={setEditIcon}
              label={t("routines.icon")}
            />

            <MemberPicker
              value={editAssignedTo}
              onChange={setEditAssignedTo}
              label={t("routines.assignedTo")}
            />

            <View>
              <Pressable
                onPress={() => {
                  const next = !editHasStartDate;
                  setEditHasStartDate(next);
                  if (!next) setEditStartsAt(null);
                }}
                className="flex-row items-center justify-between"
              >
                <Text className="text-sm text-muted-foreground">{t("routines.addStartDate")}</Text>
                <Switch
                  value={editHasStartDate}
                  onValueChange={(v) => {
                    setEditHasStartDate(v);
                    if (!v) setEditStartsAt(null);
                  }}
                  trackColor={{ true: colors.primary.DEFAULT }}
                />
              </Pressable>
              {editHasStartDate && (
                <View className="mt-3">
                  <DateTimePicker
                    value={editStartsAt}
                    onChange={setEditStartsAt}
                    mode="date"
                    label=""
                    placeholder={t("routines.startsAt")}
                  />
                </View>
              )}
            </View>
          </View>

          <Pressable
            className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8"
            onPress={handleSave}
            disabled={updateRoutine.isPending || !editTitle.trim()}
          >
            {updateRoutine.isPending ? (
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
          {task.title}
        </Text>

        <View className="flex-row items-center gap-2 mb-6">
          <View className="px-3 py-1 rounded-full bg-muted dark:bg-muted-dark">
            <Text className="text-sm text-muted-foreground">{recurrenceDescription}</Text>
          </View>
          {isCompleted && (
            <View className="px-3 py-1 rounded-full bg-success/10">
              <Text className="text-sm text-success">{t("routines.completedToday")}</Text>
            </View>
          )}
          {streak > 0 && <StreakIndicator streak={streak} />}
        </View>

        <View className="mb-6">
          {task.assigned_to && (
            <InfoRow label={t("routines.assignedTo")} value={getMemberName(task.assigned_to, members)} />
          )}
          <InfoRow label={t("routines.createdBy")} value={getMemberName(task.created_by, members)} />
          {task.starts_at && (
            <InfoRow label={t("routines.startsAt")} value={format(new Date(task.starts_at), "PPP")} />
          )}
        </View>

        {recentCompletions.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
              {t("routines.completionHistory")}
            </Text>
            {recentCompletions.map((c) => (
              <View key={c.id} className="flex-row items-center gap-2 py-2">
                <Ionicons name="checkmark-circle" size={16} color={colors.success.DEFAULT} />
                <Text className="text-sm text-muted-foreground">
                  {format(new Date(c.completed_at), "PPP 'at' HH:mm")}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  · {getMemberName(c.completed_by, members)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          className={`w-full rounded-2xl py-4 items-center active:opacity-80 mt-4 ${isCompleted ? "bg-muted dark:bg-muted-dark" : "bg-success"}`}
          onPress={() => toggleRoutine.mutate({ taskId })}
        >
          <Text className={`font-semibold text-base ${isCompleted ? "text-muted-foreground" : "text-white"}`}>
            {isCompleted ? t("common.done") : t("routines.completedToday")}
          </Text>
        </Pressable>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
