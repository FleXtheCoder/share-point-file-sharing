import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { colorFromString } from "@/lib/data"
import type { SafeUser } from "./users"

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "data", "uploads")

export function getUploadsDir(): string {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  return UPLOADS_DIR
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    color: user.color,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  }
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
  })
}

export async function getAllUsers(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({ orderBy: { username: "asc" } })
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    color: u.color,
    role: u.role,
    mustChangePassword: u.mustChangePassword,
  }))
}

export async function deleteUserAccount(userId: string): Promise<"deleted" | "not_found"> {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) return "not_found"

  const uploadsDir = getUploadsDir()

  while (true) {
    const leaf = await prisma.file.findFirst({
      where: {
        ownerId: userId,
        children: { none: { ownerId: userId } },
      },
      select: { id: true, storagePath: true },
    })

    if (!leaf) {
      const remaining = await prisma.file.count({ where: { ownerId: userId } })
      if (remaining === 0) break
      await prisma.file.deleteMany({ where: { ownerId: userId } })
      break
    }

    if (leaf.storagePath) {
      try {
        fs.unlinkSync(path.join(uploadsDir, leaf.storagePath))
      } catch {
        // Datei existiert ggf. nicht mehr auf dem Server
      }
    }

    await prisma.file.delete({ where: { id: leaf.id } })
  }

  const modifiedFiles = await prisma.file.findMany({
    where: { modifiedById: userId },
    select: { id: true, ownerId: true },
  })

  for (const file of modifiedFiles) {
    await prisma.file.update({
      where: { id: file.id },
      data: { modifiedById: file.ownerId },
    })
  }

  await prisma.user.delete({ where: { id: userId } })
  return "deleted"
}

export async function ensureAdminExists() {
  const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD ?? "admin123"
  const syncFromEnv = process.env.ADMIN_SYNC_PASSWORD === "true"

  const byUsername = await prisma.user.findUnique({ where: { username } })
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })

  if (!admin && !byUsername) {
    await prisma.user.create({
      data: {
        username,
        passwordHash: bcrypt.hashSync(password, 10),
        color: colorFromString(username),
        role: "ADMIN",
        mustChangePassword: false,
      },
    })
    return
  }

  if (!admin || !syncFromEnv) return

  const usernameTaken = byUsername && byUsername.id !== admin.id

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      passwordHash: bcrypt.hashSync(password, 10),
      mustChangePassword: false,
      ...(usernameTaken ? {} : { username }),
    },
  })
}
