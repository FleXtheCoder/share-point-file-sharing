import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/server/auth"
import { userToCurrentUser } from "@/lib/server/users"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({ user: userToCurrentUser(user) })
}
