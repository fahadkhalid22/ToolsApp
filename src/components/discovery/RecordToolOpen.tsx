"use client";

import { useEffect, useRef } from "react";

import { recordToolOpen } from "@/lib/discovery/local-state";

export function RecordToolOpen({ toolId }: { toolId: string }) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordToolOpen(toolId, "direct");
  }, [toolId]);

  return null;
}
