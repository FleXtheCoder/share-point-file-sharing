import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/auth"
import {
  softDeleteFile,
  toggleFavorite,
  getFilePermissions,
  getFileNavigation,
  updateFileShares,
} from "@/lib/server/files"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  try {
    const { id } = await params
    await softDeleteFile(user, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Löschen fehlgeschlagen" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    if (body.action === "favorite") {
      const isFavorite = await toggleFavorite(user, id)
      return NextResponse.json({ favorite: isFavorite })
    }

    if (body.action === "share") {
      await updateFileShares(user, id, body.addUserIds ?? [], body.removeUserIds ?? [])
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Aktion fehlgeschlagen" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  try {
    const { id } = await params
    const nav = new URL(request.url).searchParams.get("nav")

    if (nav === "1") {
      const navigation = await getFileNavigation(user, id)
      return NextResponse.json(navigation)
    }

    const permissions = await getFilePermissions(user, id)
    return NextResponse.json({ permissions })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Laden" },
      { status: err instanceof Error && err.message === "Kein Zugriff" ? 403 : 404 }
    )
  }
}
