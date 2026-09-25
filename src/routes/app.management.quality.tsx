import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { qualityService } from "@/modules/quality/services/quality-service";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/management/quality")({
  head: () => ({
    meta: [
      { title: "Quality & Governance Overview — Management | HEMP" },
      { name: "description", content: "Executive overview of HEMP quality guidelines, policy documents, and compliance checklists." },
    ],
  }),
  component: ManagementQualityPage,
});

function ManagementQualityPage() {
  const [metrics, setMetrics] = useState<{
    policyDocuments: number;
    equipmentChecklists: number;
    pendingReviews: number;
    pendingApprovals: number;
  } | null>(null);

  const [attentionList, setAttentionList] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const metricsData = await qualityService.getDashboardMetrics();
      const attentionData = await qualityService.getAttentionRequired();
      const activityData = await qualityService.listActivities();
      setMetrics(metricsData);
      setAttentionList(attentionData.slice(0, 5));
      setActivities(activityData.slice(0, 5));
    } catch (err) {
      console.error("Error loading quality management data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality & Governance Overview"
        subtitle="Clinical compliance guidelines, SOP policy documents, standardized inspection checklists, and pending authorizations."
        icon={ShieldCheck}
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        <StatCard
          title="Policy Documents"
          value={metrics.policyDocuments}
          description="Active & approved policy documentation"
          icon={FileText}
        />
        <StatCard
          title="Equipment Checklists"
          value={metrics.equipmentChecklists}
          description="Standardized operational inspection checklists"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Pending Reviews"
          value={metrics.pendingReviews}
          description="Awaiting peer evaluation & QA review"
          icon={Clock}
        />
        <StatCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          description="Awaiting administrative authorization"
          icon={ShieldCheck}
        />
      </div>

      {/* Grid: Attention Required & Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Attention Required */}
        <div className="surface-panel p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              Compliance Attention Required
            </h2>
            <p className="text-xs text-muted-foreground">Documents and checklists awaiting executive review or approval.</p>
          </div>
          <div className="border-t border-border pt-4">
            {attentionList.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center">
                <ShieldCheck className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">All items cleared! No actions pending.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground">Document / Checklist</th>
                      <th className="hidden md:table-cell py-2.5 px-3 font-semibold text-muted-foreground">Required Action</th>
                      <th className="py-2.5 px-3 font-semibold text-muted-foreground">Status</th>
                      <th className="hidden sm:table-cell py-2.5 px-3 font-semibold text-muted-foreground">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attentionList.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/5 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-foreground max-w-[200px] truncate">{item.description}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.identifier}</span>
                        </td>
                        <td className="hidden md:table-cell py-3 px-3 font-medium text-foreground">{item.actionRequired}</td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider",
                              item.status === "Under Review"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-primary/10 text-primary border-primary/20",
                            )}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell py-3 px-3 font-mono text-[10px] text-muted-foreground">{item.lastUpdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activities */}
        <div className="surface-panel p-5 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Recent Governance Operations</h2>
          <div className="border-t border-border pt-4">
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">No recent activities recorded.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-2 text-xs">
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 pt-0.5">
                      {act.timestamp.split(" ")[1]}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-foreground leading-snug">{act.description}</p>
                      <span className="text-[10px] text-muted-foreground font-mono block">#{act.targetName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
