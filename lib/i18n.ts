import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";

export type Language = "zh" | "en";

const LANG_KEY = "app_language";

export const translations = {
  zh: {
    // Common
    loading: "加载中...",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    confirm: "确认",
    back: "返回",

    // Login
    appTitle: "SIM卡充值提醒",
    appSubtitle: "管理您的全球电话卡\n再也不会忘记充值",
    feature1: "提前7天、3天、1天智能提醒",
    feature2: "支持多张卡片同时管理",
    feature3: "确认充值后自动重置提醒",
    loginButton: "登录",
    loginHint: "支持邮箱或手机号登录",
    emailLogin: "邮箱登录",
    phoneLogin: "手机号登录",
    emailPlaceholder: "请输入邮箱地址",
    loginPhonePlaceholder: "请输入手机号",
    pleaseEnterEmail: "请输入邮箱地址",
    pleaseEnterPhone: "请输入手机号",
    loginError: "登录错误",
    loginFailed: "登录失败，请稍后重试",
    loggingIn: "登录中...",

    // Home
    myCards: "我的卡片",
    totalCards: "共 {count} 张卡片",
    manageCards: "管理您的电话卡",
    byUrgency: "按紧急程度",
    byCountry: "按国家/地区",
    noCards: "还没有添加电话卡",
    noCardsHint: "点击下方按钮添加您的第一张卡片",
    addCard: "添加卡片",
    daysLeft: "天后到期",
    dueToday: "今天到期",
    expired: "已过期",
    statusDanger: "已过期",
    statusWarning: "即将到期",
    statusNormal: "正常",
    cards: "张",

    // Add/Edit Card
    addCardTitle: "添加卡片",
    editCardTitle: "编辑卡片",
    country: "国家/地区",
    selectCountry: "选择国家/地区",
    searchCountry: "搜索国家...",
    carrier: "运营商",
    carrierPlaceholder: "如: 中国移动、Vodafone",
    phoneNumber: "电话号码",
    phonePlaceholder: "输入电话号码",
    rechargeCycle: "充值周期（天）",
    lastRechargeDate: "上次充值日期",
    reminderSettings: "提醒设置",
    remindBefore: "提前 {days} 天提醒",
    reminderDate: "提醒日期: {date}",
    ringtone: "提醒铃声",
    selectRingtone: "选择铃声",
    notes: "备注",
    notesPlaceholder: "可选备注信息",
    rechargeLink: "充值链接",
    rechargeLinkPlaceholder: "输入运营商充值网址",
    rechargeLinkHint: "添加充值网址后可一键跳转充值",

    // Card Detail
    cardDetail: "卡片详情",
    dueDate: "到期日期",
    days: "天",
    cycle: "充值周期",
    cycleDays: "{days} 天",
    lastRecharge: "上次充值",
    nextReminders: "下次提醒",
    confirmRecharge: "确认已充值",
    confirmRecharged: "确认已充值",
    confirmRechargeTitle: "确认充值",
    confirmRechargeMsg: "确认您已经为此号码完成充值？",
    confirmRechargeHint: "确认后将重置充值周期并重新安排提醒",
    deleteCard: "删除卡片",
    deleteCardTitle: "删除卡片",
    deleteCardMsg: "确定要删除这张卡片吗？此操作不可撤销。",
    deleteConfirm: "确定要删除这张卡片吗？",
    deleteConfirmHint: "此操作不可恢复",
    goRecharge: "去充值",
    noRechargeLink: "未设置充值链接",
    cardInfo: "卡片信息",
    reminderDates: "提醒日期",
    rechargeHistory: "充值记录",
    noHistory: "暂无充值记录",
    error: "错误",
    cannotOpenLink: "无法打开链接",

    // Settings
    settings: "设置",
    language: "语言",
    languageZh: "中文",
    languageEn: "English",
    about: "关于",
    version: "版本",
    logout: "退出登录",
    logoutConfirm: "确定要退出登录吗？",
    checkUpdate: "检查更新",
    currentVersion: "当前版本",
    latestVersion: "最新版本",
    newVersionAvailable: "发现新版本 {version}",
    updateNow: "立即更新",
    alreadyLatest: "已是最新版本",
    checking: "检查中...",
    updateAvailable: "有新版本可用",
    noUpdate: "无可用更新",
  },
  en: {
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    back: "Back",

    // Login
    appTitle: "SIM Recharge Reminder",
    appSubtitle: "Manage your global SIM cards\nNever forget to recharge",
    feature1: "Smart reminders 7, 3, 1 days before",
    feature2: "Manage multiple cards at once",
    feature3: "Auto-reset after recharge confirmation",
    loginButton: "Sign In",
    loginHint: "Sign in with email or phone",
    emailLogin: "Email",
    phoneLogin: "Phone",
    emailPlaceholder: "Enter your email address",
    loginPhonePlaceholder: "Enter your phone number",
    pleaseEnterEmail: "Please enter your email address",
    pleaseEnterPhone: "Please enter your phone number",
    loginError: "Login Error",
    loginFailed: "Login failed, please try again",
    loggingIn: "Signing in...",

    // Home
    myCards: "My Cards",
    totalCards: "{count} cards total",
    manageCards: "Manage your SIM cards",
    byUrgency: "By Urgency",
    byCountry: "By Country",
    noCards: "No cards added yet",
    noCardsHint: "Tap the button below to add your first card",
    addCard: "Add Card",
    daysLeft: "days left",
    dueToday: "Due today",
    expired: "Expired",
    statusDanger: "Expired",
    statusWarning: "Expiring soon",
    statusNormal: "Normal",
    cards: "cards",

    // Add/Edit Card
    addCardTitle: "Add Card",
    editCardTitle: "Edit Card",
    country: "Country/Region",
    selectCountry: "Select country/region",
    searchCountry: "Search country...",
    carrier: "Carrier",
    carrierPlaceholder: "e.g. Vodafone, T-Mobile",
    phoneNumber: "Phone Number",
    phonePlaceholder: "Enter phone number",
    rechargeCycle: "Recharge Cycle (days)",
    lastRechargeDate: "Last Recharge Date",
    reminderSettings: "Reminder Settings",
    remindBefore: "Remind {days} days before",
    reminderDate: "Reminder date: {date}",
    ringtone: "Ringtone",
    selectRingtone: "Select ringtone",
    notes: "Notes",
    notesPlaceholder: "Optional notes",
    rechargeLink: "Recharge Link",
    rechargeLinkPlaceholder: "Enter carrier recharge URL",
    rechargeLinkHint: "Add recharge URL for quick access",

    // Card Detail
    cardDetail: "Card Detail",
    dueDate: "Due Date",
    days: "days",
    cycle: "Recharge Cycle",
    cycleDays: "{days} days",
    lastRecharge: "Last Recharge",
    nextReminders: "Next Reminders",
    confirmRecharge: "Confirm Recharged",
    confirmRecharged: "Confirm Recharged",
    confirmRechargeTitle: "Confirm Recharge",
    confirmRechargeMsg: "Confirm you have recharged this number?",
    confirmRechargeHint: "This will reset the cycle and reschedule reminders",
    deleteCard: "Delete Card",
    deleteCardTitle: "Delete Card",
    deleteCardMsg: "Are you sure you want to delete this card? This cannot be undone.",
    deleteConfirm: "Delete this card?",
    deleteConfirmHint: "This action cannot be undone",
    goRecharge: "Recharge Now",
    noRechargeLink: "No recharge link set",
    cardInfo: "Card Info",
    reminderDates: "Reminder Dates",
    rechargeHistory: "Recharge History",
    noHistory: "No recharge history",
    error: "Error",
    cannotOpenLink: "Cannot open link",

    // Settings
    settings: "Settings",
    language: "Language",
    languageZh: "中文",
    languageEn: "English",
    about: "About",
    version: "Version",
    logout: "Sign Out",
    logoutConfirm: "Are you sure you want to sign out?",
    checkUpdate: "Check for Updates",
    currentVersion: "Current Version",
    latestVersion: "Latest Version",
    newVersionAvailable: "New version {version} available",
    updateNow: "Update Now",
    alreadyLatest: "You're up to date",
    checking: "Checking...",
    updateAvailable: "Update Available",
    noUpdate: "No Updates Available",
  },
};

export type TranslationKey = keyof typeof translations.zh;

export async function getStoredLanguage(): Promise<Language> {
  try {
    const lang = await AsyncStorage.getItem(LANG_KEY);
    if (lang === "en" || lang === "zh") return lang;
    return "zh";
  } catch {
    return "zh";
  }
}

export async function setStoredLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
}

export function t(key: TranslationKey, lang: Language, params?: Record<string, string | number>): string {
  let text = translations[lang][key] || translations.zh[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
