import { createFileRoute } from "@tanstack/react-router";
import { ConfigWorkspace } from "@/modules/settings/components/config-workspace";

export const Route = createFileRoute("/app/settings/quality")({
  head: () => ({
    meta: [
      { title: "Quality Settings — HEMP" },
      { name: "description", content: "Quality configuration settings in the HEMP platform." },
    ],
  }),
  component: QualitySettingsPage,
});

function QualitySettingsPage() {
  const categories = [
    {
      key: "quality.document-status",
      label: "Document Status",
      singular: "Document Status",
    },
    {
      key: "quality.equipment-oem",
      label: "Equipment OEM",
      singular: "Equipment OEM",
    },
    {
      key: "quality.modality",
      label: "Modality",
      singular: "Modality",
    },
    {
      key: "quality.equipment-model",
      label: "Equipment Model",
      singular: "Equipment Model",
    },
  ];

  return <ConfigWorkspace title="Quality Settings" categories={categories} />;
}
