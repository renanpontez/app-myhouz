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

type DeleteStep = "closed" | "choose" | "confirm-delete-all";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useAppStore();
  const { isOwner, members, activeHouseholdId } = useHouseholdStore();

  const [deleteStep, setDeleteStep] = useState<DeleteStep>("closed");
  const [deleting, setDeleting] = useState(false);

  const otherMembers = members.filter((m) => m.user_id !== user?.id);
  const ownsHousehold = isOwner() && !!activeHouseholdId;

  const handleSignOut = () => {
    Alert.alert(t("auth.signOut"), "", [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("auth.signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    if (!ownsHousehold) {
      // Not an owner — show final confirmation directly
      setDeleteStep("confirm-delete-all");
      return;
    }
    // Owner — show the transfer/delete choice modal
    setDeleteStep("choose");
  };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      toast.error(t("error.generic"));
      setDeleting(false);
    }
  };

  const executeDeleteEverything = async () => {
    if (!activeHouseholdId) return;
    setDeleting(true);
    try {
      const httpClient = getHttpClient();
      await httpClient.delete(API.household(activeHouseholdId).detail);
      await deleteAccount();
    } catch {
      toast.error(t("error.generic"));
      setDeleting(false);
    }
  };

  const executeTransferAndDelete = async (newOwnerId: string) => {
    if (!activeHouseholdId) return;
    setDeleting(true);
    try {
      const httpClient = getHttpClient();
      await httpClient.post(API.household(activeHouseholdId).transfer, {
        new_owner_id: newOwnerId,
      });
      await deleteAccount();
    } catch {
      toast.error(t("error.generic"));
      setDeleting(false);
    }
  };

  const closeModal = () => {
    if (!deleting) {
      setDeleteStep("closed");
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

      {/* Delete Account Modal */}
      <Modal
        visible={deleteStep !== "closed"}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable className="flex-1 bg-black/40" onPress={closeModal} />
        <View className="bg-card dark:bg-card-dark rounded-t-3xl pb-10">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
          </View>

          {deleting ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.destructive.DEFAULT} />
              <Text className="text-muted-foreground text-sm mt-3">{t("auth.deletingAccount")}</Text>
            </View>
          ) : deleteStep === "choose" ? (
            /* Step 1: Owner chooses — transfer to someone or delete everything */
            <View className="px-5">
              <View className="items-center mb-4">
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.destructive.DEFAULT + "18", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="warning" size={24} color={colors.destructive.DEFAULT} />
                </View>
              </View>
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark text-center mb-2">
                {t("auth.deleteAccountOwnerTitle")}
              </Text>
              <Text className="text-sm text-muted-foreground text-center mb-6">
                {t("auth.deleteAccountOwnerDesc")}
              </Text>

              {/* Transfer to someone */}
              {otherMembers.length > 0 && (
                <>
                  <Text className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {t("auth.transferTo")}
                  </Text>
                  <View className="bg-background dark:bg-background-dark rounded-2xl border border-border dark:border-border-dark mb-4">
                    {otherMembers.map((member, i) => (
                      <Pressable
                        key={member.id}
                        className="flex-row items-center px-4 py-3.5 active:opacity-70"
                        style={i < otherMembers.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border.DEFAULT } : undefined}
                        onPress={() => {
                          Alert.alert(
                            t("auth.transferAndDelete"),
                            t("auth.transferAndDeleteConfirm", { name: formatDisplayName(member.profile.name) }),
                            [
                              { text: t("common.cancel"), style: "cancel" },
                              { text: t("common.confirm"), style: "destructive", onPress: () => executeTransferAndDelete(member.user_id) },
                            ],
                          );
                        }}
                      >
                        <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
                          <Text className="text-sm font-semibold text-primary">{getInitials(member.profile.name)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-base text-foreground dark:text-foreground-dark">{formatDisplayName(member.profile.name)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.muted.foreground} />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Invite someone */}
              {otherMembers.length === 0 && (
                <Pressable
                  className="flex-row items-center justify-center gap-2 bg-primary rounded-2xl py-4 mb-4 active:opacity-80"
                  onPress={() => {
                    setDeleteStep("closed");
                    router.push("/members/invite");
                  }}
                >
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text className="text-primary-foreground font-semibold text-base">{t("auth.inviteSomeone")}</Text>
                </Pressable>
              )}

              {/* Delete anyway */}
              <Pressable
                className="py-3 mt-1"
                onPress={() => setDeleteStep("confirm-delete-all")}
              >
                <Text className="text-destructive text-sm text-center font-medium">
                  {t("auth.deleteAnywayButton")}
                </Text>
              </Pressable>
            </View>
          ) : deleteStep === "confirm-delete-all" ? (
            /* Step 2: Final confirmation */
            <View className="px-5">
              <View className="items-center mb-4">
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.destructive.DEFAULT + "18", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="trash" size={24} color={colors.destructive.DEFAULT} />
                </View>
              </View>
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark text-center mb-2">
                {t("auth.finalConfirmTitle")}
              </Text>
              <Text className="text-sm text-muted-foreground text-center mb-6">
                {ownsHousehold ? t("auth.finalConfirmDescOwner") : t("auth.deleteAccountConfirm")}
              </Text>

              <Pressable
                className="bg-destructive rounded-2xl py-4 items-center mb-3 active:opacity-80"
                onPress={ownsHousehold ? executeDeleteEverything : executeDelete}
              >
                <Text className="text-white font-semibold text-base">
                  {ownsHousehold ? t("auth.deleteEverything") : t("auth.deleteAccount")}
                </Text>
              </Pressable>

              <Pressable className="py-3" onPress={() => setDeleteStep(ownsHousehold ? "choose" : "closed")}>
                <Text className="text-primary text-sm text-center font-medium">{t("common.cancel")}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
