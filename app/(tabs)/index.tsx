import { Text, View, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getDaysUntilDue, getCardStatus } from "@/lib/notifications";
import { getCountryByCode } from "@/constants/countries";
import { useCallback, useEffect, useState } from "react";
import { scheduleCardReminders, registerForNotifications } from "@/lib/notifications";
import { Platform } from "react-native";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: cards, isLoading, refetch } = trpc.simCards.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Register notifications on mount
  useEffect(() => {
    if (Platform.OS !== "web") {
      registerForNotifications();
    }
  }, []);

  // Schedule reminders when cards change
  useEffect(() => {
    if (cards && cards.length > 0 && Platform.OS !== "web") {
      cards.forEach((card) => {
        if (!card.isConfirmed) {
          scheduleCardReminders({
            id: card.id,
            carrier: card.carrier,
            phoneNumber: card.phoneNumber,
            countryName: card.countryName,
            lastRechargeDate: card.lastRechargeDate,
            rechargeCycleDays: card.rechargeCycleDays,
            remindDays: card.remindDays as number[],
          });
        }
      });
    }
  }, [cards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-base">加载中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderCard = ({ item }: { item: NonNullable<typeof cards>[number] }) => {
    const daysLeft = getDaysUntilDue(item.lastRechargeDate, item.rechargeCycleDays);
    const status = getCardStatus(daysLeft);
    const country = getCountryByCode(item.country);

    const statusColor = status === "danger" ? colors.error : status === "warning" ? colors.warning : colors.success;
    const statusText = status === "danger" ? "已过期" : status === "warning" ? "即将到期" : "正常";

    // 计算到期日期
    const lastRecharge = new Date(item.lastRechargeDate);
    const dueDate = new Date(lastRecharge);
    dueDate.setDate(dueDate.getDate() + item.rechargeCycleDays);
    const dueDateStr = dueDate.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" });

    return (
      <TouchableOpacity
        className="bg-surface rounded-2xl p-4 mb-3 border border-border"
        style={{ borderLeftWidth: 4, borderLeftColor: statusColor }}
        onPress={() => router.push(`/card/${item.id}` as any)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <Text className="text-2xl">{country?.flag || "📱"}</Text>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{item.carrier}</Text>
              <Text className="text-sm text-muted mt-0.5">{item.phoneNumber}</Text>
              <Text className="text-xs text-muted mt-0.5">{item.countryName}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold" style={{ color: statusColor }}>
              {daysLeft > 0 ? daysLeft : 0}
            </Text>
            <Text className="text-xs text-muted">
              {daysLeft > 0 ? "天后到期" : daysLeft === 0 ? "今天到期" : "已过期"}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: statusColor }}>
              {dueDateStr}
            </Text>
            <View className="mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor + "20" }}>
              <Text className="text-xs font-medium" style={{ color: statusColor }}>{statusText}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <IconSymbol name="sim.card" size={64} color={colors.muted} />
      <Text className="text-lg text-muted mt-4">还没有添加电话卡</Text>
      <Text className="text-sm text-muted mt-1">点击下方按钮添加您的第一张卡片</Text>
      <TouchableOpacity
        className="mt-6 px-6 py-3 rounded-2xl"
        style={{ backgroundColor: colors.primary }}
        onPress={() => router.push("/card/add" as any)}
      >
        <Text className="text-white font-semibold">添加卡片</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="px-4 pt-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4 px-2">
        <View>
          <Text className="text-2xl font-bold text-foreground">我的卡片</Text>
          <Text className="text-sm text-muted mt-0.5">
            {cards && cards.length > 0 ? `共 ${cards.length} 张卡片` : "管理您的电话卡"}
          </Text>
        </View>
        {user && (
          <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "20" }}>
            <IconSymbol name="person.fill" size={20} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Card List */}
      {cards && cards.length > 0 ? (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}

      {/* FAB */}
      {cards && cards.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          style={{ backgroundColor: colors.primary }}
                  onPress={() => router.push("/card/add" as any)}
      >
        <IconSymbol name="plus.circle.fill" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}
