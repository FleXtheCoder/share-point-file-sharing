export type FileType =
  | "folder"
  | "word"
  | "excel"
  | "powerpoint"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "text"
  | "stl"
  | "unknown"

export interface Member {
  id: string
  username: string
  avatar: string
  color: string
  role: "admin" | "member"
}

export interface AdminUser extends Member {
  mustChangePassword: boolean
  createdAt: string
}

export interface SharePermission {
  id: string
  username: string
  role: "read" | "write" | "owner"
}

export interface FileItem {
  id: string
  name: string
  type: FileType
  size: number | null
  modifiedAt: Date
  modifiedBy: string
  modifiedByName?: string
  sharedWith: string[]
  favorite: boolean
  parentId: string | null
  path: string[]
  folderColor?: string | null
}

export type ViewMode = "grid" | "list"

export type ActiveSection =
  | "my-files"
  | "shared"
  | "favorites"
  | "recent"
  | "admin"

export interface CurrentUser {
  id: string
  username: string
  avatar: string
  color: string
  role: "admin" | "member"
  mustChangePassword: boolean
}
