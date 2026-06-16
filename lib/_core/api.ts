import * as Auth from "./auth";

type LocalPasswordlessSession = {
  email: string;
  code: string;
  expiresAt: number;
};

let localPasswordlessSession: LocalPasswordlessSession | null = null;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const createLocalCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function requestPasswordlessCode(
  email: string,
): Promise<{ success: boolean; expiresInSeconds: number; delivery: "local"; debugCode: string }> {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("请输入正确的邮箱地址");
  }

  const code = createLocalCode();
  localPasswordlessSession = {
    email: normalizedEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  return {
    success: true,
    expiresInSeconds: 600,
    delivery: "local",
    debugCode: code,
  };
}

export async function verifyPasswordlessCode(
  email: string,
  code: string,
): Promise<{ sessionToken: string; user: Auth.User }> {
  const normalizedEmail = normalizeEmail(email);

  if (
    !localPasswordlessSession ||
    localPasswordlessSession.email !== normalizedEmail
  ) {
    throw new Error("请先获取验证码");
  }

  if (Date.now() > localPasswordlessSession.expiresAt) {
    localPasswordlessSession = null;
    throw new Error("验证码已过期，请重新获取");
  }

  if (localPasswordlessSession.code !== code.trim()) {
    throw new Error("验证码不正确");
  }

  localPasswordlessSession = null;

  const now = new Date();
  return {
    sessionToken: `local-session-${Date.now()}`,
    user: {
      id: Date.now(),
      openId: `local-email-${normalizedEmail}`,
      name: normalizedEmail,
      email: normalizedEmail,
      loginMethod: "email",
      lastSignedIn: now,
    },
  };
}

export async function logout(): Promise<void> {
  await Auth.removeSessionToken();
  await Auth.clearUserInfo();
}

export async function getMe(): Promise<Auth.User | null> {
  return Auth.getUserInfo();
}
