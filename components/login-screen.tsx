"use client"

import { useState } from "react"
import { PeopleRegular } from "@fluentui/react-icons"
import { Button, Input, Spinner, Text } from "@fluentui/react-components"

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>
  error: string | null
}

export function LoginScreen({ onLogin, error }: LoginScreenProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      await onLogin(username, password)
    } catch {
      // Fehler wird über authError in useDrive angezeigt
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
        background: "linear-gradient(135deg, #0078d4 0%, #005a9e 100%)",
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
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <PeopleRegular style={{ width: 48, height: 48, color: "#0078d4", marginBottom: 12 }} />
          <Text as="h1" style={{ fontSize: 24, fontWeight: 700, display: "block" }}>
            Gruppen-Drive
          </Text>
          <Text style={{ fontSize: 14, color: "#605e5c", display: "block", marginTop: 6 }}>
            Melde dich mit deinem Konto an
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            placeholder="Benutzername"
            value={username}
            onChange={(_, d) => setUsername(d.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
          />
          <Input
            placeholder="Passwort"
            type="password"
            value={password}
            onChange={(_, d) => setPassword(d.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
          />

          {error && <Text style={{ fontSize: 13, color: "#d83b01" }}>{error}</Text>}

          <Button
            appearance="primary"
            onClick={handleSubmit}
            disabled={loading || !username || !password}
            style={{ background: "#0078d4", marginTop: 4 }}
          >
            {loading ? <Spinner size="tiny" /> : "Anmelden"}
          </Button>
        </div>
      </div>
    </div>
  )
}
