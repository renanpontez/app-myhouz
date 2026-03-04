import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "./Badge";
import type { BadgeProps } from "./Badge";
import { colors } from "@/styles/colors";

interface SectionHeaderProps {
  title: string;
  action?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
  counter?: string;
  badge?: BadgeProps;
  subtitle?: { icon: keyof typeof Ionicons.glyphMap; text: string };
}

export function SectionHeader({
  title,
  action,
  counter,
  badge,
  subtitle,
}: SectionHeaderProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 32,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.foreground.DEFAULT,
            }}
            className="text-foreground dark:text-foreground-dark"
          >
            {title}
          </Text>
          {counter && (
            <Text
              style={{
                fontSize: 13,
                color: colors.muted.foreground,
                fontWeight: "500",
              }}
            >
              {counter}
            </Text>
          )}
          {badge && <Badge {...badge} />}
        </View>
        {action && (
          <Pressable
            onPress={action.onPress}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={action.icon} size={18} color="#fff" />
          </Pressable>
        )}
      </View>
      {subtitle && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
          }}
        >
          <Ionicons name={subtitle.icon} size={12} color={colors.muted.foreground} />
          <Text style={{ fontSize: 12, color: colors.muted.foreground }}>
            {subtitle.text}
          </Text>
        </View>
      )}
    </View>
  );
}
