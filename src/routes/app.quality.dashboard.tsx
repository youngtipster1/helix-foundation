import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import {
  FileText,
  ClipboardCheck,
  Clock,
  CheckSquare,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { qualityService } from "@/modules/quality/services/quality-service";
import { isModuleAdmin } from "@/features/auth/permissions";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/quality/dashboard")({
  head: () => ({
    meta: [
      { title: "Quality Dashboard — HEMP" },
      { name: "description", content: "Manage and monitor HEMP quality guidelines, policy documents, and device checklists." },
    ],
  }),
  component: QualityDashboardPage,
});

function QualityDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<{
    policyDocuments: number;
    equipmentChecklists: number;
    pendingReviews: number;
    pendingApprovals: number;
  } | null>(null);

  const [attentionList, setAttentionList] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only Quality Admin should access the dashboard
    if (user && !isModuleAdmin(user, "quality")) {
      navigate({ to: "/app/quality/training", replace: true });
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const metricsData = await qualityService.getDashboardMetrics();
      const attentionData = await qualityService.getAttentionRequired();
      const activityData = await qualityService.listActivities();
      setMetrics(metricsData);
      setAttentionList(attentionData.slice(0, 4));
      setActivities(activityData.slice(0, 5));
    } catch (err) {
      console.error("Error loading quality dashboard data", err);
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Quality Operations &bull; Manage quality documents, checklists and outstanding actions.
        </p>
      </div>

      {/* Compact summary area */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* Metric 1 */}
        <div className="surface-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Policy Documents
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-foreground">{metrics.policyDocuments}</span>
            <span className="text-xs text-muted-foreground font-mono">100% Active</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active & approved policy documentation
          </p>
        </div>

        {/* Metric 2 */}
        <div className="surface-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Equipment Checklists
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <ClipboardCheck className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-foreground">{metrics.equipmentChecklists}</span>
            <span className="text-xs text-muted-foreground font-mono">Verified</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Standardized operational inspection checklists
          </p>
        </div>

        {/* Metric 3 */}
        <div className="surface-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Reviews
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-foreground">{metrics.pendingReviews}</span>
            <span className="text-xs text-muted-foreground font-mono">In Queue</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting peer evaluation & QA review
          </p>
        </div>

        {/* Metric 4 */}
        <div className="surface-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Approvals
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-foreground">{metrics.pendingApprovals}</span>
            <span className="text-xs text-muted-foreground font-mono">Sign-Off</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting administrative authorization
          </p>
        </div>
      </div>

      {/* Main Grid: Attention Required & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Attention Required */}
        <div className="surface-panel p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              Attention Required
            </h2>
            <p className="text-sm text-muted-foreground">Documents and checklists waiting for review or approval.</p>
          </div>
          <div className="border-t border-border pt-4">
            {attentionList.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center">
                <ShieldCheck className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">All items cleared! No actions pending.</p>
              </div>
            ) : (
              <>
                {/* Mobile Vertical Cards (sm:hidden) */}
                <div className="space-y-3 sm:hidden">
                  {attentionList.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-2.5 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-xs line-clamp-2">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                            {item.identifier}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs font-semibold cursor-pointer shrink-0"
                          onClick={() => {
                            navigate({
                              to: item.type === "document" ? "/app/quality/policy-documents" : "/app/quality/checklists",
                            });
                          }}
                        >
                          Resolve
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
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
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.lastUpdated}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="py-2.5 px-3 font-semibold text-muted-foreground">Document / Checklist</th>
                        <th className="hidden md:table-cell py-2.5 px-3 font-semibold text-muted-foreground">Required Action</th>
                        <th className="py-2.5 px-3 font-semibold text-muted-foreground">Status</th>
                        <th className="py-2.5 px-3 text-center font-semibold text-muted-foreground">Action</th>
                        <th className="hidden sm:table-cell py-2.5 px-3 font-semibold text-muted-foreground">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attentionList.map((item) => (
                        <tr key={item.id} className="hover:bg-accent/5 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-foreground max-w-[150px] sm:max-w-[200px] truncate">{item.description}</p>
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
                          <td className="py-3 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-semibold cursor-pointer"
                              onClick={() => {
                                navigate({
                                  to: item.type === "document" ? "/app/quality/policy-documents" : "/app/quality/checklists",
                                });
                              }}
                            >
                              Resolve
                            </Button>
                          </td>
                          <td className="hidden sm:table-cell py-3 px-3 font-mono text-[10px] text-muted-foreground">{item.lastUpdated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Activities & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="surface-panel p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-20 text-center gap-1.5 cursor-pointer hover:bg-accent/40"
                onClick={() => navigate({ to: "/app/quality/policy-documents" })}
              >
                <PlusCircle className="size-5 text-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Document</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-20 text-center gap-1.5 cursor-pointer hover:bg-accent/40"
                onClick={() => navigate({ to: "/app/quality/checklists" })}
              >
                <PlusCircle className="size-5 text-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Checklist</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-20 text-center gap-1.5 cursor-pointer hover:bg-accent/40"
                onClick={() => navigate({ to: "/app/quality/reviews" })}
              >
                <CheckSquare className="size-5 text-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider">View Reviews</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-20 text-center gap-1.5 cursor-pointer hover:bg-accent/40"
                onClick={() => navigate({ to: "/app/quality/approvals" })}
              >
                <ShieldCheck className="size-5 text-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider">View Approvals</span>
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="surface-panel p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground">Recent Operations</h2>
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
    </div>
  );
}
