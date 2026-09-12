import { createFileRoute } from "@tanstack/react-router";
import { ServiceContractsView } from "@/modules/financial/components/service-contracts-view";

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
  component: FinancialServiceContractsPage,
});

function FinancialServiceContractsPage() {
  return <ServiceContractsView />;
}
