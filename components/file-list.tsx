"use client"

import { useState } from "react"
import {
  StarRegular,
  StarFilled,
  ShareRegular,
  DeleteRegular,
  OpenRegular,
  ArrowDownloadRegular,
  CopyRegular,
  MoreHorizontalRegular,
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

interface FileListProps {
  files: FileItem[]
  onFolderOpen: (file: FileItem) => void
  onToggleFavorite: (id: string) => void
  onDelete: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onCopyLink: (file: FileItem) => void
  onPreview: (file: FileItem) => void
}

function FileRow({
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
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={() => {
        if (file.type === "folder") onFolderOpen(file)
        else if (isPreviewable(file)) onPreview(file)
      }}
      style={{
        background: hovered ? "#f3f2f1" : "transparent",
        cursor: file.type === "folder" || isPreviewable(file) ? "pointer" : "default",
        transition: "background 0.1s",
      }}
    >
      {/* Icon + name */}
      <td style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <FileIcon type={file.type} size={20} color={file.folderColor} />
        <Text
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#323130",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 280,
          }}
          title={file.name}
        >
          {file.name}
        </Text>
      </td>

      {/* Modified by */}
      <td className="col-hide-mobile" style={{ padding: "8px 12px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {modifier && (
            <>
              <ColoredAvatar username={modifier.username} color={modifier.color} size={20} />
              <Text style={{ fontSize: 12, color: "#605e5c" }}>
                {modifier.username}
              </Text>
            </>
          )}
        </div>
      </td>

      {/* Modified date */}
      <td className="col-hide-mobile" style={{ padding: "8px 12px", verticalAlign: "middle" }}>
        <Text style={{ fontSize: 12, color: "#605e5c" }}>{formatDate(file.modifiedAt)}</Text>
      </td>

      {/* Size */}
      <td className="col-hide-mobile" style={{ padding: "8px 12px", verticalAlign: "middle" }}>
        <Text style={{ fontSize: 12, color: "#605e5c" }}>
          {file.type === "folder" ? "—" : formatFileSize(file.size)}
        </Text>
      </td>

      {/* Shared */}
      <td className="col-hide-mobile" style={{ padding: "8px 12px", verticalAlign: "middle" }}>
        {file.sharedWith.length > 0 ? (
          <Badge appearance="tint" color="brand" size="small" icon={<ShareRegular style={{ width: 10 }} />}>
            {file.sharedWith.length}
          </Badge>
        ) : (
          <Text style={{ fontSize: 12, color: "#c8c6c4" }}>Privat</Text>
        )}
      </td>

      {/* Actions */}
      <td className="file-row-actions" style={{ padding: "8px 12px", verticalAlign: "middle" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
          }}
        >
          <Tooltip content={file.favorite ? "Aus Favoriten" : "Favorit"} relationship="label">
            <button
              onClick={() => onToggleFavorite(file.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: file.favorite ? "#ffd700" : "#8a8886",
                padding: 4,
                display: "flex",
                borderRadius: 4,
              }}
            >
              {file.favorite ? <StarFilled style={{ width: 16 }} /> : <StarRegular style={{ width: 16 }} />}
            </button>
          </Tooltip>

          <Menu>
            <MenuTrigger>
              <MenuButton
                appearance="transparent"
                icon={<MoreHorizontalRegular />}
                size="small"
                style={{ minWidth: "auto", padding: "4px 6px" }}
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
      </td>
    </tr>
  )
}

export function FileList({ files, onFolderOpen, onToggleFavorite, onDelete, onShare, onCopyLink, onPreview }: FileListProps) {
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
          padding: 40,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 600, color: "#605e5c" }}>Keine Dateien gefunden</Text>
        <Text style={{ fontSize: 13, color: "#8a8886" }}>
          Laden Sie Dateien hoch oder erstellen Sie einen neuen Ordner.
        </Text>
      </div>
    )
  }

  return (
    <div style={{ padding: "16px 0", overflowX: "auto" }}>
      <table className="file-list-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col />
          <col className="col-hide-mobile" style={{ width: "15%" }} />
          <col className="col-hide-mobile" style={{ width: "13%" }} />
          <col className="col-hide-mobile" style={{ width: "10%" }} />
          <col className="col-hide-mobile" style={{ width: "12%" }} />
          <col style={{ width: 72 }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: "1px solid #e1dfdd" }}>
            {["Name", "Geändert von", "Datum", "Größe", "Freigabe", ""].map((h, index) => (
              <th
                key={h || "actions"}
                className={index > 0 && index < 5 ? "col-hide-mobile" : undefined}
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#605e5c",
                  background: "#faf9f8",
                  letterSpacing: "0.2px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileRow
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
        </tbody>
      </table>
    </div>
  )
}
