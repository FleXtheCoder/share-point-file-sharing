import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/auth"
import { listFiles, getStorageStats } from "@/lib/server/files"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const section = searchParams.get("section") ?? "my-files"
  const folderId = searchParams.get("folderId")
  const pathParam = searchParams.get("path")
  const pathSegments = pathParam ? pathParam.split("/").filter(Boolean) : []

  const files = await listFiles(user, section, folderId, pathSegments)
  const storage = await getStorageStats()

  return NextResponse.json({ files, storage })
}
