import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
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
  todayLabel?: string;
  locale?: string;
}

const OUTER_SIZE = 48;
const INNER_SIZE = 36;
const STROKE_WIDTH = 3;
const RADIUS = (OUTER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ progress, color }: { progress: number; color: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = CIRCUMFERENCE * (1 - clamped);

  return (
    <Svg
      width={OUTER_SIZE}
      height={OUTER_SIZE}
      style={{ position: "absolute" }}
    >
      {/* Background track */}
      <Circle
        cx={OUTER_SIZE / 2}
        cy={OUTER_SIZE / 2}
        r={RADIUS}
        stroke={colors.border.DEFAULT}
        strokeWidth={STROKE_WIDTH}
        fill="none"
        opacity={0.3}
      />
      {/* Progress */}
      {clamped > 0 && (
        <Circle
          cx={OUTER_SIZE / 2}
          cy={OUTER_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${OUTER_SIZE / 2}, ${OUTER_SIZE / 2}`}
        />
      )}
    </Svg>
  );
}

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
  todayLabel = "Today",
  locale = "pt-BR",
}: WeekStripProps) {
  return (
    <View className="mb-4">
      {/* Navigation row: Today button (left) | week label + arrows (right) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          minHeight: 32,
        }}
      >
        {/* Today button — only visible when not on current week */}
        {!isCurrentWeek ? (
          <Pressable
            onPress={onGoToToday}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: colors.primary.DEFAULT + "14",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.primary.DEFAULT,
              }}
            >
              {todayLabel}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        {/* Week label + arrows */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={onPrevWeek} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={colors.muted.foreground} />
          </Pressable>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.muted.foreground,
              minWidth: 100,
              textAlign: "center",
            }}
          >
            {weekLabel}
          </Text>
          <Pressable onPress={onNextWeek} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={colors.muted.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Days row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay);
          const isDayToday = isToday(day);
          const status = dayStatuses[i];
          const hasActive = status != null && status.total > 0;
          const progress = hasActive ? status.done / status.total : 0;
          const allDone = hasActive && status.done >= status.total;

          // Inner circle colors
          let circleBg = "transparent";
          let numberColor = colors.muted.foreground;
          let labelColor = colors.muted.foreground;

          // Ring color: green when all done, yellow for partial, primary when selected
          let ringColor = colors.warning.DEFAULT;
          if (allDone) ringColor = colors.success.DEFAULT;

          if (isSelected) {
            circleBg = colors.primary.DEFAULT;
            numberColor = "#FFFFFF";
            labelColor = colors.primary.DEFAULT;
            if (!hasActive) ringColor = colors.primary.DEFAULT;
          } else if (allDone) {
            circleBg = colors.success.DEFAULT;
            numberColor = "#FFFFFF";
          } else if (isDayToday) {
            numberColor = colors.foreground.DEFAULT;
            labelColor = colors.foreground.DEFAULT;
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
                  marginBottom: 6,
                }}
                className={
                  !isSelected && isDayToday
                    ? "text-foreground dark:text-foreground-dark"
                    : ""
                }
              >
                {shortDayName(day, locale)}
              </Text>

              {/* Day circle with progress ring */}
              <View
                style={{
                  width: OUTER_SIZE,
                  height: OUTER_SIZE,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* SVG progress ring (only if there are tasks) */}
                {hasActive && (
                  <ProgressRing progress={progress} color={ringColor} />
                )}

                {/* Inner circle */}
                <View
                  style={{
                    width: INNER_SIZE,
                    height: INNER_SIZE,
                    borderRadius: INNER_SIZE / 2,
                    backgroundColor: circleBg,
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
                        : ""
                    }
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
