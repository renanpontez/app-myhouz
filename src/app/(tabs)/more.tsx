import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/styles/colors";
import { useHouseholdStore } from "@/stores";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
  color?: string;
}

function MenuItem({ icon, label, badge, onPress, color }: MenuItemProps) {
  return (
    <Pressable
      className="bg-card dark:bg-card-dark rounded-2xl p-4 flex-row items-center active:opacity-80 border border-border dark:border-border-dark"
      onPress={onPress}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: (color ?? colors.primary.DEFAULT) + "15" }}
      >
        <Ionicons name={icon} size={20} color={color ?? colors.primary.DEFAULT} />
      </View>
      <Text className="flex-1 text-base font-medium text-foreground dark:text-foreground-dark">
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View className="bg-destructive px-2 py-0.5 rounded-full mr-2">
          <Text className="text-white text-xs font-semibold">{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.muted.foreground} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { household } = useHouseholdStore();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8">
        <View className="pt-4 pb-6">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {t("settings.title")}
          </Text>
          {household && (
            <Text className="text-sm text-muted-foreground mt-1">
              {household.name}
            </Text>
          )}
        </View>

        <View className="gap-3">
          <MenuItem
            icon="notifications-outline"
            label={t("reminders.title")}
            onPress={() => router.push("/reminders/")}
            color={colors.info.DEFAULT}
          />
          <MenuItem
            icon="alert-circle-outline"
            label={t("urgent.title")}
            onPress={() => router.push("/urgent/")}
            color={colors.destructive.DEFAULT}
          />
          <MenuItem
            icon="people-outline"
            label={t("members.title")}
            onPress={() => router.push("/members")}
            color={colors.sage.DEFAULT}
          />
          <MenuItem
            icon="settings-outline"
            label={t("settings.title")}
            onPress={() => router.push("/settings")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
