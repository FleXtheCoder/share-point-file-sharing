import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSessionUser } from "@/lib/server/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/server/rate-limit"
import { userToCurrentUser } from "@/lib/server/users"

const CHANGE_PASSWORD_LIMIT = 10
const CHANGE_PASSWORD_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`change-password:${user.id}`, CHANGE_PASSWORD_LIMIT, CHANGE_PASSWORD_WINDOW_MS)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Alle Felder sind erforderlich" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Neues Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || !bcrypt.compareSync(currentPassword, dbUser.passwordHash)) {
      return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: bcrypt.hashSync(newPassword, 10),
        mustChangePassword: false,
      },
    })

    return NextResponse.json({
      user: userToCurrentUser({ ...user, mustChangePassword: false }),
    })
  } catch {
    return NextResponse.json({ error: "Passwort konnte nicht geändert werden" }, { status: 500 })
  }
}
