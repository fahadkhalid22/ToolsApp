import { Check } from "lucide-react";

import type { FileWorkflowPhase } from "@/types/file-tool";

import styles from "./FileTool.module.css";

const steps = ["Upload", "Process", "Download"] as const;

function activeStep(phase: FileWorkflowPhase) {
  if (phase === "success") return 2;
  if (phase === "processing" || phase === "cancelled") return 1;
  return 0;
}

export function FileWorkflowSteps({ phase }: { phase: FileWorkflowPhase }) {
  const active = activeStep(phase);
  return (
    <ol className={styles.steps} aria-label="File processing steps">
      {steps.map((step, index) => (
        <li aria-current={index === active ? "step" : undefined} className={index <= active ? styles.stepActive : ""} key={step}>
          <span>{index < active ? <Check aria-hidden="true" size={12} /> : index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}
