import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return "bf-dev-secret-do-not-use-in-prod";
}
const COOKIE_NAME = "bf_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface SessionData {
  userId: string;
  wallet: string;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function verify(payload: string, signature: string): boolean {
  const expected = sign(payload);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(data);
  const sig = sign(payload);
  cookieStore.set(COOKIE_NAME, `${payload}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const dotIndex = raw.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = raw.slice(0, dotIndex);
  const sig = raw.slice(dotIndex + 1);

  if (!verify(payload, sig)) return null;

  try {
    const parsed = JSON.parse(payload);
    if (!parsed?.userId || typeof parsed.userId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
