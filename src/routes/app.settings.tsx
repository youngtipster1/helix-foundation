import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/app/module-placeholder";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HEMP" },
      { name: "description", content: "Settings placeholder in the HEMP workspace." },
      { property: "og:title", content: "Settings — HEMP" },
      { property: "og:description", content: "Settings placeholder." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ModulePlaceholder title="Settings" />,
});