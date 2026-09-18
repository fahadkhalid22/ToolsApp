export type ImageFormat = "jpeg" | "png";

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageCrop = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type SourceCrop = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
};

export type PhysicalUnit = "mm" | "in";

export type PassportPresetId = "35x45" | "2x2" | "custom";

export type PassportSize = {
  width: number;
  height: number;
  unit: PhysicalUnit;
};
