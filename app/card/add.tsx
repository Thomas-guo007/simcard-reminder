import { Text, View, TouchableOpacity, TextInput, ScrollView, Switch, Platform, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { COUNTRIES } from "@/constants/countries";
import { RINGTONES } from "@/constants/ringtones";
import { useState, useMemo } from "react";
import { scheduleCardReminders } from "@/lib/notifications";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLanguage } from "@/lib/language-provider";
import { findRechargeLink, getCarriersByCountry } from "@/constants/recharge-links";

export default function AddCardScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { t } = useLanguage();

  const [country, setCountry] = useState("");
  const [countryName, setCountryName] = useState("");
  const [countryFlag, setCountryFlag] = useState("");
  const [carrier, setCarrier] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rechargeCycleDays, setRechargeCycleDays] = useState("30");
  const [lastRechargeDate, setLastRechargeDate] = useState(new Date().toISOString().split("T")[0]);
  const [remind7, setRemind7] = useState(true);
  const [remind3, setRemind3] = useState(true);
  const [remind1, setRemind1] = useState(true);
  const [selectedRingtone, setSelectedRingtone] = useState("default");
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  const [rechargeLink, setRechargeLink] = useState("");
  const [note, setNote] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showSuggestedLinks, setShowSuggestedLinks] = useState(false);

  // 计算到期日和各提醒日期
  const reminderDates = useMemo(() => {
    const cycle = parseInt(rechargeCycleDays) || 30;
    const lastDate = new Date(lastRechargeDate);
    if (isNaN(lastDate.getTime())) {
      return { dueDate: null, remind7Date: null, remind3Date: null, remind1Date: null };
    }

    const dueDate = new Date(lastDate);
    dueDate.setDate(dueDate.getDate() + cycle);

    const remind7Date = new Date(dueDate);
    remind7Date.setDate(remind7Date.getDate() - 7);

    const remind3Date = new Date(dueDate);
    remind3Date.setDate(remind3Date.getDate() - 3);

    const remind1Date = new Date(dueDate);
    remind1Date.setDate(remind1Date.getDate() - 1);

    return { dueDate, remind7Date, remind3Date, remind1Date };
  }, [lastRechargeDate, rechargeCycleDays]);

  const formatDate = (date: Date | null): string => {
    if (!date) return "---";
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  };

  // 获取当前国家的运营商充值链接建议
  const suggestedLinks = useMemo(() => {
    if (!country) return [];
    return getCarriersByCountry(country);
  }, [country]);

  // 当选择运营商时自动匹配充值链接
  const autoMatchLink = (carrierName: string) => {
    if (!country || rechargeLink) return;
    const link = findRechargeLink(carrierName, country);
    if (link) {
      setRechargeLink(link);
    }
  };

  const createMutation = trpc.simCards.create.useMutation({
    onSuccess: async (result) => {
      const remindDays: number[] = [];
      if (remind7) remindDays.push(7);
      if (remind3) remindDays.push(3);
      if (remind1) remindDays.push(1);

      // Schedule notifications
      if (Platform.OS !== "web") {
        await scheduleCardReminders({
          id: typeof result === "number" ? result : 0,
          carrier,
          phoneNumber,
          countryName,
          lastRechargeDate,
          rechargeCycleDays: parseInt(rechargeCycleDays),
          remindDays,
        });
      }

      utils.simCards.list.invalidate();
      router.back();
    },
  });

  const handleSave = () => {
    if (!country || !carrier || !phoneNumber || !rechargeCycleDays) {
      return;
    }

    const remindDays: number[] = [];
    if (remind7) remindDays.push(7);
    if (remind3) remindDays.push(3);
    if (remind1) remindDays.push(1);

    createMutation.mutate({
      country,
      countryName,
      carrier,
      phoneNumber,
      rechargeCycleDays: parseInt(rechargeCycleDays),
      lastRechargeDate: new Date(lastRechargeDate).toISOString(),
      remindDays,
      rechargeLink: rechargeLink || undefined,
      note: note || undefined,
    });
  };

  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.includes(countrySearch) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const currentRingtone = RINGTONES.find(r => r.id === selectedRingtone);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ opacity: 0.8 }}>
            <Text className="text-base" style={{ color: colors.primary }}>{t("cancel")}</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">{t("addCardTitle")}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!country || !carrier || !phoneNumber || createMutation.isPending}
            style={{ opacity: (!country || !carrier || !phoneNumber) ? 0.4 : 1 }}
          >
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              {createMutation.isPending ? "..." : t("save")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Country Selector */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("country")}</Text>
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl px-4 py-3.5"
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text className={country ? "text-foreground" : "text-muted"}>
              {country ? `${countryFlag} ${countryName}` : t("selectCountry")}
            </Text>
          </TouchableOpacity>

          {showCountryPicker && (
            <View className="bg-surface border border-border rounded-xl mt-2 max-h-60 overflow-hidden">
              <TextInput
                className="px-4 py-3 border-b border-border text-foreground"
                placeholder={t("searchCountry")}
                placeholderTextColor={colors.muted}
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {filteredCountries.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    className="px-4 py-3 border-b border-border"
                    onPress={() => {
                      setCountry(c.code);
                      setCountryName(c.name);
                      setCountryFlag(c.flag);
                      setShowCountryPicker(false);
                      setCountrySearch("");
                    }}
                  >
                    <Text className="text-foreground">{c.flag} {c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Carrier */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("carrier")}</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder={t("carrierPlaceholder")}
            placeholderTextColor={colors.muted}
            value={carrier}
            onChangeText={(text) => {
              setCarrier(text);
              autoMatchLink(text);
            }}
          />
        </View>

        {/* Phone Number */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("phoneNumber")}</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder={t("phonePlaceholder")}
            placeholderTextColor={colors.muted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* Recharge Cycle */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("rechargeCycle")}</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder="30"
            placeholderTextColor={colors.muted}
            value={rechargeCycleDays}
            onChangeText={setRechargeCycleDays}
            keyboardType="number-pad"
          />
        </View>

        {/* Last Recharge Date */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("lastRechargeDate")}</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            value={lastRechargeDate}
            onChangeText={setLastRechargeDate}
          />
          <Text className="text-xs text-muted mt-1">格式：2024-01-15</Text>
        </View>

        {/* Due Date Display */}
        {reminderDates.dueDate && (
          <View className="mb-4 bg-surface border border-border rounded-xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <IconSymbol name="bell.fill" size={16} color={colors.error} />
              <Text className="text-sm font-semibold text-foreground">{t("dueDate")}</Text>
            </View>
            <Text className="text-base font-bold" style={{ color: colors.error }}>
              {formatDate(reminderDates.dueDate)}
            </Text>
          </View>
        )}

        {/* Remind Days with Specific Dates */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-3">{t("reminderSettings")}</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* 7 days before */}
            <View className="px-4 py-3 border-b border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground">{t("remindBefore", { days: 7 })}</Text>
                  {remind7 && reminderDates.remind7Date && (
                    <Text className="text-xs mt-1" style={{ color: colors.primary }}>
                      {formatDate(reminderDates.remind7Date)}
                    </Text>
                  )}
                </View>
                <Switch
                  value={remind7}
                  onValueChange={setRemind7}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </View>

            {/* 3 days before */}
            <View className="px-4 py-3 border-b border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground">{t("remindBefore", { days: 3 })}</Text>
                  {remind3 && reminderDates.remind3Date && (
                    <Text className="text-xs mt-1" style={{ color: colors.warning }}>
                      {formatDate(reminderDates.remind3Date)}
                    </Text>
                  )}
                </View>
                <Switch
                  value={remind3}
                  onValueChange={setRemind3}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </View>

            {/* 1 day before */}
            <View className="px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground">{t("remindBefore", { days: 1 })}</Text>
                  {remind1 && reminderDates.remind1Date && (
                    <Text className="text-xs mt-1" style={{ color: colors.error }}>
                      {formatDate(reminderDates.remind1Date)}
                    </Text>
                  )}
                </View>
                <Switch
                  value={remind1}
                  onValueChange={setRemind1}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Ringtone Selector */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("ringtone")}</Text>
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl px-4 py-3.5 flex-row items-center justify-between"
            onPress={() => setShowRingtonePicker(!showRingtonePicker)}
          >
            <View className="flex-row items-center gap-3">
              <IconSymbol name="bell.fill" size={18} color={colors.primary} />
              <Text className="text-foreground">{currentRingtone?.name || t("selectRingtone")}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>

          {showRingtonePicker && (
            <View className="bg-surface border border-border rounded-xl mt-2 overflow-hidden">
              {RINGTONES.map((ringtone) => (
                <TouchableOpacity
                  key={ringtone.id}
                  className="px-4 py-3 border-b border-border flex-row items-center justify-between"
                  onPress={() => {
                    setSelectedRingtone(ringtone.id);
                    setShowRingtonePicker(false);
                  }}
                >
                  <Text className="text-foreground">{ringtone.name}</Text>
                  {selectedRingtone === ringtone.id && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recharge Link */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("rechargeLink")}</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder={t("rechargeLinkPlaceholder")}
            placeholderTextColor={colors.muted}
            value={rechargeLink}
            onChangeText={setRechargeLink}
            keyboardType="url"
            autoCapitalize="none"
          />
          <Text className="text-xs text-muted mt-1">{t("rechargeLinkHint")}</Text>

          {/* Suggested Links */}
          {suggestedLinks.length > 0 && (
            <TouchableOpacity
              className="mt-2"
              onPress={() => setShowSuggestedLinks(!showSuggestedLinks)}
            >
              <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                {showSuggestedLinks ? "▼" : "▶"} {suggestedLinks.length} {t("cards")} suggested links
              </Text>
            </TouchableOpacity>
          )}

          {showSuggestedLinks && suggestedLinks.length > 0 && (
            <View className="bg-surface border border-border rounded-xl mt-2 overflow-hidden">
              {suggestedLinks.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="px-4 py-3 border-b border-border"
                  onPress={() => {
                    setRechargeLink(item.url);
                    setShowSuggestedLinks(false);
                  }}
                >
                  <Text className="text-foreground text-sm">{item.carrier}</Text>
                  <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>{item.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Note */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">{t("notes")}</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder={t("notesPlaceholder")}
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
