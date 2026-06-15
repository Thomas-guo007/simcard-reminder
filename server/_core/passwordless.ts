import { createHash } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

type LoginMethod = "email" | "phone";

type VerificationRecord = {
  code: string;
  method: LoginMethod;
  target: string;
  expiresAt: number;
  attempts: number;
};

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const verificationCodes = new Map<string, VerificationRecord>();

function normalizeMethod(value: unknown): LoginMethod | null {
  return value === "email" || value === "phone" ? value : null;
}

function normalizeTarget(method: LoginMethod, rawTarget: unknown): string | null {
  if (typeof rawTarget !== "string") return null;
  const trimmed = rawTarget.trim();
  if (!trimmed) return null;

  if (method === "email") {
    const email = trimmed.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  }

  const phone = trimmed.replace(/[\s()-]/g, "");
  return /^\+?[0-9]{6,20}$/.test(phone) ? phone : null;
}

function keyFor(method: LoginMethod, target: string) {
  return `${method}:${target}`;
}

function openIdFor(method: LoginMethod, target: string) {
  const digest = createHash("sha256").update(`${method}:${target}`).digest("hex").slice(0, 48);
  return `passwordless:${digest}`;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function shouldExposeDebugCode() {
  return !ENV.isProduction || process.env.PASSWORDLESS_DEBUG_CODES === "true";
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

async function createPasswordlessSession(method: LoginMethod, target: string) {
  const now = new Date();
  const openId = openIdFor(method, target);
  const displayName = method === "email" ? target.split("@")[0] : target;

  await upsertUser({
    openId,
    name: displayName,
    email: method === "email" ? target : null,
    loginMethod: method,
    lastSignedIn: now,
  });

  const user =
    (await getUserByOpenId(openId)) ??
    ({
      openId,
      name: displayName,
      email: method === "email" ? target : null,
      loginMethod: method,
      lastSignedIn: now,
    } as const);

  const sessionToken = await sdk.createSessionToken(openId, {
    name: displayName,
    expiresInMs: ONE_YEAR_MS,
  });

  return { sessionToken, user };
}

export function registerPasswordlessRoutes(app: Express) {
  app.post("/api/auth/passwordless/start", (req: Request, res: Response) => {
    const method = normalizeMethod(req.body?.method);
    if (!method) {
      res.status(400).json({ error: "method must be email or phone" });
      return;
    }

    const target = normalizeTarget(method, req.body?.target);
    if (!target) {
      res.status(400).json({ error: method === "email" ? "Invalid email" : "Invalid phone number" });
      return;
    }

    const code = generateCode();
    verificationCodes.set(keyFor(method, target), {
      code,
      method,
      target,
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
    });

    if (shouldExposeDebugCode()) {
      console.info(`[Passwordless] ${method} code for ${target}: ${code}`);
    }

    res.json({
      success: true,
      expiresInSeconds: CODE_TTL_MS / 1000,
      delivery: shouldExposeDebugCode() ? "debug" : "configured-provider-required",
      debugCode: shouldExposeDebugCode() ? code : undefined,
    });
  });

  app.post("/api/auth/passwordless/verify", async (req: Request, res: Response) => {
    const method = normalizeMethod(req.body?.method);
    if (!method) {
      res.status(400).json({ error: "method must be email or phone" });
      return;
    }

    const target = normalizeTarget(method, req.body?.target);
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!target || !/^\d{6}$/.test(code)) {
      res.status(400).json({ error: "Invalid verification request" });
      return;
    }

    const key = keyFor(method, target);
    const record = verificationCodes.get(key);
    if (!record || record.expiresAt < Date.now()) {
      verificationCodes.delete(key);
      res.status(400).json({ error: "Verification code expired" });
      return;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      verificationCodes.delete(key);
      res.status(429).json({ error: "Too many verification attempts" });
      return;
    }

    if (record.code !== code) {
      record.attempts += 1;
      res.status(400).json({ error: "Incorrect verification code" });
      return;
    }

    verificationCodes.delete(key);

    try {
      const { sessionToken, user } = await createPasswordlessSession(method, target);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[Passwordless] verify failed", error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });
}
