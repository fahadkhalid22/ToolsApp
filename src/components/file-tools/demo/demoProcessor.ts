import type { FileProcessor } from "@/types/file-tool";
import { FileToolProcessingError } from "@/lib/file-tools/errors";

export type DemoScenario = "success" | "fail-once" | "indeterminate";

function abortError() {
  return new DOMException("Processing cancelled", "AbortError");
}

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const handleAbort = () => {
      window.clearTimeout(timeout);
      reject(abortError());
    };
    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

export function createDemoProcessor(scenario: DemoScenario): FileProcessor<Record<string, never>> {
  let attempts = 0;
  return async ({ files, signal, reportProgress }) => {
    attempts += 1;
    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      reportProgress({ fileId: item.id, status: "processing", message: `Preparing ${index + 1} of ${files.length}…` });
      if (scenario === "indeterminate") {
        await wait(650, signal);
      } else {
        for (const progress of [18, 46, 74, 100]) {
          await wait(180, signal);
          reportProgress({
            fileId: item.id,
            progress,
            overallProgress: Math.round(((index + progress / 100) / files.length) * 100),
            status: progress === 100 ? "completed" : "processing",
            message: progress === 100 ? `${item.file.name} complete` : `Processing ${item.file.name}…`,
          });
        }
      }
      if (scenario === "fail-once" && attempts === 1 && index === 0) {
        throw new FileToolProcessingError("The development preview stopped intentionally. Retry to verify recovery.");
      }
    }

    return {
      outputs: files.map((item, index) => ({
        blob: item.file,
        fileName: `preview-${index + 1}-${item.file.name}`,
        mimeType: item.file.type || "application/octet-stream",
        originalSize: item.file.size,
        metrics: [{ label: "Preview", value: "Original bytes unchanged" }],
      })),
      summary: "Development preview only — the original bytes were passed through unchanged.",
      metrics: [
        { label: "Files", value: String(files.length) },
        { label: "Processing", value: "Local demo" },
        { label: "Upload", value: "None" },
      ],
    };
  };
}
