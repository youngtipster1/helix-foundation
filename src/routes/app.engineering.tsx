import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/app/module-placeholder";

export const Route = createFileRoute("/app/engineering")({
  head: () => ({
    meta: [
      { title: "Engineering — HEMP" },
      { name: "description", content: "Engineering module placeholder in the HEMP workspace." },
      { property: "og:title", content: "Engineering — HEMP" },
      { property: "og:description", content: "Engineering module placeholder." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ModulePlaceholder title="Engineering" />,
});