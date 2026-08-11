import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HEMP" },
      {
        name: "description",
        content: "Your HEMP workspace overview for healthcare engineering operations.",
      },
      { property: "og:title", content: "Dashboard — HEMP" },
      { property: "og:description", content: "Your HEMP workspace overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user.firstName}`}
        subtitle="Here's your workspace overview."
      />

      <hr className="border-border" />

      <section className="page-enter space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your operational modules will appear here.
          </p>
        </div>
        <EmptyState
          icon={LayoutGrid}
          title="Future workspace area"
          description="Modules are being prepared for a future development phase."
        />
      </section>
    </div>
  );
}