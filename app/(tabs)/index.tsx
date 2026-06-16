import { Text, View, TouchableOpacity, SectionList, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getDaysUntilDue, getCardStatus } from "@/lib/notifications";
import { getCountryByCode } from "@/constants/countries";
import { useCallback, useEffect, useMemo, useState } from "react";
import { scheduleCardReminders, registerForNotifications } from "@/lib/notifications";
import { Platform } from "react-native";
import { useLanguage } from "@/lib/language-provider";
import { listLocalSimCards, type LocalSimCard } from "@/lib/local-sim-cards";

type ViewMode = "urgency" | "country";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<LocalSimCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("urgency");
  const { t } = useLanguage();

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setCards([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const localCards = await listLocalSimCards();
    setCards(localCards);
    setIsLoading(false);
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

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

  // 按紧急程度排序的卡片
  const sortedCards = useMemo(() => {
    if (!cards) return [];
    return [...cards].sort((a, b) => {
      const daysA = getDaysUntilDue(a.lastRechargeDate, a.rechargeCycleDays);
      const daysB = getDaysUntilDue(b.lastRechargeDate, b.rechargeCycleDays);
      return daysA - daysB;
    });
  }, [cards]);

  // 按国家分组的卡片
  const groupedByCountry = useMemo(() => {
    if (!cards) return [];
    const groups: Record<string, { countryName: string; flag: string; data: typeof cards }> = {};
    cards.forEach((card) => {
      const key = card.country;
      if (!groups[key]) {
        const countryData = getCountryByCode(card.country);
        groups[key] = {
          countryName: card.countryName,
          flag: countryData?.flag || "🌍",
          data: [],
        };
      }
      groups[key].data.push(card);
    });

    return Object.entries(groups).map(([code, group]) => ({
      title: `${group.flag} ${group.countryName}`,
      countryCode: code,
      cardCount: group.data.length,
      data: [...group.data].sort((a, b) => {
        const daysA = getDaysUntilDue(a.lastRechargeDate, a.rechargeCycleDays);
        const daysB = getDaysUntilDue(b.lastRechargeDate, b.rechargeCycleDays);
        return daysA - daysB;
      }),
    }));
  }, [cards]);

  if (authLoading || isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-base">{t("loading")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderCard = ({ item }: { item: LocalSimCard }) => {
    const daysLeft = getDaysUntilDue(item.lastRechargeDate, item.rechargeCycleDays);
    const status = getCardStatus(daysLeft);
    const country = getCountryByCode(item.country);

    const statusColor = status === "danger" ? colors.error : status === "warning" ? colors.warning : colors.success;
    const statusText = status === "danger" ? t("statusDanger") : status === "warning" ? t("statusWarning") : t("statusNormal");

    // 计算到期日期
    const lastRecharge = new Date(item.lastRechargeDate);
    const dueDate = new Date(lastRecharge);
    dueDate.setDate(dueDate.getDate() + item.rechargeCycleDays);
    const dueDateStr = dueDate.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" });

    // 背景色根据紧急程度区分
    const cardBgColor = status === "danger" ? statusColor + "10" : status === "warning" ? statusColor + "08" : undefined;
    const borderColor = status === "danger" ? statusColor + "40" : status === "warning" ? statusColor + "30" : colors.border;

    return (
      <TouchableOpacity
        className="rounded-2xl p-4 mb-3 border"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
          backgroundColor: cardBgColor || colors.surface,
          borderColor: borderColor,
        }}
        onPress={() => router.push(`/card/${item.id}` as any)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: statusColor + "15" }}>
              <Text className="text-xl">{country?.flag || "📱"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{item.carrier}</Text>
              <Text className="text-sm text-muted mt-0.5">{item.phoneNumber}</Text>
              {viewMode === "urgency" && (
                <Text className="text-xs text-muted mt-0.5">{item.countryName}</Text>
              )}
            </View>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-bold" style={{ color: statusColor }}>
              {daysLeft > 0 ? daysLeft : 0}
            </Text>
            <Text className="text-xs font-medium" style={{ color: statusColor }}>
              {daysLeft > 0 ? t("daysLeft") : daysLeft === 0 ? t("dueToday") : t("expired")}
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: statusColor }}>
              {dueDateStr}
            </Text>
            <View className="mt-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: statusColor + "20" }}>
              <Text className="text-xs font-semibold" style={{ color: statusColor }}>{statusText}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; cardCount: number } }) => (
    <View className="flex-row items-center justify-between py-3 px-1 mt-2">
      <Text className="text-base font-bold text-foreground">{section.title}</Text>
      <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + "15" }}>
        <Text className="text-xs font-medium" style={{ color: colors.primary }}>
          {section.cardCount} {t("cards")}
        </Text>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <IconSymbol name="sim.card" size={64} color={colors.muted} />
      <Text className="text-lg text-muted mt-4">{t("noCards")}</Text>
      <Text className="text-sm text-muted mt-1">{t("noCardsHint")}</Text>
      <TouchableOpacity
        className="mt-6 px-6 py-3 rounded-2xl"
        style={{ backgroundColor: colors.primary }}
        onPress={() => router.push("/card/add" as any)}
      >
        <Text className="text-white font-semibold">{t("addCard")}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="px-4 pt-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 px-2">
        <View>
          <Text className="text-2xl font-bold text-foreground">{t("myCards")}</Text>
          <Text className="text-sm text-muted mt-0.5">
            {cards && cards.length > 0 ? t("totalCards", { count: cards.length }) : t("manageCards")}
          </Text>
        </View>
        {user && (
          <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "20" }}>
            <IconSymbol name="person.fill" size={20} color={colors.primary} />
          </View>
        )}
      </View>

      {/* View Mode Toggle */}
      {cards && cards.length > 0 && (
        <View className="flex-row mb-3 rounded-xl overflow-hidden border border-border">
          <TouchableOpacity
            className="flex-1 py-2.5 items-center"
            style={{ backgroundColor: viewMode === "urgency" ? colors.primary : "transparent" }}
            onPress={() => setViewMode("urgency")}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: viewMode === "urgency" ? "#FFFFFF" : colors.muted }}
            >
              {t("byUrgency")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2.5 items-center"
            style={{ backgroundColor: viewMode === "country" ? colors.primary : "transparent" }}
            onPress={() => setViewMode("country")}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: viewMode === "country" ? "#FFFFFF" : colors.muted }}
            >
              {t("byCountry")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card List */}
      {cards && cards.length > 0 ? (
        viewMode === "urgency" ? (
          <FlatList
            data={sortedCards}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <SectionList
            sections={groupedByCountry}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCard}
            renderSectionHeader={renderSectionHeader}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        )
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
