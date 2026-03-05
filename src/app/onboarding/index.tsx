import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { getHttpClient } from "@/core/config";
import { API } from "@/data/api/endpoints";
import { useHouseholdStore } from "@/stores";
import { useAcceptInvite } from "@/hooks/useMembers";
import { toast } from "@/stores/toast.store";
import { cn } from "@/utils/cn";
import { colors } from "@/styles/colors";
import type { Household } from "@/domain/models";

type Step = "choose" | "create" | "join";
type Selection = "create" | "join" | null;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setActiveHouseholdId } = useHouseholdStore();
  const acceptInvite = useAcceptInvite();

  const [step, setStep] = useState<Step>("choose");
  const [selection, setSelection] = useState<Selection>(null);

  // Create household
  const [householdName, setHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);

  // Join with code
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleContinue = () => {
    if (selection === "create") setStep("create");
    else if (selection === "join") setStep("join");
  };

  const handleBack = () => {
    setStep("choose");
    setJoinError("");
  };

  const handleCreateHousehold = async () => {
    try {
      setCreating(true);
      const httpClient = getHttpClient();

      const response = await httpClient.post<{ data: Household }>(
        API.user.households,
        { name: householdName },
      );
      const raw = response.data as any;
      const household = raw?.data ?? raw;
      const id = household?.id;
      if (!id) throw new Error("No household ID in response");
      setActiveHouseholdId(id);
      router.replace("/(tabs)");
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    try {
      setJoinError("");
      await acceptInvite.mutateAsync({ code: inviteCode });
      toast.success(t("onboarding.householdCreated"));
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (msg.includes("expired")) {
        setJoinError(t("onboarding.expiredCode"));
      } else if (msg.includes("invalid")) {
        setJoinError(t("onboarding.invalidCode"));
      } else {
        setJoinError(t("onboarding.codeNotFound"));
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-8 sm:items-center sm:px-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full sm:max-w-form">
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={require("../../../assets/myhouz-logo.png")}
              className="w-[180px] h-[75px]"
              resizeMode="contain"
            />
          </View>

          {step === "choose" && (
            <ChooseStep
              selection={selection}
              onSelect={setSelection}
              onContinue={handleContinue}
              t={t}
            />
          )}

          {step === "create" && (
            <CreateStep
              name={householdName}
              onChangeName={setHouseholdName}
              loading={creating}
              onCreate={handleCreateHousehold}
              onBack={handleBack}
              t={t}
            />
          )}

          {step === "join" && (
            <JoinStep
              code={inviteCode}
              onChangeCode={setInviteCode}
              loading={acceptInvite.isPending}
              error={joinError}
              onJoin={handleJoin}
              onBack={handleBack}
              t={t}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Step Components ── */

function ChooseStep({
  selection,
  onSelect,
  onContinue,
  t,
}: {
  selection: Selection;
  onSelect: (s: Selection) => void;
  onContinue: () => void;
  t: (key: string) => string;
}) {
  return (
    <View>
      <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-2 text-center">
        {t("onboarding.title")}
      </Text>
      <Text className="text-base text-muted-foreground mb-8 text-center">
        {t("onboarding.subtitle")}
      </Text>

      <View className="flex-row gap-3 mb-8">
        <Pressable
          className={cn(
            "flex-1 rounded-2xl border-2 p-5 items-center gap-3",
            selection === "create"
              ? "border-primary bg-primary/5"
              : "border-border dark:border-border-dark bg-card dark:bg-card-dark",
          )}
          onPress={() => onSelect("create")}
        >
          <Ionicons
            name="home-outline"
            size={32}
            color={
              selection === "create"
                ? colors.primary.DEFAULT
                : colors.muted.foreground
            }
          />
          <Text
            className={cn(
              "text-sm font-semibold text-center",
              selection === "create"
                ? "text-primary"
                : "text-foreground dark:text-foreground-dark",
            )}
          >
            {t("onboarding.createHousehold")}
          </Text>
          <Text className="text-xs text-muted-foreground text-center">
            {t("onboarding.createDesc")}
          </Text>
        </Pressable>

        <Pressable
          className={cn(
            "flex-1 rounded-2xl border-2 p-5 items-center gap-3",
            selection === "join"
              ? "border-primary bg-primary/5"
              : "border-border dark:border-border-dark bg-card dark:bg-card-dark",
          )}
          onPress={() => onSelect("join")}
        >
          <Ionicons
            name="code-outline"
            size={32}
            color={
              selection === "join"
                ? colors.primary.DEFAULT
                : colors.muted.foreground
            }
          />
          <Text
            className={cn(
              "text-sm font-semibold text-center",
              selection === "join"
                ? "text-primary"
                : "text-foreground dark:text-foreground-dark",
            )}
          >
            {t("onboarding.joinHousehold")}
          </Text>
          <Text className="text-xs text-muted-foreground text-center">
            {t("onboarding.joinDesc")}
          </Text>
        </Pressable>
      </View>

      <Pressable
        className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
        onPress={onContinue}
        disabled={!selection}
      >
        <Text className="text-primary-foreground font-semibold text-base">
          {t("onboarding.continue")}
        </Text>
      </Pressable>
    </View>
  );
}

function CreateStep({
  name,
  onChangeName,
  loading,
  onCreate,
  onBack,
  t,
}: {
  name: string;
  onChangeName: (v: string) => void;
  loading: boolean;
  onCreate: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  return (
    <View>
      <Pressable onPress={onBack} className="mb-4">
        <Text className="text-primary text-base">{t("onboarding.back")}</Text>
      </Pressable>

      <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-2 text-center">
        {t("onboarding.createHousehold")}
      </Text>
      <Text className="text-base text-muted-foreground mb-8 text-center">
        {t("onboarding.createDesc")}
      </Text>

      <View className="mb-6">
        <Text className="text-sm text-muted-foreground mb-1.5">
          {t("onboarding.householdName")}
        </Text>
        <TextInput
          className="border border-border dark:border-border-dark rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark"
          value={name}
          onChangeText={onChangeName}
          placeholder={t("onboarding.namePlaceholder")}
          placeholderTextColor="#64697A"
          autoFocus
        />
      </View>

      <Pressable
        className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
        onPress={onCreate}
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-primary-foreground font-semibold text-base">
            {t("onboarding.createButton")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function JoinStep({
  code,
  onChangeCode,
  loading,
  error,
  onJoin,
  onBack,
  t,
}: {
  code: string;
  onChangeCode: (v: string) => void;
  loading: boolean;
  error: string;
  onJoin: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  return (
    <View>
      <Pressable onPress={onBack} className="mb-4">
        <Text className="text-primary text-base">{t("onboarding.back")}</Text>
      </Pressable>

      <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-2 text-center">
        {t("onboarding.joinHousehold")}
      </Text>
      <Text className="text-base text-muted-foreground mb-8 text-center">
        {t("onboarding.joinDesc")}
      </Text>

      <View className="mb-6">
        <Text className="text-sm text-muted-foreground mb-1.5">
          {t("onboarding.enterCode")}
        </Text>
        <TextInput
          className={cn(
            "border rounded-xl px-4 py-3.5 text-foreground dark:text-foreground-dark bg-card dark:bg-card-dark",
            error
              ? "border-destructive"
              : "border-border dark:border-border-dark",
          )}
          value={code}
          onChangeText={onChangeCode}
          placeholder={t("onboarding.enterCode")}
          placeholderTextColor="#64697A"
          autoCapitalize="none"
          autoFocus
        />
        {error ? (
          <Text className="text-destructive text-sm mt-2">{error}</Text>
        ) : null}
      </View>

      <Pressable
        className="w-full bg-primary rounded-2xl py-4 items-center active:opacity-80 disabled:opacity-50"
        onPress={onJoin}
        disabled={loading || !code.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-primary-foreground font-semibold text-base">
            {t("onboarding.joinButton")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

