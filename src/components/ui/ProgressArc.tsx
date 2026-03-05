import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/styles/colors";

interface ProgressArcProps {
  progress: number;
  size?: number;
}

/**
 * Semicircle progress arc matching the web dashboard.
 * Shows a half-circle above the day number that fills as tasks are completed.
 * When all tasks are done (progress=1), shows a green checkmark icon.
 */
export function ProgressArc({ progress, size = 40 }: ProgressArcProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const allDone = clamped >= 1;

  // SVG dimensions: viewBox = "0 0 44 24"
  // Arc from (2, 22) to (42, 22) with radius 20 — a top semicircle
  const viewW = 44;
  const viewH = 24;
  const strokeWidth = 2.5;

  // Semicircle circumference = π × diameter/2 = π × 40 / 2 ≈ 62.83
  const semiCircumference = Math.PI * 40 / 2;
  const arcPath = "M 2 22 A 20 20 0 0 1 42 22";

  if (allDone) {
    // Show green checkmark when fully complete
    return (
      <View style={{ width: size, height: size * (viewH / viewW), alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.success.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size * (viewH / viewW) }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${viewH}`}>
        {/* Background arc */}
        <Path
          d={arcPath}
          stroke={colors.border.DEFAULT}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={0.4}
        />
        {/* Progress arc */}
        {clamped > 0 && (
          <Path
            d={arcPath}
            stroke={colors.success.DEFAULT}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${clamped * semiCircumference} ${semiCircumference}`}
          />
        )}
      </Svg>
    </View>
  );
}
