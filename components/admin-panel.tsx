"use client"

import { useState, useCallback, useEffect } from "react"
import {
  PersonAddRegular,
  DeleteRegular,
  KeyResetRegular,
  CopyRegular,
  CheckmarkRegular,
  DismissRegular,
} from "@fluentui/react-icons"
import { ColoredAvatar } from "@/components/colored-avatar"
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  Spinner,
  Text,
} from "@fluentui/react-components"
import type { AdminUser } from "@/lib/types"
import { AdminStats, type AdminStatsData } from "@/components/admin-stats"

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Anfrage fehlgeschlagen")
  return data as T
}

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [creating, setCreating] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, statsData] = await Promise.all([
        api<{ users: AdminUser[] }>("/api/admin/users"),
        api<{ stats: AdminStatsData }>("/api/admin/stats"),
      ])
      setUsers(usersData.users)
      setStats(statsData.stats)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreate() {
    if (!username.trim()) return
    setCreating(true)
    try {
      const data = await api<{ user: AdminUser; generatedPassword: string }>("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), role: "member" }),
      })
      setGeneratedPassword(data.generatedPassword)
      setUsername("")
      await loadData()
    } catch {
      // Fehler wird vom Dialog nicht separat angezeigt – einfach schließen verhindern
    } finally {
      setCreating(false)
    }
  }

  function openDeleteDialog(user: AdminUser) {
    setDeleteError(null)
    setDeleteTarget(user)
  }

  function closeDeleteDialog() {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" })
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Löschen fehlgeschlagen"
      if (message === "Benutzer nicht gefunden") {
        setDeleteTarget(null)
        await loadData()
        return
      }
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleResetPassword(userId: string) {
    const data = await api<{ generatedPassword: string }>(`/api/admin/users/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password" }),
    })
    setGeneratedPassword(data.generatedPassword)
    setCreateOpen(true)
    await loadData()
  }

  function copyPassword() {
    if (!generatedPassword) return
    navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeCreateDialog() {
    setCreateOpen(false)
    setGeneratedPassword(null)
    setCopied(false)
    setUsername("")
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 960 }}>
      {loading && !stats ? (
        <Spinner label="Lade Admin-Bereich…" />
      ) : (
        <>
          {stats && <AdminStats stats={stats} />}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Text as="h2" style={{ fontSize: 20, fontWeight: 700, display: "block" }}>
            Benutzerverwaltung
          </Text>
          <Text style={{ fontSize: 13, color: "#605e5c" }}>
            Benutzer anlegen und Zugangsdaten vergeben
          </Text>
        </div>
        <Button
          appearance="primary"
          icon={<PersonAddRegular />}
          onClick={() => setCreateOpen(true)}
          style={{ background: "#0078d4" }}
        >
          Benutzer erstellen
        </Button>
      </div>

      {loading ? (
        <Spinner label="Lade Benutzer…" />
      ) : (
        <div style={{ border: "1px solid #e1dfdd", borderRadius: 6, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 80px",
              padding: "10px 16px",
              background: "#f3f2f1",
              borderBottom: "1px solid #e1dfdd",
              fontSize: 12,
              fontWeight: 600,
              color: "#605e5c",
            }}
          >
            <span>Benutzername</span>
            <span>Status</span>
            <span />
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 80px",
                padding: "12px 16px",
                borderBottom: "1px solid #f3f2f1",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ColoredAvatar username={user.username} color={user.color} size={28} />
                <Text style={{ fontSize: 13, fontWeight: 500 }}>{user.username}</Text>
              </div>
              <Text style={{ fontSize: 11, color: user.mustChangePassword ? "#d83b01" : "#107c10" }}>
                {user.mustChangePassword ? "Passwort ändern" : "Aktiv"}
              </Text>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<KeyResetRegular />}
                  title="Passwort zurücksetzen"
                  onClick={() => handleResetPassword(user.id)}
                />
                {user.role !== "admin" && (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DeleteRegular />}
                    title="Löschen"
                    onClick={() => openDeleteDialog(user)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={(_, d) => !d.open && closeCreateDialog()}>
        <DialogSurface style={{ maxWidth: 440 }}>
          <DialogBody>
            <DialogTitle>
              {generatedPassword ? "Zugangsdaten" : "Neuer Benutzer"}
            </DialogTitle>
            <DialogContent>
              {generatedPassword ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Text style={{ fontSize: 13, color: "#605e5c" }}>
                    Gib dieses Passwort dem Benutzer weiter. Beim ersten Login muss es geändert werden.
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f3f2f1",
                      padding: "12px 16px",
                      borderRadius: 6,
                      fontFamily: "monospace",
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: 2,
                    }}
                  >
                    <span style={{ flex: 1 }}>{generatedPassword}</span>
                    <Button
                      appearance="subtle"
                      icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
                      onClick={copyPassword}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Input
                    placeholder="Benutzername"
                    value={username}
                    onChange={(_, d) => setUsername(d.value)}
                    onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
                  />
                </div>
              )}
            </DialogContent>
            <DialogActions>
              {generatedPassword ? (
                <Button appearance="primary" onClick={closeCreateDialog} style={{ background: "#0078d4" }}>
                  Fertig
                </Button>
              ) : (
                <>
                  <Button appearance="secondary" icon={<DismissRegular />} onClick={closeCreateDialog}>
                    Abbrechen
                  </Button>
                  <Button
                    appearance="primary"
                    icon={creating ? <Spinner size="tiny" /> : <PersonAddRegular />}
                    onClick={handleCreate}
                    disabled={creating || !username.trim()}
                    style={{ background: "#0078d4" }}
                  >
                    Erstellen
                  </Button>
                </>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(_, d) => !d.open && closeDeleteDialog()}>
        <DialogSurface style={{ maxWidth: 440 }}>
          <DialogBody>
            <DialogTitle>Benutzer löschen</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Text style={{ fontSize: 13, color: "#323130" }}>
                  Möchtest du <strong>{deleteTarget?.username}</strong> wirklich löschen?
                </Text>
                <Text style={{ fontSize: 13, color: "#605e5c" }}>
                  Alle Dateien dieses Benutzers werden ebenfalls gelöscht. Diese Aktion kann nicht
                  rückgängig gemacht werden.
                </Text>
                {deleteError && (
                  <Text style={{ fontSize: 13, color: "#d83b01" }}>{deleteError}</Text>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" icon={<DismissRegular />} onClick={closeDeleteDialog} disabled={deleting}>
                Abbrechen
              </Button>
              <Button
                appearance="primary"
                icon={deleting ? <Spinner size="tiny" /> : <DeleteRegular />}
                onClick={confirmDelete}
                disabled={deleting}
                style={{ background: "#d83b01" }}
              >
                Löschen
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
