import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shortDayName } from "@/utils/format";
import { isSameDay, isToday } from "date-fns";
import { colors } from "@/styles/colors";

interface DayStatus {
  total: number;
  done: number;
}

interface WeekStripProps {
  weekDays: Date[];
  dayStatuses: DayStatus[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isCurrentWeek: boolean;
  onGoToToday: () => void;
  locale?: string;
}

const DAY_SIZE = 42;

export function WeekStrip({
  weekDays,
  dayStatuses,
  selectedDay,
  onSelectDay,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  isCurrentWeek,
  onGoToToday,
  locale = "pt-BR",
}: WeekStripProps) {
  return (
    <View className="mb-4">
      {/* Navigation row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Pressable onPress={onPrevWeek} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.muted.foreground} />
        </Pressable>
        <Pressable onPress={onGoToToday} disabled={isCurrentWeek}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isCurrentWeek
                ? colors.muted.foreground
                : colors.primary.DEFAULT,
            }}
          >
            {weekLabel}
          </Text>
        </Pressable>
        <Pressable onPress={onNextWeek} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.muted.foreground} />
        </Pressable>
      </View>

      {/* Days row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay);
          const isDayToday = isToday(day);
          const status = dayStatuses[i];
          const hasActive = status != null && status.total > 0;
          const allDone = hasActive && status.done >= status.total;
          const someProgress = hasActive && status.done > 0 && !allDone;

          // Background color for the circle
          let circleBg = "transparent";
          let circleBorder = "transparent";
          let numberColor = colors.muted.foreground;
          let labelColor = colors.muted.foreground;

          if (isSelected) {
            circleBg = colors.primary.DEFAULT;
            numberColor = "#FFFFFF";
            labelColor = colors.primary.DEFAULT;
          } else if (allDone) {
            circleBg = colors.success.DEFAULT;
            numberColor = "#FFFFFF";
          } else if (isDayToday) {
            circleBorder = colors.primary.DEFAULT;
            numberColor = colors.foreground.DEFAULT;
            labelColor = colors.foreground.DEFAULT;
          } else if (someProgress) {
            circleBorder = colors.warning.DEFAULT;
            numberColor = colors.foreground.DEFAULT;
          }

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelectDay(day)}
              style={{ alignItems: "center", flex: 1 }}
              hitSlop={4}
            >
              {/* Day label */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: labelColor,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
                className={
                  !isSelected && isDayToday
                    ? "text-foreground dark:text-foreground-dark"
                    : ""
                }
              >
                {shortDayName(day, locale)}
              </Text>

              {/* Day circle */}
              <View
                style={{
                  width: DAY_SIZE,
                  height: DAY_SIZE,
                  borderRadius: DAY_SIZE / 2,
                  backgroundColor: circleBg,
                  borderWidth: circleBorder !== "transparent" ? 2 : 0,
                  borderColor: circleBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: numberColor,
                  }}
                  className={
                    !isSelected && !allDone && isDayToday
                      ? "text-foreground dark:text-foreground-dark"
                      : !isSelected && !allDone && someProgress
                        ? "text-foreground dark:text-foreground-dark"
                        : ""
                  }
                >
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
