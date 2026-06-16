import { Text, View, TouchableOpacity, ScrollView, Alert, Platform, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getDaysUntilDue, getCardStatus, scheduleCardReminders, cancelCardReminders } from "@/lib/notifications";
import { getCountryByCode } from "@/constants/countries";
import { useLanguage } from "@/lib/language-provider";
import { useCallback, useState } from "react";
import {
  confirmLocalRecharge,
  deleteLocalSimCard,
  getLocalRechargeHistory,
  getLocalSimCardById,
  type LocalRechargeHistory,
  type LocalSimCard,
} from "@/lib/local-sim-cards";

export default function CardDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();

  const cardId = parseInt(id || "0");
  const [card, setCard] = useState<LocalSimCard | null>(null);
  const [history, setHistory] = useState<LocalRechargeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCard = useCallback(async () => {
    if (cardId <= 0) return;
    setIsLoading(true);
    const [localCard, localHistory] = await Promise.all([
      getLocalSimCardById(cardId),
      getLocalRechargeHistory(cardId),
    ]);
    setCard(localCard);
    setHistory(localHistory);
    setIsLoading(false);
  }, [cardId]);

  useFocusEffect(
    useCallback(() => {
      loadCard();
    }, [loadCard]),
  );

  const confirmRecharge = async () => {
    setIsConfirming(true);
    try {
      const updated = await confirmLocalRecharge(cardId);
      if (updated) {
        setCard(updated);
        setHistory(await getLocalRechargeHistory(cardId));
        if (Platform.OS !== "web") {
          await scheduleCardReminders({
            id: updated.id,
            carrier: updated.carrier,
            phoneNumber: updated.phoneNumber,
            countryName: updated.countryName,
            lastRechargeDate: updated.lastRechargeDate,
            rechargeCycleDays: updated.rechargeCycleDays,
            remindDays: updated.remindDays,
          });
        }
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const deleteCard = async () => {
    setIsDeleting(true);
    try {
      if (Platform.OS !== "web") {
        await cancelCardReminders(cardId);
      }
      await deleteLocalSimCard(cardId);
      router.back();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmRecharge = () => {
    if (Platform.OS === "web") {
      confirmRecharge();
    } else {
      Alert.alert(t("confirmRechargeTitle"), t("confirmRechargeMsg"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("confirm"), onPress: confirmRecharge },
      ]);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      deleteCard();
    } else {
      Alert.alert(t("deleteCardTitle"), t("deleteCardMsg"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("delete"), style: "destructive", onPress: deleteCard },
      ]);
    }
  };

  const handleOpenRechargeLink = () => {
    if (card?.rechargeLink) {
      Linking.openURL(card.rechargeLink).catch(() => {
        Alert.alert(t("error"), t("cannotOpenLink"));
      });
    }
  };

  if (isLoading || !card) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t("loading")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const daysLeft = getDaysUntilDue(card.lastRechargeDate, card.rechargeCycleDays);
  const status = getCardStatus(daysLeft);
  const country = getCountryByCode(card.country);
  const statusColor = status === "danger" ? colors.error : status === "warning" ? colors.warning : colors.success;

  const dueDate = new Date(card.lastRechargeDate);
  dueDate.setDate(dueDate.getDate() + card.rechargeCycleDays);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-4 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} style={{ opacity: 0.8 }}>
            <Text className="text-base" style={{ color: colors.primary }}>{t("back")}</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">{t("cardDetail")}</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => router.push(`/card/edit/${cardId}` as any)}>
              <IconSymbol name="pencil" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <IconSymbol name="trash.fill" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Info */}
        <View className="bg-surface rounded-2xl p-6 border border-border mb-4">
          <View className="items-center mb-4">
            <Text className="text-4xl mb-2">{country?.flag || "📱"}</Text>
            <Text className="text-xl font-bold text-foreground">{card.carrier}</Text>
            <Text className="text-base text-muted mt-1">{card.phoneNumber}</Text>
            <Text className="text-sm text-muted">{card.countryName}</Text>
          </View>

          {/* Countdown */}
          <View className="items-center py-6 border-t border-border">
            <Text className="text-5xl font-bold" style={{ color: statusColor }}>
              {daysLeft > 0 ? daysLeft : 0}
            </Text>
            <Text className="text-base text-muted mt-2">
              {daysLeft > 0 ? t("daysLeft") : daysLeft === 0 ? t("dueToday") : `${t("expired")} ${Math.abs(daysLeft)} ${t("days")}`}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {t("dueDate")}：{dueDate.toLocaleDateString("zh-CN")}
            </Text>
          </View>
        </View>

        {/* Quick Recharge Link Button */}
        {card.rechargeLink && (
          <TouchableOpacity
            className="py-4 rounded-2xl items-center mb-4 border"
            style={{ backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }}
            onPress={handleOpenRechargeLink}
          >
            <View className="flex-row items-center gap-2">
              <IconSymbol name="link" size={20} color={colors.primary} />
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                {t("goRecharge")}
              </Text>
            </View>
            <Text className="text-xs text-muted mt-1" numberOfLines={1}>
              {card.rechargeLink}
            </Text>
          </TouchableOpacity>
        )}

        {/* Confirm Recharge Button */}
        <TouchableOpacity
          className="py-4 rounded-2xl items-center mb-4"
          style={{ backgroundColor: colors.success }}
          onPress={handleConfirmRecharge}
          disabled={isConfirming}
        >
          <View className="flex-row items-center gap-2">
            <IconSymbol name="checkmark.circle.fill" size={22} color="#FFFFFF" />
            <Text className="text-white text-lg font-semibold">
              {isConfirming ? "..." : t("confirmRecharged")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card Details */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">{t("cardInfo")}</Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t("rechargeCycle")}</Text>
              <Text className="text-sm text-foreground">{card.rechargeCycleDays} {t("days")}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t("lastRechargeDate")}</Text>
              <Text className="text-sm text-foreground">
                {new Date(card.lastRechargeDate).toLocaleDateString("zh-CN")}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">{t("dueDate")}</Text>
              <Text className="text-sm text-foreground">
                {dueDate.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })}
              </Text>
            </View>
          </View>
        </View>

        {/* Reminder Schedule */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">{t("reminderDates")}</Text>
          <View className="gap-2">
            {(card.remindDays as number[]).map((day) => {
              const reminderDate = new Date(dueDate);
              reminderDate.setDate(reminderDate.getDate() - day);
              const reminderColor = day === 1 ? colors.error : day === 3 ? colors.warning : colors.primary;
              return (
                <View key={day} className="flex-row items-center justify-between py-1">
                  <Text className="text-sm text-muted">{t("remindBefore", { days: day })}</Text>
                  <Text className="text-sm font-medium" style={{ color: reminderColor }}>
                    {reminderDate.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })}
                  </Text>
                </View>
              );
            })}
          </View>
          {card.note && (
            <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
              <Text className="text-sm text-muted">{t("notes")}</Text>
              <Text className="text-sm text-foreground flex-1 text-right ml-4">{card.note}</Text>
            </View>
          )}
        </View>

        {/* Recharge History */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">{t("rechargeHistory")}</Text>
          {history && history.length > 0 ? (
            <View className="gap-2">
              {history.map((record) => (
                <View key={record.id} className="flex-row items-center gap-3 py-2 border-b border-border">
                  <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                  <Text className="text-sm text-foreground">
                    {new Date(record.rechargeDate).toLocaleDateString("zh-CN")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted">{t("noHistory")}</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
