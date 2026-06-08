import { Text, View, TouchableOpacity, TextInput, ScrollView, Switch, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { COUNTRIES } from "@/constants/countries";
import { RINGTONES } from "@/constants/ringtones";
import { useState, useMemo, useEffect } from "react";
import { scheduleCardReminders } from "@/lib/notifications";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function EditCardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const cardId = parseInt(id || "0");

  const { data: card, isLoading } = trpc.simCards.getById.useQuery(
    { id: cardId },
    { enabled: cardId > 0 }
  );

  const [country, setCountry] = useState("");
  const [countryName, setCountryName] = useState("");
  const [countryFlag, setCountryFlag] = useState("");
  const [carrier, setCarrier] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rechargeCycleDays, setRechargeCycleDays] = useState("30");
  const [lastRechargeDate, setLastRechargeDate] = useState("");
  const [remind7, setRemind7] = useState(true);
  const [remind3, setRemind3] = useState(true);
  const [remind1, setRemind1] = useState(true);
  const [selectedRingtone, setSelectedRingtone] = useState("default");
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  const [note, setNote] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form with card data
  useEffect(() => {
    if (card && !initialized) {
      setCountry(card.country);
      setCountryName(card.countryName);
      const countryData = COUNTRIES.find(c => c.code === card.country);
      setCountryFlag(countryData?.flag || "");
      setCarrier(card.carrier);
      setPhoneNumber(card.phoneNumber);
      setRechargeCycleDays(card.rechargeCycleDays.toString());
      setLastRechargeDate(new Date(card.lastRechargeDate).toISOString().split("T")[0]);
      const remindDays = card.remindDays as number[];
      setRemind7(remindDays.includes(7));
      setRemind3(remindDays.includes(3));
      setRemind1(remindDays.includes(1));
      setNote(card.note || "");
      setInitialized(true);
    }
  }, [card, initialized]);

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

  const updateMutation = trpc.simCards.update.useMutation({
    onSuccess: async () => {
      const remindDays: number[] = [];
      if (remind7) remindDays.push(7);
      if (remind3) remindDays.push(3);
      if (remind1) remindDays.push(1);

      // Re-schedule notifications
      if (Platform.OS !== "web") {
        await scheduleCardReminders({
          id: cardId,
          carrier,
          phoneNumber,
          countryName,
          lastRechargeDate,
          rechargeCycleDays: parseInt(rechargeCycleDays),
          remindDays,
        });
      }

      utils.simCards.list.invalidate();
      utils.simCards.getById.invalidate({ id: cardId });
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

    updateMutation.mutate({
      id: cardId,
      country,
      countryName,
      carrier,
      phoneNumber,
      rechargeCycleDays: parseInt(rechargeCycleDays),
      lastRechargeDate: new Date(lastRechargeDate).toISOString(),
      remindDays,
      note: note || undefined,
    });
  };

  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.includes(countrySearch) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const currentRingtone = RINGTONES.find(r => r.id === selectedRingtone);

  if (isLoading || !card) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">加载中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ opacity: 0.8 }}>
            <Text className="text-base" style={{ color: colors.primary }}>取消</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">编辑卡片</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!country || !carrier || !phoneNumber || updateMutation.isPending}
            style={{ opacity: (!country || !carrier || !phoneNumber) ? 0.4 : 1 }}
          >
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Country Selector */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">国家/地区</Text>
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl px-4 py-3.5"
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text className={country ? "text-foreground" : "text-muted"}>
              {country ? `${countryFlag} ${countryName}` : "选择国家/地区"}
            </Text>
          </TouchableOpacity>

          {showCountryPicker && (
            <View className="bg-surface border border-border rounded-xl mt-2 max-h-60 overflow-hidden">
              <TextInput
                className="px-4 py-3 border-b border-border text-foreground"
                placeholder="搜索国家..."
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
          <Text className="text-sm font-medium text-foreground mb-2">运营商</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder="例如：China Mobile, AT&T"
            placeholderTextColor={colors.muted}
            value={carrier}
            onChangeText={setCarrier}
          />
        </View>

        {/* Phone Number */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">电话号码</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder="输入电话号码"
            placeholderTextColor={colors.muted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* Recharge Cycle */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">充值周期（天）</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder="例如：30"
            placeholderTextColor={colors.muted}
            value={rechargeCycleDays}
            onChangeText={setRechargeCycleDays}
            keyboardType="number-pad"
          />
        </View>

        {/* Last Recharge Date */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">上次充值日期</Text>
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
              <Text className="text-sm font-semibold text-foreground">到期日</Text>
            </View>
            <Text className="text-base font-bold" style={{ color: colors.error }}>
              {formatDate(reminderDates.dueDate)}
            </Text>
          </View>
        )}

        {/* Remind Days with Specific Dates */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-3">提醒设置</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* 7 days before */}
            <View className="px-4 py-3 border-b border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground">提前 7 天提醒</Text>
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
                  <Text className="text-foreground">提前 3 天提醒</Text>
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
                  <Text className="text-foreground">提前 1 天提醒</Text>
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
          <Text className="text-sm font-medium text-foreground mb-2">提醒铃声</Text>
          <TouchableOpacity
            className="bg-surface border border-border rounded-xl px-4 py-3.5 flex-row items-center justify-between"
            onPress={() => setShowRingtonePicker(!showRingtonePicker)}
          >
            <View className="flex-row items-center gap-3">
              <IconSymbol name="bell.fill" size={18} color={colors.primary} />
              <Text className="text-foreground">{currentRingtone?.name || "系统默认"}</Text>
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

        {/* Note */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">备注（可选）</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
            placeholder="添加备注信息"
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
