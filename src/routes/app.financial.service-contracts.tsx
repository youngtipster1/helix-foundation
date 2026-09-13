import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const Route = createFileRoute("/app/financial/service-contracts")({
  head: () => ({
    meta: [
      { title: "Service Contracts — HEMP" },
      {
        name: "description",
        content:
          "Biomedical service contracts, equipment warranty terms, and vendor SLAs.",
      },
    ],
  }),
  component: () => <ModulePlaceholder title="Service Contracts" />,
});
