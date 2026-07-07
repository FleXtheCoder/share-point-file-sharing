import { randomUUID } from "crypto"
import { fileTooLargeMessage, isFileTooLarge } from "@/lib/limits"
import fs from "fs"
import path from "path"
import type { SafeUser } from "./users"
import { getUploadsDir } from "./db"
import { getMimeTypeFromFileName } from "./mime"
import { prisma } from "@/lib/prisma"
import { getFileTypeFromName, DEFAULT_FOLDER_COLOR, isFolderColor } from "@/lib/data"
import type { FileItem, SharePermission } from "@/lib/types"

function toFileItem(
  file: {
    id: string
    name: string
    type: string
    isFolder: boolean
    size: number | null
    parentId: string | null
    modifiedById: string
    modifiedAt: Date
    folderColor?: string | null
    modifiedBy?: { username: string }
    shares?: { user: { username: string } }[]
    favorites?: { userId: string }[]
  },
  pathSegments: string[] = [],
  currentUserId?: string
): FileItem {
  return {
    id: file.id,
    name: file.name,
    type: file.isFolder ? "folder" : (file.type as FileItem["type"]),
    size: file.isFolder ? null : file.size,
    modifiedAt: file.modifiedAt,
    modifiedBy: file.modifiedById,
    modifiedByName: file.modifiedBy?.username,
    sharedWith: file.shares?.map((s) => s.user.username) ?? [],
    favorite: file.favorites?.some((f) => f.userId === currentUserId) ?? false,
    parentId: file.parentId,
    path: pathSegments,
    folderColor: file.isFolder ? file.folderColor ?? DEFAULT_FOLDER_COLOR : null,
  }
}

const fileInclude = (userId: string) => ({
  modifiedBy: { select: { username: true } },
  shares: { include: { user: { select: { username: true } } } },
  favorites: { where: { userId }, select: { userId: true } },
})

async function canAccessFile(userId: string, fileId: string): Promise<boolean> {
  let currentId: string | null = fileId

  while (currentId) {
    const file = await prisma.file.findFirst({
      where: { id: currentId, deletedAt: null },
      select: {
        ownerId: true,
        parentId: true,
        shares: { where: { userId }, select: { userId: true } },
      },
    })

    if (!file) return false
    if (file.ownerId === userId || file.shares.length > 0) return true
    currentId = file.parentId
  }

  return false
}

async function getInheritedShareUserIds(parentId: string | null, ownerId: string): Promise<string[]> {
  const userIds = new Set<string>()
  let currentId = parentId

  while (currentId) {
    const folder = await prisma.file.findFirst({
      where: { id: currentId, deletedAt: null, isFolder: true },
      select: {
        parentId: true,
        shares: { select: { userId: true } },
      },
    })

    if (!folder) break

    for (const share of folder.shares) {
      if (share.userId !== ownerId) userIds.add(share.userId)
    }

    currentId = folder.parentId
  }

  return [...userIds]
}

async function collectDescendantIds(folderId: string): Promise<string[]> {
  const ids: string[] = []
  const queue = [folderId]

  while (queue.length > 0) {
    const parentId = queue.shift()!
    const children = await prisma.file.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true, isFolder: true },
    })

    for (const child of children) {
      ids.push(child.id)
      if (child.isFolder) queue.push(child.id)
    }
  }

  return ids
}

function mergeShareUserIds(ownerId: string, ...lists: string[][]): string[] {
  const userIds = new Set<string>()
  for (const list of lists) {
    for (const userId of list) {
      if (userId !== ownerId) userIds.add(userId)
    }
  }
  return [...userIds]
}

async function applyShareChanges(
  fileIds: string[],
  ownerId: string,
  addUserIds: string[],
  removeUserIds: string[]
): Promise<void> {
  for (const targetId of fileIds) {
    for (const userId of removeUserIds) {
      await prisma.fileShare.deleteMany({ where: { fileId: targetId, userId } })
    }

    for (const userId of addUserIds) {
      if (userId === ownerId) continue
      await prisma.fileShare.upsert({
        where: { fileId_userId: { fileId: targetId, userId } },
        create: { fileId: targetId, userId, role: "WRITE" },
        update: {},
      })
    }
  }
}

export async function listFiles(
  user: SafeUser,
  section: string,
  folderId: string | null,
  pathSegments: string[] = []
): Promise<FileItem[]> {
  const include = fileInclude(user.id)

  if (section === "favorites") {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, file: { deletedAt: null } },
      include: { file: { include } },
      orderBy: { file: { modifiedAt: "desc" } },
    })
    return favorites.map((f) => toFileItem(f.file, [], user.id))
  }

  if (section === "shared") {
    const shares = await prisma.fileShare.findMany({
      where: {
        userId: user.id,
        file: { deletedAt: null, ownerId: { not: user.id } },
      },
      include: { file: { include } },
      orderBy: { file: { modifiedAt: "desc" } },
    })
    return shares.map((s) => toFileItem(s.file, [], user.id))
  }

  if (section === "recent") {
    const files = await prisma.file.findMany({
      where: {
        deletedAt: null,
        OR: [{ ownerId: user.id }, { shares: { some: { userId: user.id } } }],
      },
      include,
      orderBy: { modifiedAt: "desc" },
      take: 20,
    })
    return files.map((f) => toFileItem(f, [], user.id))
  }

  if (folderId !== null && !(await canAccessFile(user.id, folderId))) {
    return []
  }

  const files = await prisma.file.findMany({
    where:
      folderId !== null
        ? { deletedAt: null, parentId: folderId }
        : {
            deletedAt: null,
            parentId: null,
            OR: [{ ownerId: user.id }, { shares: { some: { userId: user.id } } }],
          },
    include,
    orderBy: [{ isFolder: "desc" }, { name: "asc" }],
  })

  return files.map((f) => toFileItem(f, pathSegments, user.id))
}

export async function createFolder(
  user: SafeUser,
  name: string,
  parentId: string | null,
  sharedWithUserIds: string[],
  folderColor?: string
): Promise<FileItem> {
  if (parentId && !(await canAccessFile(user.id, parentId))) {
    throw new Error("Kein Zugriff auf diesen Ordner")
  }

  const color = folderColor && isFolderColor(folderColor) ? folderColor : DEFAULT_FOLDER_COLOR

  const shareUserIds = mergeShareUserIds(
    user.id,
    await getInheritedShareUserIds(parentId, user.id),
    sharedWithUserIds
  )

  const file = await prisma.file.create({
    data: {
      name,
      type: "folder",
      isFolder: true,
      folderColor: color,
      parentId,
      ownerId: user.id,
      modifiedById: user.id,
      shares: {
        create: shareUserIds.map((userId) => ({ userId, role: "WRITE" as const })),
      },
    },
    include: {
      modifiedBy: { select: { username: true } },
      shares: { include: { user: { select: { username: true } } } },
      favorites: { where: { userId: user.id }, select: { userId: true } },
    },
  })

  return toFileItem(file, [], user.id)
}

export async function saveUploadedFile(
  user: SafeUser,
  file: File,
  parentId: string | null,
  sharedWithUserIds: string[]
): Promise<FileItem> {
  if (parentId && !(await canAccessFile(user.id, parentId))) {
    throw new Error("Kein Zugriff auf diesen Ordner")
  }

  if (isFileTooLarge(file.size)) {
    throw new Error(fileTooLargeMessage(file.name))
  }

  const shareUserIds = mergeShareUserIds(
    user.id,
    await getInheritedShareUserIds(parentId, user.id),
    sharedWithUserIds
  )

  const id = randomUUID()
  const fileType = getFileTypeFromName(file.name)
  const ext = path.extname(file.name)
  const storageName = `${id}${ext}`
  const storagePath = path.join(getUploadsDir(), storageName)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(storagePath, buffer)

  const created = await prisma.file.create({
    data: {
      id,
      name: file.name,
      type: fileType,
      isFolder: false,
      size: file.size,
      parentId,
      ownerId: user.id,
      modifiedById: user.id,
      storagePath: storageName,
      shares: {
        create: shareUserIds.map((userId) => ({ userId, role: "WRITE" as const })),
      },
    },
    include: {
      modifiedBy: { select: { username: true } },
      shares: { include: { user: { select: { username: true } } } },
      favorites: { where: { userId: user.id }, select: { userId: true } },
    },
  })

  return toFileItem(created, [], user.id)
}

export async function softDeleteFile(user: SafeUser, fileId: string): Promise<void> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, deletedAt: null },
    select: { ownerId: true },
  })

  if (!file) throw new Error("Datei nicht gefunden")
  if (file.ownerId !== user.id) throw new Error("Nur der Eigentümer kann löschen")

  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  })
}

export async function toggleFavorite(user: SafeUser, fileId: string): Promise<boolean> {
  if (!(await canAccessFile(user.id, fileId))) throw new Error("Kein Zugriff")

  const existing = await prisma.favorite.findUnique({
    where: { userId_fileId: { userId: user.id, fileId } },
  })

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_fileId: { userId: user.id, fileId } },
    })
    return false
  }

  await prisma.favorite.create({ data: { userId: user.id, fileId } })
  return true
}

async function collectFolderAncestors(
  parentId: string | null
): Promise<{ id: string; name: string }[]> {
  const breadcrumbs: { id: string; name: string }[] = []
  let currentId = parentId

  while (currentId) {
    const folder = await prisma.file.findFirst({
      where: { id: currentId, deletedAt: null, isFolder: true },
      select: { id: true, name: true, parentId: true },
    })
    if (!folder) break
    breadcrumbs.unshift({ id: folder.id, name: folder.name })
    currentId = folder.parentId
  }

  return breadcrumbs
}

export async function getFileNavigation(
  user: SafeUser,
  fileId: string
): Promise<{
  file: FileItem
  breadcrumbs: { id: string; name: string }[]
  targetFolderId: string | null
  isFolder: boolean
}> {
  if (!(await canAccessFile(user.id, fileId))) {
    throw new Error("Kein Zugriff")
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, deletedAt: null },
    include: fileInclude(user.id),
  })

  if (!file) throw new Error("Datei nicht gefunden")

  const item = toFileItem(file, [], user.id)

  if (file.isFolder) {
    const ancestors = await collectFolderAncestors(file.parentId)
    return {
      file: item,
      breadcrumbs: [...ancestors, { id: file.id, name: file.name }],
      targetFolderId: file.id,
      isFolder: true,
    }
  }

  if (!file.parentId) {
    return {
      file: item,
      breadcrumbs: [],
      targetFolderId: null,
      isFolder: false,
    }
  }

  const parent = await prisma.file.findFirst({
    where: { id: file.parentId, deletedAt: null, isFolder: true },
    select: { id: true, name: true, parentId: true },
  })

  if (!parent) throw new Error("Überordner nicht gefunden")

  const ancestors = await collectFolderAncestors(parent.parentId)
  return {
    file: item,
    breadcrumbs: [...ancestors, { id: parent.id, name: parent.name }],
    targetFolderId: parent.id,
    isFolder: false,
  }
}

export async function getFilePermissions(
  user: SafeUser,
  fileId: string
): Promise<SharePermission[]> {
  if (!(await canAccessFile(user.id, fileId))) throw new Error("Kein Zugriff")

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      owner: { select: { id: true, username: true } },
      shares: { include: { user: { select: { id: true, username: true } } } },
    },
  })

  if (!file) throw new Error("Datei nicht gefunden")

  const permissions: SharePermission[] = [
    { id: "owner", username: file.owner.username, role: "owner" },
    ...file.shares.map((s) => ({
      id: s.user.id,
      username: s.user.username,
      role: s.role === "WRITE" ? ("write" as const) : ("read" as const),
    })),
  ]

  const directUserIds = new Set(file.shares.map((s) => s.user.id))
  const inheritedUserIds = await getInheritedShareUserIds(file.parentId, file.ownerId)

  if (inheritedUserIds.length > 0) {
    const inheritedUsers = await prisma.user.findMany({
      where: { id: { in: inheritedUserIds.filter((id) => !directUserIds.has(id)) } },
      select: { id: true, username: true },
    })

    permissions.push(
      ...inheritedUsers.map((u) => ({
        id: u.id,
        username: u.username,
        role: "write" as const,
      }))
    )
  }

  return permissions
}

export async function updateFileShares(
  user: SafeUser,
  fileId: string,
  addUserIds: string[],
  removeUserIds: string[]
): Promise<void> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { ownerId: true, isFolder: true },
  })

  if (!file) throw new Error("Datei nicht gefunden")
  if (file.ownerId !== user.id) throw new Error("Nur der Eigentümer kann Freigaben ändern")

  const targetIds = file.isFolder ? [fileId, ...(await collectDescendantIds(fileId))] : [fileId]
  await applyShareChanges(targetIds, file.ownerId, addUserIds, removeUserIds)

  await prisma.file.update({ where: { id: fileId }, data: { modifiedAt: new Date() } })
}

export async function getStorageStats(): Promise<{ used: number; total: number }> {
  const result = await prisma.file.aggregate({
    where: { deletedAt: null, isFolder: false },
    _sum: { size: true },
  })
  return { used: result._sum.size ?? 0, total: 10 * 1024 * 1024 * 1024 }
}

export async function getFileForDownload(
  user: SafeUser,
  fileId: string
): Promise<{ storagePath: string; name: string; mimeType: string }> {
  if (!(await canAccessFile(user.id, fileId))) throw new Error("Kein Zugriff")

  const file = await prisma.file.findFirst({
    where: { id: fileId, isFolder: false },
    select: { name: true, storagePath: true, type: true },
  })

  if (!file?.storagePath) throw new Error("Datei nicht gefunden")

  const fullPath = path.join(getUploadsDir(), file.storagePath)
  if (!fs.existsSync(fullPath)) throw new Error("Datei auf dem Server nicht gefunden")

  return {
    storagePath: fullPath,
    name: file.name,
    mimeType: getMimeTypeFromFileName(file.name, file.type),
  }
}
