import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/ThemeProvider";
import { colors } from "@/styles/colors";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={48}
        color={isDark ? colors.secondary[600] : colors.secondary[300]}
      />
      <Text
        style={[
          styles.title,
          { color: isDark ? colors.foreground.dark : colors.foreground.DEFAULT },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.description,
            { color: isDark ? colors.secondary[400] : colors.secondary[500] },
          ]}
        >
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
