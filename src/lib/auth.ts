import { cookies } from "next/headers";
import {
  ANON_COOKIE,
  AUTH_COOKIE,
  type AuthPayload,
  verifyAuthToken,
} from "./authCore";

export { AUTH_COOKIE, ANON_COOKIE, hashPassword, verifyPassword, signAuthToken, verifyAuthToken } from "./authCore";
export type { AuthPayload } from "./authCore";

/** Reads and verifies the current request's session cookie, if any. */
export async function getAuthContext(): Promise<AuthPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

/** Reads the anonymous device id set by proxy.ts for guest (no-account) tournaments. */
export async function getAnonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ANON_COOKIE)?.value ?? null;
}
