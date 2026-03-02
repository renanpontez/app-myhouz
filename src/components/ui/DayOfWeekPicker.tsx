import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

interface DayOfWeekPickerProps {
  selectedDays: number[];
  onToggle: (day: number) => void;
}

// Monday=1 ... Saturday=6, Sunday=0
const DAYS = [1, 2, 3, 4, 5, 6, 0] as const;

const DAY_KEYS: Record<number, string> = {
  0: "days.sun",
  1: "days.mon",
  2: "days.tue",
  3: "days.wed",
  4: "days.thu",
  5: "days.fri",
  6: "days.sat",
};

export function DayOfWeekPicker({ selectedDays, onToggle }: DayOfWeekPickerProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-1.5">
      {DAYS.map((day) => {
        const isSelected = selectedDays.includes(day);
        return (
          <Pressable
            key={day}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isSelected
                ? "bg-primary"
                : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"
            }`}
            onPress={() => onToggle(day)}
          >
            <Text
              className={`text-xs font-semibold ${
                isSelected
                  ? "text-primary-foreground"
                  : "text-foreground dark:text-foreground-dark"
              }`}
            >
              {t(DAY_KEYS[day] ?? "")}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
