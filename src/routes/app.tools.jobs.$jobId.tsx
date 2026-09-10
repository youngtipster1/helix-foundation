import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Archive,
  ClipboardList,
  Wrench,
  Receipt,
  FileCheck,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  User,
  Shield,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loading } from "@/components/ui/loading";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-context";
import { toolsJobService } from "@/modules/tools/services/tools-job-service";
import { toolsExpenseService } from "@/modules/tools/services/tools-expense-service";
import { toolsDocumentService } from "@/modules/tools/services/tools-document-service";
import { toolsSettingsService } from "@/modules/tools/services/tools-settings-service";
import { personnelService } from "@/modules/settings/services/personnel-service";
import type {
  ToolJob,
  ToolExpense,
  ToolDocument,
  JobStatus,
  ToolStatus,
  RootCause,
  JobType,
  CreateExpenseInput,
  UploadDocumentInput,
} from "@/modules/tools/types";
import type { Personnel } from "@/modules/settings/types";
import { CalibrationStatusBadge } from "@/modules/tools/components/calibration-status-badge";
import { ExpenseFormModal } from "@/modules/tools/components/expense-form-modal";
import { ExpenseApprovalDialog } from "@/modules/tools/components/expense-approval-dialog";
import { DocumentUploadModal } from "@/modules/tools/components/document-upload-modal";
import { DocumentViewerModal } from "@/modules/tools/components/document-viewer-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/app/tools/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job Details — HEMP" },
      { name: "description", content: "Operational maintenance workspace, expense claims, and compliance documentation." },
    ],
  }),
  component: JobDetailsPage,
});

function calculateJobAge(openDate: string, closeDate?: string): string {
  const start = new Date(openDate).getTime();
  const end = closeDate ? new Date(closeDate).getTime() : new Date().getTime();
  const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
}

function JobDetailsPage() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<ToolJob | null>(null);
  const [expenses, setExpenses] = useState<ToolExpense[]>([]);
  const [documents, setDocuments] = useState<ToolDocument[]>([]);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [rootCauses, setRootCauses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Operational form state
  const [startDate, setStartDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [operationalStatus, setOperationalStatus] = useState<JobStatus>("Not Started");
  const [operationalToolStatus, setOperationalToolStatus] = useState<ToolStatus>("Good");
  const [operationalRootCause, setOperationalRootCause] = useState<RootCause>("Calibration due");
  const [operationalNextCalDate, setOperationalNextCalDate] = useState("");
  const [savingOperational, setSavingOperational] = useState(false);

  // Admin edit modal state
  const [isAdminEditOpen, setIsAdminEditOpen] = useState(false);
  const [adminJobType, setAdminJobType] = useState<JobType>("Calibration");
  const [adminContactName, setAdminContactName] = useState("");
  const [adminContactEmail, setAdminContactEmail] = useState("");
  const [adminContactPhone, setAdminContactPhone] = useState("");
  const [adminAssignedToId, setAdminAssignedToId] = useState("");
  const [adminIssue, setAdminIssue] = useState("");

  // Modals & Dialogs
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [reviewingExpense, setReviewingExpense] = useState<ToolExpense | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    title: string;
    fileName: string;
    fileSize?: string;
    documentType?: string;
    uploadedBy?: string;
    dateUploaded?: string;
    comment?: string;
  } | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const isToolsAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.permissions?.tools === "admin" ||
      user?.role === "Tools Admin" ||
      user?.role === "Super Admin",
  );

  const loadJobData = async () => {
    setLoading(true);
    try {
      const foundJob = await toolsJobService.getById(jobId);
      if (!foundJob) {
        toast.error(`Job ${jobId} not found`);
        navigate({ to: "/app/tools/jobs" });
        return;
      }
      setJob(foundJob);

      // Populate operational fields
      setStartDate(foundJob.startDate || "");
      setCloseDate(foundJob.closeDate || "");
      setOperationalStatus(foundJob.jobStatus);
      setOperationalToolStatus(foundJob.toolStatus);
      setOperationalRootCause(foundJob.rootCause || "Calibration due");
      setOperationalNextCalDate(foundJob.nextCalibrationDate || "");

      // Populate admin edit fields
      setAdminJobType(foundJob.jobType);
      setAdminContactName(foundJob.contactName);
      setAdminContactEmail(foundJob.contactEmail);
      setAdminContactPhone(foundJob.contactPhone);
      setAdminAssignedToId(foundJob.assignedToId);
      setAdminIssue(foundJob.issue);

      const [expList, docList, personnel, types, causes] = await Promise.all([
        toolsExpenseService.listByJobId(foundJob.jobNumber),
        toolsDocumentService.listByJobId(foundJob.jobNumber),
        personnelService.list(),
        toolsSettingsService.getJobTypes(),
        toolsSettingsService.getRootCauses(),
      ]);
      setExpenses(expList);
      setDocuments(docList);
      setPersonnelList(personnel.filter((p) => p.status === "active"));
      setJobTypes(types);
      setRootCauses(causes);
    } catch (err) {
      console.error("Error loading job details", err);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  // Operational save handler
  const handleSaveOperational = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setSavingOperational(true);
    try {
      const updated = await toolsJobService.updateOperationalFields(job.id, {
        startDate: startDate || undefined,
        closeDate: closeDate || undefined,
        jobStatus: operationalStatus,
        toolStatus: operationalToolStatus,
        rootCause: operationalRootCause,
        nextCalibrationDate: operationalNextCalDate || undefined,
      });
      setJob(updated);
      setOperationalStatus(updated.jobStatus);
      toast.success(`Job ${job.jobNumber} updated successfully.`);
    } catch (err) {
      console.error("Error saving operational fields", err);
      toast.error("Failed to update operational fields.");
    } finally {
      setSavingOperational(false);
    }
  };

  // Rule 28: When close date is edited by user, auto change status to Completed
  const handleCloseDateChange = (val: string) => {
    setCloseDate(val);
    if (val && val.trim() !== "") {
      setOperationalStatus("Completed");
    }
  };

  // Admin edit save handler
  const handleSaveAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    const assignedPerson = personnelList.find((p) => p.id === adminAssignedToId);
    const assignedName = assignedPerson ? `${assignedPerson.firstName} ${assignedPerson.lastName}` : job.assignedToName;

    try {
      const updated = await toolsJobService.updateAdminFields(job.id, {
        jobType: adminJobType,
        contactName: adminContactName.trim(),
        contactEmail: adminContactEmail.trim(),
        contactPhone: adminContactPhone.trim(),
        assignedToId: adminAssignedToId,
        assignedToName: assignedName,
        issue: adminIssue.trim(),
      });
      setJob(updated);
      setIsAdminEditOpen(false);
      toast.success(`Administrative details for ${job.jobNumber} updated.`);
    } catch (err) {
      console.error("Error saving admin fields", err);
      toast.error("Failed to save administrative details.");
    }
  };

  // Expense Handlers
  const handleAddExpense = async (input: CreateExpenseInput) => {
    if (!user) return;
    try {
      const created = await toolsExpenseService.create(input, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        isAdmin: isToolsAdmin,
      });
      setExpenses((prev) => [created, ...prev]);
      toast.success(
        isToolsAdmin
          ? "Expense added to job."
          : "Expense submitted for administrative approval.",
      );
    } catch (err) {
      console.error("Error adding expense", err);
      toast.error("Failed to submit expense.");
    }
  };

  const handleApproveExpense = async (expenseId: string) => {
    if (!user) return;
    try {
      const approved = await toolsExpenseService.approve(expenseId, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      });
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? approved : e)));
      toast.success(`Expense ${expenseId} approved.`);
    } catch (err) {
      console.error("Error approving expense", err);
      toast.error("Failed to approve expense.");
    }
  };

  const handleRejectExpense = async (expenseId: string, reason: string) => {
    if (!user) return;
    try {
      const rejected = await toolsExpenseService.reject(expenseId, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      }, reason);
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? rejected : e)));
      toast.error(`Expense ${expenseId} rejected.`);
    } catch (err) {
      console.error("Error rejecting expense", err);
      toast.error("Failed to reject expense.");
    }
  };

  // Document Handlers
  const handleUploadDocument = async (input: UploadDocumentInput) => {
    if (!user) return;
    try {
      const created = await toolsDocumentService.upload(input, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
      });
      setDocuments((prev) => [created, ...prev]);
      toast.success("Document uploaded successfully.");
    } catch (err) {
      console.error("Error uploading document", err);
      toast.error("Failed to upload document.");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await toolsDocumentService.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document deleted.");
    } catch (err) {
      console.error("Error deleting document", err);
      toast.error("Failed to delete document.");
    }
  };

  const handleArchiveJob = async () => {
    if (!job) return;
    try {
      await toolsJobService.archive(job.id, `${user?.firstName} ${user?.lastName}`);
      toast.success(`Job ${job.jobNumber} archived.`);
      navigate({ to: "/app/tools/jobs" });
    } catch (err) {
      console.error("Error archiving job", err);
      toast.error("Failed to archive job.");
    } finally {
      setArchiveDialogOpen(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="grid min-h-[400px] place-items-center">
        <Loading />
      </div>
    );
  }

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const formattedTotalExpense = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(totalExpenseAmount);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/app/tools/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Tools Jobs</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="surface-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {job.jobNumber}
              </span>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {job.jobType}
              </h1>
              <StatusBadge status={job.jobStatus} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Tool:</span>
              <Link
                to="/app/tools/$toolId"
                params={{ toolId: job.toolId }}
                className="font-mono font-semibold text-primary hover:underline"
              >
                {job.toolId} ({job.toolSnapshot.model})
              </Link>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <User className="size-3 text-muted-foreground" />
                Assigned to: <strong className="text-foreground">{job.assignedToName}</strong>
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          {isToolsAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdminEditOpen(true)}
                className="text-xs gap-1.5"
              >
                <Edit2 className="size-3.5" />
                <span>Edit Job</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveDialogOpen(true)}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
              >
                <Archive className="size-3.5" />
                <span>Archive</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Detail Tabs */}
      <Tabs defaultValue="general" className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/50 border border-border">
          <TabsTrigger value="general" className="text-xs py-2 gap-1.5">
            <ClipboardList className="size-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="text-xs py-2 gap-1.5">
            <Wrench className="size-3.5" />
            <span>Job Update</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs py-2 gap-1.5">
            <Receipt className="size-3.5" />
            <span>Expenses ({expenses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs py-2 gap-1.5">
            <FileCheck className="size-3.5" />
            <span>Documents ({documents.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL */}
        <TabsContent value="general" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Details Panel */}
            <div className="surface-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <ClipboardList className="size-4 text-primary" />
                Job Administrative Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Job Number</span>
                  <span className="font-mono font-bold text-foreground">{job.jobNumber}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Job Type</span>
                  <span className="font-medium text-foreground">{job.jobType}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Open Date</span>
                  <span className="font-mono text-foreground">{job.openDate}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Job Age</span>
                  <span className="font-mono font-medium text-foreground">{calculateJobAge(job.openDate, job.closeDate)}</span>
                </div>
                <div className="space-y-0.5 sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Assigned Engineer</span>
                  <span className="font-semibold text-foreground">{job.assignedToName}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Contact Person</span>
                  <span className="text-foreground">{job.contactName || "—"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Contact Email</span>
                  <span className="font-mono text-foreground">{job.contactEmail || "—"}</span>
                </div>
                <div className="space-y-0.5 sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
                  <span className="font-mono text-foreground">{job.contactPhone || "—"}</span>
                </div>
                <div className="space-y-0.5 sm:col-span-2 pt-2 border-t border-border/60">
                  <span className="text-muted-foreground block text-[11px] mb-1">Initial Issue / Scope</span>
                  <p className="text-foreground italic bg-muted/20 p-3 rounded border border-border leading-relaxed">
                    &ldquo;{job.issue}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Read-Only Tool Details Panel */}
            <div className="surface-panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  Associated Tool Details (Read-Only)
                </h3>
                <Link
                  to="/app/tools/$toolId"
                  params={{ toolId: job.toolId }}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Tool</span>
                  <Eye className="size-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Tools ID</span>
                  <span className="font-mono font-bold text-foreground">{job.toolSnapshot.id}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Serial Number</span>
                  <span className="font-mono text-foreground">{job.toolSnapshot.serialNumber}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Category</span>
                  <span className="text-foreground font-medium">{job.toolSnapshot.category}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">OEM / Model</span>
                  <span className="text-foreground">{job.toolSnapshot.oem} &bull; {job.toolSnapshot.model}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Calibration Status</span>
                  <CalibrationStatusBadge status={job.toolSnapshot.calibrationStatus} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Calibration Due Date</span>
                  <span className="font-mono font-bold text-foreground">{job.toolSnapshot.calibrationDueDate}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Warranty Status</span>
                  <StatusBadge status={job.toolSnapshot.warrantyStatus} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Vendor</span>
                  <span className="text-muted-foreground truncate">{job.toolSnapshot.vendor}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: JOB UPDATE (Operational Workspace) */}
        <TabsContent value="operational" className="space-y-4 animate-fade-in">
          <div className="surface-panel p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Operational Maintenance Workspace</h3>
                <p className="text-xs text-muted-foreground">
                  Update technician progress, diagnostics, root causes, calibration dates, and completion status.
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-primary/10 text-primary border border-primary/20">
                Operational Fields (Admin & User)
              </span>
            </div>

            <form onSubmit={handleSaveOperational} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs">Job Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="opJobStatus" className="text-xs">Job Status *</Label>
                  <select
                    id="opJobStatus"
                    value={operationalStatus}
                    onChange={(e) => setOperationalStatus(e.target.value as JobStatus)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Partially Completed">Partially Completed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="opToolStatus" className="text-xs">Tool Physical/Operational Status *</Label>
                  <select
                    id="opToolStatus"
                    value={operationalToolStatus}
                    onChange={(e) => setOperationalToolStatus(e.target.value as ToolStatus)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  >
                    <option value="Good">Good</option>
                    <option value="Partially working">Partially working</option>
                    <option value="Not working">Not working</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rootCause" className="text-xs">Job Fault / Root Cause</Label>
                  <select
                    id="rootCause"
                    value={operationalRootCause}
                    onChange={(e) => setOperationalRootCause(e.target.value as RootCause)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  >
                    {rootCauses.map((rc) => (
                      <option key={rc} value={rc}>{rc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nextCalDate" className="text-xs">Next Calibration Date (Manual)</Label>
                  <Input
                    id="nextCalDate"
                    type="date"
                    value={operationalNextCalDate}
                    onChange={(e) => setOperationalNextCalDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="closeDate" className="text-xs flex items-center justify-between">
                    <span>Job Close Date</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Auto-completes job</span>
                  </Label>
                  <Input
                    id="closeDate"
                    type="date"
                    value={closeDate}
                    onChange={(e) => handleCloseDateChange(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Status Automation Notice */}
              {closeDate && (
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>
                    <strong>Auto-Completion Active:</strong> Entering a Job Close Date automatically locks the Job Status to <strong>Completed</strong>.
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-end">
                <Button type="submit" size="sm" disabled={savingOperational} className="text-xs gap-1.5">
                  <Save className="size-3.5" />
                  <span>{savingOperational ? "Saving..." : "Save Operational Updates"}</span>
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* TAB 3: EXPENSES */}
        <TabsContent value="expenses" className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Operational Expenses</h3>
              <p className="text-xs text-muted-foreground">
                Itemized maintenance, parts procurement, and calibration expenses.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-right">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Total Expense
                </span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {formattedTotalExpense}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="h-9 text-xs gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Add Expense</span>
              </Button>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center bg-muted/10 space-y-2">
              <Receipt className="size-8 text-muted-foreground mx-auto" />
              <h4 className="text-xs font-semibold text-foreground">No Expenses Recorded</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No operational expenses have been claimed for this job yet. Click &ldquo;Add Expense&rdquo; to submit costs.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Vertical Cards (md:hidden) */}
              <div className="space-y-3 md:hidden">
                {expenses.map((exp) => {
                  const formatted = new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    maximumFractionDigits: 0,
                  }).format(exp.amount);

                  return (
                    <div
                      key={exp.id}
                      className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-3 transition-colors hover:border-primary/40"
                    >
                      {/* Card Header: Type + Amount & Action */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block">
                            Expense Type
                          </span>
                          <span className="text-xs font-bold text-foreground block mt-0.5">
                            {exp.expenseType}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                            {exp.date} &bull; {exp.submittedByName}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-sm font-mono font-bold text-foreground">
                            {formatted}
                          </span>
                          {isToolsAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewingExpense(exp)}
                              className="h-7 text-xs"
                            >
                              Review / Audit
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              {exp.approvalStatus === "Pending Approval" ? "In Review" : "Processed"}
                            </span>
                          )}
                        </div>
                      </div>

                      {exp.comment && (
                        <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/60 break-words leading-relaxed">
                          {exp.comment}
                        </p>
                      )}

                      {/* Card Body: Status & Receipt */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                        <StatusBadge status={exp.approvalStatus} />

                        {exp.receiptFileName && (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingDoc({
                                title: "Expense Receipt",
                                fileName: exp.receiptFileName || "Receipt.pdf",
                                fileSize: exp.receiptFileSize || "1.1 MB",
                                documentType: exp.expenseType,
                                uploadedBy: exp.submittedByName,
                                dateUploaded: exp.date,
                                comment: exp.comment,
                              })
                            }
                            className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs cursor-pointer"
                          >
                            <FileText className="size-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Expense Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Submitted By</th>
                      <th className="px-4 py-3">Receipt</th>
                      <th className="px-4 py-3 text-center">Action</th>
                      <th className="px-4 py-3">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map((exp) => {
                      const formatted = new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        maximumFractionDigits: 0,
                      }).format(exp.amount);

                      return (
                        <tr key={exp.id} className="hover:bg-accent/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-muted-foreground">{exp.date}</td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {exp.expenseType}
                            {exp.comment && (
                              <span className="block text-[11px] text-muted-foreground truncate max-w-xs">
                                {exp.comment}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-foreground">{formatted}</td>
                          <td className="px-4 py-3 text-muted-foreground">{exp.submittedByName}</td>
                          <td className="px-4 py-3">
                            {exp.receiptFileName ? (
                              <button
                                onClick={() =>
                                  setViewingDoc({
                                    title: "Expense Receipt",
                                    fileName: exp.receiptFileName || "Receipt.pdf",
                                    fileSize: exp.receiptFileSize || "1.1 MB",
                                    documentType: exp.expenseType,
                                    uploadedBy: exp.submittedByName,
                                    dateUploaded: exp.date,
                                    comment: exp.comment,
                                  })
                                }
                                className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs cursor-pointer"
                              >
                                <FileText className="size-3" />
                                <span>{exp.receiptFileName}</span>
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isToolsAdmin ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReviewingExpense(exp)}
                                className="h-7 text-xs"
                              >
                                Review / Audit
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                {exp.approvalStatus === "Pending Approval" ? "In Review" : "Processed"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={exp.approvalStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB 4: DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Compliance & Certification Documents</h3>
              <p className="text-xs text-muted-foreground">
                Calibration certificates, decommissioning forms, and service reports attached to this job.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDocModalOpen(true)}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Upload Document</span>
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center bg-muted/10 space-y-2">
              <FileCheck className="size-8 text-muted-foreground mx-auto" />
              <h4 className="text-xs font-semibold text-foreground">No Documents Uploaded</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No calibration certificates or compliance documents have been attached to this job yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">S/N</th>
                    <th className="px-4 py-3">Document Type</th>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded By</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                    <th className="px-4 py-3">Date Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{doc.documentType}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setViewingDoc({
                              title: doc.documentType,
                              fileName: doc.fileName,
                              fileSize: doc.fileSize,
                              documentType: doc.documentType,
                              uploadedBy: doc.uploadedByName,
                              dateUploaded: doc.dateUploaded,
                              comment: doc.comment,
                            })
                          }
                          className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="size-3.5" />
                          <span>{doc.fileName}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{doc.fileSize}</td>
                      <td className="px-4 py-3 text-muted-foreground">{doc.uploadedByName}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() =>
                              setViewingDoc({
                                title: doc.documentType,
                                fileName: doc.fileName,
                                fileSize: doc.fileSize,
                                documentType: doc.documentType,
                                uploadedBy: doc.uploadedByName,
                                dateUploaded: doc.dateUploaded,
                                comment: doc.comment,
                              })
                            }
                            aria-label={`View ${doc.fileName}`}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          {isToolsAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteDocument(doc.id)}
                              aria-label={`Delete ${doc.fileName}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{doc.dateUploaded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin Edit Modal */}
      <Dialog open={isAdminEditOpen} onOpenChange={setIsAdminEditOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Edit Administrative Job Information
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Only Administrators can modify core dispatch parameters and engineer assignments.
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveAdminEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="adminJobType" className="text-xs">Job Type *</Label>
              <select
                id="adminJobType"
                value={adminJobType}
                onChange={(e) => setAdminJobType(e.target.value as JobType)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                required
              >
                {jobTypes.map((jt) => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminAssignedTo" className="text-xs">Assigned Technician *</Label>
              <select
                id="adminAssignedTo"
                value={adminAssignedToId}
                onChange={(e) => setAdminAssignedToId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                required
              >
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminContactName" className="text-xs">Contact Person</Label>
              <Input
                id="adminContactName"
                value={adminContactName}
                onChange={(e) => setAdminContactName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="adminContactEmail" className="text-xs">Contact Email</Label>
                <Input
                  id="adminContactEmail"
                  type="email"
                  value={adminContactEmail}
                  onChange={(e) => setAdminContactEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminContactPhone" className="text-xs">Contact Phone</Label>
                <Input
                  id="adminContactPhone"
                  value={adminContactPhone}
                  onChange={(e) => setAdminContactPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminIssue" className="text-xs">Initial Issue / Scope *</Label>
              <Textarea
                id="adminIssue"
                value={adminIssue}
                onChange={(e) => setAdminIssue(e.target.value)}
                className="text-xs min-h-[70px]"
                required
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdminEditOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Save Admin Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <ExpenseFormModal
        open={isExpenseModalOpen}
        onOpenChange={setIsExpenseModalOpen}
        jobId={job.jobNumber}
        onSubmit={handleAddExpense}
      />

      {/* Expense Approval Dialog */}
      <ExpenseApprovalDialog
        open={Boolean(reviewingExpense)}
        onOpenChange={(open) => !open && setReviewingExpense(null)}
        expense={reviewingExpense}
        onApprove={handleApproveExpense}
        onReject={handleRejectExpense}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        open={isDocModalOpen}
        onOpenChange={setIsDocModalOpen}
        toolId={job.toolId}
        jobId={job.jobNumber}
        onSubmit={handleUploadDocument}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={Boolean(viewingDoc)}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* Confirm Archive Job Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Job Record"
        description={`Are you sure you want to archive job ${job.jobNumber}? It will be moved to the Archived Jobs registry and can be restored whenever needed.`}
        confirmLabel="Archive Job"
        variant="destructive"
        onConfirm={handleArchiveJob}
      />
    </div>
  );
}
