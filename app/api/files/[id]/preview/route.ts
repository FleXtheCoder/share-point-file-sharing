import { NextResponse } from "next/server"
import fs from "fs"
import { getSessionUser } from "@/lib/server/auth"
import { getFileForDownload } from "@/lib/server/files"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  try {
    const { id } = await params
    const file = await getFileForDownload(user, id)
    const buffer = fs.readFileSync(file.storagePath)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Vorschau fehlgeschlagen" },
      { status: 404 }
    )
  }
}
