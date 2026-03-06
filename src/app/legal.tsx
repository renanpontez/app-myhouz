import { View, ActivityIndicator, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { env } from "@/core/config/env";
import { colors } from "@/styles/colors";

export default function LegalScreen() {
  const router = useRouter();
  const url = `${env.API_URL}/privacy`;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.foreground.DEFAULT} />
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          renderLoading={() => (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
