import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/auth"
import { getAllUsers } from "@/lib/server/db"
import { userToMember } from "@/lib/server/users"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 })
  }

  const members = (await getAllUsers()).map(userToMember)
  return NextResponse.json({ members, currentUser: userToMember(user) })
}
