import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Share } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useCreateInvite } from "@/hooks/useMembers";
import { toast } from "@/stores/toast.store";
import { env } from "@/core/config/env";

export default function InviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createInvite = useCreateInvite();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const result = await createInvite.mutateAsync({ email: email || undefined });
      const code = (result?.data as any)?.data?.code;
      if (code) setInviteCode(code);
      toast.success(t("members.inviteSent"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    const url = `${env.API_URL}/invite/${inviteCode}`;
    await Share.share({ message: `Join my household on myhouz: ${url}`, url });
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-1 px-6 pt-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.dismiss()}><Text className="text-primary text-base">{t("common.cancel")}</Text></Pressable>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">{t("members.inviteMember")}</Text>
          <View className="w-16" />
        </View>

        {!inviteCode ? (
          <View className="gap-5">
            <View>
              <Text className="text-sm text-muted-foreground mb-1.5">{t("members.inviteEmail")}</Text>
              <TextInput className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder={t("members.inviteEmail")} placeholderTextColor="#64697A" />
            </View>
            <Pressable className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50" onPress={handleCreate} disabled={createInvite.isPending}>
              {createInvite.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-primary-foreground font-semibold text-base">{t("members.invite")}</Text>}
            </Pressable>
          </View>
        ) : (
          <View className="gap-5 items-center">
            <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">{t("members.inviteLink")}</Text>
            <View className="bg-card dark:bg-card-dark rounded-xl p-4 w-full border border-border dark:border-border-dark">
              <Text className="text-foreground dark:text-foreground-dark text-center font-mono">{inviteCode}</Text>
            </View>
            <Pressable className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80" onPress={handleShare}>
              <Text className="text-primary-foreground font-semibold text-base">{t("members.shareInvite")}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
