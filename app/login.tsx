import { Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/lib/language-provider";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useState } from "react";

type LoginMethod = "email" | "phone";
type LoginStep = "target" | "code";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [inputValue, setInputValue] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [step, setStep] = useState<LoginStep>("target");
  const [isLoading, setIsLoading] = useState(false);

  const text = (zh: string, en: string) => (language === "zh" ? zh : en);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const resetLoginState = (method: LoginMethod) => {
    setLoginMethod(method);
    setInputValue("");
    setVerificationCode("");
    setDebugCode(null);
    setStep("target");
  };

  const validateTarget = () => {
    const value = inputValue.trim();
    if (!value) {
      return loginMethod === "email" ? t("pleaseEnterEmail") : t("pleaseEnterPhone");
    }

    if (loginMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toLowerCase())) {
      return text("请输入正确的邮箱地址", "Please enter a valid email address");
    }

    const phone = value.replace(/[\s()-]/g, "");
    if (loginMethod === "phone" && !/^\+?[0-9]{6,20}$/.test(phone)) {
      return text("请输入正确的手机号，国际号码可带 + 号", "Please enter a valid phone number. International numbers may start with +.");
    }

    return null;
  };

  const handleRequestCode = async () => {
    const validationError = validateTarget();
    if (validationError) {
      showMessage(t("loginError"), validationError);
      return;
    }

    setIsLoading(true);
    try {
      const result = await Api.requestPasswordlessCode(loginMethod, inputValue.trim());
      setDebugCode(result.debugCode ?? null);
      setStep("code");

      const message = result.debugCode
        ? text(`测试验证码：${result.debugCode}`, `Test code: ${result.debugCode}`)
        : text("验证码已发送，请查看手机或邮箱", "Verification code sent. Check your phone or email.");
      showMessage(text("验证码已发送", "Code Sent"), message);
    } catch (error) {
      console.error("[Login] Request code failed:", error);
      showMessage(t("loginError"), error instanceof Error ? error.message : t("loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      showMessage(t("loginError"), text("请输入 6 位验证码", "Please enter the 6-digit verification code"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await Api.verifyPasswordlessCode(loginMethod, inputValue.trim(), code);
      await Auth.setSessionToken(result.sessionToken);
      await Auth.setUserInfo({
        id: Number(result.user?.id ?? 0),
        openId: result.user?.openId,
        name: result.user?.name ?? null,
        email: result.user?.email ?? null,
        loginMethod: result.user?.loginMethod ?? loginMethod,
        lastSignedIn: new Date(result.user?.lastSignedIn || Date.now()),
      });
      router.replace("/(tabs)" as any);
    } catch (error) {
      console.error("[Login] Verify code failed:", error);
      showMessage(t("loginError"), error instanceof Error ? error.message : t("loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimaryAction = () => {
    if (step === "target") {
      handleRequestCode();
    } else {
      handleVerifyCode();
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

            <View className="w-full mt-4">
              <View
                className="flex-row rounded-xl overflow-hidden mb-4"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <TouchableOpacity
                  className="flex-1 py-3 items-center"
                  style={{ backgroundColor: loginMethod === "email" ? colors.primary : "transparent" }}
                  onPress={() => resetLoginState("email")}
                  disabled={isLoading}
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
                  style={{ backgroundColor: loginMethod === "phone" ? colors.primary : "transparent" }}
                  onPress={() => resetLoginState("phone")}
                  disabled={isLoading}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: loginMethod === "phone" ? "#FFFFFF" : colors.foreground }}
                  >
                    {t("phoneLogin")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                className="w-full rounded-xl px-4 py-3 mb-3"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              >
                <TextInput
                  className="text-base"
                  style={{ color: colors.foreground, minHeight: 24 }}
                  placeholder={loginMethod === "email" ? t("emailPlaceholder") : t("loginPhonePlaceholder")}
                  placeholderTextColor={colors.muted}
                  value={inputValue}
                  onChangeText={(value) => {
                    setInputValue(value);
                    setVerificationCode("");
                    setDebugCode(null);
                    setStep("target");
                  }}
                  keyboardType={loginMethod === "email" ? "email-address" : "phone-pad"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType={step === "target" ? "send" : "next"}
                  onSubmitEditing={handlePrimaryAction}
                />
              </View>

              {step === "code" && (
                <>
                  <View
                    className="w-full rounded-xl px-4 py-3 mb-3"
                    style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                  >
                    <TextInput
                      className="text-base tracking-widest"
                      style={{ color: colors.foreground, minHeight: 24 }}
                      placeholder={text("请输入 6 位验证码", "Enter 6-digit code")}
                      placeholderTextColor={colors.muted}
                      value={verificationCode}
                      onChangeText={(value) => setVerificationCode(value.replace(/\D/g, "").slice(0, 6))}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyCode}
                    />
                  </View>

                  {debugCode && (
                    <Text className="text-xs text-muted mb-3 text-center">
                      {text("当前测试验证码", "Current test code")}: {debugCode}
                    </Text>
                  )}

                  <TouchableOpacity
                    className="mb-3 items-center"
                    onPress={handleRequestCode}
                    disabled={isLoading}
                  >
                    <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                      {text("重新发送验证码", "Resend code")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                className="w-full py-4 rounded-2xl items-center active:opacity-80"
                style={{ backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }}
                onPress={handlePrimaryAction}
                disabled={isLoading}
              >
                <Text className="text-white text-lg font-semibold">
                  {isLoading
                    ? t("loggingIn")
                    : step === "target"
                      ? text("发送验证码", "Send Code")
                      : text("验证并登录", "Verify and Sign In")}
                </Text>
              </TouchableOpacity>

              <Text className="text-xs text-muted mt-3 text-center">
                {step === "target"
                  ? text("使用手机号或邮箱验证码直接登录", "Sign in directly with a phone or email verification code")
                  : text("验证码 10 分钟内有效", "The verification code is valid for 10 minutes")}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
