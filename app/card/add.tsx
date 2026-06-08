import { Text, View, TouchableOpacity, TextInput, ScrollView, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { COUNTRIES } from "@/constants/countries";
import { useState } from "react";
import { scheduleCardReminders } from "@/lib/notifications";

export default function AddCardScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

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
  const [note, setNote] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

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
      note: note || undefined,
    });
  };

  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.includes(countrySearch) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ opacity: 0.8 }}>
            <Text className="text-base" style={{ color: colors.primary }}>取消</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">添加卡片</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!country || !carrier || !phoneNumber || createMutation.isPending}
            style={{ opacity: (!country || !carrier || !phoneNumber) ? 0.4 : 1 }}
          >
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              {createMutation.isPending ? "保存中..." : "保存"}
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

        {/* Remind Days */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-3">提醒设置</Text>
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-foreground">提前 7 天提醒</Text>
              <Switch
                value={remind7}
                onValueChange={setRemind7}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-foreground">提前 3 天提醒</Text>
              <Switch
                value={remind3}
                onValueChange={setRemind3}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-foreground">提前 1 天提醒</Text>
              <Switch
                value={remind1}
                onValueChange={setRemind1}
                trackColor={{ true: colors.primary }}
              />
            </View>
          </View>
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
