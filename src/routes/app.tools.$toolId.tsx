import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Archive,
  Wrench,
  Shield,
  DollarSign,
  ClipboardList,
  AlertCircle,
  FileText,
  Eye,
  CheckCircle2,
  Calendar,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loading } from "@/components/ui/loading";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/features/auth/auth-context";
import { toolsService } from "@/modules/tools/services/tools-service";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import type { Tool, ToolJob, ToolInput } from "@/modules/tools/types";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { ToolFormModal } from "@/modules/tools/components/tool-form-modal";
import { CreateJobModal } from "@/modules/tools/components/create-job-modal";
import { ToolJobsTable } from "@/modules/tools/components/tool-jobs-table";
import { DocumentViewerModal } from "@/modules/tools/components/document-viewer-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/$toolId")({
  head: () => ({
    meta: [
      { title: "Tool Details — HEMP" },
      { name: "description", content: "Comprehensive equipment profile, calibration logs, financials, and job history." },
    ],
  }),
  component: ToolDetailsPage,
});

function ToolDetailsPage() {
  const { toolId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tool, setTool] = useState<Tool | null>(null);
  const [jobs, setJobs] = useState<ToolJob[]>([]);
  const [hasOpenJob, setHasOpenJob] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  // Document viewer modal state
  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileName: string;
    fileSize?: string;
    documentType?: string;
    uploadedBy?: string;
    dateUploaded?: string;
    comment?: string;
  } | null>(null);

  // Archive confirm dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const isToolsAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.permissions?.tools === "admin" ||
      user?.role === "Tools Admin" ||
      user?.role === "Super Admin",
  );

  const loadToolData = async () => {
    setLoading(true);
    try {
      const data = await toolsService.getById(toolId);
      if (!data) {
        toast.error(`Tool ${toolId} not found`);
        navigate({ to: "/app/tools" });
        return;
      }
      setTool(data);

      const [toolJobs, openJobStatus] = await Promise.all([
        toolsJobService.listByToolId(toolId),
        toolsJobService.hasOpenJobsForTool(toolId),
      ]);
      setJobs(toolJobs);
      setHasOpenJob(openJobStatus);
    } catch (err) {
      console.error("Error loading tool details", err);
      toast.error("Failed to load tool details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToolData();
  }, [toolId]);

  const handleFormSubmit = async (input: ToolInput) => {
    if (!tool) return;
    try {
      const updated = await toolsService.update(tool.id, input);
      setTool(updated);
      toast.success(`Tool ${tool.id} updated successfully.`);
      loadToolData();
    } catch (err) {
      console.error("Error updating tool", err);
      toast.error("Failed to update tool record.");
    }
  };

  const handleArchiveConfirm = async () => {
    if (!tool) return;
    try {
      const result = await toolsService.archive(tool.id, `${user?.firstName} ${user?.lastName}`);
      if (result.success) {
        toast.success(`Tool ${tool.id} has been moved to Archived Tools.`);
        navigate({ to: "/app/tools" });
      } else {
        toast.error(result.message || "Unable to archive this tool.");
      }
    } catch (err) {
      console.error("Error archiving tool", err);
      toast.error("An error occurred while archiving.");
    } finally {
      setArchiveDialogOpen(false);
    }
  };

  if (loading || !tool) {
    return (
      <div className="grid min-h-[400px] place-items-center">
        <Loading />
      </div>
    );
  }

  const formattedCost = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(tool.cost || 0);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Back Link */}
      <div>
        <Link
          to="/app/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tools</span>
        </Link>
      </div>

      {/* Header Profile Banner */}
      <div className="surface-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {tool.id}
              </span>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {tool.model}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {tool.oem} &bull; {tool.category} &bull; S/N: <span className="font-mono">{tool.serialNumber}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Calibration:</span>
                <CalibrationStatusBadge status={tool.calibrationStatus} />
              </div>
              <span className="text-border">&bull;</span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Warranty:</span>
                <StatusBadge status={tool.warrantyStatus} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isToolsAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="text-xs gap-1.5"
              >
                <Edit2 className="size-3.5" />
                <span>Edit</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={hasOpenJob}
                      onClick={() => setArchiveDialogOpen(true)}
                      className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Archive className="size-3.5" />
                      <span>Archive</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                {hasOpenJob && (
                  <TooltipContent>
                    This tool cannot be archived while it has an open job.
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )}
        </div>

        {/* Open Job Archive Blocking Notice */}
        {hasOpenJob && isToolsAdmin && (
          <div className="mt-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              <strong>Archive Protected:</strong> This tool cannot be archived while it has an open job. Complete or archive active jobs before archiving this tool record.
            </span>
          </div>
        )}
      </div>

      {/* 4 Detail Tabs */}
      <Tabs defaultValue="general" className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/50 border border-border">
          <TabsTrigger value="general" className="text-xs py-2 gap-1.5">
            <Wrench className="size-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="calibration" className="text-xs py-2 gap-1.5">
            <Shield className="size-3.5" />
            <span>Calibration & Warranty</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="text-xs py-2 gap-1.5">
            <DollarSign className="size-3.5" />
            <span>Financials</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-xs py-2 gap-1.5">
            <ClipboardList className="size-3.5" />
            <span>Jobs ({jobs.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL */}
        <TabsContent value="general" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tool Master Details Panel */}
            <div className="surface-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Wrench className="size-4 text-primary" />
                Equipment Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Tools ID</span>
                  <span className="font-mono font-bold text-foreground">{tool.id}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Serial Number (S/N)</span>
                  <span className="font-mono text-foreground font-semibold">{tool.serialNumber}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Category</span>
                  <span className="font-medium text-foreground">{tool.category}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">OEM / Manufacturer</span>
                  <span className="font-medium text-foreground">{tool.oem}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Model</span>
                  <span className="font-medium text-foreground">{tool.model}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Year of Manufacture</span>
                  <span className="font-mono text-foreground">{tool.yearOfManufacture || "—"}</span>
                </div>
              </div>
            </div>

            {/* Vendor Details Panel */}
            <div className="surface-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Building className="size-4 text-primary" />
                Vendor & Maintenance Support
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5 sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Vendor Name</span>
                  <span className="font-semibold text-foreground">{tool.vendor || "—"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Contact Person</span>
                  <span className="text-foreground">{tool.vendorContact || "—"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Vendor Email</span>
                  <span className="font-mono text-foreground">{tool.vendorEmail || "—"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Vendor Phone</span>
                  <span className="font-mono text-foreground">{tool.vendorPhone || "—"}</span>
                </div>
                <div className="space-y-0.5 sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Facility Address</span>
                  <span className="text-muted-foreground leading-relaxed">{tool.vendorAddress || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: CALIBRATION & WARRANTY */}
        <TabsContent value="calibration" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calibration Panel */}
            <div className="surface-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Shield className="size-4 text-primary" />
                Metrology & Calibration Schedule
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-muted/20 border border-border">
                  <span className="text-muted-foreground">Current Calibration Status:</span>
                  <CalibrationStatusBadge status={tool.calibrationStatus} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-[11px]">Last Calibration Date</span>
                    <span className="font-mono font-medium text-foreground">{tool.lastCalibrationDate || "—"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-[11px]">Next Calibration Due Date</span>
                    <span className="font-mono font-bold text-foreground">{tool.nextCalibrationDate || "—"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-[11px]">Validity Interval</span>
                    <span className="font-medium text-foreground">{tool.calibrationValidity || "12 Months"}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  Calibration status is computed from the Next Calibration Due Date. Updates are manually entered during operational calibrations.
                </p>
              </div>
            </div>

            {/* Warranty Panel */}
            <div className="surface-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <CheckCircle2 className="size-4 text-primary" />
                Warranty & Coverage Protection
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-muted/20 border border-border">
                  <span className="text-muted-foreground">Warranty Status:</span>
                  <StatusBadge status={tool.warrantyStatus} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-[11px]">Warranty Start Date</span>
                    <span className="font-mono text-foreground">{tool.warrantyStartDate || "—"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-[11px]">Warranty Expiration Date</span>
                    <span className="font-mono font-medium text-foreground">{tool.warrantyEndDate || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: FINANCIALS */}
        <TabsContent value="financials" className="space-y-4 animate-fade-in">
          <div className="surface-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
              <DollarSign className="size-4 text-primary" />
              Procurement & Purchase Documentation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Date of Purchase</span>
                <span className="font-mono text-foreground">{tool.dateOfPurchase || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Purchase Order (PO) Number</span>
                <span className="font-mono font-bold text-foreground">{tool.poNumber || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Acquisition Cost</span>
                <span className="font-mono font-bold text-foreground text-sm">{formattedCost}</span>
              </div>
            </div>

            {tool.comment && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground block text-[11px] mb-1">Procurement Notes / Comment</span>
                <p className="text-xs text-foreground italic bg-muted/20 p-3 rounded border border-border leading-relaxed">
                  &ldquo;{tool.comment}&rdquo;
                </p>
              </div>
            )}

            {/* Attached Receipt / PO */}
            <div className="pt-3 border-t border-border space-y-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Attached Receipt / Purchase Document
              </span>
              {tool.receiptFileName ? (
                <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3 max-w-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded bg-primary/10 grid place-items-center text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{tool.receiptFileName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {tool.receiptFileSize || "2.4 MB"} &bull; Uploaded {tool.dateOfPurchase || "2026-08-01"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setViewingDoc({
                        title: "Purchase Order / Invoice",
                        fileName: tool.receiptFileName || "Purchase_Order.pdf",
                        fileSize: tool.receiptFileSize || "2.4 MB",
                        documentType: "Purchase Order Receipt",
                        uploadedBy: tool.vendorContact || "Procurement Admin",
                        dateUploaded: tool.dateOfPurchase || "2026-08-01",
                        comment: tool.comment || "Official capital procurement voucher.",
                      })
                    }
                    className="text-xs gap-1.5"
                  >
                    <Eye className="size-3.5" />
                    <span>View</span>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No receipt document attached.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: JOBS */}
        <TabsContent value="jobs" className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Associated Tool Jobs</h3>
              <p className="text-xs text-muted-foreground">
                Lifecycle history: 1 Tool &rarr; Many Jobs ({jobs.length} recorded)
              </p>
            </div>
            {isToolsAdmin && (
              <Button
                size="sm"
                onClick={() => setIsCreateJobOpen(true)}
                className="text-xs gap-1.5 cursor-pointer"
              >
                <span>Create New Job</span>
              </Button>
            )}
          </div>

          <ToolJobsTable jobs={jobs} onJobUpdated={loadToolData} />
        </TabsContent>
      </Tabs>

      {/* Edit Tool Modal */}
      <ToolFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        tool={tool}
        onSubmit={handleFormSubmit}
      />

      {/* Create Job Modal with Stepper */}
      <CreateJobModal
        open={isCreateJobOpen}
        onOpenChange={setIsCreateJobOpen}
        preselectedTool={tool}
        onJobCreated={loadToolData}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={Boolean(viewingDoc)}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Equipment Record"
        description={`Are you sure you want to archive ${tool.model} (${tool.id})? It will be moved to the Archived Tools section and can be restored whenever needed.`}
        confirmLabel="Archive Tool"
        variant="destructive"
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
