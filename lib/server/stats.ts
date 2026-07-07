import { prisma } from "@/lib/prisma"
import type { FileType } from "@/lib/types"
import { getStorageStats } from "./files"

export interface TypeBreakdown {
  type: FileType
  count: number
  size: number
}

export interface AdminStats {
  users: { total: number; admins: number; members: number }
  files: { total: number; folders: number; shares: number; favorites: number }
  storage: { used: number; total: number }
  byType: TypeBreakdown[]
}

export async function getAdminStats(): Promise<AdminStats> {
  const [userCounts, fileCounts, shares, favorites, storage, grouped] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    prisma.file.groupBy({
      by: ["isFolder"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    prisma.fileShare.count(),
    prisma.favorite.count(),
    getStorageStats(),
    prisma.file.groupBy({
      by: ["type"],
      where: { deletedAt: null, isFolder: false },
      _count: { id: true },
      _sum: { size: true },
    }),
  ])

  const admins = userCounts.find((u) => u.role === "ADMIN")?._count.id ?? 0
  const members = userCounts.find((u) => u.role === "MEMBER")?._count.id ?? 0
  const folders = fileCounts.find((f) => f.isFolder)?._count.id ?? 0
  const files = fileCounts.find((f) => !f.isFolder)?._count.id ?? 0

  const byType = grouped
    .map((g) => ({
      type: g.type as FileType,
      count: g._count.id,
      size: g._sum.size ?? 0,
    }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    users: { total: admins + members, admins, members },
    files: { total: files, folders, shares, favorites },
    storage,
    byType,
  }
}
