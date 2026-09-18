import type { FileDownloadResource, FileProcessingOutput } from "../../types/file-tool";
import { sanitizeDownloadFileName } from "./format.ts";

export type ObjectUrlAdapter = {
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
};

type DownloadDocument = {
  createElement: (tagName: "a") => HTMLAnchorElement;
  body: Pick<HTMLElement, "appendChild" | "removeChild">;
};

export function createDownloadResource(
  output: FileProcessingOutput,
  urlAdapter: ObjectUrlAdapter,
): FileDownloadResource {
  const downloadUrl = urlAdapter.createObjectURL(output.blob);
  let revoked = false;
  return {
    ...output,
    downloadUrl,
    safeFileName: sanitizeDownloadFileName(output.fileName),
    revoke: () => {
      if (revoked) return;
      revoked = true;
      urlAdapter.revokeObjectURL(downloadUrl);
    },
  };
}

export function downloadFileOutput(
  output: FileProcessingOutput,
  options?: {
    urlAdapter?: ObjectUrlAdapter;
    documentAdapter?: DownloadDocument;
    scheduleCleanup?: (cleanup: () => void) => void;
  },
) {
  const urlAdapter = options?.urlAdapter ?? URL;
  const documentAdapter = options?.documentAdapter ?? document;
  const scheduleCleanup = options?.scheduleCleanup ?? ((cleanup) => window.setTimeout(cleanup, 0));
  const resource = createDownloadResource(output, urlAdapter);
  const anchor = documentAdapter.createElement("a") as HTMLAnchorElement;
  anchor.href = resource.downloadUrl;
  anchor.download = resource.safeFileName;
  anchor.rel = "noopener";
  anchor.hidden = true;
  documentAdapter.body.appendChild(anchor);
  anchor.click();
  documentAdapter.body.removeChild(anchor);
  scheduleCleanup(resource.revoke);
  return resource.safeFileName;
}
