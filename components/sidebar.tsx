"use client"

import {
  FolderRegular,
  ShareRegular,
  StarRegular,
  ClockRegular,
  PeopleRegular,
  StorageRegular,
  SignOutRegular,
  ShieldRegular,
} from "@fluentui/react-icons"
import { Button, Text, Tooltip } from "@fluentui/react-components"
import { ColoredAvatar } from "@/components/colored-avatar"
import type { ActiveSection, CurrentUser, Member } from "@/lib/types"
import { formatFileSize } from "@/lib/data"

interface SidebarProps {
  activeSection: ActiveSection
  onSectionChange: (section: ActiveSection) => void
  currentUser: CurrentUser | null
  members: Member[]
  storage: { used: number; total: number } | null
  onLogout: () => void
  className?: string
  onNavigate?: () => void
}

const NAV_ITEMS: { key: ActiveSection; label: string; icon: React.ReactNode }[] = [
  { key: "my-files", label: "Meine Dateien", icon: <FolderRegular /> },
  { key: "shared", label: "Geteilt", icon: <ShareRegular /> },
  { key: "favorites", label: "Favoriten", icon: <StarRegular /> },
  { key: "recent", label: "Zuletzt geöffnet", icon: <ClockRegular /> },
]

function UserAvatar({ username, color, size }: { username: string; color: string; size: number }) {
  return <ColoredAvatar username={username} color={color} size={size} />
}

export function Sidebar({
  activeSection,
  onSectionChange,
  currentUser,
  members,
  storage,
  onLogout,
  className,
  onNavigate,
}: SidebarProps) {
  const used = storage?.used ?? 0
  const total = storage?.total ?? 0
  const usedPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const isAdmin = currentUser?.role === "admin"

  const navItems = isAdmin
    ? [...NAV_ITEMS, { key: "admin" as const, label: "Admin", icon: <ShieldRegular /> }]
    : NAV_ITEMS

  return (
    <aside
      className={className}
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        background: "#f3f2f1",
        borderRight: "1px solid #e1dfdd",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid #e1dfdd",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#0078d4",
        }}
      >
        <PeopleRegular style={{ color: "#fff", width: 22, height: 22 }} />
        <Text style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
          Gruppen-Drive
        </Text>
      </div>

      {currentUser && (
        <div
          style={{
            padding: "14px 16px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid #e1dfdd",
          }}
        >
          <UserAvatar username={currentUser.username} color={currentUser.color} size={34} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text
              style={{
                fontWeight: 600,
                fontSize: 13,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentUser.username}
            </Text>
          </div>
          <Button
            appearance="subtle"
            icon={<SignOutRegular />}
            size="small"
            onClick={onLogout}
            title="Abmelden"
          />
        </div>
      )}

      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.key
          return (
            <button
              key={item.key}
              onClick={() => {
                onSectionChange(item.key)
                onNavigate?.()
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                border: "none",
                background: isActive ? "#deecf9" : "transparent",
                borderLeft: isActive ? "3px solid #0078d4" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                color: isActive ? "#0078d4" : "#323130",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#edebe9"
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
              }}
            >
              <span style={{ color: isActive ? "#0078d4" : "#605e5c", display: "flex" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}

        <div style={{ padding: "16px 16px 8px", marginTop: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#8a8886",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Mitglieder ({members.length})
          </Text>
        </div>
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {members.map((member) => (
            <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <Tooltip
                content={`${member.username} — ${member.role === "admin" ? "Admin" : "Mitglied"}`}
                relationship="label"
              >
                <UserAvatar username={member.username} color={member.color} size={28} />
              </Tooltip>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: member.id === currentUser?.id ? 600 : 400,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {member.id === currentUser?.id ? "Du" : member.username}
              </Text>
              {member.role === "admin" && (
                <Text style={{ fontSize: 10, color: "#0078d4", whiteSpace: "nowrap" }}>Admin</Text>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #e1dfdd", background: "#faf9f8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <StorageRegular style={{ width: 16, height: 16, color: "#605e5c" }} />
          <Text style={{ fontSize: 12, color: "#605e5c" }}>Speicher</Text>
          <Text style={{ fontSize: 12, color: "#323130", marginLeft: "auto", fontWeight: 600 }}>
            {formatFileSize(used)}
            {total > 0 && ` / ${formatFileSize(total)}`}
          </Text>
        </div>
        {total > 0 && (
          <div style={{ height: 4, background: "#e1dfdd", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${usedPercent}%`,
                background: usedPercent > 80 ? "#d83b01" : "#0078d4",
                borderRadius: 2,
              }}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
