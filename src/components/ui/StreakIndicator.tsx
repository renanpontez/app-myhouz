import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/styles/colors";

interface StreakIndicatorProps {
  streak: number;
}

export function StreakIndicator({ streak }: StreakIndicatorProps) {
  if (streak <= 0) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Ionicons name="flame" size={14} color={colors.brandAccent.DEFAULT} />
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: colors.brandAccent.DEFAULT,
        }}
      >
        {streak}
      </Text>
    </View>
  );
}
