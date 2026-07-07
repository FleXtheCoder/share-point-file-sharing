import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSessionUser, requireAdmin } from "@/lib/server/auth"
import { deleteUserAccount } from "@/lib/server/db"
import { prisma } from "@/lib/prisma"
import { generatePassword } from "@/lib/server/password"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  try {
    requireAdmin(user)
  } catch {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const { id } = await params
    if (id === user.id) {
      return NextResponse.json({ error: "Du kannst dich nicht selbst löschen" }, { status: 400 })
    }

    const result = await deleteUserAccount(id)
    if (result === "not_found") {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Benutzer konnte nicht gelöscht werden" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  try {
    requireAdmin(user)
  } catch {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    if (body.action === "reset-password") {
      const generatedPassword = generatePassword()
      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: bcrypt.hashSync(generatedPassword, 10),
          mustChangePassword: true,
        },
      })
      return NextResponse.json({ generatedPassword })
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Aktion fehlgeschlagen" }, { status: 500 })
  }
}
