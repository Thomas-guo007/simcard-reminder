import { Text, View, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout();
      router.replace("/login");
    } else {
      Alert.alert("退出登录", "确定要退出登录吗？", [
        { text: "取消", style: "cancel" },
        {
          text: "退出",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]);
    }
  };

  return (
    <ScreenContainer className="px-4 pt-4">
      {/* Header */}
      <View className="mb-6 px-2">
        <Text className="text-2xl font-bold text-foreground">设置</Text>
      </View>

      {/* User Info */}
      <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
        <View className="flex-row items-center gap-4">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <IconSymbol name="person.fill" size={28} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {user?.name || "用户"}
            </Text>
            <Text className="text-sm text-muted mt-0.5">
              {user?.email || "已登录"}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Items */}
      <View className="bg-surface rounded-2xl border border-border mb-4 overflow-hidden">
        <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
          <IconSymbol name="bell.fill" size={20} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-base text-foreground">通知提醒</Text>
            <Text className="text-xs text-muted mt-0.5">管理充值提醒通知</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </View>

        <View className="flex-row items-center gap-3 px-4 py-4">
          <IconSymbol name="sim.card" size={20} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-base text-foreground">关于应用</Text>
            <Text className="text-xs text-muted mt-0.5">SIM卡充值提醒 v1.0.0</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        className="bg-surface rounded-2xl p-4 border border-border items-center"
        onPress={handleLogout}
      >
        <View className="flex-row items-center gap-2">
          <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
          <Text className="text-base font-medium" style={{ color: colors.error }}>
            退出登录
          </Text>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <View className="items-center mt-8">
        <Text className="text-xs text-muted">SIM卡充值提醒</Text>
        <Text className="text-xs text-muted mt-1">帮助您管理全球电话卡充值</Text>
      </View>
    </ScreenContainer>
  );
}
