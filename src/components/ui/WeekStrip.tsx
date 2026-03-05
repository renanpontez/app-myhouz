import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { shortDayName } from "@/utils/format";
import { isSameDay, isToday } from "date-fns";
import { useTheme } from "@/providers/ThemeProvider";
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
  const { isDark } = useTheme();
  const mutedFg = isDark ? colors.muted.foregroundDark : colors.muted.foreground;
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
            <Ionicons name="chevron-back" size={18} color={mutedFg} />
          </Pressable>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              minWidth: 100,
              textAlign: "center",
            }}
            className="text-muted-foreground dark:text-muted-foreground-dark"
          >
            {weekLabel}
          </Text>
          <Pressable onPress={onNextWeek} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={mutedFg} />
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
          let circleBg: string = "transparent";
          let numberColor: string = mutedFg;
          let labelColor: string = mutedFg;

          // Ring color: green when all done, primary 30% for partial/default
          let ringColor: string = colors.primary.DEFAULT;
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
            numberColor = isDark ? colors.foreground.dark : colors.foreground.DEFAULT;
            labelColor = isDark ? colors.foreground.dark : colors.foreground.DEFAULT;
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
                {/* SVG progress ring — always visible as a track */}
                <ProgressRing progress={progress} color={ringColor} />

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

              {/* Today dot — reserve space on all days to prevent layout shift */}
              <View style={{ height: 9, marginTop: 4, alignItems: "center", justifyContent: "center" }}>
                {isDayToday && !isSelected && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: colors.primary.DEFAULT,
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
