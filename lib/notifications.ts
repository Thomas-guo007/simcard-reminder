import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
    await Notifications.setNotificationChannelAsync("recharge-reminder", {
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

  // Cancel existing notifications for this card
  await cancelCardReminders(card.id);

  const lastRecharge = new Date(card.lastRechargeDate);
  const dueDate = new Date(lastRecharge);
  dueDate.setDate(dueDate.getDate() + card.rechargeCycleDays);

  const now = new Date();

  for (const daysBefore of card.remindDays) {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    // Set reminder at 9:00 AM
    reminderDate.setHours(9, 0, 0, 0);

    // Only schedule future reminders
    if (reminderDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "充值提醒",
          body: `您的 ${card.countryName} ${card.carrier} (${card.phoneNumber}) 将在${daysBefore}天后到期，请及时充值！`,
          data: { cardId: card.id, type: "recharge-reminder" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: Platform.OS === "android" ? "recharge-reminder" : undefined,
        } as any,
        identifier: `card-${card.id}-remind-${daysBefore}`,
      });
    }
  }

  // Also schedule a due date notification
  const dueDateReminder = new Date(dueDate);
  dueDateReminder.setHours(9, 0, 0, 0);
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
        channelId: Platform.OS === "android" ? "recharge-reminder" : undefined,
      } as any,
      identifier: `card-${card.id}-due`,
    });
  }
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
  const lastRecharge = new Date(lastRechargeDate);
  const dueDate = new Date(lastRecharge);
  dueDate.setDate(dueDate.getDate() + rechargeCycleDays);

  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getCardStatus(daysUntilDue: number): "normal" | "warning" | "danger" {
  if (daysUntilDue <= 0) return "danger";
  if (daysUntilDue <= 7) return "warning";
  return "normal";
}
