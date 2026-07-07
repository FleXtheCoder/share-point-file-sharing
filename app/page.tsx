"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  Toast,
  ToastBody,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
  Spinner,
  Text,
  Button,
} from "@fluentui/react-components"
import { LineHorizontal3Regular } from "@fluentui/react-icons"
import { Sidebar } from "@/components/sidebar"
import { Toolbar } from "@/components/toolbar"
import { FileGrid } from "@/components/file-grid"
import { FileList } from "@/components/file-list"
import { UploadDialog, NewFolderDialog, ShareDialog, DeleteConfirmDialog } from "@/components/dialogs"
import { FilePreviewDialog } from "@/components/file-preview-dialog"
import { LoginScreen } from "@/components/login-screen"
import { ChangePasswordScreen } from "@/components/change-password-screen"
import { AdminPanel } from "@/components/admin-panel"
import { useDrive } from "@/hooks/use-drive"
import { isPreviewable } from "@/lib/preview"
import { buildShareLink } from "@/lib/links"
import type { ActiveSection, FileItem, ViewMode } from "@/lib/types"

const SECTION_LABELS: Record<Exclude<ActiveSection, "admin">, string> = {
  "my-files": "Meine Dateien",
  shared: "Geteilt",
  favorites: "Favoriten",
  recent: "Zuletzt geöffnet",
}

export default function Page() {
  const toasterId = useId("toaster")
  const { dispatchToast } = useToastController(toasterId)

  const {
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
  } = useDrive()

  const deepLinkHandled = useRef(false)

  const [activeSection, setActiveSection] = useState<ActiveSection>("my-files")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name-asc")
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([])

  const [uploadOpen, setUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [shareDialogFile, setShareDialogFile] = useState<FileItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!mobileNavOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  const currentPath = useMemo(() => breadcrumbs.map((b) => b.name), [breadcrumbs])
  const isAdminView = activeSection === "admin"

  useEffect(() => {
    if (isAuthenticated && currentUser && !currentUser.mustChangePassword && !isAdminView) {
      loadFiles(activeSection, currentFolderId, currentPath)
    }
  }, [isAuthenticated, currentUser, activeSection, currentFolderId, currentPath, loadFiles, isAdminView])

  const showToast = useCallback(
    (title: string, body: string, intent: "success" | "warning" | "info" | "error" = "success") => {
      queueMicrotask(() => {
        dispatchToast(
          <Toast>
            <ToastTitle>{title}</ToastTitle>
            <ToastBody>{body}</ToastBody>
          </Toast>,
          { intent }
        )
      })
    },
    [dispatchToast]
  )

  useEffect(() => {
    if (deepLinkHandled.current) return
    if (!isAuthenticated || !currentUser || currentUser.mustChangePassword) return

    const fileId = new URLSearchParams(window.location.search).get("file")
    if (!fileId) return

    deepLinkHandled.current = true

    void (async () => {
      try {
        const navigation = await resolveDeepLink(fileId)
        setActiveSection("my-files")
        setCurrentFolderId(navigation.targetFolderId)
        setBreadcrumbs(navigation.breadcrumbs)
        setSearchQuery("")

        if (navigation.isFolder) {
          showToast("Ordner geöffnet", `"${navigation.file.name}" wurde geöffnet.`, "info")
        } else if (isPreviewable(navigation.file)) {
          setPreviewFile(navigation.file)
          showToast("Datei geöffnet", `"${navigation.file.name}" wird angezeigt.`, "info")
        } else {
          setSearchQuery(navigation.file.name)
          showToast("Datei gefunden", `"${navigation.file.name}" im Ordner angezeigt.`, "info")
        }
      } catch (err) {
        showToast(
          "Link ungültig",
          err instanceof Error ? err.message : "Der Freigabelink konnte nicht geöffnet werden.",
          "error"
        )
      } finally {
        window.history.replaceState({}, "", window.location.pathname)
      }
    })()
  }, [isAuthenticated, currentUser, resolveDeepLink, showToast])

  const filteredFiles = useMemo(() => {
    let result = files
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((f) => f.name.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1
      if (a.type !== "folder" && b.type === "folder") return 1
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name, "de")
        case "name-desc": return b.name.localeCompare(a.name, "de")
        case "date-desc": return b.modifiedAt.getTime() - a.modifiedAt.getTime()
        case "date-asc": return a.modifiedAt.getTime() - b.modifiedAt.getTime()
        case "size-desc": return (b.size ?? 0) - (a.size ?? 0)
        case "type": return a.type.localeCompare(b.type)
        default: return 0
      }
    })
  }, [files, searchQuery, sortBy])

  const handleFolderOpen = useCallback((file: FileItem) => {
    setCurrentFolderId(file.id)
    setBreadcrumbs((prev) => [...prev, { id: file.id, name: file.name }])
    setSearchQuery("")
    setActiveSection("my-files")
  }, [])

  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      if (index === -1) {
        setCurrentFolderId(null)
        setBreadcrumbs([])
      } else {
        const target = breadcrumbs[index]
        setCurrentFolderId(target.id)
        setBreadcrumbs((prev) => prev.slice(0, index + 1))
      }
    },
    [breadcrumbs]
  )

  const handleSectionChange = useCallback((section: ActiveSection) => {
    setActiveSection(section)
    if (section !== "my-files") {
      setCurrentFolderId(null)
      setBreadcrumbs([])
    }
    setSearchQuery("")
    setMobileNavOpen(false)
  }, [])

  const onToggleFavorite = useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id)
      try {
        await handleToggleFavorite(id)
        if (file) {
          showToast(
            file.favorite ? "Aus Favoriten entfernt" : "Zu Favoriten hinzugefügt",
            file.name,
            file.favorite ? "info" : "success"
          )
        }
      } catch (err) {
        showToast("Fehler", err instanceof Error ? err.message : "Fehler", "error")
      }
    },
    [files, handleToggleFavorite, showToast]
  )

  const onDelete = useCallback((file: FileItem) => {
    setDeleteTarget(file)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    await handleDelete(deleteTarget.id, activeSection, currentFolderId, currentPath)
    showToast("Gelöscht", `"${deleteTarget.name}" wurde gelöscht.`, "warning")
  }, [deleteTarget, handleDelete, activeSection, currentFolderId, currentPath, showToast])

  const onUpload = useCallback(
    async (uploadedFiles: File[], sharedWith: string[]) => {
      try {
        await handleUpload(uploadedFiles, sharedWith, activeSection, currentFolderId, currentPath)
        showToast("Hochgeladen", `${uploadedFiles.length} Datei(en) hochgeladen.`, "success")
      } catch (err) {
        showToast("Fehler", err instanceof Error ? err.message : "Upload fehlgeschlagen", "error")
      }
    },
    [handleUpload, activeSection, currentFolderId, currentPath, showToast]
  )

  const onCreateFolder = useCallback(
    async (name: string, sharedWith: string[], folderColor: string) => {
      try {
        await handleCreateFolder(name, sharedWith, folderColor, activeSection, currentFolderId, currentPath)
        showToast("Ordner erstellt", `"${name}" wurde erstellt.`, "success")
      } catch (err) {
        showToast("Fehler", err instanceof Error ? err.message : "Ordner konnte nicht erstellt werden", "error")
      }
    },
    [handleCreateFolder, activeSection, currentFolderId, currentPath, showToast]
  )

  const onShare = useCallback(
    async (fileId: string, addUserIds: string[], removeUserIds: string[]) => {
      try {
        await handleShare(fileId, addUserIds, removeUserIds, activeSection, currentFolderId, currentPath)
        showToast("Freigabe aktualisiert", "Die Freigabeeinstellungen wurden gespeichert.", "success")
      } catch (err) {
        showToast("Fehler", err instanceof Error ? err.message : "Freigabe fehlgeschlagen", "error")
      }
    },
    [handleShare, activeSection, currentFolderId, currentPath, showToast]
  )

  const onCopyLink = useCallback(
    (file: FileItem) => {
      navigator.clipboard.writeText(buildShareLink(file.id))
      showToast("Link kopiert", "Der Direktlink wurde in die Zwischenablage kopiert.", "success")
    },
    [showToast]
  )

  const onChangePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await changePassword(currentPassword, newPassword)
      showToast("Passwort geändert", "Dein Passwort wurde erfolgreich aktualisiert.", "success")
    },
    [changePassword, showToast]
  )

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} error={authError} />
  }

  if (currentUser?.mustChangePassword && currentUser.role !== "admin") {
    return <ChangePasswordScreen onChangePassword={onChangePassword} error={passwordError} />
  }

  const currentFolderName = breadcrumbs[breadcrumbs.length - 1]?.name ?? null
  const sectionLabel = isAdminView ? "Admin" : SECTION_LABELS[activeSection as Exclude<ActiveSection, "admin">]

  return (
    <>
      <Toaster toasterId={toasterId} position="top-end" />

      <div className="app-shell">
        {mobileNavOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Menü schließen"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <Sidebar
          className={`app-sidebar${mobileNavOpen ? " is-open" : ""}`}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          currentUser={currentUser}
          members={members}
          storage={storage}
          onLogout={logout}
          onNavigate={() => setMobileNavOpen(false)}
        />

        <main className="app-main" style={{ background: "#faf9f8" }}>
          {isAdminView ? (
            <>
              <div className="mobile-admin-bar mobile-only">
                <Button
                  appearance="subtle"
                  icon={<LineHorizontal3Regular />}
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Menü öffnen"
                />
                <span className="mobile-admin-bar-title">Admin</span>
              </div>
              <AdminPanel />
            </>
          ) : (
            <>
              <Toolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onUploadClick={() => setUploadOpen(true)}
                onNewFolderClick={() => setNewFolderOpen(true)}
                sortBy={sortBy}
                onSortChange={setSortBy}
                breadcrumbs={breadcrumbs.map((b) => b.name)}
                onBreadcrumbClick={handleBreadcrumbClick}
                sectionLabel={sectionLabel}
                onMenuClick={() => setMobileNavOpen(true)}
              />

              <div className="file-count-bar" style={{ padding: "12px 24px 0" }}>
                {error ? (
                  <Text style={{ fontSize: 13, color: "#d83b01" }}>{error}</Text>
                ) : (
                  <span style={{ fontSize: 13, color: "#605e5c" }}>
                    {loading ? (
                      <Spinner size="tiny" label="Lade Dateien…" />
                    ) : (
                      <>
                        {filteredFiles.length} Element{filteredFiles.length !== 1 ? "e" : ""}
                        {searchQuery && ` für „${searchQuery}"`}
                      </>
                    )}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {loading && files.length === 0 ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Spinner size="large" label="Dateien werden geladen…" />
                  </div>
                ) : viewMode === "grid" ? (
                  <FileGrid
                    files={filteredFiles}
                    onFolderOpen={handleFolderOpen}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={onDelete}
                    onShare={(f) => setShareDialogFile(f)}
                    onCopyLink={onCopyLink}
                    onPreview={(f) => setPreviewFile(f)}
                  />
                ) : (
                  <FileList
                    files={filteredFiles}
                    onFolderOpen={handleFolderOpen}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={onDelete}
                    onShare={(f) => setShareDialogFile(f)}
                    onCopyLink={onCopyLink}
                    onPreview={(f) => setPreviewFile(f)}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={onUpload}
        currentFolder={currentFolderName}
        members={members}
        currentUserId={currentUser?.id ?? ""}
      />
      <NewFolderDialog
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        onCreate={onCreateFolder}
        currentFolder={currentFolderName}
        members={members}
        currentUserId={currentUser?.id ?? ""}
      />
      <ShareDialog
        open={shareDialogFile !== null}
        onOpenChange={(o) => { if (!o) setShareDialogFile(null) }}
        file={shareDialogFile}
        onShare={onShare}
        getPermissions={getPermissions}
        onToast={showToast}
        members={members}
        currentUserId={currentUser?.id ?? ""}
      />
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        file={deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={confirmDelete}
      />
      <FilePreviewDialog
        file={previewFile}
        open={previewFile !== null}
        onOpenChange={(o) => { if (!o) setPreviewFile(null) }}
      />
    </>
  )
}
