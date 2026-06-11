import { Text, View, TouchableOpacity, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/lib/language-provider";
import { useState } from "react";
import type { Language } from "@/lib/i18n";
import { APP_VERSION, checkForUpdate, openUpdateUrl, type VersionInfo } from "@/constants/version";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout();
      router.replace("/login");
    } else {
      Alert.alert(t("logout"), t("logoutConfirm"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLangPicker(false);
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);
      if (!info.hasUpdate) {
        if (Platform.OS === "web") {
          alert(t("alreadyLatest"));
        } else {
          Alert.alert(t("checkUpdate"), t("alreadyLatest"));
        }
      }
    } catch (error) {
      console.error("[Settings] Check update failed:", error);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleUpdate = () => {
    if (updateInfo?.downloadUrl) {
      openUpdateUrl(updateInfo.downloadUrl);
    } else {
      openUpdateUrl();
    }
  };

  return (
    <ScreenContainer className="px-4 pt-4">
      {/* Header */}
      <View className="mb-6 px-2">
        <Text className="text-2xl font-bold text-foreground">{t("settings")}</Text>
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
              {user?.name || (language === "zh" ? "用户" : "User")}
            </Text>
            <Text className="text-sm text-muted mt-0.5">
              {user?.email || (language === "zh" ? "已登录" : "Signed in")}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Items */}
      <View className="bg-surface rounded-2xl border border-border mb-4 overflow-hidden">
        {/* Language Setting */}
        <TouchableOpacity
          className="flex-row items-center gap-3 px-4 py-4 border-b border-border"
          onPress={() => setShowLangPicker(!showLangPicker)}
        >
          <IconSymbol name="globe" size={20} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-base text-foreground">{t("language")}</Text>
            <Text className="text-xs text-muted mt-0.5">
              {language === "zh" ? "中文" : "English"}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </TouchableOpacity>

        {/* Language Picker */}
        {showLangPicker && (
          <View className="px-4 py-2 border-b border-border" style={{ backgroundColor: colors.background }}>
            <TouchableOpacity
              className="flex-row items-center justify-between py-3 px-3 rounded-xl mb-1"
              style={{ backgroundColor: language === "zh" ? colors.primary + "10" : "transparent" }}
              onPress={() => handleLanguageChange("zh")}
            >
              <Text className="text-base text-foreground">{t("languageZh")}</Text>
              {language === "zh" && (
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between py-3 px-3 rounded-xl"
              style={{ backgroundColor: language === "en" ? colors.primary + "10" : "transparent" }}
              onPress={() => handleLanguageChange("en")}
            >
              <Text className="text-base text-foreground">{t("languageEn")}</Text>
              {language === "en" && (
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications */}
        <View className="flex-row items-center gap-3 px-4 py-4 border-b border-border">
          <IconSymbol name="bell.fill" size={20} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-base text-foreground">
              {language === "zh" ? "通知提醒" : "Notifications"}
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              {language === "zh" ? "管理充值提醒通知" : "Manage recharge reminders"}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </View>

        {/* Version & Update */}
        <TouchableOpacity
          className="flex-row items-center gap-3 px-4 py-4"
          onPress={handleCheckUpdate}
          disabled={isCheckingUpdate}
        >
          <IconSymbol name="arrow.up.circle" size={20} color={colors.primary} />
          <View className="flex-1">
            <Text className="text-base text-foreground">{t("checkUpdate")}</Text>
            <Text className="text-xs text-muted mt-0.5">
              {t("currentVersion")}: v{APP_VERSION}
            </Text>
          </View>
          {isCheckingUpdate ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Update Available Banner */}
      {updateInfo?.hasUpdate && (
        <View
          className="rounded-2xl p-4 border mb-4"
          style={{ backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <IconSymbol name="arrow.up.circle" size={24} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {t("updateAvailable")}
              </Text>
              <Text className="text-sm text-muted mt-0.5">
                {t("newVersionAvailable", { version: updateInfo.version })}
              </Text>
            </View>
          </View>
          {updateInfo.releaseNotes ? (
            <Text className="text-xs text-muted mb-3" numberOfLines={3}>
              {updateInfo.releaseNotes}
            </Text>
          ) : null}
          <TouchableOpacity
            className="w-full py-3 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleUpdate}
          >
            <Text className="text-white font-semibold">{t("updateNow")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity
        className="bg-surface rounded-2xl p-4 border border-border items-center"
        onPress={handleLogout}
      >
        <View className="flex-row items-center gap-2">
          <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
          <Text className="text-base font-medium" style={{ color: colors.error }}>
            {t("logout")}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <View className="items-center mt-8">
        <Text className="text-xs text-muted">{t("appTitle")} v{APP_VERSION}</Text>
        <Text className="text-xs text-muted mt-1">
          {language === "zh" ? "帮助您管理全球电话卡充值" : "Helping you manage global SIM card recharges"}
        </Text>
      </View>
    </ScreenContainer>
  );
}
