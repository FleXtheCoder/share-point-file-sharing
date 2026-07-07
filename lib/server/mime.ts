export function getMimeTypeFromFileName(name: string, fileType: string): string {
  const lower = name.toLowerCase()
  const ext = lower.includes(".") ? lower.split(".").pop() ?? "" : lower

  const byExt: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    txt: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    stl: "model/stl",
    json: "application/json; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    jsx: "text/javascript; charset=utf-8",
    ts: "text/typescript; charset=utf-8",
    tsx: "text/typescript; charset=utf-8",
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    yaml: "text/yaml; charset=utf-8",
    yml: "text/yaml; charset=utf-8",
  }

  if (byExt[ext]) return byExt[ext]

  const byType: Record<string, string> = {
    pdf: "application/pdf",
    image: "image/jpeg",
    text: "text/plain; charset=utf-8",
    code: "text/plain; charset=utf-8",
    stl: "model/stl",
    video: "video/mp4",
    word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }

  return byType[fileType] ?? "application/octet-stream"
}
