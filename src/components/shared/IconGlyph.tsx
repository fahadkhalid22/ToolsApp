import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Bell,
  Braces,
  Calculator,
  Clock3,
  FileDown,
  FileImage,
  Files,
  FileText,
  GraduationCap,
  Heart,
  History,
  Home,
  Image,
  Images,
  ImageDown,
  LayoutGrid,
  Percent,
  QrCode,
  Scan,
  Settings,
  Sparkles,
  TextCursorInput,
  WandSparkles,
} from "lucide-react";

const icons = {
  bell: Bell,
  braces: Braces,
  calculator: Calculator,
  clock: Clock3,
  "file-down": FileDown,
  "file-image": FileImage,
  files: Files,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  heart: Heart,
  history: History,
  home: Home,
  image: Image,
  images: Images,
  "image-down": ImageDown,
  "layout-grid": LayoutGrid,
  percent: Percent,
  "qr-code": QrCode,
  scan: Scan,
  settings: Settings,
  sparkles: Sparkles,
  "text-cursor-input": TextCursorInput,
  wand: WandSparkles,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

type IconGlyphProps = LucideProps & {
  name: IconName;
};

export function IconGlyph({ name, ...props }: IconGlyphProps) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" {...props} />;
}
