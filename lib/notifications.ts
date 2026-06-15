import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIFICATION_CHANNEL_ID = "recharge-reminder";
const OVERDUE_REPEAT_DAYS = 14;

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForNotifications(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "充值提醒",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export interface ReminderCard {
  id: number;
  carrier: string;
  phoneNumber: string;
  countryName: string;
  lastRechargeDate: string | Date;
  rechargeCycleDays: number;
  remindDays: number[];
}

export async function scheduleCardReminders(card: ReminderCard) {
  if (Platform.OS === "web") return;

  const hasPermission = await registerForNotifications();
  if (!hasPermission) return;

  await cancelCardReminders(card.id);

  const lastRecharge = new Date(card.lastRechargeDate);
  if (Number.isNaN(lastRecharge.getTime())) return;

  const dueDate = getDueDate(card.lastRechargeDate, card.rechargeCycleDays);
  const now = new Date();

  const uniqueRemindDays = [...new Set(card.remindDays)].filter((days) => days > 0).sort((a, b) => b - a);

  for (const daysBefore of uniqueRemindDays) {
    const reminderDate = atReminderHour(addDays(dueDate, -daysBefore));

    if (reminderDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "充值提醒",
          body: `您的 ${card.countryName} ${card.carrier} (${card.phoneNumber}) 将在${daysBefore}天后到期，请及时充值！`,
          data: { cardId: card.id, type: "recharge-reminder", daysBefore },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: Platform.OS === "android" ? NOTIFICATION_CHANNEL_ID : undefined,
        } as any,
        identifier: `card-${card.id}-remind-${daysBefore}`,
      });
    }
  }

  const dueDateReminder = atReminderHour(dueDate);
  if (dueDateReminder > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "充值到期",
        body: `您的 ${card.countryName} ${card.carrier} (${card.phoneNumber}) 今天到期，请立即充值以防号码丢失！`,
        data: { cardId: card.id, type: "recharge-due" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDateReminder,
        channelId: Platform.OS === "android" ? NOTIFICATION_CHANNEL_ID : undefined,
      } as any,
      identifier: `card-${card.id}-due`,
    });
  }

  await scheduleOverdueReminders(card, dueDate, now);
}

async function scheduleOverdueReminders(card: ReminderCard, dueDate: Date, now: Date) {
  for (let overdueDay = 1; overdueDay <= OVERDUE_REPEAT_DAYS; overdueDay++) {
    const reminderDate = atReminderHour(addDays(dueDate, overdueDay));
    if (reminderDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "充值逾期提醒",
        body: `您的 ${countryCarrierText(card)} 已逾期${overdueDay}天，请尽快充值并在APP内确认。`,
        data: { cardId: card.id, type: "recharge-overdue", overdueDay },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: Platform.OS === "android" ? NOTIFICATION_CHANNEL_ID : undefined,
      } as any,
      identifier: `card-${card.id}-overdue-${overdueDay}`,
    });
  }
}

function countryCarrierText(card: ReminderCard) {
  return `${card.countryName} ${card.carrier} (${card.phoneNumber})`;
}

function getDueDate(lastRechargeDate: string | Date, rechargeCycleDays: number): Date {
  const dueDate = new Date(lastRechargeDate);
  dueDate.setDate(dueDate.getDate() + rechargeCycleDays);
  return dueDate;
}

function atReminderHour(date: Date): Date {
  const next = new Date(date);
  next.setHours(9, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function cancelCardReminders(cardId: number) {
  if (Platform.OS === "web") return;

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduledNotifications) {
    if (notification.identifier.startsWith(`card-${cardId}-`)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export function getDaysUntilDue(lastRechargeDate: string | Date, rechargeCycleDays: number): number {
  const dueDate = getDueDate(lastRechargeDate, rechargeCycleDays);

  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getCardStatus(daysUntilDue: number): "normal" | "warning" | "danger" {
  if (daysUntilDue <= 0) return "danger";
  if (daysUntilDue <= 7) return "warning";
  return "normal";
}
