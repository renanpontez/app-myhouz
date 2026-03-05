import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { colors } from "@/styles/colors";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.background.dark : colors.background.DEFAULT },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      {message && (
        <Text
          style={[
            styles.message,
            { color: isDark ? colors.foreground.dark : colors.foreground.DEFAULT },
          ]}
        >
          {message}
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
    gap: 16,
  },
  message: {
    fontSize: 15,
    fontWeight: "500",
  },
});
