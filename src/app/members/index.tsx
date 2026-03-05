import { View, Text, Pressable, RefreshControl, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useMembers, useRemoveMember } from "@/hooks/useMembers";
import { useHouseholdStore } from "@/stores";
import { getInitials } from "@/utils/format";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";
import type { HouseholdMemberWithProfile } from "@/domain/models";

function MemberCard({ member, isCurrentOwner, onRemove }: { member: HouseholdMemberWithProfile; isCurrentOwner: boolean; onRemove?: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark flex-row items-center">
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Text className="text-primary font-semibold text-sm">{getInitials(member.profile.name)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground dark:text-foreground-dark">{member.profile.name}</Text>
        <Text className="text-xs text-muted-foreground">{t(`members.${member.role}`)}</Text>
      </View>
      {isCurrentOwner && member.role !== "owner" && onRemove && (
        <Pressable onPress={onRemove}><Ionicons name="close-circle-outline" size={22} color={colors.destructive.DEFAULT} /></Pressable>
      )}
    </View>
  );
}

export default function MembersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, refetch, isLoading } = useMembers();
  const removeMember = useRemoveMember();
  const { isOwner } = useHouseholdStore();
  const members = data?.data?.data ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  const handleRemove = (memberId: string) => {
    Alert.alert(t("members.removeMember"), t("members.removeConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: async () => { try { await removeMember.mutateAsync(memberId); } catch { toast.error(t("error.generic")); } } },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.primary.DEFAULT} /></Pressable>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t("members.title")}</Text>
        </View>
        {isOwner() && (
          <Pressable className="w-10 h-10 bg-primary rounded-full items-center justify-center" onPress={() => router.push("/members/invite")}>
            <Ionicons name="person-add" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
      <ScrollView className="flex-1 px-5" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}>
        {members.map((m) => <MemberCard key={m.id} member={m} isCurrentOwner={isOwner()} onRemove={() => handleRemove(m.id)} />)}
      </ScrollView>
    </SafeAreaView>
  );
}
