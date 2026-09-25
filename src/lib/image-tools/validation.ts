import type { FileValidator } from "../../types/file-tool";
import { resizeFormatFromHeader, type ResizeFormat } from "./resizer.ts";

/** MIME and extension are advisory; the first bytes must agree as well. */
export function imageSignatureValidator(accepted: readonly ResizeFormat[]): FileValidator {
  return async (item) => {
    const format = resizeFormatFromHeader(new Uint8Array(await item.file.slice(0, 8).arrayBuffer()));
    const extension = item.file.name.toLowerCase().split(".").pop();
    const extensionFormat = extension === "jpg" || extension === "jpeg" ? "jpeg" : extension === "png" ? "png" : null;
    const mime = item.file.type.toLowerCase();
    const mimeFormat = mime === "image/jpeg" || mime === "image/jpg" ? "jpeg" : mime === "image/png" ? "png" : null;
    if (format && accepted.includes(format) && format === extensionFormat && (!mimeFormat || format === mimeFormat)) return null;
    return {
      code: "custom-validation",
      severity: "error",
      message: `The file contents do not match its name or a supported ${accepted.map((value) => value === "jpeg" ? "JPEG" : "PNG").join(" or ")} format. Choose a valid image with a matching extension.`,
    };
  };
}
