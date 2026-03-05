import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAcceptInvite } from "@/hooks/useMembers";
import { useHouseholdStore } from "@/stores";
import { colors } from "@/styles/colors";
import { toast } from "@/stores/toast.store";

export default function AcceptInviteScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const acceptInvite = useAcceptInvite();
  const { setActiveHouseholdId } = useHouseholdStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    acceptInvite
      .mutateAsync({ code })
      .then(() => {
        toast.success("Joined household!");
        router.replace("/(tabs)");
      })
      .catch((err) => {
        setError(err.message ?? "Failed to join");
      });
  }, [code]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
      {error ? (
        <Text className="text-destructive text-lg">{error}</Text>
      ) : (
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      )}
    </SafeAreaView>
  );
}
