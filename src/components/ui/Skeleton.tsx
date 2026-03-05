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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Skeleton width={120} height={18} borderRadius={6} />
        <Skeleton width={32} height={14} borderRadius={6} />
      </View>
      <Skeleton width={28} height={28} borderRadius={14} />
    </View>
  );
}

function SkeletonWeekStrip() {
  return (
    <View style={{ marginBottom: 16 }}>
      {/* Week nav row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Skeleton width={16} height={16} borderRadius={4} />
        <Skeleton width={100} height={14} borderRadius={6} />
        <Skeleton width={16} height={16} borderRadius={4} />
      </View>
      {/* Day circles */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {Array.from({ length: 7 }, (_, i) => (
          <View key={i} style={{ alignItems: "center", gap: 6 }}>
            <Skeleton width={28} height={10} borderRadius={4} />
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SkeletonSectionCard() {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? colors.border.dark : colors.border.DEFAULT,
        backgroundColor: isDark ? colors.card.dark : colors.card.DEFAULT,
        alignItems: "center",
        paddingVertical: 24,
      }}
    >
      <Skeleton width={140} height={12} borderRadius={6} />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={{ paddingBottom: 32 }}>
      {/* Header: Avatar + Greeting + Bell */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: 16,
          paddingTop: 4,
        }}
      >
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width={90} height={12} borderRadius={6} />
          <Skeleton
            width={120}
            height={22}
            borderRadius={8}
            style={{ marginTop: 6 }}
          />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>

      {/* Week strip */}
      <SkeletonWeekStrip />

      {/* Today's Tasks */}
      <View style={{ marginBottom: 16 }}>
        <SkeletonSectionHeader />
        <SkeletonSectionCard />
      </View>

      {/* Items */}
      <View style={{ marginBottom: 16 }}>
        <SkeletonSectionHeader />
        <SkeletonSectionCard />
      </View>

      {/* Reminders */}
      <View style={{ marginBottom: 16 }}>
        <SkeletonSectionHeader />
        <SkeletonSectionCard />
      </View>
    </View>
  );
}
