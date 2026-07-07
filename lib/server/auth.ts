import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { ensureAdminExists, getUserById } from "./db"
import type { SafeUser } from "./users"

const COOKIE_NAME = "gruppen-drive-session"
const SESSION_DURATION = 60 * 60 * 24 * 30

function getSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-secret-change-in-production"
  )
}

let bootstrapped = false

export async function ensureBootstrapped() {
  if (!bootstrapped) {
    await ensureAdminExists()
    bootstrapped = true
  }
}

export async function createSession(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret())
}

export async function getSessionUser(): Promise<SafeUser | null> {
  await ensureBootstrapped()

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return getUserById(payload.userId as string)
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function requireUser(user: SafeUser | null): SafeUser {
  if (!user) throw new Error("Nicht angemeldet")
  return user
}

export function requireAdmin(user: SafeUser): SafeUser {
  if (user.role !== "ADMIN") throw new Error("Keine Berechtigung")
  return user
}
