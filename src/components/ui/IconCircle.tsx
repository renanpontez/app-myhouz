import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconCircleSize = "sm" | "md" | "lg";

interface IconCircleProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: IconCircleSize;
  color: string;
  backgroundColor?: string;
}

const SIZE_MAP: Record<IconCircleSize, { container: number; icon: number }> = {
  sm: { container: 32, icon: 14 },
  md: { container: 40, icon: 18 },
  lg: { container: 48, icon: 22 },
};

export function IconCircle({
  icon,
  size = "md",
  color,
  backgroundColor,
}: IconCircleProps) {
  const { container, icon: iconSize } = SIZE_MAP[size];
  const bg = backgroundColor ?? `${color}`;

  return (
    <View
      style={{
        width: container,
        height: container,
        borderRadius: container / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={iconSize} color={color} />
    </View>
  );
}
