import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToastStore, type ToastItem } from "@/stores/toast.store";
import { colors } from "@/styles/colors";

const TOAST_DURATION = 3000;

const iconMap: Record<ToastItem["type"], keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  warning: "warning",
  info: "information-circle",
};

const colorMap: Record<ToastItem["type"], string> = {
  success: colors.success.DEFAULT,
  error: colors.destructive.DEFAULT,
  warning: colors.warning.DEFAULT,
  info: colors.info.DEFAULT,
};

function ToastMessage({ item }: { item: ToastItem }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });

    timerRef.current = setTimeout(() => {
      dismiss();
    }, TOAST_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-20, { duration: 200 });
    setTimeout(() => removeToast(item.id), 250);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.toast, animatedStyle]}>
      <Ionicons name={iconMap[item.type]} size={20} color={colorMap[item.type]} />
      <View style={styles.toastContent}>
        <Text style={styles.toastTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.message && (
          <Text style={styles.toastMessage} numberOfLines={2}>
            {item.message}
          </Text>
        )}
      </View>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.secondary[400]} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastMessage key={t.id} item={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card.dark,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  toastMessage: {
    fontSize: 13,
    fontWeight: "400",
    color: "#CBD5E1",
    marginTop: 2,
  },
});
