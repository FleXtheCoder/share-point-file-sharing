export function buildShareLink(fileId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/?file=${fileId}`
}
