import { Construction } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Module" title={title} />
      <EmptyState
        icon={Construction}
        title="Coming in a future development phase."
        description="This module has not been implemented yet."
      />
    </div>
  );
}