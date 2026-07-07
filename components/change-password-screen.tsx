"use client"

import { useState } from "react"
import { KeyRegular } from "@fluentui/react-icons"
import { Button, Input, Spinner, Text } from "@fluentui/react-components"

interface ChangePasswordScreenProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>
  error: string | null
}

export function ChangePasswordScreen({ onChangePassword, error }: ChangePasswordScreenProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit() {
    setLocalError(null)
    if (newPassword.length < 8) {
      setLocalError("Passwort muss mindestens 8 Zeichen lang sein")
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwörter stimmen nicht überein")
      return
    }

    setLoading(true)
    try {
      await onChangePassword(currentPassword, newPassword)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf9f8",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: "40px 48px",
          width: "100%",
          maxWidth: 420,
          border: "1px solid #e1dfdd",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <KeyRegular style={{ width: 40, height: 40, color: "#0078d4", marginBottom: 12 }} />
          <Text as="h1" style={{ fontSize: 22, fontWeight: 700, display: "block" }}>
            Passwort ändern
          </Text>
          <Text style={{ fontSize: 14, color: "#605e5c", display: "block", marginTop: 6 }}>
            Beim ersten Login musst du ein neues Passwort festlegen.
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            placeholder="Aktuelles Passwort"
            type="password"
            value={currentPassword}
            onChange={(_, d) => setCurrentPassword(d.value)}
          />
          <Input
            placeholder="Neues Passwort (min. 8 Zeichen)"
            type="password"
            value={newPassword}
            onChange={(_, d) => setNewPassword(d.value)}
          />
          <Input
            placeholder="Neues Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={(_, d) => setConfirmPassword(d.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
          />

          {(error || localError) && (
            <Text style={{ fontSize: 13, color: "#d83b01" }}>{error || localError}</Text>
          )}

          <Button
            appearance="primary"
            onClick={handleSubmit}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            style={{ background: "#0078d4", marginTop: 4 }}
          >
            {loading ? <Spinner size="tiny" /> : "Passwort speichern"}
          </Button>
        </div>
      </div>
    </div>
  )
}
