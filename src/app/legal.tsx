import { useEffect } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import { env } from "@/core/config/env";

export default function LegalScreen() {
  const router = useRouter();

  useEffect(() => {
    Linking.openURL(`${env.API_URL}/privacy`);
    router.back();
  }, []);

  return <View />;
}
