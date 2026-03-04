import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IconCircle } from "./IconCircle";
import { useTheme } from "@/providers/ThemeProvider";
import { colors } from "@/styles/colors";

interface ListRowIcon {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor?: string;
  size?: "sm" | "md" | "lg";
}

interface ListRowProps {
  icon: ListRowIcon;
  title: string;
  subtitle?: ReactNode;
  strikethrough?: boolean;
  badge?: ReactNode;
  trailing?: ReactNode;
  accessory?: "chevron" | ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  leading?: ReactNode;
}

export function ListRow({
  icon,
  title,
  subtitle,
  strikethrough,
  badge,
  trailing,
  accessory = "chevron",
  onPress,
  disabled,
  leading,
}: ListRowProps) {
  const { isDark } = useTheme();
  const mutedFg = isDark ? colors.muted.foregroundDark : colors.muted.foreground;
  return (
    <Pressable
      className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark flex-row items-center active:opacity-80"
      onPress={onPress}
      disabled={disabled}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      {leading}
      <IconCircle
        icon={icon.icon}
        color={icon.color}
        backgroundColor={icon.backgroundColor}
        size={icon.size}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: "500",
              flex: 1,
              textDecorationLine: strikethrough ? "line-through" : "none",
            }}
            className={
              strikethrough
                ? "text-muted-foreground dark:text-muted-foreground-dark"
                : "text-foreground dark:text-foreground-dark"
            }
          >
            {title}
          </Text>
          {badge}
        </View>
        {subtitle && (
          <View style={{ marginTop: 2 }}>
            {typeof subtitle === "string" ? (
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                {subtitle}
              </Text>
            ) : (
              subtitle
            )}
          </View>
        )}
      </View>
      {trailing && <View style={{ marginLeft: 8 }}>{trailing}</View>}
      {accessory === "chevron" ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={mutedFg}
          style={{ marginLeft: 4 }}
        />
      ) : accessory ? (
        <View style={{ marginLeft: 4 }}>{accessory}</View>
      ) : null}
    </Pressable>
  );
}
