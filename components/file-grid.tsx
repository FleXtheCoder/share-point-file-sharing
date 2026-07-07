"use client"

import { useState } from "react"
import {
  CopyRegular,
  MoreHorizontalRegular,
  StarRegular,
  StarFilled,
  ShareRegular,
  DeleteRegular,
  OpenRegular,
  ArrowDownloadRegular,
  EyeRegular,
} from "@fluentui/react-icons"
import { ColoredAvatar } from "@/components/colored-avatar"
import {
  Badge,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  Tooltip,
} from "@fluentui/react-components"
import type { FileItem } from "@/lib/types"
import { FileIcon } from "@/components/file-icon"
import { formatDate, formatFileSize, getMemberDisplay } from "@/lib/data"
import { isPreviewable } from "@/lib/preview"

interface FileGridProps {
  files: FileItem[]
  onFolderOpen: (file: FileItem) => void
  onToggleFavorite: (id: string) => void
  onDelete: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onCopyLink: (file: FileItem) => void
  onPreview: (file: FileItem) => void
}

function FileCard({
  file,
  onFolderOpen,
  onToggleFavorite,
  onDelete,
  onShare,
  onCopyLink,
  onPreview,
}: {
  file: FileItem
  onFolderOpen: (f: FileItem) => void
  onToggleFavorite: (id: string) => void
  onDelete: (file: FileItem) => void
  onShare: (f: FileItem) => void
  onCopyLink: (f: FileItem) => void
  onPreview: (f: FileItem) => void
}) {
  const [hovered, setHovered] = useState(false)
  const modifier = getMemberDisplay(file, new Map())

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={() => {
        if (file.type === "folder") onFolderOpen(file)
        else if (isPreviewable(file)) onPreview(file)
      }}
      style={{
        background: hovered ? "#f3f2f1" : "#fff",
        border: `1px solid ${hovered ? "#c8c6c4" : "#e1dfdd"}`,
        borderRadius: 6,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        cursor: file.type === "folder" || isPreviewable(file) ? "pointer" : "default",
        transition: "all 0.15s",
        position: "relative",
        minWidth: 0,
      }}
    >
      {/* Top row: icon + favorite + menu */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <FileIcon type={file.type} size={36} color={file.folderColor} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Favorite button */}
          <Tooltip
            content={file.favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            relationship="label"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(file.id)
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: file.favorite ? "#ffd700" : "#c8c6c4",
                padding: 2,
                display: "flex",
                opacity: hovered || file.favorite ? 1 : 0,
                transition: "opacity 0.15s",
              }}
            >
              {file.favorite ? <StarFilled style={{ width: 16 }} /> : <StarRegular style={{ width: 16 }} />}
            </button>
          </Tooltip>

          {/* Context menu */}
          <Menu>
            <MenuTrigger>
              <MenuButton
                appearance="transparent"
                icon={<MoreHorizontalRegular />}
                size="small"
                style={{
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 0.15s",
                  minWidth: "auto",
                  padding: "2px 4px",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {file.type === "folder" && (
                  <MenuItem icon={<OpenRegular />} onClick={() => onFolderOpen(file)}>
                    Öffnen
                  </MenuItem>
                )}
                {isPreviewable(file) && (
                  <MenuItem icon={<EyeRegular />} onClick={() => onPreview(file)}>
                    Vorschau
                  </MenuItem>
                )}
                {file.type !== "folder" && (
                  <MenuItem
                    icon={<ArrowDownloadRegular />}
                    onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
                  >
                    Herunterladen
                  </MenuItem>
                )}
                <MenuItem icon={<ShareRegular />} onClick={() => onShare(file)}>
                  Teilen
                </MenuItem>
                <MenuItem icon={<CopyRegular />} onClick={() => onCopyLink(file)}>
                  Link kopieren
                </MenuItem>
                <MenuItem
                  icon={file.favorite ? <StarFilled /> : <StarRegular />}
                  onClick={() => onToggleFavorite(file.id)}
                >
                  {file.favorite ? "Aus Favoriten entfernen" : "Favorit"}
                </MenuItem>
                <MenuItem
                  icon={<DeleteRegular />}
                  onClick={() => onDelete(file)}
                  style={{ color: "#d83b01" }}
                >
                  Löschen
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      {/* File name */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#323130",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
        }}
        title={file.name}
      >
        {file.name}
      </Text>

      {/* Meta: size + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 11, color: "#8a8886" }}>
          {file.type === "folder" ? "Ordner" : formatFileSize(file.size)}
        </Text>
        <Text style={{ fontSize: 11, color: "#8a8886" }}>{formatDate(file.modifiedAt)}</Text>
      </div>

      {/* Shared badge + modifier avatar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: -4 }}>
          {file.sharedWith.length > 0 && (
            <Tooltip
              content={`Geteilt mit ${file.sharedWith.length} Person${file.sharedWith.length !== 1 ? "en" : ""}`}
              relationship="label"
            >
              <Badge
                appearance="tint"
                color="brand"
                size="small"
                icon={<ShareRegular style={{ width: 10 }} />}
              >
                {file.sharedWith.length}
              </Badge>
            </Tooltip>
          )}
        </div>
        {modifier && (
          <Tooltip content={`Geändert von ${modifier.username}`} relationship="label">
            <ColoredAvatar username={modifier.username} color={modifier.color} size={20} />
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export function FileGrid({ files, onFolderOpen, onToggleFavorite, onDelete, onShare, onCopyLink, onPreview }: FileGridProps) {
  if (files.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#8a8886",
        }}
      >
        <FolderEmptyIcon />
        <Text style={{ fontSize: 16, fontWeight: 600, color: "#605e5c" }}>Keine Dateien gefunden</Text>
        <Text style={{ fontSize: 13, color: "#8a8886" }}>
          Laden Sie Dateien hoch oder erstellen Sie einen neuen Ordner.
        </Text>
      </div>
    )
  }

  return (
    <div
      className="file-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
        padding: "20px 24px",
        alignContent: "start",
      }}
    >
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          onFolderOpen={onFolderOpen}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
          onShare={onShare}
          onCopyLink={onCopyLink}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}

function FolderEmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="4" y="20" width="56" height="36" rx="4" fill="#f3f2f1" stroke="#e1dfdd" strokeWidth="2" />
      <path d="M4 24c0-2.2 1.8-4 4-4h16l4 4H56c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V24z" fill="#f9f8f7" stroke="#e1dfdd" strokeWidth="2" />
    </svg>
  )
}
