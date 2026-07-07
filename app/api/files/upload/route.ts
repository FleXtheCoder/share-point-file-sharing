import { NextResponse } from "next/server"
import { fileTooLargeMessage, isFileTooLarge } from "@/lib/limits"
import { getSessionUser } from "@/lib/server/auth"
import { createFolder, saveUploadedFile } from "@/lib/server/files"
import { checkRateLimit } from "@/lib/server/rate-limit"

const UPLOAD_LIMIT = 30
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const action = formData.get("action") as string

    if (action === "upload") {
      const rateLimit = checkRateLimit(`upload:${user.id}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)
      if (!rateLimit.ok) {
        return NextResponse.json(
          { error: "Upload-Limit erreicht. Bitte später erneut versuchen." },
          { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
        )
      }
    }

    if (action === "folder") {
      const name = formData.get("name") as string
      const parentId = (formData.get("parentId") as string) || null
      const sharedWith = JSON.parse((formData.get("sharedWith") as string) ?? "[]") as string[]
      const folderColor = (formData.get("folderColor") as string) || undefined

      if (!name?.trim()) {
        return NextResponse.json({ error: "Ordnername erforderlich" }, { status: 400 })
      }

      const folder = await createFolder(user, name.trim(), parentId, sharedWith, folderColor)
      return NextResponse.json({ file: folder })
    }

    if (action === "upload") {
      const parentId = (formData.get("parentId") as string) || null
      const sharedWith = JSON.parse((formData.get("sharedWith") as string) ?? "[]") as string[]
      const uploadedFiles = formData.getAll("files") as File[]

      if (uploadedFiles.length === 0) {
        return NextResponse.json({ error: "Keine Dateien ausgewählt" }, { status: 400 })
      }

      for (const file of uploadedFiles) {
        if (isFileTooLarge(file.size)) {
          return NextResponse.json({ error: fileTooLargeMessage(file.name) }, { status: 413 })
        }
      }

      const results = []
      for (const file of uploadedFiles) {
        results.push(await saveUploadedFile(user, file, parentId, sharedWith))
      }
      return NextResponse.json({ files: results })
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Speichern" },
      { status: 500 }
    )
  }
}
