import { AppShell } from "@/components/layout/AppShell";

import { ImageToolWorkspace } from "./ImageToolWorkspace";

type ImageToolId =
  | "image-compressor"
  | "image-resizer"
  | "jpg-to-png"
  | "png-to-jpg"
  | "passport-photo-maker";

export function ImageToolPage({ toolId }: { toolId: ImageToolId }) {
  return (
    <AppShell showRecentPanel={false}>
      <ImageToolWorkspace toolId={toolId} />
    </AppShell>
  );
}
