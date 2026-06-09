import { Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/lib/language-provider";

export default function LoginScreen() {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-8">
      <View className="flex-1 justify-center items-center gap-8">
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

        {/* Login Button */}
        <View className="w-full items-center mt-8">
          <TouchableOpacity
            className="w-full py-4 rounded-2xl items-center active:opacity-80"
            style={{ backgroundColor: colors.primary }}
            onPress={() => startOAuthLogin()}
          >
            <Text className="text-white text-lg font-semibold">{t("loginButton")}</Text>
          </TouchableOpacity>
          <Text className="text-xs text-muted mt-3 text-center">
            {t("loginHint")}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
