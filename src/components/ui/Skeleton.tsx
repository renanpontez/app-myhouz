import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/providers/ThemeProvider";
import { colors } from "@/styles/colors";

/* ---------- Base Skeleton ---------- */

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark
            ? colors.muted.dark
            : colors.muted.DEFAULT,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

/* ---------- SkeletonListRow ---------- */

export function SkeletonListRow() {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? colors.border.dark : colors.border.DEFAULT,
        backgroundColor: isDark ? colors.card.dark : colors.card.DEFAULT,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Icon circle */}
      <Skeleton width={40} height={40} borderRadius={20} />

      {/* Text lines */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="60%" height={14} borderRadius={6} />
        <Skeleton
          width="40%"
          height={10}
          borderRadius={5}
          style={{ marginTop: 6 }}
        />
      </View>

      {/* Chevron placeholder */}
      <Skeleton width={16} height={16} borderRadius={4} style={{ marginLeft: 4 }} />
    </View>
  );
}

/* ---------- SkeletonCard ---------- */

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  const { isDark } = useTheme();
  const widths = ["90%", "70%", "80%", "50%", "60%"] as const;

  return (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? colors.border.dark : colors.border.DEFAULT,
        backgroundColor: isDark ? colors.card.dark : colors.card.DEFAULT,
        gap: 10,
      }}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={widths[i % widths.length]}
          height={12}
          borderRadius={6}
        />
      ))}
    </View>
  );
}

/* ---------- SkeletonDetail ---------- */

function SkeletonInfoRow() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
      }}
    >
      <Skeleton width={80} height={12} borderRadius={6} />
      <Skeleton width={120} height={12} borderRadius={6} />
    </View>
  );
}

export function SkeletonDetail() {
  const { isDark } = useTheme();

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
      {/* Title */}
      <Skeleton width="70%" height={24} borderRadius={8} />
      <Skeleton
        width="40%"
        height={14}
        borderRadius={6}
        style={{ marginTop: 10 }}
      />

      {/* Description / notes area */}
      <Skeleton
        width="100%"
        height={60}
        borderRadius={12}
        style={{ marginTop: 20 }}
      />

      {/* Info rows */}
      <View
        style={{
          marginTop: 20,
          borderTopWidth: 1,
          borderTopColor: isDark ? colors.border.dark : colors.border.DEFAULT,
        }}
      >
        <SkeletonInfoRow />
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border.dark : colors.border.DEFAULT,
          }}
        >
          <SkeletonInfoRow />
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border.dark : colors.border.DEFAULT,
          }}
        >
          <SkeletonInfoRow />
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border.dark : colors.border.DEFAULT,
          }}
        >
          <SkeletonInfoRow />
        </View>
      </View>

      {/* Action button */}
      <Skeleton
        width="100%"
        height={52}
        borderRadius={16}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}

/* ---------- SkeletonDashboard ---------- */

function SkeletonSectionHeader() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        marginTop: 8,
      }}
    >
      <Skeleton width={120} height={18} borderRadius={6} />
      <Skeleton width={40} height={14} borderRadius={6} />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
      {/* Greeting */}
      <View style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Skeleton width={100} height={12} borderRadius={6} />
        <Skeleton
          width="65%"
          height={24}
          borderRadius={8}
          style={{ marginTop: 6 }}
        />
      </View>

      {/* Week strip area */}
      <Skeleton
        width="100%"
        height={100}
        borderRadius={16}
        style={{ marginBottom: 16 }}
      />

      {/* Today's Tasks */}
      <View style={{ marginBottom: 16 }}>
        <SkeletonSectionHeader />
        <SkeletonListRow />
        <SkeletonListRow />
        <SkeletonListRow />
      </View>

      {/* Items */}
      <View style={{ marginBottom: 16 }}>
        <SkeletonSectionHeader />
        <SkeletonListRow />
        <SkeletonListRow />
      </View>

      {/* Reminders */}
      <View style={{ marginBottom: 16 }}>
        <SkeletonSectionHeader />
        <SkeletonListRow />
        <SkeletonListRow />
      </View>
    </View>
  );
}
