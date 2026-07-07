import { getInitials } from "@/lib/data"

interface ColoredAvatarProps {
  username: string
  color: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function ColoredAvatar({ username, color, size = 28, className, style }: ColoredAvatarProps) {
  const initials = getInitials(username)
  const fontSize = size <= 20 ? 9 : size <= 24 ? 10 : size <= 28 ? 11 : size <= 32 ? 12 : 13

  return (
    <div
      className={className}
      aria-label={username}
      title={username}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        backgroundColor: color,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    >
      {initials}
    </div>
  )
}
