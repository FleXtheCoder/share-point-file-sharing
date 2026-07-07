import type { Role } from "@prisma/client"
import type { CurrentUser, Member } from "@/lib/types"
import { getInitials } from "@/lib/data"

export type SafeUser = {
  id: string
  username: string
  color: string
  role: Role
  mustChangePassword: boolean
}

export function userToMember(user: SafeUser): Member {
  return {
    id: user.id,
    username: user.username,
    avatar: getInitials(user.username),
    color: user.color,
    role: user.role === "ADMIN" ? "admin" : "member",
  }
}

export function userToCurrentUser(user: SafeUser): CurrentUser {
  return {
    id: user.id,
    username: user.username,
    avatar: getInitials(user.username),
    color: user.color,
    role: user.role === "ADMIN" ? "admin" : "member",
    mustChangePassword: user.mustChangePassword,
  }
}

export function isAdmin(user: SafeUser): boolean {
  return user.role === "ADMIN"
}
