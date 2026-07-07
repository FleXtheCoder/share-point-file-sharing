"use client"

import {
  ArrowUploadRegular,
  FolderAddRegular,
  GridRegular,
  ListRegular,
  SearchRegular,
  ArrowSortRegular,
  LineHorizontal3Regular,
} from "@fluentui/react-icons"
import {
  Button,
  Input,
  Select,
  Tooltip,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
} from "@fluentui/react-components"
import type { ViewMode } from "@/lib/types"

interface ToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onUploadClick: () => void
  onNewFolderClick: () => void
  sortBy: string
  onSortChange: (sort: string) => void
  breadcrumbs: string[]
  onBreadcrumbClick: (index: number) => void
  sectionLabel: string
  onMenuClick?: () => void
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onUploadClick,
  onNewFolderClick,
  sortBy,
  onSortChange,
  breadcrumbs,
  onBreadcrumbClick,
  sectionLabel,
  onMenuClick,
}: ToolbarProps) {
  return (
    <div
      className="drive-toolbar"
      style={{
        background: "#fff",
        borderBottom: "1px solid #e1dfdd",
        padding: "0 24px",
      }}
    >
      {/* Top bar: actions + search */}
      <div
        className="toolbar-row-main"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 0",
          borderBottom: "1px solid #f3f2f1",
        }}
      >
        <Button
          className="mobile-only"
          appearance="subtle"
          icon={<LineHorizontal3Regular />}
          onClick={onMenuClick}
          aria-label="Menü öffnen"
          style={{ minWidth: 36, padding: 0 }}
        />

        <div className="toolbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            appearance="primary"
            icon={<ArrowUploadRegular />}
            onClick={onUploadClick}
            style={{ background: "#0078d4", border: "none" }}
          >
            <span className="toolbar-btn-label">Hochladen</span>
          </Button>
          <Button
            appearance="subtle"
            icon={<FolderAddRegular />}
            onClick={onNewFolderClick}
          >
            <span className="toolbar-btn-label">Neuer Ordner</span>
          </Button>
        </div>

        <div style={{ flex: 1 }} className="desktop-only" />

        <div className="toolbar-search-wrap" style={{ flex: 1 }}>
          <Input
            contentBefore={<SearchRegular style={{ color: "#605e5c" }} />}
            placeholder="Dateien suchen..."
            value={searchQuery}
            onChange={(_, d) => onSearchChange(d.value)}
            style={{ width: 240 }}
            appearance="filled-lighter"
          />
        </div>

        <div className="toolbar-sort-wrap" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ArrowSortRegular style={{ color: "#605e5c", width: 16 }} />
          <Select
            value={sortBy}
            onChange={(_, d) => onSortChange(d.value)}
            appearance="filled-lighter"
            style={{ minWidth: 140 }}
          >
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="date-desc">Zuletzt geändert</option>
            <option value="date-asc">Älteste zuerst</option>
            <option value="size-desc">Größte zuerst</option>
            <option value="type">Dateityp</option>
          </Select>
        </div>

        {/* View mode */}
        <div
          className="toolbar-view-toggle"
          style={{
            display: "flex",
            border: "1px solid #e1dfdd",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <Tooltip content="Kachelansicht" relationship="label">
            <button
              onClick={() => onViewModeChange("grid")}
              style={{
                padding: "6px 10px",
                border: "none",
                background: viewMode === "grid" ? "#deecf9" : "#fff",
                color: viewMode === "grid" ? "#0078d4" : "#605e5c",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <GridRegular style={{ width: 18, height: 18 }} />
            </button>
          </Tooltip>
          <Tooltip content="Listenansicht" relationship="label">
            <button
              onClick={() => onViewModeChange("list")}
              style={{
                padding: "6px 10px",
                border: "none",
                borderLeft: "1px solid #e1dfdd",
                background: viewMode === "list" ? "#deecf9" : "#fff",
                color: viewMode === "list" ? "#0078d4" : "#605e5c",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ListRegular style={{ width: 18, height: 18 }} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Breadcrumb bar */}
      <div className="toolbar-breadcrumb-row" style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbButton
              onClick={() => onBreadcrumbClick(-1)}
              style={{ fontWeight: 600, color: "#0078d4" }}
            >
              {sectionLabel}
            </BreadcrumbButton>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center" }}>
              <BreadcrumbDivider />
              <BreadcrumbItem>
                <BreadcrumbButton
                  onClick={() => onBreadcrumbClick(i)}
                  current={i === breadcrumbs.length - 1}
                  style={{
                    color: i === breadcrumbs.length - 1 ? "#323130" : "#0078d4",
                    fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                  }}
                >
                  {crumb}
                </BreadcrumbButton>
              </BreadcrumbItem>
            </span>
          ))}
        </Breadcrumb>
        {breadcrumbs.length === 0 && (
          <Text style={{ fontSize: 13, color: "#8a8886", marginLeft: 4 }}>
            — Alle Dateien und Ordner
          </Text>
        )}
      </div>
    </div>
  )
}
