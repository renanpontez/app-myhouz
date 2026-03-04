import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/providers/ThemeProvider";
import { useAppStore } from "@/stores";
import { useHouseholdStore } from "@/stores";
import { getHttpClient } from "@/core/config";
import { API } from "@/data/api/endpoints";
import { colors } from "@/styles/colors";
import { getInitials, formatDisplayName } from "@/utils/format";
import { toast } from "@/stores/toast.store";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useAppStore();
  const { isOwner, members, activeHouseholdId } = useHouseholdStore();

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t("auth.signOut"), "", [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("auth.signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  const otherMembers = members.filter((m) => m.user_id !== user?.id);

  const handleDeleteAccount = () => {
    if (!isOwner() || !activeHouseholdId) {
      // Not an owner — just confirm and delete
      Alert.alert(t("auth.deleteAccount"), t("auth.deleteAccountConfirm"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("auth.deleteAccount"), style: "destructive", onPress: deleteAccount },
      ]);
      return;
    }

    if (otherMembers.length === 0) {
      // Owner but sole member — warn all data will be lost
      Alert.alert(
        t("auth.deleteAccount"),
        t("auth.deleteAccountSoleOwner"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("auth.deleteEverything"), style: "destructive", onPress: async () => {
            try {
              const httpClient = getHttpClient();
              await httpClient.delete(API.household(activeHouseholdId).detail);
              await deleteAccount();
            } catch {
              toast.error(t("error.generic"));
            }
          }},
        ],
      );
      return;
    }

    // Owner with other members — show transfer picker
    setShowTransfer(true);
  };

  const handleTransferAndDelete = async (newOwnerId: string) => {
    if (!activeHouseholdId) return;
    setTransferring(true);
    try {
      const httpClient = getHttpClient();
      await httpClient.post(API.household(activeHouseholdId).transfer, {
        new_owner_id: newOwnerId,
      });
      setShowTransfer(false);
      await deleteAccount();
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setTransferring(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.primary.DEFAULT} /></Pressable>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{t("settings.title")}</Text>
        </View>

        {/* Profile */}
        <View className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-4 border border-border dark:border-border-dark flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
            <Text className="text-primary font-bold text-base">{user ? getInitials(user.name) : ""}</Text>
          </View>
          <View>
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">{user?.name}</Text>
            <Text className="text-sm text-muted-foreground">{user?.email}</Text>
          </View>
        </View>

        {/* Theme */}
        <Pressable className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark flex-row items-center justify-between" onPress={toggleTheme}>
          <View className="flex-row items-center gap-3">
            <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary.DEFAULT} />
            <Text className="text-base text-foreground dark:text-foreground-dark">{t("settings.theme")}</Text>
          </View>
          <Text className="text-muted-foreground">{isDark ? t("settings.dark") : t("settings.light")}</Text>
        </Pressable>

        {/* Language */}
        <Pressable className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark flex-row items-center justify-between" onPress={() => setLanguage(language === "pt-BR" ? "en-US" : "pt-BR")}>
          <View className="flex-row items-center gap-3">
            <Ionicons name="language" size={20} color={colors.primary.DEFAULT} />
            <Text className="text-base text-foreground dark:text-foreground-dark">{t("settings.language")}</Text>
          </View>
          <Text className="text-muted-foreground">{language}</Text>
        </Pressable>

        {/* Household Settings (owner only) */}
        {isOwner() && (
          <Pressable className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark flex-row items-center justify-between" onPress={() => router.push("/settings/household")}>
            <View className="flex-row items-center gap-3">
              <Ionicons name="home-outline" size={20} color={colors.primary.DEFAULT} />
              <Text className="text-base text-foreground dark:text-foreground-dark">{t("settings.householdSettings")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted.foreground} />
          </Pressable>
        )}

        {/* Sign Out */}
        <Pressable className="bg-card dark:bg-card-dark rounded-2xl p-4 mb-3 border border-border dark:border-border-dark" onPress={handleSignOut}>
          <Text className="text-destructive font-medium text-base text-center">{t("auth.signOut")}</Text>
        </Pressable>

        {/* Delete Account */}
        <Pressable className="p-4 mb-8" onPress={handleDeleteAccount}>
          <Text className="text-destructive text-sm text-center">{t("auth.deleteAccount")}</Text>
        </Pressable>
      </ScrollView>

      {/* Transfer Ownership Modal */}
      <Modal visible={showTransfer} transparent animationType="slide" onRequestClose={() => setShowTransfer(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => !transferring && setShowTransfer(false)} />
        <View className="bg-card dark:bg-card-dark rounded-t-3xl pb-10">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
          </View>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark px-5 mb-1">
            {t("auth.transferOwnership")}
          </Text>
          <Text className="text-sm text-muted-foreground px-5 mb-4">
            {t("auth.transferOwnershipDesc")}
          </Text>
          {transferring ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
          ) : (
            <FlatList
              data={otherMembers}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center px-5 py-3.5 active:bg-muted/40"
                  onPress={() => {
                    Alert.alert(
                      t("auth.transferAndDelete"),
                      t("auth.transferAndDeleteConfirm", { name: formatDisplayName(item.profile.name) }),
                      [
                        { text: t("common.cancel"), style: "cancel" },
                        { text: t("common.confirm"), style: "destructive", onPress: () => handleTransferAndDelete(item.user_id) },
                      ],
                    );
                  }}
                >
                  <View className="w-9 h-9 rounded-full bg-muted dark:bg-muted-dark items-center justify-center mr-3">
                    <Text className="text-sm font-semibold text-muted-foreground">{getInitials(item.profile.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-foreground dark:text-foreground-dark">{formatDisplayName(item.profile.name)}</Text>
                    <Text className="text-xs text-muted-foreground">{item.profile.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted.foreground} />
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
