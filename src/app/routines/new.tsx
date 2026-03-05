import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useCreateRoutine } from "@/hooks/useRoutines";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { DayOfWeekPicker } from "@/components/ui/DayOfWeekPicker";
import { toast } from "@/stores/toast.store";
import { colors } from "@/styles/colors";
import type { RecurrenceType, RecurrenceMeta } from "@/domain/models";

const RECURRENCES: RecurrenceType[] = ["daily", "weekly", "monthly", "weekdays", "weekends", "custom"];
const INTERVAL_UNITS = ["days", "weeks", "months"] as const;

export default function NewRoutineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { startsAt: startsAtParam } = useLocalSearchParams<{ startsAt?: string }>();
  const createRoutine = useCreateRoutine();

  const [title, setTitle] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("daily");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [hasStartDate, setHasStartDate] = useState(!!startsAtParam);
  const [startsAt, setStartsAt] = useState<Date | null>(() => {
    if (!startsAtParam) return null;
    const [y, m, d] = startsAtParam.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  });

  // Custom recurrence state
  const [customMode, setCustomMode] = useState<"days_of_week" | "interval">("days_of_week");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [intervalEvery, setIntervalEvery] = useState("2");
  const [intervalUnit, setIntervalUnit] = useState<"days" | "weeks" | "months">("days");

  const handleToggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const buildRecurrenceMeta = (): RecurrenceMeta => {
    if (recurrence !== "custom") return null;
    if (customMode === "days_of_week") {
      return { type: "days_of_week", days: selectedDays };
    }
    return {
      type: "interval",
      every: parseInt(intervalEvery, 10) || 2,
      unit: intervalUnit,
    };
  };

  const handleCreate = async () => {
    try {
      const payload: Record<string, unknown> = {
        title,
        recurrence,
        recurrence_meta: buildRecurrenceMeta(),
        assigned_to: assignedTo || undefined,
        starts_at: startsAt ? `${startsAt.getFullYear()}-${String(startsAt.getMonth() + 1).padStart(2, "0")}-${String(startsAt.getDate()).padStart(2, "0")}` : undefined,
      };
      await createRoutine.mutateAsync(payload);
      router.dismiss();
    } catch (err) {
      console.error("[CREATE_ROUTINE]", err);
      toast.error(t("error.generic"));
    }
  };

  const isCustomValid =
    recurrence !== "custom" ||
    (customMode === "days_of_week" && selectedDays.length > 0) ||
    (customMode === "interval" && parseInt(intervalEvery, 10) > 0);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.dismiss()}>
            <Text className="text-primary text-base">{t("common.cancel")}</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {t("routines.addTask")}
          </Text>
          <View className="w-16" />
        </View>

        <View className="gap-5">
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("routines.taskTitle")}</Text>
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
              value={title}
              onChangeText={setTitle}
              placeholder={t("routines.taskTitle")}
              placeholderTextColor="#64697A"
              autoFocus
            />
          </View>

          <View>
            <Text className="text-sm text-muted-foreground mb-2">{t("routines.recurrence")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {RECURRENCES.map((r) => (
                <Pressable
                  key={r}
                  className={`px-4 py-2.5 rounded-xl ${recurrence === r ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                  onPress={() => setRecurrence(r)}
                >
                  <Text className={`text-sm font-medium ${recurrence === r ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                    {t(`routines.${r}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {recurrence === "custom" && (
            <View className="gap-4">
              <View className="flex-row gap-2">
                <Pressable
                  className={`flex-1 py-2.5 rounded-xl items-center ${customMode === "days_of_week" ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                  onPress={() => setCustomMode("days_of_week")}
                >
                  <Text className={`text-sm font-medium ${customMode === "days_of_week" ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                    {t("routines.customDaysOfWeek")}
                  </Text>
                </Pressable>
                <Pressable
                  className={`flex-1 py-2.5 rounded-xl items-center ${customMode === "interval" ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                  onPress={() => setCustomMode("interval")}
                >
                  <Text className={`text-sm font-medium ${customMode === "interval" ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                    {t("routines.customInterval")}
                  </Text>
                </Pressable>
              </View>

              {customMode === "days_of_week" ? (
                <DayOfWeekPicker
                  selectedDays={selectedDays}
                  onToggle={handleToggleDay}
                />
              ) : (
                <View className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-sm text-muted-foreground">{t("routines.every")}</Text>
                    <TextInput
                      className="border border-border dark:border-border-dark rounded-xl px-4 py-3 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark w-16 text-center"
                      value={intervalEvery}
                      onChangeText={setIntervalEvery}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    {INTERVAL_UNITS.map((u) => (
                      <Pressable
                        key={u}
                        className={`px-4 py-2.5 rounded-xl ${intervalUnit === u ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                        onPress={() => setIntervalUnit(u)}
                      >
                        <Text className={`text-sm font-medium ${intervalUnit === u ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                          {t(`intervalUnit.${u}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          <MemberPicker
            value={assignedTo}
            onChange={setAssignedTo}
            label={t("routines.assignedTo")}
          />

          <View>
            <Pressable
              onPress={() => {
                const next = !hasStartDate;
                setHasStartDate(next);
                if (!next) setStartsAt(null);
              }}
              className="flex-row items-center justify-between"
            >
              <Text className="text-sm text-muted-foreground">{t("routines.addStartDate")}</Text>
              <Switch
                value={hasStartDate}
                onValueChange={(v) => {
                  setHasStartDate(v);
                  if (!v) setStartsAt(null);
                }}
                trackColor={{ true: colors.primary.DEFAULT }}
              />
            </Pressable>
            {hasStartDate && (
              <View className="mt-3">
                <DateTimePicker
                  value={startsAt}
                  onChange={setStartsAt}
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
          onPress={handleCreate}
          disabled={createRoutine.isPending || !title.trim() || !isCustomValid}
        >
          {createRoutine.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">{t("common.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
