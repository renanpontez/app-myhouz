import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/ThemeProvider";
import { colors } from "@/styles/colors";

export type BadgeVariant = "default" | "destructive" | "success" | "warning" | "info" | "muted";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
}

function getVariantStyles(isDark: boolean): Record<BadgeVariant, { bg: string; text: string }> {
  return {
    default: { bg: `${colors.primary.DEFAULT}15`, text: colors.primary.DEFAULT },
    destructive: { bg: `${colors.destructive.DEFAULT}15`, text: colors.destructive.DEFAULT },
    success: { bg: `${colors.success.DEFAULT}15`, text: colors.success.DEFAULT },
    warning: { bg: `${colors.warning.DEFAULT}15`, text: colors.warning.DEFAULT },
    info: { bg: `${colors.info.DEFAULT}15`, text: colors.info.DEFAULT },
    muted: { bg: isDark ? colors.muted.dark : colors.muted.DEFAULT, text: isDark ? colors.muted.foregroundDark : colors.muted.foreground },
  };
}

export function Badge({ label, variant = "default", icon }: BadgeProps) {
  const { isDark } = useTheme();
  const style = getVariantStyles(isDark)[variant];

  return (
    <View
      style={{
        backgroundColor: style.bg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
      }}
    >
      {icon && <Ionicons name={icon} size={10} color={style.text} />}
      <Text style={{ fontSize: 11, fontWeight: "600", color: style.text }}>
        {label}
      </Text>
    </View>
  );
}
