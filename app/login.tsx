import { Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/lib/language-provider";
import { useState } from "react";

type LoginMethod = "email" | "phone";

export default function LoginScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!inputValue.trim()) {
      const msg = loginMethod === "email"
        ? t("pleaseEnterEmail")
        : t("pleaseEnterPhone");
      if (Platform.OS === "web") {
        alert(msg);
      } else {
        Alert.alert(t("loginError"), msg);
      }
      return;
    }

    setIsLoading(true);
    try {
      // Use OAuth login flow - the OAuth portal supports email/phone login
      await startOAuthLogin();
    } catch (error) {
      console.error("[Login] Failed:", error);
      if (Platform.OS === "web") {
        alert(t("loginFailed"));
      } else {
        Alert.alert(t("loginError"), t("loginFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center items-center px-8 gap-6">
            {/* Logo Area */}
            <View className="items-center gap-4">
              <View
                className="w-24 h-24 rounded-3xl items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <IconSymbol name="sim.card" size={48} color="#FFFFFF" />
              </View>
              <Text className="text-3xl font-bold text-foreground">{t("appTitle")}</Text>
              <Text className="text-base text-muted text-center leading-6">
                {t("appSubtitle")}
              </Text>
            </View>

            {/* Features */}
            <View className="w-full gap-3">
              <View className="flex-row items-center gap-3 px-4">
                <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                <Text className="text-sm text-foreground">{t("feature1")}</Text>
              </View>
              <View className="flex-row items-center gap-3 px-4">
                <IconSymbol name="sim.card" size={20} color={colors.primary} />
                <Text className="text-sm text-foreground">{t("feature2")}</Text>
              </View>
              <View className="flex-row items-center gap-3 px-4">
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                <Text className="text-sm text-foreground">{t("feature3")}</Text>
              </View>
            </View>

            {/* Login Method Tabs */}
            <View className="w-full mt-4">
              <View
                className="flex-row rounded-xl overflow-hidden mb-4"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <TouchableOpacity
                  className="flex-1 py-3 items-center"
                  style={{
                    backgroundColor: loginMethod === "email" ? colors.primary : "transparent",
                  }}
                  onPress={() => setLoginMethod("email")}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: loginMethod === "email" ? "#FFFFFF" : colors.foreground }}
                  >
                    {t("emailLogin")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 items-center"
                  style={{
                    backgroundColor: loginMethod === "phone" ? colors.primary : "transparent",
                  }}
                  onPress={() => setLoginMethod("phone")}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: loginMethod === "phone" ? "#FFFFFF" : colors.foreground }}
                  >
                    {t("phoneLogin")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Field */}
              <View
                className="w-full rounded-xl px-4 py-3 mb-4"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <TextInput
                  className="text-base"
                  style={{ color: colors.foreground, minHeight: 24 }}
                  placeholder={loginMethod === "email" ? t("emailPlaceholder") : t("loginPhonePlaceholder")}
                  placeholderTextColor={colors.muted}
                  value={inputValue}
                  onChangeText={setInputValue}
                  keyboardType={loginMethod === "email" ? "email-address" : "phone-pad"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                className="w-full py-4 rounded-2xl items-center active:opacity-80"
                style={{
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.6 : 1,
                }}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text className="text-white text-lg font-semibold">
                  {isLoading ? t("loggingIn") : t("loginButton")}
                </Text>
              </TouchableOpacity>

              <Text className="text-xs text-muted mt-3 text-center">
                {t("loginHint")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
