import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const Route = createFileRoute("/app/settings/debrief")({
  head: () => ({
    meta: [
      { title: "Debrief Settings — HEMP" },
      { name: "description", content: "Debrief settings module placeholder." },
    ],
  }),
  component: () => <ModulePlaceholder title="Debrief Settings" />,
});
