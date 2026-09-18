import assert from "node:assert/strict";
import test from "node:test";

import { formatBytes, getFileExtension, sanitizeDownloadFileName } from "../src/lib/file-tools/format.ts";
import { createDownloadResource, downloadFileOutput } from "../src/lib/file-tools/download.ts";
import { createToolFileItems, mergeFileSelection, removeFileFromQueue, reorderFileQueue } from "../src/lib/file-tools/queue.ts";
import { validateFileSelection } from "../src/lib/file-tools/validation.ts";
import { fileWorkflowReducer, initialFileWorkflowState } from "../src/lib/file-tools/workflow.ts";

const baseConfig = {
  id: "fixture-tool",
  mode: "multiple",
  title: "Fixture tool",
  description: "Fixture description",
  uploadLabel: "Drop files here or browse",
  uploadHelperText: "PNG or PDF · up to 5 MB",
  processLabel: "Process files",
  downloadLabel: "Download file",
  accepted: {
    extensions: [".png", ".pdf"],
    mimeTypes: ["image/png", "application/pdf"],
    mimeMismatchPolicy: "warn",
  },
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxTotalSizeBytes: 8 * 1024 * 1024,
  minFiles: 1,
  maxFiles: 3,
  duplicatePolicy: "reject",
  rejectEmptyFiles: true,
  allowReordering: true,
};

function fixture(name, options = {}) {
  const size = options.size ?? 16;
  return new File([new Uint8Array(size)], name, {
    type: options.type ?? "image/png",
    lastModified: options.lastModified ?? 1,
  });
}

function items(files) {
  return createToolFileItems(files, (file, index) => `${index}-${file.name}`);
}

test("file formatting and download filenames are safe and deterministic", () => {
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(getFileExtension("archive.photo.PNG"), ".png");
  assert.equal(sanitizeDownloadFileName('../bad:file?.png'), "bad-file-.png");
});

test("download resources sanitize filenames and revoke object URLs exactly once", () => {
  const revoked = [];
  const adapter = {
    createObjectURL: () => "blob:fixture",
    revokeObjectURL: (url) => revoked.push(url),
  };
  const resource = createDownloadResource({ blob: new Blob(["done"]), fileName: "../unsafe:result.txt" }, adapter);
  assert.equal(resource.safeFileName, "unsafe-result.txt");
  resource.revoke();
  resource.revoke();
  assert.deepEqual(revoked, ["blob:fixture"]);
});

test("download action clicks a temporary anchor and schedules cleanup", () => {
  const events = [];
  const anchor = { href: "", download: "", rel: "", hidden: false, click: () => events.push("clicked") };
  const adapter = { createObjectURL: () => "blob:download", revokeObjectURL: () => events.push("revoked") };
  const fileName = downloadFileOutput(
    { blob: new Blob(["done"]), fileName: "result.txt" },
    {
      urlAdapter: adapter,
      documentAdapter: {
        createElement: () => anchor,
        body: { appendChild: () => events.push("added"), removeChild: () => events.push("removed") },
      },
      scheduleCleanup: (cleanup) => { events.push("scheduled"); cleanup(); },
    },
  );
  assert.equal(fileName, "result.txt");
  assert.deepEqual(events, ["added", "clicked", "removed", "scheduled", "revoked"]);
});

test("validation accepts allowed files and preserves deterministic order", async () => {
  const selected = items([fixture("one.png"), fixture("two.pdf", { type: "application/pdf" })]);
  const result = await validateFileSelection(selected, baseConfig);
  assert.equal(result.valid, true);
  assert.deepEqual(result.files.map((item) => item.file.name), ["one.png", "two.pdf"]);
  assert.ok(result.files.every((item) => item.status === "valid"));
});

test("validation rejects unsupported, oversized, empty, and excessive selections", async () => {
  const config = { ...baseConfig, maxFileSizeBytes: 10, maxFiles: 2 };
  const selected = items([
    fixture("empty.png", { size: 0 }),
    fixture("large.png", { size: 11 }),
    fixture("notes.txt", { type: "text/plain" }),
  ]);
  const result = await validateFileSelection(selected, config);
  assert.equal(result.valid, false);
  const codes = result.issues.map((entry) => entry.code);
  assert.ok(codes.includes("empty-file"));
  assert.ok(codes.includes("file-too-large"));
  assert.ok(codes.includes("unsupported-extension"));
  assert.ok(codes.includes("too-many-files"));
});

test("MIME mismatches can warn or reject without treating metadata as infallible", async () => {
  const selected = items([fixture("photo.png", { type: "text/plain" })]);
  const warned = await validateFileSelection(selected, baseConfig);
  assert.equal(warned.valid, true);
  assert.equal(warned.issues[0]?.severity, "warning");
  const rejected = await validateFileSelection(selected, {
    ...baseConfig,
    accepted: { ...baseConfig.accepted, mimeMismatchPolicy: "reject" },
  });
  assert.equal(rejected.valid, false);
});

test("duplicate policy rejects, ignores, or allows practical metadata matches", async () => {
  const duplicate = fixture("same.png", { lastModified: 99 });
  const selected = items([duplicate, duplicate]);
  const rejected = await validateFileSelection(selected, baseConfig);
  assert.equal(rejected.valid, false);
  assert.ok(rejected.issues.some((entry) => entry.code === "duplicate-file"));
  const ignored = await validateFileSelection(selected, { ...baseConfig, duplicatePolicy: "ignore" });
  assert.equal(ignored.valid, true);
  assert.equal(ignored.files.length, 1);
  assert.equal(ignored.issues[0]?.fileId, undefined);
  const allowed = await validateFileSelection(selected, { ...baseConfig, duplicatePolicy: "allow" });
  assert.equal(allowed.valid, true);
  assert.equal(allowed.files.length, 2);
});

test("custom validators are supported and failures stay local", async () => {
  const selected = items([fixture("blocked.png")]);
  const result = await validateFileSelection(selected, {
    ...baseConfig,
    customValidators: [async (file) => ({
      code: "custom-validation",
      severity: "error",
      message: `${file.file.name} was rejected by the fixture validator.`,
    })],
  });
  assert.equal(result.valid, false);
  assert.match(result.issues[0].message, /fixture validator/);
});

test("single selection replaces one file and exposes multi-selection for validation", () => {
  const current = items([fixture("old.png")]);
  const replaced = mergeFileSelection(current, [fixture("new.png")], { mode: "single" }, (file) => file.name);
  assert.deepEqual(replaced.map((item) => item.file.name), ["new.png"]);
  const invalidBatch = mergeFileSelection(current, [fixture("one.png"), fixture("two.png")], { mode: "single" }, (file) => file.name);
  assert.equal(invalidBatch.length, 2);
});

test("queue removal and accessible reordering keep stable deterministic order", () => {
  const selected = items([fixture("one.png"), fixture("two.png"), fixture("three.png")]);
  const moved = reorderFileQueue(selected, selected[2].id, "up");
  assert.deepEqual(moved.map((item) => item.file.name), ["one.png", "three.png", "two.png"]);
  assert.deepEqual(moved.map((item) => item.order), [0, 1, 2]);
  const removed = removeFileFromQueue(moved, moved[1].id);
  assert.deepEqual(removed.map((item) => item.file.name), ["one.png", "two.png"]);
});

test("workflow follows ready, processing, progress, success, and reset transitions", () => {
  const selected = items([fixture("one.png")]);
  let state = fileWorkflowReducer(initialFileWorkflowState, { type: "VALIDATION_STARTED", files: selected });
  assert.equal(state.phase, "validating");
  state = fileWorkflowReducer(state, { type: "VALIDATION_FINISHED", files: selected, issues: [] });
  assert.equal(state.phase, "ready");
  state = fileWorkflowReducer(state, { type: "PROCESS_STARTED" });
  assert.equal(state.phase, "processing");
  state = fileWorkflowReducer(state, { type: "PROCESS_PROGRESS", progress: { fileId: selected[0].id, progress: 50, overallProgress: 50 } });
  assert.equal(state.files[0].progress, 50);
  state = fileWorkflowReducer(state, { type: "PROCESS_SUCCEEDED", result: { outputs: [{ blob: new Blob(["ok"]), fileName: "done.png" }] } });
  assert.equal(state.phase, "success");
  assert.equal(state.result?.outputs[0].fileName, "done.png");
  assert.deepEqual(fileWorkflowReducer(state, { type: "RESET" }), initialFileWorkflowState);
});

test("workflow exposes recoverable error, retry, and cancellation states", () => {
  const selected = items([fixture("one.png")]);
  let state = fileWorkflowReducer(initialFileWorkflowState, { type: "VALIDATION_STARTED", files: selected });
  state = fileWorkflowReducer(state, { type: "VALIDATION_FINISHED", files: selected, issues: [] });
  state = fileWorkflowReducer(state, { type: "PROCESS_STARTED" });
  state = fileWorkflowReducer(state, { type: "PROCESS_FAILED", error: { kind: "processing", message: "Try again.", retryable: true } });
  assert.equal(state.phase, "error");
  assert.equal(fileWorkflowReducer(state, { type: "PROCESS_STARTED" }).phase, "processing");
  state = fileWorkflowReducer(fileWorkflowReducer(state, { type: "PROCESS_STARTED" }), { type: "PROCESS_CANCELLED" });
  assert.equal(state.phase, "cancelled");
});

test("validation errors prevent processing", async () => {
  const selected = items([fixture("bad.txt", { type: "text/plain" })]);
  const validation = await validateFileSelection(selected, baseConfig);
  let state = fileWorkflowReducer(initialFileWorkflowState, { type: "VALIDATION_STARTED", files: selected });
  state = fileWorkflowReducer(state, { type: "VALIDATION_FINISHED", files: validation.files, issues: validation.issues });
  assert.equal(state.phase, "error");
  assert.equal(fileWorkflowReducer(state, { type: "PROCESS_STARTED" }).phase, "error");
});
