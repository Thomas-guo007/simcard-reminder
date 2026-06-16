import AsyncStorage from "@react-native-async-storage/async-storage";

const CARDS_KEY = "simcard-reminder.cards.v1";
const HISTORY_KEY = "simcard-reminder.recharge-history.v1";

export type LocalSimCard = {
  id: number;
  userId: number;
  country: string;
  countryName: string;
  carrier: string;
  phoneNumber: string;
  rechargeCycleDays: number;
  lastRechargeDate: Date;
  remindDays: number[];
  isConfirmed: boolean;
  rechargeLink: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LocalRechargeHistory = {
  id: number;
  cardId: number;
  userId: number;
  rechargeDate: Date;
  createdAt: Date;
};

type StoredSimCard = Omit<LocalSimCard, "lastRechargeDate" | "createdAt" | "updatedAt"> & {
  lastRechargeDate: string;
  createdAt: string;
  updatedAt: string;
};

type StoredRechargeHistory = Omit<LocalRechargeHistory, "rechargeDate" | "createdAt"> & {
  rechargeDate: string;
  createdAt: string;
};

export type CreateLocalSimCardInput = {
  country: string;
  countryName: string;
  carrier: string;
  phoneNumber: string;
  rechargeCycleDays: number;
  lastRechargeDate: string;
  remindDays: number[];
  rechargeLink?: string;
  note?: string;
};

export type UpdateLocalSimCardInput = Partial<CreateLocalSimCardInput> & {
  id: number;
};

const parseCard = (card: StoredSimCard): LocalSimCard => ({
  ...card,
  lastRechargeDate: new Date(card.lastRechargeDate),
  createdAt: new Date(card.createdAt),
  updatedAt: new Date(card.updatedAt),
});

const serializeCard = (card: LocalSimCard): StoredSimCard => ({
  ...card,
  lastRechargeDate: card.lastRechargeDate.toISOString(),
  createdAt: card.createdAt.toISOString(),
  updatedAt: card.updatedAt.toISOString(),
});

const parseHistory = (history: StoredRechargeHistory): LocalRechargeHistory => ({
  ...history,
  rechargeDate: new Date(history.rechargeDate),
  createdAt: new Date(history.createdAt),
});

const serializeHistory = (history: LocalRechargeHistory): StoredRechargeHistory => ({
  ...history,
  rechargeDate: history.rechargeDate.toISOString(),
  createdAt: history.createdAt.toISOString(),
});

async function readCards(): Promise<LocalSimCard[]> {
  const raw = await AsyncStorage.getItem(CARDS_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as StoredSimCard[]).map(parseCard);
}

async function writeCards(cards: LocalSimCard[]) {
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards.map(serializeCard)));
}

async function readHistory(): Promise<LocalRechargeHistory[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as StoredRechargeHistory[]).map(parseHistory);
}

async function writeHistory(history: LocalRechargeHistory[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.map(serializeHistory)));
}

export async function listLocalSimCards(): Promise<LocalSimCard[]> {
  const cards = await readCards();
  return cards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getLocalSimCardById(id: number): Promise<LocalSimCard | null> {
  const cards = await readCards();
  return cards.find((card) => card.id === id) ?? null;
}

export async function createLocalSimCard(input: CreateLocalSimCardInput): Promise<LocalSimCard> {
  const cards = await readCards();
  const now = new Date();
  const nextId = cards.reduce((max, card) => Math.max(max, card.id), 0) + 1;
  const card: LocalSimCard = {
    id: nextId,
    userId: 1,
    country: input.country,
    countryName: input.countryName,
    carrier: input.carrier,
    phoneNumber: input.phoneNumber,
    rechargeCycleDays: input.rechargeCycleDays,
    lastRechargeDate: new Date(input.lastRechargeDate),
    remindDays: input.remindDays,
    isConfirmed: false,
    rechargeLink: input.rechargeLink || null,
    note: input.note || null,
    createdAt: now,
    updatedAt: now,
  };
  await writeCards([...cards, card]);
  return card;
}

export async function updateLocalSimCard(input: UpdateLocalSimCardInput): Promise<LocalSimCard | null> {
  const cards = await readCards();
  const index = cards.findIndex((card) => card.id === input.id);
  if (index < 0) return null;

  const current = cards[index];
  const scheduleChanged = Boolean(input.rechargeCycleDays || input.lastRechargeDate || input.remindDays);
  const updated: LocalSimCard = {
    ...current,
    ...input,
    lastRechargeDate: input.lastRechargeDate ? new Date(input.lastRechargeDate) : current.lastRechargeDate,
    rechargeLink: input.rechargeLink !== undefined ? input.rechargeLink || null : current.rechargeLink,
    note: input.note !== undefined ? input.note || null : current.note,
    isConfirmed: scheduleChanged ? false : current.isConfirmed,
    updatedAt: new Date(),
  };

  cards[index] = updated;
  await writeCards(cards);
  return updated;
}

export async function deleteLocalSimCard(id: number): Promise<void> {
  const cards = await readCards();
  const history = await readHistory();
  await writeCards(cards.filter((card) => card.id !== id));
  await writeHistory(history.filter((item) => item.cardId !== id));
}

export async function confirmLocalRecharge(id: number): Promise<LocalSimCard | null> {
  const cards = await readCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index < 0) return null;

  const now = new Date();
  const updated: LocalSimCard = {
    ...cards[index],
    lastRechargeDate: now,
    isConfirmed: false,
    updatedAt: now,
  };
  cards[index] = updated;
  await writeCards(cards);

  const history = await readHistory();
  const nextId = history.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  await writeHistory([
    ...history,
    {
      id: nextId,
      cardId: id,
      userId: 1,
      rechargeDate: now,
      createdAt: now,
    },
  ]);

  return updated;
}

export async function getLocalRechargeHistory(cardId: number): Promise<LocalRechargeHistory[]> {
  const history = await readHistory();
  return history
    .filter((item) => item.cardId === cardId)
    .sort((a, b) => b.rechargeDate.getTime() - a.rechargeDate.getTime());
}
