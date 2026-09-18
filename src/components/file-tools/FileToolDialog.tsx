"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import styles from "./FileTool.module.css";

type FileToolDialogProps = {
  children: ReactNode;
  label: string;
  onClose: () => void;
  open: boolean;
};

export function FileToolDialog({ children, label, onClose, open }: FileToolDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className={styles.dialogLayer}>
      <button aria-label={`Close ${label}`} className={styles.dialogBackdrop} onClick={onClose} tabIndex={-1} type="button" />
      <div aria-label={label} aria-modal="true" className={styles.dialogViewport} ref={dialogRef} role="dialog" tabIndex={-1}>
        <button aria-label={`Close ${label}`} className={styles.dialogClose} onClick={onClose} type="button">
          <X aria-hidden="true" size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
