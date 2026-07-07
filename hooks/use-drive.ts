"use client"

import { useCallback, useEffect, useState } from "react"
import type { ActiveSection, CurrentUser, FileItem, Member, SharePermission } from "@/lib/types"

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Anfrage fehlgeschlagen")
  return data as T
}

function parseFiles(raw: { files: Array<Omit<FileItem, "modifiedAt"> & { modifiedAt: string }> }) {
  return raw.files.map((f) => ({ ...f, modifiedAt: new Date(f.modifiedAt) }))
}

export function useDrive() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [storage, setStorage] = useState<{ used: number; total: number } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadMembers = useCallback(async () => {
    const usersData = await api<{ members: Member[] }>("/api/users")
    setMembers(usersData.members)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const data = await api<{ user: CurrentUser }>("/api/auth/me")
      setCurrentUser(data.user)
      setIsAuthenticated(true)
      await loadMembers()
    } catch {
      setIsAuthenticated(false)
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }, [loadMembers])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const loadFiles = useCallback(
    async (section: ActiveSection, folderId: string | null, path: string[]) => {
      if (section === "admin") return
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ section })
        if (folderId) params.set("folderId", folderId)
        if (path.length) params.set("path", path.join("/"))

        const data = await api<{
          files: Array<Omit<FileItem, "modifiedAt"> & { modifiedAt: string }>
          storage: { used: number; total: number }
        }>(`/api/files?${params}`)

        setFiles(parseFiles(data))
        setStorage(data.storage)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Laden")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const login = useCallback(
    async (username: string, password: string) => {
      setAuthError(null)
      try {
        const data = await api<{ user: CurrentUser }>("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })
        setCurrentUser(data.user)
        setIsAuthenticated(true)
        await loadMembers()
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen")
        throw err
      }
    },
    [loadMembers]
  )

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setPasswordError(null)
    try {
      const data = await api<{ user: CurrentUser }>("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentUser(data.user)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Passwort konnte nicht geändert werden")
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    setIsAuthenticated(false)
    setFiles([])
    setMembers([])
  }, [])

  const handleUpload = useCallback(
    async (
      uploadedFiles: File[],
      sharedWith: string[],
      section: ActiveSection,
      folderId: string | null,
      path: string[]
    ) => {
      const formData = new FormData()
      formData.set("action", "upload")
      if (folderId) formData.set("parentId", folderId)
      formData.set("sharedWith", JSON.stringify(sharedWith))
      for (const file of uploadedFiles) formData.append("files", file)
      await api("/api/files/upload", { method: "POST", body: formData })
      await loadFiles(section, folderId, path)
    },
    [loadFiles]
  )

  const handleCreateFolder = useCallback(
    async (
      name: string,
      sharedWith: string[],
      folderColor: string,
      section: ActiveSection,
      folderId: string | null,
      path: string[]
    ) => {
      const formData = new FormData()
      formData.set("action", "folder")
      formData.set("name", name)
      formData.set("folderColor", folderColor)
      if (folderId) formData.set("parentId", folderId)
      formData.set("sharedWith", JSON.stringify(sharedWith))
      await api("/api/files/upload", { method: "POST", body: formData })
      await loadFiles(section, folderId, path)
    },
    [loadFiles]
  )

  const handleDelete = useCallback(
    async (id: string, section: ActiveSection, folderId: string | null, path: string[]) => {
      await api(`/api/files/${id}`, { method: "DELETE" })
      await loadFiles(section, folderId, path)
    },
    [loadFiles]
  )

  const handleToggleFavorite = useCallback(async (id: string) => {
    const data = await api<{ favorite: boolean }>(`/api/files/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "favorite" }),
    })
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, favorite: data.favorite } : f)))
  }, [])

  const handleShare = useCallback(
    async (
      fileId: string,
      addUserIds: string[],
      removeUserIds: string[],
      section: ActiveSection,
      folderId: string | null,
      path: string[]
    ) => {
      await api(`/api/files/${fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share", addUserIds, removeUserIds }),
      })
      await loadFiles(section, folderId, path)
    },
    [loadFiles]
  )

  const getPermissions = useCallback(async (fileId: string): Promise<SharePermission[]> => {
    const data = await api<{ permissions: SharePermission[] }>(`/api/files/${fileId}`)
    return data.permissions
  }, [])

  const resolveDeepLink = useCallback(async (fileId: string) => {
    const data = await api<{
      file: Omit<FileItem, "modifiedAt"> & { modifiedAt: string }
      breadcrumbs: { id: string; name: string }[]
      targetFolderId: string | null
      isFolder: boolean
    }>(`/api/files/${fileId}?nav=1`)

    return {
      ...data,
      file: { ...data.file, modifiedAt: new Date(data.file.modifiedAt) },
    }
  }, [])

  return {
    isAuthenticated,
    currentUser,
    members,
    files,
    loading,
    error,
    authError,
    passwordError,
    storage,
    loadFiles,
    login,
    changePassword,
    logout,
    handleUpload,
    handleCreateFolder,
    handleDelete,
    handleToggleFavorite,
    handleShare,
    getPermissions,
    resolveDeepLink,
  }
}
