export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const precision = value >= 10 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

export function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.slice(lastDot).toLowerCase() : "";
}

export function formatAcceptedExtensions(extensions: readonly string[]) {
  return extensions
    .map((extension) => extension.replace(/^\./, "").toUpperCase())
    .join(", ");
}

export function sanitizeDownloadFileName(fileName: string, fallback = "processed-file") {
  const sanitized = fileName
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[.\s-]+/, "")
    .trim()
    .slice(0, 180);
  return sanitized || fallback;
}
