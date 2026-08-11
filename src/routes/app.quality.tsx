import { createFileRoute } from "@tanstack/react-router";

import { ModulePlaceholder } from "@/components/app/module-placeholder";

export const Route = createFileRoute("/app/quality")({
  head: () => ({
    meta: [
      { title: "Quality — HEMP" },
      { name: "description", content: "Quality module placeholder in the HEMP workspace." },
      { property: "og:title", content: "Quality — HEMP" },
      { property: "og:description", content: "Quality module placeholder." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ModulePlaceholder title="Quality" />,
});