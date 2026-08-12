import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const Route = createFileRoute("/app/settings/parts-inventory")({
  head: () => ({
    meta: [
      { title: "Parts Inventory Settings — HEMP" },
      { name: "description", content: "Parts Inventory settings module placeholder." },
    ],
  }),
  component: () => <ModulePlaceholder title="Parts Inventory Settings" />,
});
