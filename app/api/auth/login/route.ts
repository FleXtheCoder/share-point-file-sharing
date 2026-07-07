import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createSession, setSessionCookie, ensureBootstrapped } from "@/lib/server/auth"
import { getUserByUsername } from "@/lib/server/db"
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit"
import { userToCurrentUser } from "@/lib/server/users"

const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rateLimit = checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Zu viele Anmeldeversuche. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  try {
    await ensureBootstrapped()
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Benutzername und Passwort erforderlich" }, { status: 400 })
    }

    const user = await getUserByUsername(username)
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return NextResponse.json({ error: "Ungültige Anmeldedaten" }, { status: 401 })
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: userToCurrentUser({
        id: user.id,
        username: user.username,
        color: user.color,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      }),
    })
  } catch {
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen" }, { status: 500 })
  }
}
