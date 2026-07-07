import type { FileItem } from "./types"

export type PreviewKind = "stl" | "image" | "pdf" | "text" | "code"

export const MAX_TEXT_PREVIEW_BYTES = 512 * 1024

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif"])

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "jsonc",
  "xml",
  "svg",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "c",
  "h",
  "cpp",
  "cc",
  "cxx",
  "hpp",
  "cs",
  "php",
  "swift",
  "kt",
  "kts",
  "scala",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "sql",
  "vue",
  "svelte",
  "lua",
  "r",
  "dart",
  "ex",
  "exs",
  "erl",
  "hs",
  "clj",
  "graphql",
  "gql",
  "dockerfile",
  "makefile",
  "cmake",
  "gradle",
  "properties",
  "env",
  "gitignore",
  "gitattributes",
  "editorconfig",
  "prisma",
  "proto",
  "wasm",
  "zig",
  "v",
  "tf",
  "tfvars",
  "mdx",
])

const EXT_TO_HLJS_LANGUAGE: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  html: "xml",
  htm: "xml",
  svg: "xml",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  ps1: "powershell",
  cs: "csharp",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  h: "cpp",
  kt: "kotlin",
  kts: "kotlin",
  ex: "elixir",
  exs: "elixir",
  md: "markdown",
  mdx: "markdown",
  sql: "sql",
  php: "php",
  java: "java",
  go: "go",
  swift: "swift",
  scala: "scala",
  lua: "lua",
  r: "r",
  dart: "dart",
  erl: "erlang",
  hs: "haskell",
  clj: "clojure",
  graphql: "graphql",
  gql: "graphql",
  dockerfile: "dockerfile",
  makefile: "makefile",
  cmake: "cmake",
  gradle: "gradle",
  proto: "protobuf",
  tf: "hcl",
  tfvars: "hcl",
  prisma: "prisma",
  vue: "xml",
  svelte: "xml",
  json: "json",
  jsonc: "json",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  ini: "ini",
  toml: "ini",
  properties: "properties",
}

export function getFileExtension(name: string): string {
  const lower = name.toLowerCase()
  if (lower === "dockerfile") return "dockerfile"
  if (lower === "makefile") return "makefile"
  const parts = lower.split(".")
  if (parts.length < 2) return ""
  return parts[parts.length - 1] ?? ""
}

export function getPreviewKind(file: FileItem): PreviewKind | null {
  if (file.type === "folder") return null

  const ext = getFileExtension(file.name)

  if (file.type === "stl" || ext === "stl") return "stl"
  if (file.type === "pdf" || ext === "pdf") return "pdf"
  if (file.type === "image" || IMAGE_EXTENSIONS.has(ext)) return "image"
  if (file.type === "code" || CODE_EXTENSIONS.has(ext)) return "code"
  if (file.type === "text" || ext === "txt" || ext === "md" || ext === "log") return "text"

  return null
}

export function isPreviewable(file: FileItem): boolean {
  return getPreviewKind(file) !== null
}

export function isStlFile(file: FileItem): boolean {
  return getPreviewKind(file) === "stl"
}

export function getPreviewUrl(fileId: string): string {
  return `/api/files/${fileId}/preview`
}

export function getHighlightLanguage(fileName: string): string | null {
  const ext = getFileExtension(fileName)
  return EXT_TO_HLJS_LANGUAGE[ext] ?? ext ?? null
}

export function getPreviewLanguageLabel(fileName: string, kind: PreviewKind): string {
  if (kind === "text") return "Plain Text"
  if (kind === "code") {
    const lang = getHighlightLanguage(fileName)
    return lang ? lang.toUpperCase() : "CODE"
  }
  if (kind === "pdf") return "PDF"
  if (kind === "image") return getFileExtension(fileName).toUpperCase() || "IMAGE"
  if (kind === "stl") return "STL"
  return "DATEI"
}
