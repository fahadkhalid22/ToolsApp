import type { FileToolConfig, ToolFileItem } from "../../types/file-tool";

export type FileIdFactory = (file: File, index: number) => string;

function defaultFileId(file: File, index: number) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${index}`;
  return `${randomId}-${file.name}`;
}

export function createToolFileItems(
  files: readonly File[],
  idFactory: FileIdFactory = defaultFileId,
) {
  return files.map<ToolFileItem>((file, index) => ({
    id: idFactory(file, index),
    file,
    order: index,
    status: "queued",
    progress: null,
    issues: [],
  }));
}

export function mergeFileSelection(
  current: readonly ToolFileItem[],
  incoming: readonly File[],
  config: Pick<FileToolConfig, "mode">,
  idFactory: FileIdFactory = defaultFileId,
) {
  const nextItems = createToolFileItems(incoming, idFactory);
  const combined = config.mode === "single" ? nextItems : [...current, ...nextItems];
  return combined.map((item, order) => ({ ...item, order }));
}

export function removeFileFromQueue(files: readonly ToolFileItem[], fileId: string) {
  return files
    .filter((file) => file.id !== fileId)
    .map((file, order) => ({ ...file, order }));
}

export function reorderFileQueue(
  files: readonly ToolFileItem[],
  fileId: string,
  direction: "up" | "down",
) {
  const index = files.findIndex((file) => file.id === fileId);
  if (index < 0) return [...files];
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= files.length) return [...files];
  const reordered = [...files];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered.map((file, order) => ({ ...file, order }));
}

export function fileFingerprint(file: File) {
  return `${file.name.toLowerCase()}::${file.size}::${file.lastModified}`;
}
