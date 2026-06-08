import { Text, View, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getDaysUntilDue, getCardStatus, scheduleCardReminders, cancelCardReminders } from "@/lib/notifications";
import { getCountryByCode } from "@/constants/countries";

export default function CardDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();

  const cardId = parseInt(id || "0");

  const { data: card, isLoading } = trpc.simCards.getById.useQuery(
    { id: cardId },
    { enabled: cardId > 0 }
  );

  const { data: history } = trpc.simCards.rechargeHistory.useQuery(
    { cardId },
    { enabled: cardId > 0 }
  );

  const confirmMutation = trpc.simCards.confirmRecharge.useMutation({
    onSuccess: () => {
      utils.simCards.list.invalidate();
      utils.simCards.getById.invalidate({ id: cardId });
      utils.simCards.rechargeHistory.invalidate({ cardId });
      // Re-schedule notifications with new date
      if (card && Platform.OS !== "web") {
        scheduleCardReminders({
          id: card.id,
          carrier: card.carrier,
          phoneNumber: card.phoneNumber,
          countryName: card.countryName,
          lastRechargeDate: new Date().toISOString(),
          rechargeCycleDays: card.rechargeCycleDays,
          remindDays: card.remindDays as number[],
        });
      }
    },
  });

  const deleteMutation = trpc.simCards.delete.useMutation({
    onSuccess: () => {
      if (Platform.OS !== "web") {
        cancelCardReminders(cardId);
      }
      utils.simCards.list.invalidate();
      router.back();
    },
  });

  const handleConfirmRecharge = () => {
    if (Platform.OS === "web") {
      confirmMutation.mutate({ id: cardId });
    } else {
      Alert.alert("确认充值", "确认您已经为此号码完成充值？", [
        { text: "取消", style: "cancel" },
        { text: "确认", onPress: () => confirmMutation.mutate({ id: cardId }) },
      ]);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      deleteMutation.mutate({ id: cardId });
    } else {
      Alert.alert("删除卡片", "确定要删除这张卡片吗？此操作不可撤销。", [
        { text: "取消", style: "cancel" },
        { text: "删除", style: "destructive", onPress: () => deleteMutation.mutate({ id: cardId }) },
      ]);
    }
  };

  if (isLoading || !card) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">加载中...</Text>
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
            <Text className="text-base" style={{ color: colors.primary }}>返回</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">卡片详情</Text>
          <TouchableOpacity onPress={handleDelete}>
            <IconSymbol name="trash.fill" size={22} color={colors.error} />
          </TouchableOpacity>
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
              {daysLeft > 0 ? "天后到期" : daysLeft === 0 ? "今天到期" : `已过期 ${Math.abs(daysLeft)} 天`}
            </Text>
            <Text className="text-sm text-muted mt-1">
              到期日：{dueDate.toLocaleDateString("zh-CN")}
            </Text>
          </View>
        </View>

        {/* Confirm Recharge Button */}
        <TouchableOpacity
          className="py-4 rounded-2xl items-center mb-4"
          style={{ backgroundColor: colors.success }}
          onPress={handleConfirmRecharge}
          disabled={confirmMutation.isPending}
        >
          <View className="flex-row items-center gap-2">
            <IconSymbol name="checkmark.circle.fill" size={22} color="#FFFFFF" />
            <Text className="text-white text-lg font-semibold">
              {confirmMutation.isPending ? "确认中..." : "确认已充值"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card Details */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">卡片信息</Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">充值周期</Text>
              <Text className="text-sm text-foreground">{card.rechargeCycleDays} 天</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">上次充值</Text>
              <Text className="text-sm text-foreground">
                {new Date(card.lastRechargeDate).toLocaleDateString("zh-CN")}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted">提醒设置</Text>
              <Text className="text-sm text-foreground">
                提前 {(card.remindDays as number[]).join("、")} 天
              </Text>
            </View>
            {card.note && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">备注</Text>
                <Text className="text-sm text-foreground flex-1 text-right ml-4">{card.note}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recharge History */}
        <View className="bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">充值记录</Text>
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
            <Text className="text-sm text-muted">暂无充值记录</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
