import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { useHouseholdStore } from "@/stores";
import { getMemberName } from "@/utils/members";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";
import type { ItemType, ItemPriority, ItemStatus } from "@/domain/models";

const TYPES: ItemType[] = ["buy", "repair", "fix"];
const PRIORITIES: ItemPriority[] = ["low", "medium", "high"];
const STATUSES: ItemStatus[] = ["pending", "in_progress", "done"];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border dark:border-border-dark">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { data, isLoading } = useItem(itemId);
  const updateItem = useUpdateItem(itemId);
  const deleteItem = useDeleteItem();
  const { members } = useHouseholdStore();

  const item = data?.data?.data;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<ItemType>("buy");
  const [editPriority, setEditPriority] = useState<ItemPriority>("medium");
  const [editPrice, setEditPrice] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const enterEditMode = () => {
    if (!item) return;
    setEditName(item.name);
    setEditType(item.type);
    setEditPriority(item.priority);
    setEditPrice(item.price ? String(item.price) : "");
    setEditLink(item.link ?? "");
    setEditAssignedTo(item.assigned_to);
    setEditNotes(item.notes ?? "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateItem.mutateAsync({
        name: editName,
        type: editType,
        priority: editPriority,
        price: editPrice ? parseFloat(editPrice) : null,
        link: editLink || null,
        assigned_to: editAssignedTo,
        notes: editNotes || null,
      } as any);
      setIsEditing(false);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleStatusChange = async (status: ItemStatus) => {
    try {
      await updateItem.mutateAsync({ status } as any);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleDelete = () => {
    Alert.alert(t("common.delete"), t("items.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem.mutateAsync(itemId);
            router.back();
          } catch {
            toast.error(t("error.generic"));
          }
        },
      },
    ]);
  };

  if (isLoading || !item) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </SafeAreaView>
    );
  }

  const priorityColor = item.priority === "high" ? colors.destructive.DEFAULT : item.priority === "medium" ? colors.warning.DEFAULT : colors.muted.foreground;

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <ScrollView className="flex-1 px-6 pt-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable onPress={() => setIsEditing(false)}>
              <Text className="text-primary text-base">{t("common.cancel")}</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              {t("items.editItem")}
            </Text>
            <View className="w-16" />
          </View>

          <View className="gap-5">
            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("items.itemName")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-2">{t("items.type")}</Text>
              <View className="flex-row gap-2">
                {TYPES.map((t_) => (
                  <Pressable
                    key={t_}
                    className={`flex-1 py-3 rounded-xl items-center ${editType === t_ ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                    onPress={() => setEditType(t_)}
                  >
                    <Text className={`text-sm font-medium ${editType === t_ ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                      {t(`items.${t_}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-2">{t("items.priority")}</Text>
              <View className="flex-row gap-2">
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p}
                    className={`flex-1 py-3 rounded-xl items-center ${editPriority === p ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                    onPress={() => setEditPriority(p)}
                  >
                    <Text className={`text-sm font-medium ${editPriority === p ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                      {t(`items.${p}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("items.price")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder={t("items.pricePlaceholder")}
                placeholderTextColor="#64697A"
                keyboardType="decimal-pad"
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("items.link")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editLink}
                onChangeText={setEditLink}
                placeholder={t("items.linkPlaceholder")}
                placeholderTextColor="#64697A"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <MemberPicker
              value={editAssignedTo}
              onChange={setEditAssignedTo}
              label={t("items.assignedTo")}
            />

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("items.notes")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ minHeight: 80 }}
              />
            </View>
          </View>

          <Pressable
            className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8"
            onPress={handleSave}
            disabled={updateItem.isPending || !editName.trim()}
          >
            {updateItem.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">{t("common.saveChanges")}</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary.DEFAULT} />
          </Pressable>
          <View className="flex-row gap-4">
            <Pressable onPress={enterEditMode}>
              <Ionicons name="create-outline" size={22} color={colors.primary.DEFAULT} />
            </Pressable>
            <Pressable onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={colors.destructive.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-4">
          {item.name}
        </Text>

        <View className="flex-row gap-2 mb-6">
          <View className="px-3 py-1 rounded-full bg-muted dark:bg-muted-dark">
            <Text className="text-sm text-muted-foreground">{t(`items.${item.type}`)}</Text>
          </View>
          <View className="px-3 py-1 rounded-full" style={{ backgroundColor: priorityColor + "15" }}>
            <Text className="text-sm" style={{ color: priorityColor }}>{t(`items.${item.priority}`)}</Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-muted dark:bg-muted-dark">
            <Text className="text-sm text-muted-foreground">
              {t(`items.${item.status === "in_progress" ? "inProgress" : item.status}`)}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          {item.price != null && (
            <InfoRow label={t("items.price")} value={`R$ ${item.price.toFixed(2)}`} />
          )}
          {item.assigned_to && (
            <InfoRow label={t("items.assignedTo")} value={getMemberName(item.assigned_to, members)} />
          )}
          {item.link && (
            <Pressable
              className="flex-row items-center justify-between py-3 border-b border-border dark:border-border-dark"
              onPress={() => Linking.openURL(item.link!)}
            >
              <Text className="text-sm text-muted-foreground">{t("items.link")}</Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm text-primary" numberOfLines={1} style={{ maxWidth: 200 }}>
                  {item.link.replace(/^https?:\/\//, "")}
                </Text>
                <Ionicons name="open-outline" size={14} color={colors.primary.DEFAULT} />
              </View>
            </Pressable>
          )}
          <InfoRow label={t("items.addedBy")} value={getMemberName(item.added_by, members)} />
          <InfoRow label={t("items.createdAt")} value={format(new Date(item.created_at), "PPP")} />
        </View>

        {item.notes && (
          <View className="mb-6">
            <Text className="text-sm text-muted-foreground mb-1">{t("items.notes")}</Text>
            <Text className="text-foreground dark:text-foreground-dark">{item.notes}</Text>
          </View>
        )}

        {/* Status pills */}
        <View className="mb-2">
          <Text className="text-sm text-muted-foreground mb-2">{t("items.status")}</Text>
          <View className="flex-row gap-2">
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                className={`flex-1 py-3 rounded-xl items-center ${item.status === s ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                onPress={() => handleStatusChange(s)}
                disabled={updateItem.isPending}
              >
                <Text className={`text-sm font-medium ${item.status === s ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
                  {t(`items.${s === "in_progress" ? "inProgress" : s}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
