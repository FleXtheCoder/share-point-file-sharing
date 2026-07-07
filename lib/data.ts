import type { FileItem, FileType } from "./types"

const AVATAR_COLORS = ["#0078d4", "#107c10", "#d83b01", "#8764b8", "#038387", "#ca5010"]

export const FOLDER_COLORS = [...AVATAR_COLORS] as const
export const DEFAULT_FOLDER_COLOR = FOLDER_COLORS[0]

export function isFolderColor(color: string): boolean {
  return FOLDER_COLORS.includes(color as (typeof FOLDER_COLORS)[number])
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "--"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function colorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function getMemberDisplay(
  file: FileItem,
  members: Map<string, { username: string; color: string }>
): { username: string; color: string } | null {
  if (file.modifiedByName) {
    return { username: file.modifiedByName, color: colorFromString(file.modifiedBy) }
  }
  return members.get(file.modifiedBy) ?? null
}

export function getFileTypeFromName(name: string): FileType {
  const ext = name.split(".").pop()?.toLowerCase()
  const map: Record<string, FileType> = {
    docx: "word",
    doc: "word",
    xlsx: "excel",
    xls: "excel",
    csv: "excel",
    pptx: "powerpoint",
    ppt: "powerpoint",
    pdf: "pdf",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    svg: "image",
    mp4: "video",
    mov: "video",
    avi: "video",
    mkv: "video",
    mp3: "audio",
    wav: "audio",
    flac: "audio",
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    tar: "archive",
    gz: "archive",
    js: "code",
    ts: "code",
    jsx: "code",
    tsx: "code",
    mjs: "code",
    cjs: "code",
    html: "code",
    htm: "code",
    css: "code",
    scss: "code",
    sass: "code",
    less: "code",
    json: "code",
    jsonc: "code",
    xml: "code",
    yaml: "code",
    yml: "code",
    toml: "code",
    ini: "code",
    py: "code",
    rb: "code",
    go: "code",
    rs: "code",
    java: "code",
    c: "code",
    h: "code",
    cpp: "code",
    cc: "code",
    cs: "code",
    php: "code",
    swift: "code",
    kt: "code",
    scala: "code",
    sh: "code",
    bash: "code",
    zsh: "code",
    sql: "code",
    vue: "code",
    svelte: "code",
    lua: "code",
    md: "text",
    log: "text",
    txt: "text",
    stl: "stl",
  }
  if (name.toLowerCase() === "dockerfile" || name.toLowerCase() === "makefile") return "code"
  return map[ext ?? ""] ?? "unknown"
}

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  folder: "Ordner",
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
  pdf: "PDF",
  image: "Bilder",
  video: "Videos",
  audio: "Audio",
  archive: "Archive",
  code: "Code",
  text: "Text",
  stl: "STL",
  unknown: "Sonstige",
}

export const FILE_TYPE_COLORS: Record<FileType, string> = {
  folder: "#0078d4",
  word: "#2b579a",
  excel: "#217346",
  powerpoint: "#d24726",
  pdf: "#d83b01",
  image: "#038387",
  video: "#8764b8",
  audio: "#107c10",
  archive: "#8a8886",
  code: "#002050",
  text: "#605e5c",
  stl: "#5c2d91",
  unknown: "#a19f9d",
}
