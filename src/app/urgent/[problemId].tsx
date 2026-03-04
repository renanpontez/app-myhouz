import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useUrgentProblem, useUpdateUrgentProblem, useResolveUrgentProblem, useDeleteUrgentProblem } from "@/hooks/useUrgent";
import { useHouseholdStore } from "@/stores";
import { getMemberName } from "@/utils/members";
import { SkeletonDetail } from "@/components/ui/Skeleton";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border dark:border-border-dark">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm text-foreground dark:text-foreground-dark">{value}</Text>
    </View>
  );
}

export default function UrgentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { problemId } = useLocalSearchParams<{ problemId: string }>();
  const { data, isLoading } = useUrgentProblem(problemId);
  const updateProblem = useUpdateUrgentProblem(problemId);
  const resolve = useResolveUrgentProblem(problemId);
  const deleteProblem = useDeleteUrgentProblem();
  const { members } = useHouseholdStore();
  const problem = data?.data?.data;

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const enterEditMode = () => {
    if (!problem) return;
    setEditTitle(problem.title);
    setEditDescription(problem.description);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProblem.mutateAsync({
        title: editTitle,
        description: editDescription,
      });
      setIsEditing(false);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleResolve = () => {
    Alert.alert(t("urgent.resolve"), t("urgent.resolveConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("urgent.resolve"),
        onPress: async () => {
          try {
            await resolve.mutateAsync({ is_active: false });
            router.back();
          } catch {
            toast.error(t("error.generic"));
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(t("common.delete"), t("urgent.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProblem.mutateAsync(problemId);
            router.back();
          } catch {
            toast.error(t("error.generic"));
          }
        },
      },
    ]);
  };

  if (isLoading || !problem) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <SkeletonDetail />
      </SafeAreaView>
    );
  }

  if (isEditing) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <ScrollView className="flex-1 px-6 pt-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable onPress={() => setIsEditing(false)}>
              <Text className="text-primary text-base">{t("common.cancel")}</Text>
            </Pressable>
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              {t("common.edit")}
            </Text>
            <View className="w-16" />
          </View>

          <View className="gap-5">
            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("urgent.problemTitle")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>

            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("urgent.description")}</Text>
              <TextInput
                className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />
            </View>
          </View>

          <Pressable
            className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50 mt-8 mb-8"
            onPress={handleSave}
            disabled={updateProblem.isPending || !editTitle.trim() || !editDescription.trim()}
          >
            {updateProblem.isPending ? (
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
            {problem.is_active && (
              <Pressable onPress={enterEditMode}>
                <Ionicons name="create-outline" size={22} color={colors.primary.DEFAULT} />
              </Pressable>
            )}
            <Pressable onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={colors.destructive.DEFAULT} />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {problem.title}
          </Text>
          <View className={`px-3 py-0.5 rounded-full ${problem.is_active ? "bg-destructive/10" : "bg-success/10"}`}>
            <Text className={`text-xs font-medium ${problem.is_active ? "text-destructive" : "text-success"}`}>
              {problem.is_active ? t("common.active") : t("common.resolved")}
            </Text>
          </View>
        </View>

        <Text className="text-foreground dark:text-foreground-dark mb-6">{problem.description}</Text>

        <View className="mb-6">
          <InfoRow label={t("urgent.reportedBy")} value={getMemberName(problem.reported_by, members)} />
          <InfoRow label={t("urgent.reportedAt")} value={format(new Date(problem.created_at), "PPP 'at' HH:mm")} />
          {!problem.is_active && problem.resolved_by && (
            <InfoRow label={t("urgent.resolvedBy")} value={getMemberName(problem.resolved_by, members)} />
          )}
          {!problem.is_active && problem.resolved_at && (
            <InfoRow label={t("urgent.resolvedAt")} value={format(new Date(problem.resolved_at), "PPP 'at' HH:mm")} />
          )}
        </View>

        {problem.is_active && (
          <Pressable className="w-full bg-success rounded-2xl py-4 items-center active:opacity-80" onPress={handleResolve}>
            <Text className="text-white font-semibold text-base">{t("urgent.resolve")}</Text>
          </Pressable>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
