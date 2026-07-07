import { randomBytes } from "crypto"

const CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generatePassword(length = 12): string {
  const bytes = randomBytes(length)
  let password = ""
  for (let i = 0; i < length; i++) {
    password += CHARS[bytes[i] % CHARS.length]
  }
  return password
}
