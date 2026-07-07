import { NextResponse } from "next/server"
import { getSessionUser, requireAdmin } from "@/lib/server/auth"
import { getAdminStats } from "@/lib/server/stats"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  try {
    requireAdmin(user)
  } catch {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
  }

  const stats = await getAdminStats()
  return NextResponse.json({ stats })
}
