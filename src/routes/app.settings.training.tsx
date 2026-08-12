import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const Route = createFileRoute("/app/settings/training")({
  head: () => ({
    meta: [
      { title: "Training Settings — HEMP" },
      { name: "description", content: "Training settings module placeholder." },
    ],
  }),
  component: () => <ModulePlaceholder title="Training Settings" />,
});
