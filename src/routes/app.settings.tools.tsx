import { createFileRoute } from "@tanstack/react-router";
import { ConfigWorkspace } from "@/modules/settings/components/config-workspace";

export const Route = createFileRoute("/app/settings/tools")({
  head: () => ({
    meta: [
      { title: "Tools Settings — HEMP" },
      { name: "description", content: "Tools configuration settings in the HEMP platform." },
    ],
  }),
  component: ToolsSettingsPage,
});

function ToolsSettingsPage() {
  const categories = [
    {
      key: "tools.warranty-status",
      label: "Warranty Status",
      singular: "Warranty Status",
    },
    {
      key: "tools.model",
      label: "Tools Model",
      singular: "Tools Model",
    },
    {
      key: "tools.oem",
      label: "Tools OEM",
      singular: "Tools OEM",
    },
  ];

  return <ConfigWorkspace title="Tools Settings" categories={categories} />;
}
