import { notFound } from "next/navigation";

import { RoutePlaceholder } from "@/components/shared/RoutePlaceholder";

const sections: Record<string, { title: string; description: string }> = {
  settings: {
    title: "Settings",
    description:
      "Account and workspace settings are intentionally deferred to the account and business phase.",
  },
};

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export default async function SectionPlaceholderPage({
  params,
}: PageProps<"/[section]">) {
  const { section } = await params;
  const page = sections[section];

  if (!page) notFound();

  return <RoutePlaceholder {...page} />;
}
