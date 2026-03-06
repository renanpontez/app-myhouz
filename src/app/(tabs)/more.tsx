import { View, Text, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useUrgentProblems } from "@/hooks/useUrgent";
import { colors } from "@/styles/colors";
import type { UrgentProblem } from "@/domain/models";

function UrgentRow({ problem, onPress }: { problem: UrgentProblem; onPress: () => void }) {
  return (
    <Pressable className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark flex-row items-center active:opacity-80" onPress={onPress}>
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${problem.is_active ? "bg-destructive/10" : "bg-success/10"}`}>
        <Ionicons name={problem.is_active ? "alert-circle" : "checkmark-circle"} size={20} color={problem.is_active ? colors.destructive.DEFAULT : colors.success.DEFAULT} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground dark:text-foreground-dark">{problem.title}</Text>
        <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>{problem.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted.foreground} />
    </Pressable>
  );
}

export default function UrgentTabScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showActive, setShowActive] = useState(true);
  const { data, refetch, isLoading } = useUrgentProblems({ active: showActive });
  const problems = data?.data?.data ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t("urgent.title")}</Text>
        <Pressable className="w-10 h-10 bg-destructive rounded-full items-center justify-center" onPress={() => router.push("/urgent/new")}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <View className="flex-row px-5 gap-2 mb-3">
        <Pressable className={`px-4 py-2 rounded-full ${showActive ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`} onPress={() => setShowActive(true)}>
          <Text className={`text-sm font-medium ${showActive ? "text-primary-foreground" : "text-muted-foreground"}`}>{t("urgent.activeProblems")}</Text>
        </Pressable>
        <Pressable className={`px-4 py-2 rounded-full ${!showActive ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`} onPress={() => setShowActive(false)}>
          <Text className={`text-sm font-medium ${!showActive ? "text-primary-foreground" : "text-muted-foreground"}`}>{t("urgent.resolvedProblems")}</Text>
        </Pressable>
      </View>

      <FlashList
        data={problems}
        renderItem={({ item }) => <UrgentRow problem={item} onPress={() => router.push(`/urgent/${item.id}`)} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
        ListEmptyComponent={!isLoading ? (
          <View className="items-center pt-20">
            <Ionicons name="alert-circle-outline" size={48} color={colors.muted.foreground} />
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mt-4">{t("urgent.noProblems")}</Text>
            <Text className="text-muted-foreground text-sm mt-1">{t("urgent.noProblemsSubtitle")}</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}
