import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useCreateItem } from "@/hooks/useItems";
import { MemberPicker } from "@/components/ui/MemberPicker";
import { toast } from "@/stores/toast.store";
import type { ItemType, ItemPriority } from "@/domain/models";

const TYPES: ItemType[] = ["buy", "repair", "fix"];
const PRIORITIES: ItemPriority[] = ["low", "medium", "high"];

export default function NewItemScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createItem = useCreateItem();

  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("buy");
  const [priority, setPriority] = useState<ItemPriority>("medium");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleCreate = async () => {
    try {
      await createItem.mutateAsync({
        name,
        type,
        priority,
        notes: notes || undefined,
        price: price ? parseFloat(price) : undefined,
        link: link || undefined,
        assigned_to: assignedTo || undefined,
      } as any);
      router.dismiss();
    } catch (err) {
      console.error("[CREATE_ITEM]", err);
      toast.error(t("error.generic"));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.dismiss()}>
            <Text className="text-primary text-base">{t("common.cancel")}</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            {t("items.addItem")}
          </Text>
          <View className="w-16" />
        </View>

        <View className="gap-5">
          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("items.itemName")}</Text>
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
              value={name}
              onChangeText={setName}
              placeholder={t("items.itemName")}
              placeholderTextColor="#64697A"
              autoFocus
            />
          </View>

          <View>
            <Text className="text-sm text-muted-foreground mb-2">{t("items.type")}</Text>
            <View className="flex-row gap-2">
              {TYPES.map((t_) => (
                <Pressable
                  key={t_}
                  className={`flex-1 py-3 rounded-xl items-center ${type === t_ ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                  onPress={() => setType(t_)}
                >
                  <Text className={`text-sm font-medium ${type === t_ ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
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
                  className={`flex-1 py-3 rounded-xl items-center ${priority === p ? "bg-primary" : "bg-card dark:bg-card-dark border border-border dark:border-border-dark"}`}
                  onPress={() => setPriority(p)}
                >
                  <Text className={`text-sm font-medium ${priority === p ? "text-primary-foreground" : "text-foreground dark:text-foreground-dark"}`}>
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
              value={price}
              onChangeText={setPrice}
              placeholder={t("items.pricePlaceholder")}
              placeholderTextColor="#64697A"
              keyboardType="decimal-pad"
            />
          </View>

          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("items.link")}</Text>
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
              value={link}
              onChangeText={setLink}
              placeholder={t("items.linkPlaceholder")}
              placeholderTextColor="#64697A"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <MemberPicker
            value={assignedTo}
            onChange={setAssignedTo}
            label={t("items.assignedTo")}
          />

          <View>
            <Text className="text-sm text-muted-foreground mb-1.5">{t("items.notes")}</Text>
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
              value={notes}
              onChangeText={setNotes}
              placeholder={t("items.notes")}
              placeholderTextColor="#64697A"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          </View>
        </View>

        <Pressable
          className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8"
          onPress={handleCreate}
          disabled={createItem.isPending || !name.trim()}
        >
          {createItem.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">{t("common.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
