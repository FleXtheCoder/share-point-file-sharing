"use client"

import { Text } from "@fluentui/react-components"
import { formatFileSize, FILE_TYPE_COLORS, FILE_TYPE_LABELS } from "@/lib/data"
import type { FileType } from "@/lib/types"

export interface AdminStatsData {
  users: { total: number; admins: number; members: number }
  files: { total: number; folders: number; shares: number; favorites: number }
  storage: { used: number; total: number }
  byType: Array<{ type: FileType; count: number; size: number }>
}

interface PieSegment {
  label: string
  value: number
  color: string
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function DonutChart({
  segments,
  size = 180,
  innerRatio = 0.55,
  centerValue,
  centerLabel,
}: {
  segments: PieSegment[]
  size?: number
  innerRatio?: number
  centerValue?: string
  centerLabel?: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * innerRatio

  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 12, color: "#8a8886" }}>Keine Daten</Text>
      </div>
    )
  }

  let angle = 0
  const slices = segments.map((seg) => {
    const sliceAngle = (seg.value / total) * 360
    const start = angle
    const end = angle + sliceAngle
    angle = end
    const mid = start + sliceAngle / 2
    return { ...seg, start, end, mid, sliceAngle }
  })

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice) => {
          if (slice.sliceAngle >= 359.99) {
            return (
              <g key={slice.label}>
                <circle cx={cx} cy={cy} r={outerR} fill={slice.color} />
                <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
              </g>
            )
          }
          const outerPath = describeArc(cx, cy, outerR, slice.start, slice.end)
          const innerPath = describeArc(cx, cy, innerR, slice.end, slice.start)
          const d = `${outerPath} L ${polarToCartesian(cx, cy, innerR, slice.start).x} ${polarToCartesian(cx, cy, innerR, slice.start).y} ${innerPath} Z`
          return <path key={slice.label} d={d} fill={slice.color} stroke="#fff" strokeWidth={1.5} />
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
          {centerValue ?? total}
        </Text>
        {centerLabel && <Text style={{ fontSize: 11, color: "#605e5c" }}>{centerLabel}</Text>}
      </div>
    </div>
  )
}

function Legend({ segments }: { segments: PieSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
      {segments.map((seg) => {
        const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0
        return (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {seg.label}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 600, color: "#323130" }}>{seg.value}</Text>
            <Text style={{ fontSize: 11, color: "#8a8886", width: 32, textAlign: "right" }}>{pct}%</Text>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e1dfdd",
        borderRadius: 8,
        padding: "16px 18px",
        minWidth: 0,
      }}
    >
      <Text style={{ fontSize: 12, color: "#605e5c", display: "block", marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: 700, display: "block", lineHeight: 1.1 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 11, color: "#8a8886", display: "block", marginTop: 4 }}>{sub}</Text>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e1dfdd",
        borderRadius: 8,
        padding: "18px 20px",
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 16 }}>{title}</Text>
      {children}
    </div>
  )
}

function toSegments(
  byType: AdminStatsData["byType"],
  valueKey: "count" | "size"
): PieSegment[] {
  return byType
    .filter((t) => t[valueKey] > 0)
    .map((t) => ({
      label: FILE_TYPE_LABELS[t.type] ?? t.type,
      value: t[valueKey],
      color: FILE_TYPE_COLORS[t.type] ?? "#8a8886",
    }))
}

export function AdminStats({ stats }: { stats: AdminStatsData }) {
  const usedPct =
    stats.storage.total > 0
      ? Math.min(Math.round((stats.storage.used / stats.storage.total) * 100), 100)
      : 0

  const countSegments = toSegments(stats.byType, "count")
  const sizeSegments = toSegments(stats.byType, "size")
  const totalSize = sizeSegments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
      <div>
        <Text as="h2" style={{ fontSize: 20, fontWeight: 700, display: "block" }}>
          Übersicht
        </Text>
        <Text style={{ fontSize: 13, color: "#605e5c" }}>
          Statistiken und Speichernutzung der Gruppe
        </Text>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <StatCard label="Benutzer" value={String(stats.users.total)} sub={`${stats.users.members} Mitglieder`} />
        <StatCard label="Dateien" value={String(stats.files.total)} sub={`${stats.files.folders} Ordner`} />
        <StatCard label="Freigaben" value={String(stats.files.shares)} sub={`${stats.files.favorites} Favoriten`} />
        <StatCard
          label="Speicher"
          value={formatFileSize(stats.storage.used)}
          sub={`${usedPct}% von ${formatFileSize(stats.storage.total)}`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <ChartCard title="Dateien nach Typ">
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <DonutChart segments={countSegments} centerValue={String(countSegments.reduce((s, x) => s + x.value, 0))} centerLabel="Dateien" />
            <Legend segments={countSegments} />
          </div>
        </ChartCard>

        <ChartCard title="Speicher nach Typ">
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <DonutChart
              segments={sizeSegments}
              centerValue={formatFileSize(totalSize)}
              centerLabel="belegt"
            />
            <Legend
              segments={sizeSegments.map((s) => ({
                ...s,
                label: `${s.label} (${formatFileSize(s.value)})`,
              }))}
            />
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
