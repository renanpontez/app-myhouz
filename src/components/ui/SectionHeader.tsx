import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "./Badge";
import type { BadgeProps } from "./Badge";

interface SectionHeaderProps {
  title: string;
  counter?: string;
  badge?: BadgeProps;
  subtitle?: { icon: keyof typeof Ionicons.glyphMap; text: string };
  link?: { label: string; onPress: () => void };
}

export function SectionHeader({
  title,
  counter,
  badge,
  subtitle,
  link,
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
            }}
            className="text-foreground dark:text-foreground-dark"
          >
            {title}
          </Text>
          {counter && (
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
              }}
              className="text-muted-foreground dark:text-muted-foreground-dark"
            >
              {counter}
            </Text>
          )}
          {badge && <Badge {...badge} />}
        </View>
        {link && (
          <Pressable onPress={link.onPress} hitSlop={8}>
            <Text
              style={{ fontSize: 13, fontWeight: "600" }}
              className="text-muted-foreground dark:text-foreground-dark"
            >
              {link.label}
            </Text>
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
          <Ionicons name={subtitle.icon} size={12} color="#64697A" />
          <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
            {subtitle.text}
          </Text>
        </View>
      )}
    </View>
  );
}
