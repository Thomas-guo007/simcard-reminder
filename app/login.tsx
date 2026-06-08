import { Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function LoginScreen() {
  const colors = useColors();

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
          <Text className="text-3xl font-bold text-foreground">SIM卡充值提醒</Text>
          <Text className="text-base text-muted text-center leading-6">
            管理您的全球电话卡{"\n"}再也不会忘记充值
          </Text>
        </View>

        {/* Features */}
        <View className="w-full gap-3">
          <View className="flex-row items-center gap-3 px-4">
            <IconSymbol name="bell.fill" size={20} color={colors.primary} />
            <Text className="text-sm text-foreground">提前7天、3天、1天智能提醒</Text>
          </View>
          <View className="flex-row items-center gap-3 px-4">
            <IconSymbol name="sim.card" size={20} color={colors.primary} />
            <Text className="text-sm text-foreground">支持多张卡片同时管理</Text>
          </View>
          <View className="flex-row items-center gap-3 px-4">
            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
            <Text className="text-sm text-foreground">确认充值后自动重置提醒</Text>
          </View>
        </View>

        {/* Login Button */}
        <View className="w-full items-center mt-8">
          <TouchableOpacity
            className="w-full py-4 rounded-2xl items-center active:opacity-80"
            style={{ backgroundColor: colors.primary }}
            onPress={() => startOAuthLogin()}
          >
            <Text className="text-white text-lg font-semibold">一键登录</Text>
          </TouchableOpacity>
          <Text className="text-xs text-muted mt-3 text-center">
            支持邮箱或手机号登录
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
