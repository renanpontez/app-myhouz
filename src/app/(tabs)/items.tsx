import { View, Text, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useItems } from "@/hooks/useItems";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { colors } from "@/styles/colors";
import type { HouseholdItem, ItemType, ItemStatus } from "@/domain/models";

const FILTER_TABS: (ItemType | "all")[] = ["all", "buy", "repair", "fix"];
const STATUS_TABS: (ItemStatus | "all")[] = ["all", "pending", "in_progress", "done"];

const TYPE_ICON: Record<ItemType, keyof typeof Ionicons.glyphMap> = {
  buy: "cart",
  repair: "construct",
  fix: "build",
};

const PRIORITY_BADGE: Record<string, { variant: "destructive" | "warning" | "muted"; label: string }> = {
  high: { variant: "destructive", label: "" },
  medium: { variant: "warning", label: "" },
  low: { variant: "muted", label: "" },
};

function ItemRowContent({ item, onPress, t }: { item: HouseholdItem; onPress: () => void; t: (key: string) => string }) {
  const priorityColor =
    item.priority === "high"
      ? colors.destructive.DEFAULT
      : item.priority === "medium"
        ? colors.warning.DEFAULT
        : colors.muted.foreground;

  const priceStr = item.price ? ` · R$ ${item.price.toFixed(2)}` : "";
  const subtitleText = `${t(`items.${item.type}`)}${priceStr}`;

  const priorityBadge = PRIORITY_BADGE[item.priority];

  return (
    <ListRow
      icon={{
        icon: TYPE_ICON[item.type],
        color: priorityColor,
      }}
      title={item.name}
      strikethrough={item.status === "done"}
      subtitle={
        <Text style={{ fontSize: 12, color: colors.muted.foreground }}>
          {subtitleText}
        </Text>
      }
      badge={
        priorityBadge ? (
          <Badge
            label={t(`items.${item.priority}`)}
            variant={priorityBadge.variant}
          />
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

export default function ItemsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ItemType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");

  const filters: { type?: string; status?: string } = {};
  if (activeFilter !== "all") filters.type = activeFilter;
  if (statusFilter !== "all") filters.status = statusFilter;
  const hasFilters = Object.keys(filters).length > 0;
  const { data, refetch, isLoading } = useItems(hasFilters ? filters : undefined);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const items = data?.data?.data ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          {t("items.title")}
        </Text>
        <Pressable
          className="w-10 h-10 bg-primary rounded-full items-center justify-center"
          onPress={() => router.push("/items/new")}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Type filter tabs */}
      <View className="flex-row px-5 gap-2 mb-2">
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab}
            className={`px-4 py-2 rounded-full ${activeFilter === tab ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
            onPress={() => setActiveFilter(tab)}
          >
            <Text
              className={`text-sm font-medium ${activeFilter === tab ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {tab === "all" ? t("common.all") : t(`items.${tab}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Status filter tabs */}
      <View className="flex-row px-5 gap-2 mb-3">
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab}
            className={`px-3 py-1.5 rounded-full ${statusFilter === tab ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
            onPress={() => setStatusFilter(tab)}
          >
            <Text
              className={`text-xs font-medium ${statusFilter === tab ? "text-primary-foreground" : "text-muted-foreground"}`}
            >
              {tab === "all" ? t("common.all") : t(`items.${tab === "in_progress" ? "inProgress" : tab}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlashList
        data={items}
        renderItem={({ item }) => (
          <ItemRowContent
            item={item}
            onPress={() => router.push(`/items/${item.id}`)}
            t={t}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center pt-20">
              <Ionicons name="cart-outline" size={48} color={colors.muted.foreground} />
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mt-4">
                {t("items.noItems")}
              </Text>
              <Text className="text-muted-foreground text-sm mt-1">
                {t("items.noItemsSubtitle")}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
