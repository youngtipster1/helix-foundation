import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/app/module-placeholder";

export const Route = createFileRoute("/app/operations")({
  head: () => ({
    meta: [
      { title: "Operations — HEMP" },
      { name: "description", content: "Operations module placeholder in the HEMP workspace." },
      { property: "og:title", content: "Operations — HEMP" },
      { property: "og:description", content: "Operations module placeholder." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ModulePlaceholder title="Operations" />,
});