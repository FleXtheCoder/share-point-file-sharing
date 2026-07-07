export const MAX_FILE_SIZE_MB = 150
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function isFileTooLarge(size: number): boolean {
  return size > MAX_FILE_SIZE_BYTES
}

export function fileTooLargeMessage(fileName: string): string {
  return `"${fileName}" ist zu groß. Maximal ${MAX_FILE_SIZE_MB} MB pro Datei.`
}
