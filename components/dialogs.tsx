"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowUploadRegular,
  DocumentRegular,
  FolderRegular,
  DismissRegular,
  CheckmarkRegular,
  ShareRegular,
  CopyRegular,
  DeleteRegular,
} from "@fluentui/react-icons"
import { ColoredAvatar } from "@/components/colored-avatar"
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Input,
  Spinner,
  Text,
} from "@fluentui/react-components"
import type { FileItem, Member, SharePermission } from "@/lib/types"
import { colorFromString, formatFileSize, DEFAULT_FOLDER_COLOR, FOLDER_COLORS } from "@/lib/data"
import { fileTooLargeMessage, isFileTooLarge, MAX_FILE_SIZE_MB } from "@/lib/limits"
import { buildShareLink } from "@/lib/links"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onUpload: (files: File[], sharedWith: string[]) => Promise<void>
  currentFolder: string | null
  members: Member[]
  currentUserId: string
}

export function UploadDialog({
  open,
  onOpenChange,
  onUpload,
  currentFolder,
  members,
  currentUserId,
}: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [sharedWith, setSharedWith] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const otherMembers = members.filter((m) => m.id !== currentUserId)

  function addFiles(files: File[]) {
    const tooLarge = files.find((file) => isFileTooLarge(file.size))
    if (tooLarge) {
      setUploadError(fileTooLargeMessage(tooLarge.name))
      return
    }
    setUploadError(null)
    setSelectedFiles(files)
  }

  async function handleSubmit() {
    if (selectedFiles.length === 0) return
    const tooLarge = selectedFiles.find((file) => isFileTooLarge(file.size))
    if (tooLarge) {
      setUploadError(fileTooLargeMessage(tooLarge.name))
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      await onUpload(selectedFiles, sharedWith)
      setSelectedFiles([])
      setSharedWith([])
      onOpenChange(false)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        onOpenChange(d.open)
        if (!d.open) {
          setSelectedFiles([])
          setSharedWith([])
          setUploadError(null)
        }
      }}
    >
      <DialogSurface style={{ maxWidth: 520 }}>
        <DialogBody>
          <DialogTitle>Dateien hochladen</DialogTitle>
          <DialogContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files))
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#0078d4" : "#c8c6c4"}`,
                  borderRadius: 8,
                  padding: 32,
                  textAlign: "center",
                  background: dragOver ? "#eff6fc" : "#faf9f8",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ArrowUploadRegular style={{ width: 36, height: 36, color: "#0078d4" }} />
                <Text style={{ fontWeight: 600 }}>Dateien hier ablegen</Text>
                <Text style={{ fontSize: 13, color: "#8a8886" }}>oder klicken zum Durchsuchen</Text>
                <Text style={{ fontSize: 12, color: "#8a8886" }}>Max. {MAX_FILE_SIZE_MB} MB pro Datei</Text>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ border: "1px solid #e1dfdd", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: "#f3f2f1", borderBottom: "1px solid #e1dfdd" }}>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "#605e5c" }}>
                      {selectedFiles.length} Datei{selectedFiles.length !== 1 ? "en" : ""} ausgewählt
                    </Text>
                  </div>
                  {selectedFiles.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
                      <DocumentRegular style={{ color: "#0078d4", width: 16 }} />
                      <Text style={{ fontSize: 13, flex: 1 }}>{f.name}</Text>
                      <Text style={{ fontSize: 11, color: "#8a8886" }}>{formatFileSize(f.size)}</Text>
                    </div>
                  ))}
                </div>
              )}

              {otherMembers.length > 0 && (
                <div>
                  <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
                    Teilen mit (optional)
                  </Text>
                  {otherMembers.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Checkbox
                        checked={sharedWith.includes(m.id)}
                        onChange={() =>
                          setSharedWith((prev) =>
                            prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          )
                        }
                      />
                      <ColoredAvatar username={m.username} color={m.color} size={24} />
                      <Text style={{ fontSize: 13 }}>{m.username}</Text>
                    </div>
                  ))}
                </div>
              )}

              {currentFolder && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6fc", padding: "8px 12px", borderRadius: 6 }}>
                  <FolderRegular style={{ color: "#0078d4", width: 16 }} />
                  <Text style={{ fontSize: 12, color: "#0078d4" }}>Wird in &quot;{currentFolder}&quot; hochgeladen</Text>
                </div>
              )}

              {uploadError && (
                <Text style={{ fontSize: 13, color: "#a4262c" }}>{uploadError}</Text>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={uploading}>Abbrechen</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              icon={uploading ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || uploading}
              style={{ background: "#0078d4" }}
            >
              {uploading ? "Wird hochgeladen…" : "Hochladen"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

interface NewFolderDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: (name: string, sharedWith: string[], folderColor: string) => Promise<void>
  currentFolder: string | null
  members: Member[]
  currentUserId: string
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onCreate,
  currentFolder,
  members,
  currentUserId,
}: NewFolderDialogProps) {
  const [name, setName] = useState("")
  const [sharedWith, setSharedWith] = useState<string[]>([])
  const [folderColor, setFolderColor] = useState(DEFAULT_FOLDER_COLOR)
  const [creating, setCreating] = useState(false)
  const otherMembers = members.filter((m) => m.id !== currentUserId)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      await onCreate(name.trim(), sharedWith, folderColor)
      setName("")
      setSharedWith([])
      setFolderColor(DEFAULT_FOLDER_COLOR)
      onOpenChange(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        onOpenChange(d.open)
        if (!d.open) {
          setName("")
          setSharedWith([])
          setFolderColor(DEFAULT_FOLDER_COLOR)
        }
      }}
    >
      <DialogSurface style={{ maxWidth: 440 }}>
        <DialogBody>
          <DialogTitle>Neuer Ordner</DialogTitle>
          <DialogContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input
                contentBefore={<FolderRegular style={{ color: folderColor }} />}
                value={name}
                onChange={(_, d) => setName(d.value)}
                placeholder="z.B. Urlaubsfotos 2025"
                style={{ width: "100%" }}
                onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
              />

              <div>
                <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
                  Ordnerfarbe
                </Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Farbe ${color}`}
                      onClick={() => setFolderColor(color)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: folderColor === color ? "3px solid #323130" : "2px solid #e1dfdd",
                        background: color,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {otherMembers.length > 0 && (
                <div>
                  <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
                    Teilen mit (optional)
                  </Text>
                  {otherMembers.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Checkbox
                        checked={sharedWith.includes(m.id)}
                        onChange={() =>
                          setSharedWith((prev) =>
                            prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          )
                        }
                      />
                      <ColoredAvatar username={m.username} color={m.color} size={24} />
                      <Text style={{ fontSize: 13 }}>{m.username}</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={creating}>Abbrechen</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              icon={creating ? <Spinner size="tiny" /> : <CheckmarkRegular />}
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              style={{ background: "#0078d4" }}
            >
              {creating ? "Wird erstellt…" : "Erstellen"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  file: FileItem | null
  onShare: (fileId: string, addUserIds: string[], removeUserIds: string[]) => Promise<void>
  getPermissions: (itemId: string) => Promise<SharePermission[]>
  onToast: (title: string, body: string, intent?: "success" | "warning" | "info" | "error") => void
  members: Member[]
  currentUserId: string
}

export function ShareDialog({
  open,
  onOpenChange,
  file,
  onShare,
  getPermissions,
  onToast,
  members,
  currentUserId,
}: ShareDialogProps) {
  const [permissions, setPermissions] = useState<SharePermission[]>([])
  const [addUserIds, setAddUserIds] = useState<string[]>([])
  const [removeUserIds, setRemoveUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareLink, setShareLink] = useState("")

  const otherMembers = members.filter((m) => m.id !== currentUserId)

  useEffect(() => {
    if (open && file) {
      setShareLink(buildShareLink(file.id))
    }
  }, [open, file])

  useEffect(() => {
    if (open && file) {
      setLoading(true)
      setAddUserIds([])
      setRemoveUserIds([])
      getPermissions(file.id)
        .then(setPermissions)
        .catch(() => setPermissions([]))
        .finally(() => setLoading(false))
    }
  }, [open, file, getPermissions])

  function toggleAddMember(userId: string) {
    setAddUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  function markForRemoval(userId: string) {
    setRemoveUserIds((prev) => [...prev, userId])
  }

  async function handleSave() {
    if (!file) return
    setSaving(true)
    try {
      await onShare(file.id, addUserIds, removeUserIds)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    onToast("Link kopiert", "Der Direktlink wurde in die Zwischenablage kopiert.", "success")
  }

  const linkHint = file?.type === "folder"
    ? "Führt direkt zu diesem Ordner."
    : "Führt zum Ordner mit dieser Datei."

  const activePermissions = permissions.filter(
    (p) => p.role !== "owner" && !removeUserIds.includes(p.id)
  )

  const availableToAdd = otherMembers.filter(
    (m) =>
      !activePermissions.some((p) => p.id === m.id) && !addUserIds.includes(m.id)
  )

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ maxWidth: 480 }}>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShareRegular style={{ color: "#0078d4" }} />
              {file?.name ?? "Datei"} teilen
            </div>
          </DialogTitle>
          <DialogContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Direktlink
                </Text>
                <Text style={{ fontSize: 12, color: "#605e5c", display: "block", marginBottom: 10 }}>
                  {linkHint} Nur für angemeldete Personen mit Zugriff.
                </Text>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    readOnly
                    value={shareLink}
                    style={{ flex: 1, fontSize: 12 }}
                    appearance="filled-lighter"
                  />
                  <Button icon={<CopyRegular />} onClick={copyLink} appearance="secondary">
                    Kopieren
                  </Button>
                </div>
              </div>

              {availableToAdd.length > 0 && (
                <div>
                  <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
                    Person hinzufügen
                  </Text>
                  {availableToAdd.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Checkbox checked={addUserIds.includes(m.id)} onChange={() => toggleAddMember(m.id)} />
                      <ColoredAvatar username={m.username} color={m.color} size={28} />
                      <Text style={{ fontSize: 13, flex: 1 }}>{m.username}</Text>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 12 }}>
                  Zugriff verwalten
                </Text>
                {loading ? (
                  <Spinner size="small" label="Berechtigungen werden geladen…" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {permissions
                      .filter((p) => p.role === "owner")
                      .map((p) => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <ColoredAvatar username={p.username} color={colorFromString(p.username)} size={28} />
                          <Text style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.username} (Eigentümer)</Text>
                        </div>
                      ))}

                    {activePermissions.map((p) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ColoredAvatar username={p.username} color={colorFromString(p.username)} size={28} />
                        <Text style={{ fontSize: 13, flex: 1 }}>{p.username}</Text>
                        <Text style={{ fontSize: 11, color: "#107c10", fontWeight: 600 }}>Zugriff</Text>
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<DismissRegular />}
                          onClick={() => markForRemoval(p.id)}
                        />
                      </div>
                    ))}

                    {addUserIds.map((uid) => {
                      const m = members.find((mem) => mem.id === uid)
                      if (!m) return null
                      return (
                        <div key={uid} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}>
                          <ColoredAvatar username={m.username} color={m.color} size={28} />
                          <div style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13 }}>{m.username}</Text>
                            <Text style={{ fontSize: 11, color: "#0078d4" }}>Wird hinzugefügt</Text>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" disabled={saving}>Abbrechen</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              icon={saving ? <Spinner size="tiny" /> : <CheckmarkRegular />}
              onClick={handleSave}
              disabled={saving || (addUserIds.length === 0 && removeUserIds.length === 0)}
              style={{ background: "#0078d4" }}
            >
              {saving ? "Wird gespeichert…" : "Speichern"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

interface DeleteConfirmDialogProps {
  open: boolean
  file: FileItem | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteConfirmDialog({ open, file, onOpenChange, onConfirm }: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setError(null)
      setDeleting(false)
    }
  }, [open])

  async function handleConfirm() {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen")
    } finally {
      setDeleting(false)
    }
  }

  const isFolder = file?.type === "folder"

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ maxWidth: 440 }}>
        <DialogBody>
          <DialogTitle>{isFolder ? "Ordner löschen" : "Datei löschen"}</DialogTitle>
          <DialogContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Text style={{ fontSize: 13, color: "#323130" }}>
                Möchtest du <strong>{file?.name}</strong> wirklich löschen?
              </Text>
              <Text style={{ fontSize: 13, color: "#605e5c" }}>
                {isFolder
                  ? "Der Ordner und alle enthaltenen Dateien werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
                  : "Die Datei wird gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."}
              </Text>
              {error && <Text style={{ fontSize: 13, color: "#d83b01" }}>{error}</Text>}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" icon={<DismissRegular />} onClick={() => onOpenChange(false)} disabled={deleting}>
              Abbrechen
            </Button>
            <Button
              appearance="primary"
              icon={deleting ? <Spinner size="tiny" /> : <DeleteRegular />}
              onClick={handleConfirm}
              disabled={deleting}
              style={{ background: "#d83b01" }}
            >
              {deleting ? "Wird gelöscht…" : "Löschen"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
