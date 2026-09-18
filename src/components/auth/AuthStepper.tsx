import { Check } from "lucide-react";

import styles from "./AuthStepper.module.css";

export type AuthStep = {
  label: string;
  description: string;
};

type AuthStepperProps = {
  activeStep: number;
  steps: readonly AuthStep[];
};

export function AuthStepper({ activeStep, steps }: AuthStepperProps) {
  return (
    <ol className={styles.list} aria-label="Account setup progress">
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number < activeStep;
        const active = number === activeStep;

        return (
          <li
            className={`${styles.item} ${complete ? styles.complete : ""} ${active ? styles.active : ""}`}
            key={step.label}
            aria-current={active ? "step" : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {complete ? <Check size={14} strokeWidth={3} /> : number}
            </span>
            <span className={styles.copy}>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
