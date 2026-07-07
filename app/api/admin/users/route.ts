import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSessionUser, requireAdmin } from "@/lib/server/auth"
import { prisma } from "@/lib/prisma"
import { colorFromString } from "@/lib/data"
import { generatePassword } from "@/lib/server/password"
import { userToMember } from "@/lib/server/users"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  try {
    requireAdmin(user)
  } catch {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({
    users: users.map((u) => ({
      ...userToMember({
        id: u.id,
        username: u.username,
        color: u.color,
        role: u.role,
        mustChangePassword: u.mustChangePassword,
      }),
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt,
    })),
  })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  try {
    requireAdmin(user)
  } catch {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  try {
    const { username, role } = await request.json()

    if (!username?.trim()) {
      return NextResponse.json({ error: "Benutzername ist erforderlich" }, { status: 400 })
    }

    const normalizedUsername = username.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { username: normalizedUsername } })
    if (existing) {
      return NextResponse.json({ error: "Benutzername bereits vergeben" }, { status: 409 })
    }

    const generatedPassword = generatePassword()
    const created = await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash: bcrypt.hashSync(generatedPassword, 10),
        color: colorFromString(normalizedUsername),
        role: role === "admin" ? "ADMIN" : "MEMBER",
        mustChangePassword: role !== "admin",
      },
    })

    return NextResponse.json({
      user: userToMember({
        id: created.id,
        username: created.username,
        color: created.color,
        role: created.role,
        mustChangePassword: created.mustChangePassword,
      }),
      generatedPassword,
    })
  } catch {
    return NextResponse.json({ error: "Benutzer konnte nicht erstellt werden" }, { status: 500 })
  }
}
