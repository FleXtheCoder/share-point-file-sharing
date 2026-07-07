"use client"

import {
  DocumentRegular,
  FolderRegular,
  TableSimpleRegular,
  SlideTextRegular,
  DocumentPdfRegular,
  ImageRegular,
  VideoRegular,
  MusicNote2Regular,
  FolderZipRegular,
  CodeRegular,
  DocumentTextRegular,
  CubeRegular,
  QuestionCircleRegular,
} from "@fluentui/react-icons"
import type { FileType } from "@/lib/types"
import { getFileTypeFromName } from "@/lib/data"

export { getFileTypeFromName }

interface FileIconProps {
  type: FileType
  size?: number
  className?: string
  color?: string | null
}

const ICON_COLORS: Record<FileType, string> = {
  folder: "#0078d4",
  word: "#2b579a",
  excel: "#217346",
  powerpoint: "#d24726",
  pdf: "#d83b01",
  image: "#038387",
  video: "#8764b8",
  audio: "#107c10",
  archive: "#8a8886",
  code: "#002050",
  text: "#605e5c",
  stl: "#5c2d91",
  unknown: "#8a8886",
}

export function FileIcon({ type, size = 24, className, color }: FileIconProps) {
  const iconColor = type === "folder" && color ? color : ICON_COLORS[type]
  const props = { style: { color: iconColor, width: size, height: size }, className }

  switch (type) {
    case "folder":
      return <FolderRegular {...props} />
    case "word":
      return <DocumentRegular {...props} />
    case "excel":
      return <TableSimpleRegular {...props} />
    case "powerpoint":
      return <SlideTextRegular {...props} />
    case "pdf":
      return <DocumentPdfRegular {...props} />
    case "image":
      return <ImageRegular {...props} />
    case "video":
      return <VideoRegular {...props} />
    case "audio":
      return <MusicNote2Regular {...props} />
    case "archive":
      return <FolderZipRegular {...props} />
    case "code":
      return <CodeRegular {...props} />
    case "text":
      return <DocumentTextRegular {...props} />
    case "stl":
      return <CubeRegular {...props} />
    default:
      return <QuestionCircleRegular {...props} />
  }
}
