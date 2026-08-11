import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/app/module-placeholder";

export const Route = createFileRoute("/app/management")({
  head: () => ({
    meta: [
      { title: "Management — HEMP" },
      { name: "description", content: "Management module placeholder in the HEMP workspace." },
      { property: "og:title", content: "Management — HEMP" },
      { property: "og:description", content: "Management module placeholder." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ModulePlaceholder title="Management" />,
});