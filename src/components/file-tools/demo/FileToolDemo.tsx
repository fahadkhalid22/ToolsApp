"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Files, Gauge, RotateCcw } from "lucide-react";

import { FileToolDialog } from "@/components/file-tools/FileToolDialog";
import { FileToolView } from "@/components/file-tools/FileToolView";
import { useFileWorkflow } from "@/lib/file-tools/useFileWorkflow";
import type { FileToolConfig, FileToolMode } from "@/types/file-tool";

import { createDemoProcessor, type DemoScenario } from "./demoProcessor";
import styles from "./FileToolDemo.module.css";

function makeFixture(name: string, type: string, kilobytes: number) {
  return new File([new Uint8Array(kilobytes * 1024)], name, { type, lastModified: 1 });
}

function DemoInstance({ mode, scenario, showFixtures = true }: { mode: FileToolMode; scenario: DemoScenario; showFixtures?: boolean }) {
  const config = useMemo<FileToolConfig>(() => ({
    id: "file-tool-development-preview",
    mode,
    title: mode === "single" ? "Prepare one local file" : "Prepare a local file batch",
    description: "Exercise the shared upload, validation, progress, recovery, and result experience without running a production tool algorithm.",
    uploadLabel: mode === "single" ? "Drop your file here or browse" : "Drop your files here or browse",
    uploadHelperText: "PNG or PDF files for the development preview",
    processLabel: mode === "single" ? "Process preview file" : "Process preview batch",
    downloadLabel: "Download preview",
    privacyNote: "Files stay in this browser for this preview.",
    accepted: { extensions: [".png", ".pdf"], mimeTypes: ["image/png", "application/pdf"], mimeMismatchPolicy: "warn" },
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxTotalSizeBytes: 12 * 1024 * 1024,
    minFiles: mode === "single" ? 1 : 2,
    maxFiles: mode === "single" ? 1 : 5,
    duplicatePolicy: "reject",
    rejectEmptyFiles: true,
    allowReordering: mode === "multiple",
    supportsCancellation: true,
    outputMode: mode === "single" ? "single" : "multiple",
  }), [mode]);
  const processor = useMemo(() => createDemoProcessor(scenario), [scenario]);
  const workflow = useFileWorkflow(config, processor, {});

  return (
    <>
      {showFixtures ? <div className={styles.fixtureBar} aria-label="Development fixtures">
        <span>Deterministic fixtures</span>
        <button onClick={() => workflow.actions.selectFiles(mode === "single"
          ? [makeFixture("sample-photo.png", "image/png", 640)]
          : [makeFixture("project-brief.pdf", "application/pdf", 820), makeFixture("cover-image.png", "image/png", 540), makeFixture("appendix.pdf", "application/pdf", 380)])} type="button">
          <CheckCircle2 aria-hidden="true" size={15} /> Load valid {mode === "single" ? "file" : "batch"}
        </button>
        <button onClick={() => workflow.actions.selectFiles([new File([], "empty-photo.heic", { type: "image/heic", lastModified: 2 })])} type="button">
          <AlertTriangle aria-hidden="true" size={15} /> Load validation error
        </button>
        <button onClick={workflow.actions.reset} type="button"><RotateCcw aria-hidden="true" size={15} /> Reset</button>
      </div> : null}
      <FileToolView
        actions={workflow.actions}
        config={config}
        headingLevel="h2"
        optionsPanel={<div className={styles.slotPreview}><Gauge aria-hidden="true" size={17} /><span><strong>Tool options slot</strong><small>Parts 05 and 06 can place typed controls here without duplicating the workflow.</small></span></div>}
        presentation="modal"
        resultInfoSlot={<>This route is a development-only visual harness. It does not compress, convert, or merge files.</>}
        state={workflow.state}
      />
    </>
  );
}

export function FileToolDemo() {
  const [mode, setMode] = useState<FileToolMode>("single");
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className={styles.main} id="main-content">
      <header className={styles.pageHeader}>
        <span>Development preview · Part 04</span>
        <h1 className="font-heading">Shared file-tool workflow</h1>
        <p>Exercise every reusable state before connecting real image and PDF processors.</p>
      </header>
      <div className={styles.demoControls}>
        <fieldset>
          <legend>Input mode</legend>
          <button aria-pressed={mode === "single"} onClick={() => setMode("single")} type="button">Single file</button>
          <button aria-pressed={mode === "multiple"} onClick={() => setMode("multiple")} type="button"><Files aria-hidden="true" size={14} /> Multiple files</button>
        </fieldset>
        <fieldset>
          <legend>Processor behavior</legend>
          <button aria-pressed={scenario === "success"} onClick={() => setScenario("success")} type="button">Progress</button>
          <button aria-pressed={scenario === "indeterminate"} onClick={() => setScenario("indeterminate")} type="button">Indeterminate</button>
          <button aria-pressed={scenario === "fail-once"} onClick={() => setScenario("fail-once")} type="button">Fail once</button>
        </fieldset>
      </div>
      <button className={styles.openModalButton} onClick={() => setModalOpen(true)} type="button">Open modal preview</button>
      <div className={styles.stage} key={`${mode}-${scenario}`}><DemoInstance mode={mode} scenario={scenario} /></div>
      <FileToolDialog label="file workflow modal preview" onClose={() => setModalOpen(false)} open={modalOpen}>
        <DemoInstance mode={mode} scenario={scenario} showFixtures={false} />
      </FileToolDialog>
    </main>
  );
}
